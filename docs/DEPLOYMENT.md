# Deployment

This project deploys the Vite frontend to Firebase Hosting and the FastAPI backend to Cloud Run in `us-central1`.

## Required Manual Setup

Before the GitHub Actions deployment workflow can run, confirm or create the GCP project `stadiumpulse-wc26`. The fallback project IDs are a human decision if the primary project is unavailable; the checked-in workflow intentionally uses the locked primary project ID.

Create the `github-actions-deploy@stadiumpulse-wc26.iam.gserviceaccount.com` service account and grant exactly these roles:

- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/artifactregistry.writer`
- `roles/firebasehosting.admin`

Set these GitHub Secrets:

- `WIF_PROVIDER`: Workload Identity Federation provider for keyless `gcloud` authentication.
- `FIREBASE_SERVICE_ACCOUNT`: Firebase Hosting deploy JSON credential.

Those two secrets use different mechanisms because `google-github-actions/auth` supports Workload Identity Federation for the Cloud Run deploy path, while `FirebaseExtended/action-hosting-deploy` expects a Firebase service account JSON. The JSON belongs only in the encrypted GitHub Secret, never in the repository.

Grant `roles/run.viewer` to the Firebase Hosting deploy identity for the Cloud Run service. Without it, the Hosting-to-Cloud-Run `/api/**` rewrite can fail silently even when Hosting deploy itself succeeds.

## Environment Variables

Backend production variables:

```text
ENVIRONMENT=production
GCP_PROJECT_ID=stadiumpulse-wc26
ALLOWED_ORIGINS=https://stadiumpulse-wc26.web.app
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL_PRIMARY=gemini-3.5-flash
GEMINI_MODEL_LITE=gemini-3.1-flash-lite
LOG_LEVEL=INFO
```

Local backend only:

```text
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json
```

Frontend production variables:

```text
VITE_FIREBASE_API_KEY=<firebase-web-api-key>
VITE_FIREBASE_AUTH_DOMAIN=stadiumpulse-wc26.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=stadiumpulse-wc26
VITE_FIREBASE_APP_ID=<firebase-web-app-id>
VITE_API_BASE_URL=/api
```

## Frontend Install Note

`frontend/.npmrc` sets `legacy-peer-deps=true` because this project uses the locked `typescript@6.0.3`, while the current `typescript-eslint` peer range still expects TypeScript below 6. That is a dependency resolver compatibility issue, not a runtime behavior change.

## Deploy Flow

The checked-in workflow deploys on pushes to `main`:

- `.github/workflows/ci.yml` runs lint, formatting, tests, TypeScript, and build checks.
- `.github/workflows/deploy.yml` deploys Cloud Run first, then Firebase Hosting.

Do not run real deploy commands until the project ID, service account, roles, Firebase project, and GitHub Secrets above are confirmed.

## Known Limitation

The backend rate limiter uses `slowapi`'s in-memory storage. That is acceptable for a single Cloud Run instance, but under autoscaling each instance has its own counter. A production-scale deployment should move rate limit state to a shared store such as Redis or Memorystore.
