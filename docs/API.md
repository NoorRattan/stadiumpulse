# API Reference

All protected routes use Supabase Auth access tokens with `Authorization: Bearer <token>`. Role checks are enforced server-side from the `user_role` custom access-token claim.

| Method  | Path                                  | Auth               | Purpose                                                                                      |
| ------- | ------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| `GET`   | `/health`                             | None               | Health check. Returns service status without authentication.                                 |
| `GET`   | `/api/auth/me`                        | Any signed-in user | Return the current user's backend profile.                                                   |
| `POST`  | `/api/auth/bootstrap`                 | Any signed-in user | Idempotently create or read the signed-in user's `profiles` row.                             |
| `POST`  | `/api/concierge/chat`                 | Any signed-in user | Send a multilingual concierge message and receive the assistant reply.                       |
| `GET`   | `/api/wayfinding/zones`               | Any signed-in user | Return identity-only zone options for selectors.                                             |
| `POST`  | `/api/wayfinding/route`               | Any signed-in user | Generate accessibility-aware route options around crowd density.                             |
| `GET`   | `/api/accessibility/settings`         | Any signed-in user | Read the caller's accessibility preferences.                                                 |
| `PUT`   | `/api/accessibility/settings`         | Any signed-in user | Update the caller's accessibility preferences.                                               |
| `GET`   | `/api/travel/suggestions?matchId=...` | Any signed-in user | Return sustainable travel suggestions for a selected match.                                  |
| `GET`   | `/api/crowd/zones`                    | Staff or volunteer | List live crowd-zone summaries for the ops dashboard.                                        |
| `GET`   | `/api/crowd/digest`                   | Staff or volunteer | Rank the top three projected pressure points into an approval-gated 15-minute action digest. |
| `GET`   | `/api/crowd/zones/{zoneId}`           | Staff or volunteer | Read one live crowd-zone summary.                                                            |
| `GET`   | `/api/crowd/zones/{zoneId}/forecast`  | Staff or volunteer | Project the next 15 minutes from recent readings and narrate an action.                      |
| `POST`  | `/api/incidents`                      | Staff or volunteer | Generate a draft incident report from freeform notes.                                        |
| `GET`   | `/api/incidents?zoneId=&status=`      | Staff or volunteer | List paginated incident reports with optional filters.                                       |
| `PATCH` | `/api/incidents/{incidentId}`         | Staff only         | Transition an incident status to submitted or resolved.                                      |
| `POST`  | `/api/briefings/generate`             | Staff only         | Generate a per-zone volunteer briefing.                                                      |
| `GET`   | `/api/briefings/{zoneId}`             | Staff or volunteer | Read the latest briefing for a zone.                                                         |

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

Possible error codes are `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `INTERNAL_ERROR`, and `AI_UPSTREAM_ERROR`.

Crowd values in the demo deployment are explicitly simulated. Forecast and digest ranking math is deterministic and bounded to `0..100`; Gemini only phrases the operational narrative around server-computed projections. Digest recommendations never execute an operational change and always require supervisor approval.
