# Building StadiumPulse: A Venue Nervous System for World Cup Match Days

Stadium match days are not a collection of independent screens. A gate becoming
crowded changes the route a fan should take, the message a concierge should
give, the briefing a volunteer needs, and the decision an operator may need to
review. StadiumPulse was built around that relationship.

Instead of creating seven disconnected AI widgets, StadiumPulse treats the
venue as one nervous system. Deterministic crowd and route signals form the
shared source of truth. Generative AI explains those results, translates them,
or turns them into a reviewable draft, but it cannot change a safety-critical
number or autonomously execute an operational action.

## The problem

World Cup visitors need practical answers under pressure: which gate should I
use, can I reach my section without stairs, what transport option avoids the
largest queue, and can I ask those questions in my preferred language?

Venue teams face the same event from the other side. They need to understand
crowd movement, see which zones may deteriorate in the next 15 minutes, prepare
incident drafts consistently, and brief volunteers without losing the human
approval step.

StadiumPulse connects those two perspectives. The fan experience and the
operations console use the same venue context rather than competing copies of
the truth.

## How the system works

The React and TypeScript frontend is deployed on Cloudflare Pages. FastAPI on
Render owns the domain logic, authorization, rate limits, and AI-provider calls.
Supabase provides Postgres, Auth, row-level security, and Realtime change
signals. Groq provides the language-model layer.

The ordering of responsibilities matters:

1. The backend reads current venue context and calculates density bands,
   forecasts, route candidates, and ranked actions deterministically.
2. Role checks and row-level security decide which authenticated user may read
   or change operational data.
3. Groq receives bounded context and explains or formats an already-computed
   result.
4. If the AI provider is unavailable, tested deterministic fallbacks keep fan
   routes and operational review paths usable.
5. Incident drafts and briefings remain human-reviewed. StadiumPulse never
   triggers physical venue action.

This design makes the AI useful without turning it into an unreviewable control
system.

## The evaluator walkthrough

The public `/demo` route proves the browser-to-FastAPI-to-Supabase connection
without requiring an account. It displays a selectable crowd map, an accessible
route, multilingual concierge examples, travel guidance, and the ranked
operations digest.

Two operational workflows normally remain protected because real incident and
briefing endpoints require staff or volunteer authorization. To make those
capabilities reviewable without weakening security, the public demo contains
clearly labelled, synthetic replays of the Incident Copilot and Briefing
Generator. A visitor can run both flows and see structured, scenario-derived
output, but the replay never writes an incident, creates a briefing, consumes
shared credentials, or pollutes another visitor's view.

The public concierge remains the live generative proof path. Anonymous requests
are stateless and rate-limited; signed-in sessions can retain recent context.

## Accessibility and honest demo boundaries

Accessibility is part of routing, not a settings afterthought. The application
supports step-free route preferences, labelled keyboard navigation, skip links,
read-aloud concierge replies, high contrast, and reduced motion. The browser
suite checks public routes for serious or critical axe findings, heading
structure, horizontal overflow, keyboard globe interaction, and motion safety
across desktop and mobile browser profiles.

The demo also says what it does not have. Crowd readings are synthetic, not
physical sensor claims. Ticket passes are demonstrations, not official FIFA
tickets. Camera AR, CCTV ingestion, and autonomous venue control are not
presented as live integrations.

## Reliability and security lessons

A shallow health endpoint is not enough for a hosted demo. The warm-up workflow
therefore calls both `/health` and the database-backed `/api/demo` path every ten
minutes. That exercises the useful dependency path instead of hiding database
wake-up latency behind a process-only response.

The security boundary is tested at several layers: JWT validation, server-side
role checks, Postgres RLS, a protected role-change trigger, and a custom access-
token hook that copies the authoritative database role into the token claim.
Anonymous visitors cannot read profiles or operational zone rows, and users
cannot grant themselves a staff role.

## What changed during the quality pass

The final hardening pass decomposed the animated venue globe into host-city
data, projection, scene rendering, and interaction boundaries. Its measured
complexity fell from 41 to 3. The fan cockpit was split into cohesive ticket,
route, match, alert, and amenity regions, reducing its component complexity from
46 to 1.

Unused UI primitives and an unused scaffolding CLI were removed. Shared zone
loading, CORS parsing, route-loading UI, and ops-zone conversion replaced
duplicated implementations. Exact clone detection dropped from 45 clones and
2.28% duplicated lines to 35 clones and 1.79%.

The project is verified with complete backend statement coverage, frontend unit
and accessibility tests, TypeScript and formatting gates, bundle and contrast
budgets, production dependency audits, and Playwright across Chromium, Firefox,
WebKit, Pixel 7, and iPhone 13 profiles.

## Try StadiumPulse

- Live application: <https://stadiumpulse.pages.dev>
- Public connected demo: <https://stadiumpulse.pages.dev/demo>
- Source repository: <https://github.com/NoorRattan/stadiumpulse>

StadiumPulse's central idea is simple: one trustworthy venue signal should help
both the person finding a seat and the team keeping the venue safe. AI is most
valuable when it makes that shared signal understandable, accessible, and
actionable while leaving safety decisions in human hands.
