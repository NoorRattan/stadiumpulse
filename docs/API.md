# API Reference

All routes use Firebase Auth ID tokens with `Authorization: Bearer <token>`. Role checks are enforced server-side.

| Method  | Path                                  | Auth               | Purpose                                                                 |
| ------- | ------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `GET`   | `/api/auth/me`                        | Any signed-in user | Return the current user's backend profile.                              |
| `POST`  | `/api/auth/bootstrap`                 | Any signed-in user | Idempotently create or read the signed-in user's `users/{uid}` profile. |
| `POST`  | `/api/concierge/chat`                 | Any signed-in user | Send a multilingual concierge message and receive the assistant reply.  |
| `GET`   | `/api/wayfinding/zones`               | Any signed-in user | Return identity-only zone options for selectors.                        |
| `POST`  | `/api/wayfinding/route`               | Any signed-in user | Generate accessibility-aware route options around crowd density.        |
| `GET`   | `/api/accessibility/settings`         | Any signed-in user | Read the caller's accessibility preferences.                            |
| `PUT`   | `/api/accessibility/settings`         | Any signed-in user | Update the caller's accessibility preferences.                          |
| `GET`   | `/api/travel/suggestions?matchId=...` | Any signed-in user | Return sustainable travel suggestions for a selected match.             |
| `GET`   | `/api/crowd/zones`                    | Staff or volunteer | List live crowd-zone summaries for the ops dashboard.                   |
| `GET`   | `/api/crowd/zones/{zoneId}`           | Staff or volunteer | Read one live crowd-zone summary.                                       |
| `POST`  | `/api/incidents`                      | Staff or volunteer | Generate a draft incident report from freeform notes.                   |
| `GET`   | `/api/incidents?zoneId=&status=`      | Staff or volunteer | List paginated incident reports with optional filters.                  |
| `PATCH` | `/api/incidents/{incidentId}`         | Staff only         | Transition an incident status to submitted or resolved.                 |
| `POST`  | `/api/briefings/generate`             | Staff only         | Generate a per-zone volunteer briefing.                                 |
| `GET`   | `/api/briefings/{zoneId}`             | Staff or volunteer | Read the latest briefing for a zone.                                    |

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
