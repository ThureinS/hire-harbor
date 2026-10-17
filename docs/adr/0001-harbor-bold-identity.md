# Harbor Bold as the UI identity, sans-only typography

## Status

accepted (2026-08-26, branch `feat/ui-overhaul`)

## Decision

HireHarbor's visual identity is **Harbor Bold**: deep navy foreground, signal-orange primary, sharp 6px radii, system sans-serif everywhere, full light + dark modes. No display-serif layer.

## Context

A UI overhaul was brainstormed against seven candidate themes (A Harbor Bold light/dark, B Premium Minimal, C Playful Warm, D Dark Techy, E Deep Sea, F Editorial Newsprint, G Harbor Editorial) on a throwaway style lab (`/style-lab`). A serif display/sans body hybrid (G) was also considered as a way to distinguish the brand.

## Why the "generic" option won

- A job board's core surfaces are dense functional data (listings, forms, dashboards). Sans-serif was selected for visual consistency and scannability; no project usability study or verified quantitative performance comparison supports this choice.
- A sans-only system has zero font dependencies, no licensing/perf overhead, and no risk of the serif voice leaking into job data — the failure mode the user explicitly rejected in F.
- The distinctiveness cost is accepted and mitigated by execution (spacing discipline, hairline rules, motion polish), not by palette.

## Considered and rejected

- **F Editorial Newsprint** — distinctive, trust-signaling, but serif typography read as non-professional/non-job-board in practice.
- **G Harbor Editorial** (A + Fraunces serif at display moments) — a hybrid judged not worth a typographic system rule + font dependency for this project's scale.

## Consequences

- Fraunces (and any webfont) stays out of `index.html`.
- The style lab was deleted during implementation of the core overhaul; this does not imply a production release.
- Legacy identity remnants (`.gradient-title` gray gradient, `blue` button variant, `grid-background`) have been removed as part of the overhaul.
- Workflow forms and application status panels now follow the same Harbor Bold rules: labeled sans-serif controls, signal-orange action emphasis, sharp 6px surfaces, and guarded loading/disabled states.
