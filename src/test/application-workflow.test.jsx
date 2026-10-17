import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplyJobDrawer } from "@/components/apply-job";
import ApplicationCard from "@/components/application-card";
import CreatedApplications from "@/components/created-applications";
import { applyToJob, getApplications, getResumeSignedUrl, updateApplicationStatus } from "@/api/apiApplication";

// Polyfill ResizeObserver for Radix UI primitives in jsdom
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const auth = vi.hoisted(() => ({ current: null, user: null }));
vi.mock("@clerk/clerk-react", () => ({
  useSession: () => auth.current,
  useUser: () => ({ user: auth.user, isLoaded: true, isSignedIn: Boolean(auth.user) }),
}));

vi.mock("@/api/apiApplication", () => ({
  applyToJob: vi.fn(),
  updateApplicationStatus: vi.fn(),
  getResumeSignedUrl: vi.fn(),
  getApplications: vi.fn(),
}));

// Mock vaul Drawer components for jsdom compatibility
vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open }) => <div data-testid="drawer-root" data-open={open}>{children}</div>,
  DrawerTrigger: ({ children }) => <div data-testid="drawer-trigger">{children}</div>,
  DrawerContent: ({ children }) => <div data-testid="drawer-content">{children}</div>,
  DrawerHeader: ({ children }) => <header>{children}</header>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children }) => <footer>{children}</footer>,
  DrawerClose: ({ children }) => <div>{children}</div>,
}));

// Mock Select for predictable trigger and item selection in jsdom
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value, disabled }) => (
    <div data-testid="select-root">
      <select
        aria-label="Application status"
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="applied">Applied</option>
        <option value="interviewing">Interviewing</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
      </select>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}));

function signIn(id = "user_cand_1", role = "candidate") {
  auth.user = { id, fullName: "Jane Candidate", unsafeMetadata: { role } };
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
  id: "job-123",
  title: "Frontend Engineer",
  isOpen: true,
  company: { name: "Harbor Tech" },
};

beforeEach(() => {
  vi.resetAllMocks();
  signIn();
});

describe("ApplyJobDrawer workflow", () => {
  it("renders disabled state when already applied", () => {
    render(<ApplyJobDrawer user={auth.user} job={mockJob} fetchJob={vi.fn()} applied={true} />);
    const button = screen.getByRole("button", { name: "Applied" });
    expect(button.disabled).toBe(true);
  });

  it("renders disabled state when job hiring is closed", () => {
    const closedJob = { ...mockJob, isOpen: false };
    render(<ApplyJobDrawer user={auth.user} job={closedJob} fetchJob={vi.fn()} applied={false} />);
    const button = screen.getByRole("button", { name: "Hiring Closed" });
    expect(button.disabled).toBe(true);
  });

  it("validates required fields before submitting", async () => {
    render(<ApplyJobDrawer user={auth.user} job={mockJob} fetchJob={vi.fn()} applied={false} />);
    const submitBtn = screen.getByRole("button", { name: /Submit application/i });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText("Skills are required")).toBeTruthy();
    expect(await screen.findByText("Education is required")).toBeTruthy();
    expect(await screen.findByText("Only PDF or Word documents are allowed")).toBeTruthy();
    expect(applyToJob).not.toHaveBeenCalled();
  });

  it("successfully submits application with valid inputs and resume", async () => {
    const fetchJob = vi.fn();
    applyToJob.mockResolvedValue([{ id: "app-1", status: "applied" }]);

    render(<ApplyJobDrawer user={auth.user} job={mockJob} fetchJob={fetchJob} applied={false} />);

    fireEvent.change(screen.getByPlaceholderText("Years of experience"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByPlaceholderText("React, SQL, onboarding"), {
      target: { value: "React, TypeScript, CSS" },
    });
    fireEvent.click(screen.getByLabelText("Graduate"));

    const fakePdf = new File(["fake content"], "resume.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/Resume/i);
    fireEvent.change(fileInput, { target: { files: [fakePdf] } });

    const submitBtn = screen.getByRole("button", { name: /Submit application/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(applyToJob).toHaveBeenCalledTimes(1);
    });

    expect(applyToJob).toHaveBeenCalledWith(
      "token-user_cand_1",
      {},
      expect.objectContaining({
        job_id: "job-123",
        candidate_id: "user_cand_1",
        name: "Jane Candidate",
        experience: 3,
        skills: "React, TypeScript, CSS",
        education: "Graduate",
        status: "applied",
        resume: fakePdf,
      })
    );

    expect(fetchJob).toHaveBeenCalledTimes(1);
  });

  it("displays error message and retains inputs when application submission fails", async () => {
    const fetchJob = vi.fn();
    applyToJob.mockRejectedValue(new Error("Storage upload failed"));

    render(<ApplyJobDrawer user={auth.user} job={mockJob} fetchJob={fetchJob} applied={false} />);

    const expInput = screen.getByPlaceholderText("Years of experience");
    fireEvent.change(expInput, { target: { value: "5" } });
    const skillsInput = screen.getByPlaceholderText("React, SQL, onboarding");
    fireEvent.change(skillsInput, { target: { value: "Node, GraphQL" } });
    fireEvent.click(screen.getByLabelText("Post Graduate"));

    const fakeDoc = new File(["doc"], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.change(screen.getByLabelText(/Resume/i), { target: { files: [fakeDoc] } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Submit application/i }));
    });

    expect(await screen.findByText("Storage upload failed")).toBeTruthy();
    expect(expInput.value).toBe("5");
    expect(skillsInput.value).toBe("Node, GraphQL");
    expect(fetchJob).not.toHaveBeenCalled();
  });
});

