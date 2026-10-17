# Release-readiness review

Initially reviewed 2026-09-17 on `feat/ui-overhaul`, including the uncommitted
changes after `88912e9`; implementation and regression evidence updated 2026-09-20.
This is a code-only review of the current working tree. Browser work remains paused
at the user's request. No production deployment or remote policy audit was performed.
This review does not approve a release.

## Evidence and limits

| Check | Result |
| --- | --- |
| Existing changes | Before new edits, lint/build passed with a 2,009.57 kB entry bundle (635.86 kB gzip). API/UI/documentation changes were reviewed in the diff. |
| `npm test` | 82 passing tests across seven files: 23 request/session/page cases, 17 application workflow and candidate tracking cases, 6 job save/unsave/delete cases, 5 post-job recruiter cases, 3 Markdown cases, and 28 API cases. |
| `npm run lint` | Passed with no warnings on the combined working tree. |
| `npm run build` | Passed; route-level dynamic imports with `React.lazy` and `Suspense` reduced the main JS entry bundle from 2,055.36 kB down to 394.45 kB (123.70 kB gzip). |
| `git diff --check` | Passed. |
| Request/session regressions | Mounted React tests with deferred promises cover response order, invocation inputs, readiness, account/session changes, sign-out, route changes, unmounts, StrictMode, token errors, and mutation result ownership. |
| Markdown regressions | Real editor/renderer pipeline tested in jsdom for unsafe HTML/URLs and preservation of ordinary Markdown. No browser exploit or visual QA performed. |
| Existing API regressions | Mocked Supabase tests cover original error propagation, empty mutation results, missing detail, user-scoped saved queries, literal search wildcard escaping, private resume signed URL generation, and legacy public URL fallback. They do not test live RLS or storage. |
| Dependency advisories | Installation reported 23 advisories (1 low, 5 moderate, 15 high, 2 critical). Not triaged or remediated in this change. |
| Deployment configuration | `vercel.json` added with SPA rewrite rules (`/(.*)` -> `/index.html`) to support deep-linking. No committed SQL migrations or CI workflow found. |
| Earlier authenticated QA | Company/job creation, board visibility, and candidate save-control success were observed before browser work paused. See `CONTEXT.md` for exact disposable records and remaining flows. |

## Architecture and code findings

The existing split between pages, reusable UI, API functions, and a shared request
hook is reasonable for the current project. A wholesale rewrite is not needed.
The highest-value work is strengthening request ownership and database boundaries.

### 1. Request lifetime and identity — implemented and locally regression-tested

`src/hooks/use-fetch.js` now captures the callback and a shallow copy of flat
options before awaiting the token. The newest invocation owns data/error/loading;
older results still return to their callers without replacing current hook state.
`fn` is stable within a session/resource and changes when ownership changes.

The hook exposes `ready` for read effects. Session ID, user ID, readiness, and an
optional resource key define ownership. A committed identity/resource change or
unmount invalidates pending work; render-time state masking prevents displaying
another owner's data before effects run. Stale tokens cannot dispatch a new API
call. An API mutation already dispatched can still finish on the server: callers
receive its outcome and must check `result.isCurrent()` before UI side effects.

Saved jobs, created jobs/applications, board/company reads, and detail reads wait
for session readiness and refetch for a new identity. Protected routes also wait
for matching Clerk user/session state and reset child forms on account/session
changes. Job detail reads and hiring mutations use the route ID as their resource
key; mismatched records are not rendered. Refresh failure may retain data only for
the same record and session.

Tests: `src/hooks/use-fetch.test.jsx` and `src/test/request-pages.test.jsx`.
Clerk and API calls are mocked, while React lifecycle/effects and routing are real.
Actual Clerk/Supabase integration and browser account switching remain QA gates.

### 2. Markdown boundary — implemented and locally regression-tested

`src/components/safe-markdown.jsx` shares one policy between the requirements
editor in `post-job.jsx` and persisted requirements in `job.jsx`. `pluginsFilter`
appends `rehype-sanitize` after all parsing, rewriting, attribute, and highlighting
plugins. The default allowlist removes scripts, embedded documents, SVG/MathML,
inline event/style attributes, and unsafe URL schemes. It also prefixes IDs/names
to mitigate DOM clobbering; arbitrary author HTML/styling is intentionally limited.

`src/components/safe-markdown.test.jsx` mounts the real renderer and editor,
including a subsequent edit, and checks unsafe raw HTML, encoded/Markdown URLs,
rewritten HTML, and ordinary links/images, emphasis, lists, tables, and code.
Stored Markdown remains unchanged; sanitization occurs on rendering. Any future
rendering surface must use this boundary too. Visual/browser QA remains pending.

