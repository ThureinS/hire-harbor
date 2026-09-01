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

Verification performed:
- `npm run lint` passed.
- `npm run build` passed; Vite large chunk warning remains.
- Local visual QA covered public landing, recruiter `/post-job`, missing job route, and desktop/mobile overflow checks.
- Mutating QA remains intentionally untested: no submissions, uploads, saves, deletes, or status changes.

Next steps:
- Perform real authenticated candidate and recruiter flow QA in a disposable Supabase/Clerk test environment.
- Decide whether to address the Vite large chunk warning with route-level code splitting.
- Review remaining mutating actions for confirmation, optimistic state, and failure feedback before merging to `main`.
- Push `feat/ui-overhaul` and open a PR for review once mutating QA is complete.
