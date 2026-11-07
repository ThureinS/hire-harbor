export const DEMO_ACCOUNTS = [
  {
    id: "candidate",
    role: "candidate",
    title: "Demo Candidate",
    subtitle: "Job Seeker",
    badge: "Candidate Role",
    email: import.meta.env.VITE_DEMO_CANDIDATE_EMAIL || "candidate.demo@hireharbor.dev",
    password: import.meta.env.VITE_DEMO_CANDIDATE_PASSWORD || "DemoHarbor2026!",
    targetPath: "/jobs",
    description: "Explore the platform from an applicant's perspective.",
    features: [
      "Search & filter jobs by title, company, location",
      "Apply to jobs with PDF/Word resume upload",
      "Save jobs & track application statuses",
    ],
  },
  {
    id: "recruiter",
    role: "recruiter",
    title: "Demo Recruiter",
    subtitle: "Employer / Company",
    badge: "Recruiter Role",
    email: import.meta.env.VITE_DEMO_RECRUITER_EMAIL || "recruiter.demo@hireharbor.dev",
    password: import.meta.env.VITE_DEMO_RECRUITER_PASSWORD || "DemoHarbor2026!",
    targetPath: "/post-job",
    description: "Explore the platform from an employer's perspective.",
    features: [
      "Post new jobs with Markdown requirements editor",
      "Add company profile with logo upload",
      "Review candidate resumes & update hiring pipeline",
    ],
  },
];