### 3. Authorization and resume privacy — block real-user deployment

- `apiApplication.js` now persists private storage object paths and generates short-lived
  signed URLs (`getResumeSignedUrl`) for authenticated downloads. Storage uploads are
  cleaned up on database insert failure. `ApplicationCard` uses signed URLs with a
  fallback for legacy public URLs. Server-side storage RLS policies still require verification.
- `onboarding.jsx` writes the role into user-editable `unsafeMetadata`. UI role
  checks are not server authorization. Decide whether recruiter capability is
  self-service or approved, then enforce the intended permissions server-side.
- The README's original `auth.uid()::text` examples were incompatible with Clerk's
  non-UUID subject. Documentation now uses `auth.jwt()->>'sub'`. No live policies
  were changed or verified by editing those examples.
- The illustrative schema/policies still need protection against duplicate
  applications, applying to closed jobs, forged ownership, and recruiter changes
  to application fields other than status. Verify actual schema, grants, RLS, and
  storage policies using separate candidate/recruiter accounts before release.
- `assertRowsAffected()` catches a mutation returning no rows. It does not prove
  that all unauthorized writes are denied or that returned-row visibility fully
  describes what happened. Test policies independently.

### 4. Upload recovery and errors — follow-up implementation

`apiApplication.js` and `apiCompanies.js` upload before inserting a database row.
Failed inserts can leave orphaned objects; filenames use a limited random number
and have no original extension. Use collision-resistant names, validated extensions,
and cleanup/reconciliation designed for ambiguous network failures. Storage errors
still use generic messages; the earlier claim that every mutation preserves the
original error was too broad.

Client limits are 5 MiB for resumes and 2 MiB for logos, with MIME-type checks.
These do not verify file content or enforce storage-side restrictions. Configure
and test server limits before handling real uploads.

### 5. UI quality and scale — remaining checks

- The jobs board preserves filter controls on failure but hides its result list;
  saved jobs and created lists return only `LoadError`. Consistent retry behavior
  and deliberate stale-data treatment remain to be designed/tested.
- `jobListing.jsx` fetches on each keystroke and slices all fetched jobs locally;
  the API ignores the supplied page/limit and has no explicit sort. Use server
  pagination/counts and stable ordering before the dataset grows beyond API limits.
- `ApplyJobDrawer` labels have been updated to explicitly pair `htmlFor` with control IDs. Other forms and pagination anchors without `href` remain to be standardized for keyboard navigation.
- Job cards now show hiring state rather than an unfetched applicant count. Job
  detail still labels the RLS-visible applications length as a total; a candidate
  may see only their own application. Do not broaden application access to fix a
  count; hide it or provide a safe aggregate.

## Deployment gates

- [x] Fix and locally regression-test request lifetime/identity and Markdown handling.
- [ ] Review actual database/storage policies and constraints, with negative
  cross-account access tests; keep those definitions versioned.
- [x] Implement private resume handling before real-user deployment.
- [ ] Confirm production Clerk/Supabase configuration. Current code requests the
  legacy `supabase` JWT template; native third-party auth is not yet implemented.
- [ ] Keep service-role keys and JWT signing secrets out of `VITE_*` variables.
- [x] Add/verify SPA deep-link handling for Vercel, including refresh on `/job/:id` (`vercel.json`).
- [ ] Add CI for the chosen tests, lint, and production build; review dependency
  advisories. Installation reported advisories; a dependency-by-dependency security
  review and remediation remain open.
- [x] Evaluate route-level splitting and Markdown editor bundle cost (`React.lazy` / `Suspense` reduced entry bundle from 2.05 MB to 394 kB).
- [ ] Finish recruiter/candidate QA, failed-request cases, keyboard/mobile checks,
  and same-session account switching when browser work is authorized again.
- [ ] Review the final diff, commit, and open a PR. After release approval, deploy
  to the intended environment and perform a production smoke test with a rollback
  path. None of these release steps has been performed by this review.

## Documentation updates

`CONTEXT.md` now separates code findings, earlier observed QA, unverified remote
setup, and pending work. `README.md` corrects Node requirements, ownership examples,
private-resume guidance, current auth integration, unsupported job-edit claims,
and Tailwind configuration references. The identity ADR removes an unsupported
quantitative usability claim and avoids implying that the overhaul was deployed.

The 2026-09-20 implementation resolves findings 1 and 2 with local regression
coverage. README testing instructions and this review now describe the ownership
contract and evidence limits. Findings 3–5 and the remaining deployment gates are
still open; documentation examples do not change remote configuration.
