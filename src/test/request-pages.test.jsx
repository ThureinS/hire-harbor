import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import JobPage from "@/pages/job";
import SavedJobs from "@/pages/saved-jobs";
import CreatedJobs from "@/components/created-jobs";
import CreatedApplications from "@/components/created-applications";
import ProtectedRoute from "@/components/protected-route";
import { getSingleJob, updateHiringStatus, getSavedJobs, getMyJobs } from "@/api/apiJobs";
import { getApplications } from "@/api/apiApplication";

const auth = vi.hoisted(() => ({ current: null, user: null }));
vi.mock("@clerk/clerk-react", () => ({
  useSession: () => auth.current,
  useUser: () => ({ user: auth.user, isLoaded: true, isSignedIn: Boolean(auth.user) }),
}));
vi.mock("@/api/apiJobs", () => ({
  getSingleJob: vi.fn(), updateHiringStatus: vi.fn(), getSavedJobs: vi.fn(), getMyJobs: vi.fn(),
}));
vi.mock("@/api/apiApplication", () => ({ getApplications: vi.fn() }));
vi.mock("@/components/job-card", () => ({ default: ({ job }) => <p>{job.title}</p> }));
vi.mock("@/components/application-card", () => ({ default: ({ application }) => <p>{application.name}</p> }));
vi.mock("@/components/apply-job", () => ({
  ApplyJobDrawer: ({ job }) => <button>Apply to {job.title}</button>,
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({ onValueChange, disabled }) => <button disabled={disabled} onClick={() => onValueChange("closed")}>Close hiring</button>,
  SelectContent: () => null, SelectItem: () => null, SelectTrigger: () => null, SelectValue: () => null,
}));

function signIn(id = "A") {
  auth.user = { id, unsafeMetadata: { role: "recruiter" } };
  auth.current = { isLoaded: true, session: { id: `session-${id}`, user: auth.user, getToken: vi.fn().mockResolvedValue(`token-${id}`) } };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const job = (id, recruiter = "A") => ({ id, title: `Listing ${id}`, recruiter_id: recruiter, isOpen: true, applications: [], requirements: "**React**" });
function Navigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate("/job/B")}>Next job</button>;
}
function renderJob() {
  return render(<MemoryRouter initialEntries={["/job/A"]}>
    <Navigation />
    <Routes><Route path="/job/:id" element={<JobPage />} /></Routes>
  </MemoryRouter>);
}
beforeEach(() => { vi.resetAllMocks(); signIn(); });

describe("job route ownership", () => {
  it("does not retain the previous listing or its actions when the next route fails", async () => {
    getSingleJob.mockResolvedValueOnce(job("A")).mockRejectedValueOnce(new Error("B failed"));
    renderJob();
    await screen.findByText("Listing A");
    fireEvent.click(screen.getByText("Next job"));
    await screen.findByRole("alert");
    expect(screen.queryByText("Listing A")).toBeNull();
    expect(screen.queryByText("Close hiring")).toBeNull();
    expect(screen.queryByRole("button", { name: /Apply to/ })).toBeNull();
    expect(updateHiringStatus).not.toHaveBeenCalled();
  });

  it("keeps same-record data on refresh failure", async () => {
    getSingleJob.mockResolvedValueOnce(job("A")).mockRejectedValueOnce(new Error("refresh failed"));
    updateHiringStatus.mockResolvedValue([job("A")]);
    renderJob();
    await screen.findByText("Listing A");
    fireEvent.click(screen.getByText("Close hiring"));
    await screen.findByText(/Showing the last loaded version/);
    expect(screen.getByText("Listing A")).toBeTruthy();
    expect(updateHiringStatus).toHaveBeenCalledWith("token-A", { job_id: "A" }, false);
  });

  it("does not refetch the next route when an old-route mutation completes", async () => {
    const mutation = deferred();
    getSingleJob.mockImplementation(async (_, { job_id }) => job(job_id));
    updateHiringStatus.mockReturnValue(mutation.promise);
    renderJob();
    await screen.findByText("Listing A");
    fireEvent.click(screen.getByText("Close hiring"));
    await act(async () => {});
    fireEvent.click(screen.getByText("Next job"));
    await screen.findByText("Listing B");
    await act(async () => { mutation.resolve([job("A")]); });
    expect(getSingleJob).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Listing B")).toBeTruthy();
  });

  it("does not show an API record that differs from the requested route", async () => {
    getSingleJob.mockResolvedValue(job("B"));
    renderJob();
    await screen.findByText("Job not found");
    expect(screen.queryByText("Listing B")).toBeNull();
    expect(screen.queryByText("Close hiring")).toBeNull();
  });
});

describe("account lists without remounting", () => {
  it.each([
    ["saved jobs", SavedJobs, getSavedJobs, "user_id", (id) => [{ id, job: job(id) }]],
    ["created jobs", CreatedJobs, getMyJobs, "recruiter_id", (id) => [job(id)]],
    ["applications", CreatedApplications, getApplications, "user_id", (id) => [{ id, name: `Listing ${id}` }]],
  ])("waits for session readiness and replaces %s on account changes", async (_, Component, api, idField, data) => {
    auth.current = { isLoaded: false, session: undefined };
    api.mockImplementation(async (token, options) => {
      expect(token).toBe(`token-${options[idField]}`);
      return data(options[idField]);
    });
    const { rerender } = render(<Component />);
    expect(api).not.toHaveBeenCalled();
    signIn(); rerender(<Component />);
    await screen.findByText("Listing A");
    const pending = deferred();
    api.mockReturnValueOnce(pending.promise);
    signIn("B"); rerender(<Component />);
    expect(screen.queryByText("Listing A")).toBeNull();
    await act(async () => { pending.resolve(data("B")); });
    await screen.findByText("Listing B");
    expect(api).toHaveBeenLastCalledWith("token-B", { [idField]: "B" });
    auth.user = null; auth.current = { isLoaded: true, session: null };
    rerender(<Component />);
    expect(screen.queryByText("Listing B")).toBeNull();
  });
});

it("resets protected form state across accounts and waits for matching session/user state", () => {
  const tree = <MemoryRouter><ProtectedRoute><input aria-label="Private draft" defaultValue="" /></ProtectedRoute></MemoryRouter>;
  const { rerender } = render(tree);
  fireEvent.change(screen.getByLabelText("Private draft"), { target: { value: "A's draft" } });
  signIn("B");
  rerender(<MemoryRouter><ProtectedRoute><input aria-label="Private draft" defaultValue="" /></ProtectedRoute></MemoryRouter>);
  expect(screen.getByLabelText("Private draft").value).toBe("");
  auth.user = { ...auth.user, id: "C" };
  rerender(<MemoryRouter><ProtectedRoute><input aria-label="Private draft" /></ProtectedRoute></MemoryRouter>);
  expect(screen.queryByLabelText("Private draft")).toBeNull();
  expect(screen.getByRole("status")).toBeTruthy();
});
