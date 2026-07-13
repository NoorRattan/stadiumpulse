# API Reference

All protected routes use Supabase Auth access tokens with `Authorization: Bearer <token>`. Role checks are enforced server-side from the `user_role` custom access-token claim.

`GET /api/demo` deliberately avoids Groq calls and mutations. Its curated synthetic preview proves frontend to FastAPI to Supabase connectivity. `GET /api/experience` supplies the public schedule, venues, amenities, events, sustainability, alerts, FAQ, and official ticket handoff. Public concierge requests are rate-limited and stateless; signed-in concierge sessions retain recent conversation context. Public fan wayfinding and travel routes return deterministic fallback content without authentication; signed-in users can receive the Groq-enhanced versions. Staff role checks remain server-side for every portal and operations route.

| Method  | Path                                  | Auth               | Purpose                                                                                        |
| ------- | ------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| `GET`   | `/health`                             | None               | Health check. Returns service status without authentication.                                   |
| `GET`   | `/api/demo`                           | None               | Read-only, rate-limited FIFA 2026 scenario backed by seeded Supabase demo data.                |
| `GET`   | `/api/experience`                     | None               | Curated public tournament, venue, amenity, event, sustainability, alert, and FAQ hub.          |
| `POST`  | `/api/auth/signup`                    | None               | Create a confirmed email/password Supabase user and fan profile, then let the browser sign in. |
| `GET`   | `/api/auth/me`                        | Any signed-in user | Return the current user's backend profile.                                                     |
| `POST`  | `/api/auth/bootstrap`                 | Any signed-in user | Idempotently create or read the signed-in user's `profiles` row.                               |
| `GET`   | `/api/account/overview`               | Any signed-in user | Return clearly labelled demo passes and the caller's saved accessibility preferences.          |
| `POST`  | `/api/concierge/chat`                 | Optional           | Send a multilingual message. Public requests are stateless; signed-in sessions retain context. |
| `GET`   | `/api/wayfinding/zones`               | None               | Return identity-only zone options for selectors.                                               |
| `POST`  | `/api/wayfinding/route`               | Optional           | Generate accessibility-aware route options. Public requests use deterministic fallback steps.  |
| `GET`   | `/api/accessibility/settings`         | Any signed-in user | Read the caller's accessibility preferences.                                                   |
| `PUT`   | `/api/accessibility/settings`         | Any signed-in user | Update the caller's accessibility preferences.                                                 |
| `GET`   | `/api/travel/suggestions?matchId=...` | Optional           | Return sustainable travel suggestions. Public requests use curated fallback descriptions.      |
| `GET`   | `/api/crowd/zones`                    | Staff or volunteer | List live crowd-zone summaries for the ops dashboard.                                          |
| `GET`   | `/api/crowd/digest`                   | Staff or volunteer | Rank the top three projected pressure points into an approval-gated 15-minute action digest.   |
| `GET`   | `/api/crowd/zones/{zoneId}`           | Staff or volunteer | Read one live crowd-zone summary.                                                              |
| `GET`   | `/api/crowd/zones/{zoneId}/forecast`  | Staff or volunteer | Project the next 15 minutes from recent readings and narrate an action.                        |
| `POST`  | `/api/incidents`                      | Staff or volunteer | Generate a draft incident report from freeform notes.                                          |
| `GET`   | `/api/incidents?zoneId=&status=`      | Staff or volunteer | List paginated incident reports with optional filters.                                         |
| `PATCH` | `/api/incidents/{incidentId}`         | Staff only         | Transition an incident status to submitted or resolved.                                        |
| `POST`  | `/api/briefings/generate`             | Staff only         | Generate a per-zone volunteer briefing.                                                        |
| `GET`   | `/api/briefings/{zoneId}`             | Staff or volunteer | Read the latest briefing for a zone.                                                           |
| `GET`   | `/api/portals/volunteer`              | Staff or volunteer | Return the volunteer schedule, tasks, training, and advanced guidance workspace.               |
| `GET`   | `/api/portals/operations`             | Staff only         | Return organizer-level crowd, transport, incident, and staffing priorities.                    |
| `GET`   | `/api/portals/venue-staff`            | Staff only         | Return security, medical, cleaning, crowd, and guest-services queues.                          |
| `GET`   | `/api/portals/command-center`         | Staff only         | Return explainable, approval-gated control-room recommendations and audit state.               |

> **Note**: Render exposes the backend health endpoint directly at `/health`. The frontend is hosted separately on Cloudflare Pages and calls the Render API through `VITE_API_BASE_URL`; there is no Firebase Hosting `/api/**` rewrite.

Standard errors use:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This action requires staff role.",
    "status": 403
  }
}
```

Possible error codes are `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `CONFLICT`, `NOT_FOUND`, `RATE_LIMITED`, `INTERNAL_ERROR`, and `AI_UPSTREAM_ERROR`.

Crowd values in the demo deployment are explicitly simulated. Forecast and digest ranking math is deterministic and bounded to `0..100`; Groq only phrases the operational narrative around server-computed projections. Digest recommendations never execute an operational change and always require supervisor approval.
