# Harbor Bold as the UI identity, sans-only typography

## Status

accepted (2026-08-26, branch `feat/ui-overhaul`)

## Decision

HireHarbor's visual identity is **Harbor Bold**: deep navy foreground, signal-orange primary, sharp 6px radii, system sans-serif everywhere, full light + dark modes. No display-serif layer.

## Context

A UI overhaul was brainstormed against six candidate themes (A Harbor Bold light/dark, B Premium Minimal, C Playful Warm, D Dark Techy, E Deep Sea, F Editorial Newsprint, G Harbor Editorial) on a throwaway style lab (`/style-lab`). Research showed 2026's editorial-serif trend (serif display + sans UI, à la Stripe/Notion) would differentiate the brand, and a hybrid (G) was seriously considered.

## Why the "generic" option won

- A job board's core surfaces are dense functional data (listings, forms, dashboards); sans-serif measurably outperforms serif there (~12% faster task completion, NN/g), and credibility is judged on scannability.
- A sans-only system has zero font dependencies, no licensing/perf overhead, and no risk of the serif voice leaking into job data — the failure mode the user explicitly rejected in F.
- The distinctiveness cost is accepted and mitigated by execution (spacing discipline, hairline rules, motion polish), not by palette.

## Considered and rejected

- **F Editorial Newsprint** — distinctive, trust-signaling, but serif typography read as non-professional/non-job-board in practice.
- **G Harbor Editorial** (A + Fraunces serif at display moments) — the industry-standard hybrid, judged not worth a typographic system rule + font dependency for this project's scale.

## Consequences

- Fraunces (and any webfont) stays out of `index.html`.
- The style lab was deleted after the core overhaul shipped.
- Legacy identity remnants (`.gradient-title` gray gradient, `blue` button variant, `grid-background`) have been removed as part of the overhaul.
- Workflow forms and application status panels now follow the same Harbor Bold rules: labeled sans-serif controls, signal-orange action emphasis, sharp 6px surfaces, and guarded loading/disabled states.