describe("ApplicationCard recruiter workflow", () => {
  const application = {
    id: "app-999",
    name: "Alex Doe",
    experience: 4,
    education: "Graduate",
    skills: "React, Tailwind",
    status: "applied",
    resume: "https://example.com/resume.pdf",
    created_at: "2026-09-15T10:00:00Z",
    job: { title: "Frontend Lead", company: { name: "Harbor Corp" } },
  };

  it("renders candidate view with status badge", () => {
    render(<ApplicationCard application={application} isCandidate={true} />);
    expect(screen.getByText("Submitted application")).toBeTruthy();
    expect(screen.getByText("Frontend Lead at Harbor Corp")).toBeTruthy();
    expect(screen.getByText("Status: applied")).toBeTruthy();
  });

  it("renders recruiter view with candidate details and status control", () => {
    render(<ApplicationCard application={application} isCandidate={false} />);
    expect(screen.getByText("Candidate")).toBeTruthy();
    expect(screen.getByText("Alex Doe")).toBeTruthy();
    expect(screen.getByText("4 years")).toBeTruthy();
    expect(screen.getByText("React, Tailwind")).toBeTruthy();
    expect(screen.getByLabelText("Application status")).toBeTruthy();
  });

  it("updates application status when recruiter changes dropdown selection", async () => {
    updateApplicationStatus.mockResolvedValue([{ id: "app-999", status: "interviewing" }]);

    render(<ApplicationCard application={application} isCandidate={false} />);
    const select = screen.getByLabelText("Application status");

    await act(async () => {
      fireEvent.change(select, { target: { value: "interviewing" } });
    });

    await waitFor(() => {
      expect(updateApplicationStatus).toHaveBeenCalledWith(
        "token-user_cand_1",
        { application_id: "app-999" },
        "interviewing"
      );
    });

    expect(select.value).toBe("interviewing");
  });

  it("shows error alert and retains previous status when status update fails", async () => {
    updateApplicationStatus.mockRejectedValue(new Error("Unauthorized status update"));

    render(<ApplicationCard application={application} isCandidate={false} />);
    const select = screen.getByLabelText("Application status");

    await act(async () => {
      fireEvent.change(select, { target: { value: "hired" } });
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Unauthorized status update");
    expect(select.value).toBe("applied");
  });

  it("requests signed URL and triggers download when clicking download button", async () => {
    getResumeSignedUrl.mockResolvedValue("https://signed.url/resume-download.pdf");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ApplicationCard application={application} isCandidate={false} />);
    const downloadBtn = screen.getByRole("button", { name: "Download resume" });

    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    await waitFor(() => {
      expect(getResumeSignedUrl).toHaveBeenCalledWith(
        "token-user_cand_1",
        { resume: application.resume }
      );
    });
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("shows error alert when resume download fails for a private resume path", async () => {
    getResumeSignedUrl.mockRejectedValue(new Error("Storage signed URL failure"));

    render(
      <ApplicationCard
        application={{ ...application, resume: "resume-999.pdf" }}
        isCandidate={false}
      />
    );
    const downloadBtn = screen.getByRole("button", { name: "Download resume" });

    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Storage signed URL failure");
  });

  it("falls back to public URL when signed URL fails for legacy public resume", async () => {
    getResumeSignedUrl.mockRejectedValue(new Error("Storage signed URL failure"));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ApplicationCard application={application} isCandidate={false} />);
    const downloadBtn = screen.getByRole("button", { name: "Download resume" });

    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it.each([
    ["hired"],
    ["rejected"],
    ["applied"],
  ])("transitions status to %s when recruiter changes dropdown selection", async (status) => {
    updateApplicationStatus.mockResolvedValue([{ id: "app-999", status }]);

    render(<ApplicationCard application={application} isCandidate={false} />);
    const select = screen.getByLabelText("Application status");

    await act(async () => {
      fireEvent.change(select, { target: { value: status } });
    });

    await waitFor(() => {
      expect(updateApplicationStatus).toHaveBeenCalledWith(
        "token-user_cand_1",
        { application_id: "app-999" },
        status
      );
    });

    expect(select.value).toBe(status);
  });
});

describe("CreatedApplications candidate tracking under /my-jobs", () => {
  it("renders candidate's submitted applications with status badges", async () => {
    getApplications.mockResolvedValue([
      {
        id: "app-1",
        name: "Jane Candidate",
        status: "applied",
        experience: 3,
        education: "Graduate",
        skills: "React",
        resume: "resume-1.pdf",
        created_at: "2026-09-17T12:00:00Z",
        job: { title: "Staff Frontend Engineer", company: { name: "QA Harbor" } },
      },
      {
        id: "app-2",
        name: "Jane Candidate",
        status: "interviewing",
        experience: 3,
        education: "Graduate",
        skills: "React",
        resume: "resume-2.pdf",
        created_at: "2026-09-18T12:00:00Z",
        job: { title: "Lead Architect", company: { name: "Bold Corp" } },
      },
    ]);

    render(<CreatedApplications />);

    expect(await screen.findByText("Staff Frontend Engineer at QA Harbor")).toBeTruthy();
    expect(screen.getByText("Status: applied")).toBeTruthy();
    expect(screen.getByText("Lead Architect at Bold Corp")).toBeTruthy();
    expect(screen.getByText("Status: interviewing")).toBeTruthy();
  });

  it("renders empty state when candidate has no submitted applications", async () => {
    getApplications.mockResolvedValue([]);

    render(<CreatedApplications />);

    expect(await screen.findByText("No applications submitted yet")).toBeTruthy();
  });
});
