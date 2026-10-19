import { beforeEach, describe, expect, it, vi } from "vitest";
import supabaseClient from "@/utils/supabase";
import { addNewJob, deleteJob, getJobs, getMyJobs, getSavedJobs, getSingleJob, saveJob, updateHiringStatus } from "./apiJobs";
import { applyToJob, getApplications, getResumeSignedUrl, updateApplicationStatus } from "./apiApplication";
import { addNewCompany, getCompanies } from "./apiCompanies";

vi.mock("@/utils/supabase", async (importOriginal) => ({
  ...await importOriginal(), default: vi.fn(),
}));
let outcome, query;
beforeEach(() => {
  outcome = { data: [{ id: "row" }], error: null };
  query = { then: (resolve) => Promise.resolve(outcome).then(resolve) };
  for (const method of ["select", "insert", "update", "delete", "eq", "ilike", "maybeSingle"]) {
    query[method] = vi.fn(() => query);
  }
  supabaseClient.mockResolvedValue({
    from: vi.fn(() => query),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.url" }, error: null }),
      })),
    },
  });
});

const mutations = [
  ["create job", () => addNewJob("token", {}, { title: "Job" })],
  ["delete job", () => deleteJob("token", { job_id: "job" })],
  ["save job", () => saveJob("token", { alreadySaved: false }, { user_id: "user", job_id: "job" })],
  ["unsave job", () => saveJob("token", { alreadySaved: true }, { user_id: "user", job_id: "job" })],
  ["hiring status", () => updateHiringStatus("token", { job_id: "job" }, false)],
  ["application status", () => updateApplicationStatus("token", { application_id: "application" }, "hired")],
  ["apply", () => applyToJob("token", {}, { candidate_id: "user", resume: new Blob(["test"]) })],
  ["create company", () => addNewCompany("token", {}, { name: "Company", logo: new Blob(["test"]) })],
];
const reads = [
  ["jobs", () => getJobs("token", {})],
  ["job detail", () => getSingleJob("token", { job_id: "job" })],
  ["saved jobs", () => getSavedJobs("token", { user_id: "user" })],
  ["created jobs", () => getMyJobs("token", { recruiter_id: "user" })],
  ["applications", () => getApplications("token", { user_id: "user" })],
  ["companies", () => getCompanies("token")],
];

describe("existing API error handling", () => {
  it.each([...mutations, ...reads])("preserves the database error for %s", async (_, invoke) => {
    const error = { message: "Database denied request", code: "42501" };
    outcome = { data: null, error };
    await expect(invoke()).rejects.toBe(error);
  });
  it.each(mutations)("rejects an empty returned-row result for %s", async (_, invoke) => {
    outcome = { data: [], error: null };
    await expect(invoke()).rejects.toThrow(/not/);
  });
  it("distinguishes missing detail from a failed detail request", async () => {
    outcome = { data: null, error: null };
    await expect(getSingleJob("token", { job_id: "missing" })).resolves.toBeNull();
    expect(query.maybeSingle).toHaveBeenCalled();
  });
  it("scopes both saved reads and removal to the supplied user", async () => {
    await getSavedJobs("token", { user_id: "user" });
    expect(query.eq).toHaveBeenCalledWith("user_id", "user");
    query.eq.mockClear();
    await saveJob("token", { alreadySaved: true }, { job_id: "job", user_id: "user" });
    expect(query.eq).toHaveBeenCalledWith("job_id", "job");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user");
  });
  it("escapes literal search wildcards and backslashes", async () => {
    await getJobs("token", { searchQuery: "50%_\\" });
    expect(query.ilike).toHaveBeenCalledWith("title", "%50\\%\\_\\\\%");
  });
  it("creates signed URL for resume path", async () => {
    const res = await getResumeSignedUrl("token", { resume: "resume-1234.pdf" });
    expect(res).toBe("https://signed.url");
  });
  it("extracts path from full public URL when creating signed URL", async () => {
    const res = await getResumeSignedUrl("token", { resume: "https://example.supabase.co/storage/v1/object/public/resumes/resume-5678.pdf" });
    expect(res).toBe("https://signed.url");
  });
  it("propagates error when signed URL generation fails for object path", async () => {
    supabaseClient.mockResolvedValueOnce({
      from: vi.fn(() => query),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: new Error("File not found") }),
        })),
      },
    });
    await expect(getResumeSignedUrl("token", { resume: "missing-resume.pdf" })).rejects.toThrow("File not found");
  });
});
