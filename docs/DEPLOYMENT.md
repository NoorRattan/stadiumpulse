# Deployment

This project deploys the Vite frontend to Firebase Hosting and the FastAPI backend to Cloud Run in `us-central1`.

## Prerequisites

Complete these steps before any automated deployment can run. They require console access to GCP and GitHub — they cannot be automated.

### 1. GCP Project

Confirm or create the GCP project `stadiumpulse-wc26`. If that project ID is already taken by another account, use the fallback ID `stadiumpulse-wc26-1` or `stadiumpulse-wc26-2` (project IDs are globally unique). Whatever ID you land on, update it in:

- `frontend/.firebaserc` — `projects.default`
- `frontend/firebase.json` — the CSP `frame-src` value and any Hosting-specific references
- `.github/workflows/deploy.yml` — `--project`, `GCP_PROJECT_ID`, `ALLOWED_ORIGINS`, and `projectId`

### 2. Enable GCP APIs

On the confirmed project, enable:

- Cloud Run (`run.googleapis.com`)
- Cloud Build (`cloudbuild.googleapis.com`)
- Artifact Registry (`artifactregistry.googleapis.com`)
- Firestore (`firestore.googleapis.com`)
- Vertex AI (`aiplatform.googleapis.com`)
- IAM (`iam.googleapis.com`)
- Firebase Auth / Identity Toolkit (`identitytoolkit.googleapis.com`)

### 3. Add Firebase to the GCP Project

In the Firebase Console, add Firebase to the existing GCP project. Then enable:

- **Firestore in Native mode, region `us-central1`** — the region cannot be changed after first creation.
- **Firebase Authentication** — enable Google sign-in, Email/Password, and Anonymous auth.
- **Firebase Hosting.**

### 4. Deployment Service Account

Create the `github-actions-deploy@<project-id>.iam.gserviceaccount.com` service account and grant exactly these roles:

- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/artifactregistry.writer`
- `roles/firebasehosting.admin`

This account deploys. It does not run the application.

### 5. Cloud Run Runtime Service Account

The Cloud Run service runs as a separate default Compute Engine service account (or a dedicated one you create). Grant the *runtime* service account:

- `roles/aiplatform.user` — Vertex AI / Gemini calls
- `roles/datastore.user` — Firestore reads and writes

Without these, deployment succeeds but every AI call and every Firestore read fails at runtime.

### 6. Workload Identity Federation

Set up [Workload Identity Federation for GitHub Actions](https://cloud.google.com/iam/docs/workload-identity-federation-with-other-providers) against the `github-actions-deploy` service account. The `google-github-actions/auth` action in `deploy.yml` uses keyless authentication via WIF — no service account JSON is downloaded for this path.

### 7. Firebase Hosting Credential

`FirebaseExtended/action-hosting-deploy` does not support WIF. Create a service account key for the Firebase Hosting deploy (it can be the same `github-actions-deploy` account) and download the JSON. Store it only as an encrypted GitHub secret — never commit it.

### 8. GitHub Secrets

Set these two secrets on the repository:

| Secret | Value |
|--------|-------|
| `WIF_PROVIDER` | The Workload Identity Federation provider resource name from step 6 |
| `FIREBASE_SERVICE_ACCOUNT` | The Firebase Hosting deploy JSON from step 7 |

### 9. Grant `roles/run.viewer` to the Hosting Identity

Grant `roles/run.viewer` on the Cloud Run service to the Firebase Hosting deploy identity. Without this, the Hosting-to-Cloud-Run `/api/**` rewrite fails silently — the Hosting deploy itself succeeds, but API calls return 404 or 403 with no error in the Hosting logs.

```bash
gcloud run services add-iam-policy-binding stadiumpulse-api \
  --region us-central1 \
  --member "serviceAccount:firebase-adminsdk-<hash>@<project-id>.iam.gserviceaccount.com" \
  --role roles/run.viewer
```

### 10. Firebase Web App Config

Get the `VITE_FIREBASE_*` values from Firebase Console → Project Settings → Your apps → Web app. You need these before the frontend build can connect to Auth.

---

## First Deploy

Run these steps in order. Do not push to `main` before completing steps 1–3.

### Step 1: Local Cloud Run dry-run

Deploy the backend directly from `gcloud` CLI before routing through CI:

```bash
gcloud run deploy stadiumpulse-api \
  --source backend/ \
  --project <project-id> \
  --region us-central1 \
  --set-env-vars ENVIRONMENT=production,GCP_PROJECT_ID=<project-id>,ALLOWED_ORIGINS=https://<project-id>.web.app,VERTEX_AI_LOCATION=us-central1,GEMINI_MODEL_PRIMARY=gemini-2.5-flash,GEMINI_MODEL_LITE=gemini-2.5-flash-lite,LOG_LEVEL=INFO \
  --allow-unauthenticated
```

Fix any Dockerfile or permission failures here before they hit CI logs.

### Step 2: Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes --project <project-id>
```

### Step 3: Seed Firestore

```bash
cd backend
python -m seed.seed_data
```

Authenticate with `gcloud auth application-default login` or set `GOOGLE_APPLICATION_CREDENTIALS` to a local service account JSON (not committed). The script upserts fixed document IDs, so re-running it is safe.

### Step 4: Push to `main`

Pushing to `main` triggers `deploy.yml`. Watch the Actions run live. Watch for:

- **Hosting→Cloud Run rewrite failure**: If `/api/health` returns an error through the Hosting URL but works on the raw Cloud Run URL, the `roles/run.viewer` grant from step 9 of Prerequisites is missing.
- **Tests silently skipping**: Confirm `asyncio_mode = auto` is present in `backend/pytest.ini`.
- **`npm ci` failure on the runner**: Confirm `frontend/package-lock.json` is committed and up to date.

### Step 5: Smoke-test the rewrite

After the Actions run goes green, hit the health endpoint through the Hosting domain (not the raw Cloud Run URL):

```
https://<project-id>.web.app/api/health
```

This is the specific thing that fails silently if the `roles/run.viewer` grant was skipped.

### Step 6: Grant yourself staff role

Sign into the deployed app once (creates your `users/{uid}` doc with role `fan`). Get your UID from Firebase Console → Authentication. Then run:

```bash
cd backend
python scripts/grant_role.py --uid <your-uid> --role staff
```

After granting, sign out and back in (or force a token refresh) to pick up the new custom claim. The app checks role claims at sign-in; an existing session does not pick up role changes automatically.

---

## Environment Variables

### Backend (Cloud Run production)

```text
ENVIRONMENT=production
GCP_PROJECT_ID=stadiumpulse-wc26
ALLOWED_ORIGINS=https://stadiumpulse-wc26.web.app
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL_PRIMARY=gemini-2.5-flash
GEMINI_MODEL_LITE=gemini-2.5-flash-lite
LOG_LEVEL=INFO
```

These are set in the `--set-env-vars` flag in `deploy.yml`. Cloud Run does not default `ENVIRONMENT` — it must be set explicitly or the backend will fail to start.

### Backend (local only)

```text
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json
```

Never commit this file. Confirm `.gitignore` covers `*.json` in `backend/`.

### Frontend (production build)

```text
VITE_FIREBASE_API_KEY=<firebase-web-api-key>
VITE_FIREBASE_AUTH_DOMAIN=stadiumpulse-wc26.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=stadiumpulse-wc26
VITE_FIREBASE_APP_ID=<firebase-web-app-id>
VITE_API_BASE_URL=/api
```

Get actual values from Firebase Console → Project Settings → Your apps → Web app.

---

## Frontend Install Note

`frontend/.npmrc` sets `legacy-peer-deps=true`. This project uses `typescript@6.0.3`, while the current `typescript-eslint` peer range still expects TypeScript below 6. This is a dependency resolver compatibility issue — linting and type checking both work correctly — but `npm ci` fails without `legacy-peer-deps=true` until `typescript-eslint` widens its peer declaration.

---

## Content Security Policy

`firebase.json` sets a CSP header on all Hosting responses:

- `script-src` includes `apis.google.com` — required for Google sign-in popup
- `frame-src` includes `stadiumpulse-wc26.firebaseapp.com` — required for the Firebase Auth redirect/popup flow

If the Google sign-in popup breaks on the live site, verify the CSP `frame-src` value matches the actual Firebase project domain and that `apis.google.com` is in `script-src`.

---

## Known Limitation

The backend rate limiter uses `slowapi`'s in-memory storage. That is acceptable for a single Cloud Run instance, but under autoscaling each instance has its own counter. A production-scale deployment should move rate limit state to a shared store such as Redis or Memorystore.
