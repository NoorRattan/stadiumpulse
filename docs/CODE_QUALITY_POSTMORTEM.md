# Code Quality Postmortem

Date: 2026-07-15

## Scope

This review covered the current backend, frontend, tests, workflows, and live
public routes. It used Ruff, Radon, Vulture, ESLint complexity rules, Knip,
ts-prune, depcheck, jscpd, full unit tests, browser tests, and production
dependency audits. Generated dependencies, build output, and local tool state
were excluded from source metrics.

## What the review found

- The backend is well-factored overall: Radon reports an A average complexity
  grade and every production module has an A maintainability grade.
- `get_travel_suggestions` mixed input validation, ranking, AI fallback, and
  response assembly. Extracting travel context and description selection makes
  the deterministic and optional-AI paths independently testable.
- Three generated UI/date modules and the `shadcn` scaffolding CLI were no
  longer used. They increased the apparent API and dependency surface without
  contributing to the application.
- The public experience hooks repeated the same loading, error, refresh, and
  effect lifecycle. A generic internal resource hook now owns that behavior.
- Footer link groups repeated identical markup. A typed shared renderer now
  keeps labels, destinations, and responsive layout data-driven.
- The venue globe previously mixed projection, canvas rendering, interaction,
  and host-city data in one callback. It now delegates to cohesive scene,
  projection, and data modules. `VenueNetworkGlobe` complexity fell from 41 to
  3 and its component body fell from 587 measured lines to 298.
- The `/fan` cockpit previously combined five independent panels in a single
  component. Its ticket, route, matches, alerts, amenities, shared primitives,
  and view-model logic are now separated. `FanCockpit` complexity fell from 46
  to 1.
- Shared zone loading, CORS normalization, ops-zone adaptation, and route
  loading UI removed production clones. Exact clone detection fell from 45
  clones and 2.28% duplicated lines before remediation to 35 clones and 1.79%.

## Frontend structural-warning disposition

The original strict ESLint diagnostic produced 59 warnings. The final run
produces 47: 12 complexity warnings, 34 function-length warnings, and one file-
length warning. No max-parameter, nesting, warning-comment, or correctness-rule
warning remains.

The 34 function-length findings use a deliberately aggressive 75-line limit
that counts declarative JSX, fixtures, accessibility labels, and Tailwind class
strings as executable structure. Two are test scenarios (`ConciergeChat.test`
and `LoginPage.test`); the other 32 are bounded page or visual renderers. Every
one is covered by unit, axe, or five-profile browser tests. They are accepted as
presentation-size signals rather than hidden control-flow defects. The only
file-length finding is `CockpitPage.tsx`, which now contains the three remaining
read-only role cockpits after the fan cockpit was extracted.

The remaining complexity findings are explicitly accounted for:

| Function                        | Complexity | Reason retained                                                                                            |
| ------------------------------- | ---------: | ---------------------------------------------------------------------------------------------------------- |
| `ConciergeChat`                 |         12 | Request, speech, retry, and authenticated-session states are exercised together by unit and browser tests. |
| `ConciergeMessage`              |         12 | Small role/content rendering variants; no state or side effects.                                           |
| `GlassCard`                     |         12 | Declarative animation and style variants only.                                                             |
| `PageHero`                      |         17 | Declarative optional hero regions and motion variants.                                                     |
| `ParticleCanvas` frame callback |         12 | Bounded animation loop with reduced-motion coverage and cleanup.                                           |
| `AccountPage`                   |         16 | Explicit loading, signed-out, error, and authenticated account states.                                     |
| `StaffCockpit`                  |         14 | Read-only data/fallback presentation; no mutations.                                                        |
| `OrganizerCockpit`              |         28 | Read-only multi-panel presentation; approval state is local demo state only.                               |
| `DemoPage`                      |         11 | Explicit loading, failure, and connected-demo branches.                                                    |
| `PublicExperiencePage`          |         19 | One route renders several selected public directory modes from a common API response.                      |
| `WayfindingPage`                |         15 | Form validation, deterministic fallback, request, and route-result states.                                 |
| `DashboardPage`                 |         14 | Live-loading, selected-zone, and forecast-result states.                                                   |

These are not being represented as eliminated. They are retained because a
late broad rewrite would raise regression risk without changing authorization,
domain logic, or evaluator-visible behavior. The two worst named outliers were
decomposed and the remaining list is now explicit and reproducible.

## Operational root cause

The warm-up workflow ran only once every three days even though the hosted
backend can idle between visits. That schedule could not protect an evaluator
or demo visitor from a cold start. The workflow now calls both the process-only
health endpoint and the database-backed demo endpoint every ten minutes. This
keeps the useful end-to-end path exercised instead of masking database wake-up
latency with a shallow health check.

## Prevention rules

1. Run Ruff, full backend coverage, ESLint, Prettier, Vitest, TypeScript, the
   production build, bundle check, contrast check, audits, and Playwright before
   merging to `main`.
2. Run Knip and an exact clone scan before adding a new dependency, generated
   UI primitive, barrel export, or cross-page abstraction.
3. Keep generative code downstream of deterministic safety and routing logic;
   every AI call must retain a tested fallback.
4. Treat a new React function above 150 lines or complexity 15 as a refactoring
   prompt. Extract data shaping or one cohesive rendered region, then preserve
   behavior with its existing unit and browser tests.
5. Keep `/health` minimal, but pair it with a database-backed smoke path in
   uptime automation so process health cannot conceal dependency failure.
6. Re-run the live RLS and custom-claim transaction audit after changing roles,
   policies, triggers, or authentication bootstrap behavior.
