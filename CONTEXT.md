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
- Scope: core loop first (`Header`, landing page, job listing page, listing cards, job detail page).
- Surface language: Border + Hover Lift.
- Legacy styling removed: `.gradient-title`, `grid-background`, `blue` button variant.

Implemented:
- `src/components/header.jsx` uses the compact Harbor Bold nav/auth treatment.
- `src/pages/landing.jsx` is the dark-first core loop entry screen.
- `src/components/job-card.jsx` uses the confirmed Border + Hover Lift treatment.
- `src/pages/jobListing.jsx` organizes search/filter/results/pagination around scannability.
- `src/pages/job.jsx` has clearer title/company/meta panels and apply/status placement.
- `/style-lab` has been deleted.

Verification expectation:
- Run `npm run build`.
- Run `npm run lint`.
- Start `npm run dev` and visually check desktop/mobile for layout, contrast, hover states, and text overflow.
