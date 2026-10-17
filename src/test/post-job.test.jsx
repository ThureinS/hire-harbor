import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PostJob from "@/pages/post-job";
import { getCompanies } from "@/api/apiCompanies";
import { addNewJob } from "@/api/apiJobs";

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

vi.mock("@/api/apiCompanies", () => ({
  getCompanies: vi.fn(),
  addNewCompany: vi.fn(),
}));

vi.mock("@/api/apiJobs", () => ({
  addNewJob: vi.fn(),
}));

// Mock Select for reliable select triggering in jsdom
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }) => (
    <div data-testid="select-root">
      <select
        data-testid="mock-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="">Select option</option>
        <option value="United States">United States</option>
        <option value="comp-1">Harbor Corp</option>
      </select>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }) => <div>{children}</div>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectGroup: ({ children }) => <div>{children}</div>,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}));

vi.mock("@/components/add-company-drawer", () => ({
  default: () => <button type="button">Add Company Drawer</button>,
}));

vi.mock("@/components/safe-markdown", () => ({
  SafeMarkdownEditor: ({ value, onChange }) => (
    <textarea
      aria-label="Requirements markdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

function signInRecruiter(id = "recruiter_1") {
  auth.user = { id, fullName: "Recruiter One", unsafeMetadata: { role: "recruiter" } };
  auth.current = {
    isLoaded: true,
    session: {
      id: `session-${id}`,
      user: auth.user,
      getToken: vi.fn().mockResolvedValue(`token-${id}`),
    },
  };
}

function signInCandidate(id = "candidate_1") {
  auth.user = { id, fullName: "Candidate One", unsafeMetadata: { role: "candidate" } };
  auth.current = {
    isLoaded: true,
    session: {
      id: `session-${id}`,
      user: auth.user,
      getToken: vi.fn().mockResolvedValue(`token-${id}`),
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  signInRecruiter();
});

describe("PostJob page workflow", () => {
  it("redirects non-recruiter users to /jobs", () => {
    signInCandidate();
    render(
      <MemoryRouter initialEntries={["/post-job"]}>
        <Routes>
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/jobs" element={<p>Jobs Board</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Jobs Board")).toBeTruthy();
    expect(screen.queryByText("Post a Job")).toBeNull();
  });

  it("renders the recruiter post job form with loaded companies", async () => {
    getCompanies.mockResolvedValue([{ id: "comp-1", name: "Harbor Corp" }]);

    render(
      <MemoryRouter initialEntries={["/post-job"]}>
        <Routes>
          <Route path="/post-job" element={<PostJob />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Post a Job")).toBeTruthy();
    expect(screen.getByPlaceholderText("Senior frontend engineer")).toBeTruthy();
    expect(screen.getByPlaceholderText("Describe the role, team, and outcomes.")).toBeTruthy();
    expect(screen.getByText("Location")).toBeTruthy();
    expect(screen.getAllByText("Company").length).toBeGreaterThan(0);
    expect(screen.getByText("Add Company Drawer")).toBeTruthy();
    expect(screen.getByLabelText("Requirements markdown")).toBeTruthy();
  });

  it("validates all required fields when submitting an empty form", async () => {
    getCompanies.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/post-job"]}>
        <Routes>
          <Route path="/post-job" element={<PostJob />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Post a Job");
    const submitBtn = screen.getByRole("button", { name: "Submit" });

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(await screen.findByText("Title is required")).toBeTruthy();
    expect(await screen.findByText("Description is required")).toBeTruthy();
    expect(await screen.findByText("Select a location")).toBeTruthy();
    expect(await screen.findByText("Select or Add a new Company")).toBeTruthy();
    expect(await screen.findByText("Requirements are required")).toBeTruthy();
    expect(addNewJob).not.toHaveBeenCalled();
  });

  it("submits valid job and navigates to /jobs upon success", async () => {
    getCompanies.mockResolvedValue([{ id: "comp-1", name: "Harbor Corp" }]);
    addNewJob.mockResolvedValue([{ id: "job-99", title: "Lead React Architect" }]);

    render(
      <MemoryRouter initialEntries={["/post-job"]}>
        <Routes>
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/jobs" element={<p>Jobs Board Redirected</p>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Post a Job");

    fireEvent.change(screen.getByPlaceholderText("Senior frontend engineer"), {
      target: { value: "Lead React Architect" },
    });
    fireEvent.change(screen.getByPlaceholderText("Describe the role, team, and outcomes."), {
      target: { value: "Build performant UI surfaces." },
    });

    const selects = screen.getAllByTestId("mock-select");
    // selects[0] is Location, selects[1] is Company
    fireEvent.change(selects[0], { target: { value: "United States" } });
    fireEvent.change(selects[1], { target: { value: "comp-1" } });

    fireEvent.change(screen.getByLabelText("Requirements markdown"), {
      target: { value: "## Requirements\n- 5+ years React" },
    });

    const submitBtn = screen.getByRole("button", { name: "Submit" });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(addNewJob).toHaveBeenCalledTimes(1);
    });

    expect(addNewJob).toHaveBeenCalledWith(
      "token-recruiter_1",
      {},
      expect.objectContaining({
        title: "Lead React Architect",
        description: "Build performant UI surfaces.",
        location: "United States",
        company_id: "comp-1",
        requirements: "## Requirements\n- 5+ years React",
        recruiter_id: "recruiter_1",
        isOpen: true,
      })
    );

    expect(await screen.findByText("Jobs Board Redirected")).toBeTruthy();
  });

  it("displays error message when company loading fails without breaking layout", async () => {
    getCompanies.mockRejectedValue(new Error("Supabase paused"));

    render(
      <MemoryRouter initialEntries={["/post-job"]}>
        <Routes>
          <Route path="/post-job" element={<PostJob />} />
        </Routes>
      </MemoryRouter>
    );

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "Could not load companies. Please refresh and try again."
    );
    expect(screen.getByText("Location")).toBeTruthy();
    expect(screen.getAllByText("Company").length).toBeGreaterThan(0);
    expect(screen.getByText("Add Company Drawer")).toBeTruthy();
  });
});
