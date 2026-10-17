import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import JobCard from "@/components/job-card";
import { deleteJob, saveJob } from "@/api/apiJobs";

const auth = vi.hoisted(() => ({ current: null, user: null }));
vi.mock("@clerk/clerk-react", () => ({
  useSession: () => auth.current,
  useUser: () => ({ user: auth.user, isLoaded: true, isSignedIn: Boolean(auth.user) }),
}));

vi.mock("@/api/apiJobs", () => ({
  deleteJob: vi.fn(),
  saveJob: vi.fn(),
}));

function signIn(id = "user_recruiter_1", role = "recruiter") {
  auth.user = { id, fullName: "Alex Recruiter", unsafeMetadata: { role } };
  auth.current = {
    isLoaded: true,
    session: {
      id: `session-${id}`,
      user: auth.user,
      getToken: vi.fn().mockResolvedValue(`token-${id}`),
    },
  };
}

const mockJob = {
  id: "job-demo-123",
  title: "Staff Frontend Engineer (Harbor Bold Demo)",
  description: "Build robust frontend architectures. Lead design systems.",
  location: "Remote",
  isOpen: true,
  company: { name: "QA Disposable Harbor 20260917", logo_url: "https://example.com/logo.png" },
};

beforeEach(() => {
  vi.resetAllMocks();
  signIn();
});

describe("JobCard actions: save, unsave, delete", () => {
  it("saves an unsaved job when clicking save button", async () => {
    saveJob.mockResolvedValue([{ id: "saved-1" }]);
    const onJobAction = vi.fn();

    render(
      <MemoryRouter>
        <JobCard job={mockJob} savedInit={false} onJobAction={onJobAction} isMyJob={false} />
      </MemoryRouter>
    );

    const saveBtn = screen.getByRole("button", { name: "Save job" });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(saveJob).toHaveBeenCalledWith(
        "token-user_recruiter_1",
        { alreadySaved: false },
        { user_id: "user_recruiter_1", job_id: "job-demo-123" }
      );
    });

    expect(screen.getByRole("button", { name: "Remove saved job" })).toBeTruthy();
    expect(onJobAction).toHaveBeenCalledTimes(1);
  });

  it("unsaves an already-saved job when clicking unsave button", async () => {
    saveJob.mockResolvedValue([{ id: "saved-1" }]);
    const onJobAction = vi.fn();

    render(
      <MemoryRouter>
        <JobCard job={mockJob} savedInit={true} onJobAction={onJobAction} isMyJob={false} />
      </MemoryRouter>
    );

    const unsaveBtn = screen.getByRole("button", { name: "Remove saved job" });
    await act(async () => {
      fireEvent.click(unsaveBtn);
    });

    await waitFor(() => {
      expect(saveJob).toHaveBeenCalledWith(
        "token-user_recruiter_1",
        { alreadySaved: true },
        { user_id: "user_recruiter_1", job_id: "job-demo-123" }
      );
    });

    expect(screen.getByRole("button", { name: "Save job" })).toBeTruthy();
    expect(onJobAction).toHaveBeenCalledTimes(1);
  });

  it("displays error message if save/unsave action fails", async () => {
    saveJob.mockRejectedValue(new Error("Database error saving job"));

    render(
      <MemoryRouter>
        <JobCard job={mockJob} savedInit={false} isMyJob={false} />
      </MemoryRouter>
    );

    const saveBtn = screen.getByRole("button", { name: "Save job" });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Database error saving job");
  });

  it("prompts for confirmation and deletes job when recruiter confirms", async () => {
    deleteJob.mockResolvedValue([{ id: "job-demo-123" }]);
    const onJobAction = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <JobCard job={mockJob} isMyJob={true} onJobAction={onJobAction} />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByRole("button", {
      name: `Delete ${mockJob.title}`,
    });

    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      `Delete "${mockJob.title}" and its applications? This cannot be undone.`
    );

    await waitFor(() => {
      expect(deleteJob).toHaveBeenCalledWith(
        "token-user_recruiter_1",
        { job_id: "job-demo-123" }
      );
    });

    expect(onJobAction).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it("does not delete job when recruiter cancels confirmation dialog", async () => {
    const onJobAction = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <MemoryRouter>
        <JobCard job={mockJob} isMyJob={true} onJobAction={onJobAction} />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByRole("button", {
      name: `Delete ${mockJob.title}`,
    });

    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteJob).not.toHaveBeenCalled();
    expect(onJobAction).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("displays error message if job deletion fails", async () => {
    deleteJob.mockRejectedValue(new Error("Unauthorized deletion"));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <JobCard job={mockJob} isMyJob={true} />
      </MemoryRouter>
    );

    const deleteBtn = screen.getByRole("button", {
      name: `Delete ${mockJob.title}`,
    });

    await act(async () => {
      fireEvent.click(deleteBtn);
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Unauthorized deletion");
  });
});
