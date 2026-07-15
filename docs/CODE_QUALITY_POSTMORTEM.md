# Code Quality Postmortem

Date: 2026-07-15

## Scope

This review covered backend and frontend production code, tests, build checks,
browser coverage, dependency hygiene, and duplication. The final verification
used Ruff, ESLint, Prettier, TypeScript, Knip, jscpd, pytest with branch
coverage, Vitest, and Playwright. Generated dependencies, build output, and
local tool caches were excluded from source metrics.

## Final state

| Gate                    | Final result                                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| ESLint structural rules | Zero warnings and zero errors                                              |
| Cyclomatic complexity   | Maximum 10 per function                                                    |
| Function size           | Maximum 75 lines, excluding blank lines and comments                       |
| File size               | Maximum 500 lines, excluding blank lines and comments                      |
| Knip                    | 14 findings before remediation, 0 after                                    |
| jscpd                   | 34 clones / 362 lines / 1.60% before; 14 clones / 168 lines / 0.74% after  |
| Production duplication  | Zero detected production clones at 5 lines / 50 tokens                     |
| Backend tests           | 149 passed                                                                 |
| Backend coverage        | 100% statements and 100% branches                                          |
| Browser design          | Skip-free across five browser/device profiles plus a dedicated axe project |

The 14 remaining jscpd clone groups are test-only setup, mock, and fixture
patterns. They do not duplicate production behavior. No exclusions or threshold
changes were added to hide them.

## What changed

### Permanent structural enforcement

The frontend ESLint configuration now enforces complexity 10, 75 lines per
function, and 500 lines per file as errors. These limits apply to all TypeScript
and TSX source checked by ESLint. The final strict run has zero warnings, so
there is no accepted-warning list or presentation-code exception.

### Cockpit and page decomposition

The role cockpit entry page now dispatches to separate fan, volunteer, staff,
and organizer implementations. Large panels were separated into cohesive
sections, view models, and state helpers. Snapshot and simulated data labels are
explicit, and the nonfunctional Snooze action was removed.

The briefing, crowd dashboard, incident, and role portal pages now keep page
orchestration separate from headers, state loading, metrics, maps, lists,
previews, and error states. Fan-facing public experience, travel, wayfinding,
support, account, demo, and authentication pages received the same focused
decomposition where their previous render functions crossed the permanent
limits.

### Component decomposition

Concierge request state, speech handling, and the floating dock were separated
from message rendering. Crowd digests, incident forms and lists, navigation,
page heroes, theme transitions, venue maps, particle rendering, seat previews,
and the venue network globe were split into focused components, hooks, or scene
helpers. The globe no longer combines projection, canvas drawing, interaction,
and venue data in one callback, and the fan cockpit no longer owns every panel
in one component.

This work preserved accessibility names, reduced-motion behavior, role checks,
API contracts, deterministic fallbacks, and existing user-visible flows.

### Dead-code and API-surface cleanup

Knip initially reported one unused file, one unused export, and 12 unused
exported types. The service worker was a real production runtime entry, so it
was declared in `knip.json` instead of deleted. Genuinely unused exports and
types were removed or made module-private. The final `npx knip` run exits clean
with no findings or configuration hints.

### Duplication cleanup

Production duplication was removed through shared behavior rather than jscpd
exclusions:

- Crowd risks now use one mapper for operational digest response items.
- Demo incident and briefing responses inherit their common artifact fields.
- Zone selectors share one option renderer.
- The theme-independent brand gradient is declared once.
- Repeated authenticated page-test setup uses one test renderer and auth-value
  factory.

The literal command
`npx jscpd ../backend src --min-lines 5 --min-tokens 50` now reports 14
test-only clone groups and 0.74% duplicated lines overall, down from 34 groups
and 1.60%. CSS, production TypeScript/TSX, and production Python have no clone
group at that threshold.

### Backend verification

Shared crowd response mapping and demo response schemas retain their external
JSON contracts. The full backend suite now runs 149 tests and reaches 100% for
both statements and branches. The coverage gate is enforced rather than
reported as an informational metric.

### Skip-free browser coverage

Playwright does not use `test.skip`, `test.fixme`, or conditional test exits.
Behavioral coverage runs through Chromium, Firefox, WebKit, mobile Chrome, and
mobile Safari. Accessibility coverage is routed to a dedicated axe Chromium
project through project matching, so each selected test executes instead of
being counted and skipped at runtime. Traces, screenshots, and videos are
retained on failure. The final matrix passes all 63 checks: 40 behavioral and
responsive checks across the five profiles plus 23 all-severity axe scans.

## Prevention rules

1. Keep ESLint complexity at 10, function length at 75, and file length at 500
   as error-level gates. New warnings are merge blockers.
2. Run Ruff, backend tests with 100% statement and branch coverage, ESLint,
   Prettier, TypeScript, Vitest, the production build, bundle checks, contrast
   checks, dependency audits, and Playwright before merging to `main`.
3. Keep `npx knip` at zero findings. Declare non-imported runtime assets as
   explicit entries instead of deleting them or suppressing the report.
4. Run the literal jscpd command before merging. Keep overall duplicated lines
   below 1% and do not accept production clone groups or add exclusions to meet
   the threshold.
5. Add shared helpers only when they represent one real behavior or contract;
   do not create abstractions solely to change a metric.
6. Keep browser tests skip-free. Use Playwright projects and matching to route
   platform-specific coverage, and fail when a required prerequisite is
   unavailable.
7. Keep generative output downstream of deterministic safety, routing, and
   authorization logic. Every AI call must retain a tested fallback and require
   human review before operational mutation.
8. Re-run the live role, RLS, custom-claim, health, and database-backed smoke
   checks after changing authentication, policies, deployment configuration, or
   persistence behavior.
