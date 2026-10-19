# Hire Harbor

A two-sided job board: job seekers discover and apply to listings; employers post jobs and manage applications.

## Language

**Harbor Bold**:
The app's visual identity — deep navy + signal orange, sharp edges, sans-serif everywhere, light and dark modes. The canonical answer to "which theme?".
_Avoid_: theme A, the blue one, default theme

**Style Lab**:
Deleted throwaway page that compared candidate themes before Harbor Bold was selected.
_Avoid_: theme picker, playground

**Border + Hover Lift**:
The confirmed surface language for Harbor Bold. Interactive cards rest with a hairline border, then
lift slightly with a stronger border and restrained shadow on hover.
_Avoid_: soft SaaS elevation, flat-only cards

**Listing**:
A single job posted by an employer, shown as a card in grids.
_Avoid_: job post, vacancy, ad

## UI Overhaul Status

Current branch: `feat/ui-overhaul`.

Locked decisions:
- Visual identity: Harbor Bold.
- Default theme: dark.
- Scope: core loop first (`Header`, landing page, job listing page, listing cards, job detail page, application workflow surfaces).
- Surface language: Border + Hover Lift.
- Legacy styling removed: `.gradient-title`, `grid-background`, `blue` button variant.

Implemented:
- `src/components/header.jsx` uses the compact Harbor Bold nav/auth treatment.
- `src/pages/landing.jsx` is the dark-first core loop entry screen.
- `src/components/job-card.jsx` uses the confirmed Border + Hover Lift treatment.
- `src/pages/jobListing.jsx` organizes search/filter/results/pagination around scannability.
- `src/pages/job.jsx` has clearer title/company/meta panels, apply/status placement, missing-job guardrails, and recruiter application empty states.
- `src/components/apply-job.jsx` uses labeled Harbor Bold form controls, loading guards, and PDF/Word resume validation including `.docx`.
- `src/components/application-card.jsx` uses status-aware application badges and disabled recruiter status controls while updates are loading.
- `.gitignore` ignores local `learn.md` notes.
- `/style-lab` has been deleted.
- Database mutations propagate query errors and call `assertRowsAffected()` before reporting success. Storage upload errors still use generic messages; row checks do not prove authorization policies are correct.
- Save/delete/status controls update after successful responses. Job deletion asks for confirmation; pending actions disable their controls. Application form values are retained on submission failure.
- Company drawer submission stops propagation to the job form, closes on success, and resets its values. Company selection compares IDs as strings.
- Client-side upload limits: 2 MiB for company logos and 5 MiB for resumes; accepted MIME types are checked. File content and server-side limits remain unverified.
- `LoadError` centralizes failure copy. The jobs board retains search/filter controls on load errors but hides results; saved jobs and created-job/application lists return only the error fallback. Job detail can retain its last loaded record on refresh failure.
- `useFetch` captures invocation-time callback/flat options and uses the latest committed session. Only the newest request updates hook state. Session/readiness/resource changes and unmounts invalidate old work; state is hidden immediately for a different owner. `fn` is stable within that owner and changes to trigger refetches when ownership changes.
- Read effects wait for session readiness. Protected routes wait for matching Clerk user/session state and reset child forms on account/session changes. Mutation continuations check `result.isCurrent()` before changing UI; already-dispatched mutations are not cancelled. Job detail data and actions are scoped to the route ID.
- Both the requirements editor preview and job detail use shared `SafeMarkdown` components with `rehype-sanitize` appended after HTML parsing, rewriting, and highlighting. The default allowlist removes unsafe HTML, attributes, and URL schemes.
- Route-level code-splitting with `React.lazy` and `Suspense` in `App.jsx` and `app-layout.jsx` splits all application routes into dynamic chunks. Main JS entry bundle reduced from 2,055.36 kB down to 394.45 kB.
- `vercel.json` provides SPA rewrite rules (`/(.*)` -> `/index.html`) to ensure deep routes like `/job/:id` don't 404 on deployment.
- `.github/workflows/ci.yml` sets up automated GitHub Actions CI running lint, test suite (82 tests), and production build across Node 20 and Node 22 on push and pull requests.
- `apiApplication.js` transitions resume persistence from public URLs to private storage object paths, with short-lived signed URL retrieval (`getResumeSignedUrl`) and orphaned file cleanup on insert failure. `ApplicationCard` downloads via signed URLs with backwards-compatible fallback for legacy public URLs.

Verification and evidence (updated 2026-10-18):
- `npm test` passes 82 tests across seven files: 23 request/session/page cases, 17 application workflow and candidate tracking cases, 6 job save/unsave/delete cases, 5 post-job recruiter form validation/creation/redirect cases, 3 real Markdown pipeline cases, and 28 mocked API regression cases.
- `npm run lint` and `npm run build` pass with 0 errors. Main entry bundle is 394.45 kB (123.70 kB gzip).
- `git diff --check` passes cleanly.
- Vitest/Testing Library test suites cover:
  - Candidate application submission with resume file, error retention, and disabled state on already-applied/closed jobs.
  - Candidate application tracking under `/my-jobs` with status badges and empty state.
  - Recruiter review on `/job/:id` and `/my-jobs`: applicant details, resume signed URL download with legacy public fallback, and status transitions (`applied` -> `interviewing` -> `hired` -> `rejected`).
  - Candidate/recruiter job actions: save/unsave toggling and recruiter job deletion with confirmation and cancellation.
- Dependency installation reported 23 advisories (1 low, 5 moderate, 15 high, 2 critical); these have not been triaged or fixed in this change.
- Live Recruiter QA was previously demonstrated directly in the browser: posted job `Staff Frontend Engineer (Harbor Bold Demo)` (`d3a98e80-54c2-4b98-b9ed-463c71a19847`) under company `QA Disposable Harbor 20260917`.

Next steps:
- Use [the release-readiness review](docs/release-readiness.md) for findings, evidence limits, and release gates.
- Review database/storage RLS policies on Supabase directly before real-user deployment.
- Verify cross-account boundaries in live browser QA with candidate/recruiter accounts.
- Review working tree changes, commit, and open PR to `main`.
