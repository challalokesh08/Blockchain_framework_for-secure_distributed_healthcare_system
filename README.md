# HealthLedger: Secure Distributed Healthcare Blockchain Framework

This repository contains a professional full-stack healthcare blockchain application and dynamic website.

## Project structure

- `server/` — Node.js + Express backend with a blockchain ledger, encrypted patient records, and ledger validation API.
- `client/` — React + Vite frontend with multi-page navigation, professional healthcare UI, ledger explorer, and record management.

## Key features

- Encrypted healthcare record storage with AES encryption.
- Tamper-proof blockchain ledger with proof-of-integrity validation.
- Multi-page professional website with Home, Features, Explorer, Records, and About pages.
- Audit-ready patient record history and block explorer.
- Modern responsive UI designed for healthcare administration.

## Quick start

Install dependencies for both server and client:

```bash
npm install
npm run install-all
```

Start the development environment:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

## Build and deploy

Build the client application:

```bash
npm run build
```

Start the server in production mode:

```bash
npm start
```

## Deployment

### Docker

Build the Docker image:

```bash
npm run docker-build
```

Start the app with Docker Compose:

```bash
npm run docker-up
```

The app will listen on `http://localhost:4000` and serve the built React site from the Node.js backend.

## Demo credentials

- doctor1 / doctorpass  (Doctor)
- nurse1 / nursepass    (Nurse)
- admin1 / adminpass    (Admin)

## Notes

- The backend uses a simplified blockchain model for demonstration and can be extended into a distributed healthcare network.
- Use the `/api/records` endpoint to submit new patient transactions and `/api/mine` to add them to the ledger.
- Smart contracts are available on the `Contracts` page and support approval / finalization workflows.
- Customize `ENCRYPTION_KEY` and `JWT_SECRET` in `.env` for secure deployment.

## SMS Notifications (Twilio)

The server can send SMS notifications to patients when their records or files are uploaded. To enable Twilio set these environment variables (for example in `server/.env`):

- `TWILIO_SID` — Your Twilio Account SID
- `TWILIO_TOKEN` — Your Twilio Auth Token
- `TWILIO_FROM` — Your Twilio phone number (the sender)

If these variables are not set the server writes notification messages to `server/notifications/` for development.

## File metadata persistence

Uploaded file metadata is stored in `server/uploads/metadata.json` so uploaded file records persist across restarts. For production use consider storing metadata in a database and protecting files in a private object store (S3).

### SQLite persistence

The application now persists uploaded file metadata in a lightweight SQLite database at `server/data.db`.

### Signed download URLs

When a hospital uploads a file the server generates a signed, expiring download URL and sends it to the patient. Configure the following optional environment variables:

- `DOWNLOAD_SECRET` — secret used to sign download tokens (defaults to `JWT_SECRET`).
- `DOWNLOAD_URL_EXPIRY` — token lifetime in seconds (default `86400`, i.e., 24h).

Signed URLs look like: `https://yourhost/api/files/<filename>?token=<signed-token>` and are accepted even without an Authorization header.

## PWA / Mobile App

I added Progressive Web App support so the site can be installed on mobile and desktop as an app:

- `client/public/manifest.webmanifest` — app manifest
- `client/public/service-worker.js` — simple service worker caching core assets
- `client/public/icon.svg` — app icon
- `client/src/registerServiceWorker.js` and registration in `client/src/main.jsx`

This makes the web app installable and gives a native-like experience. For native mobile apps (iOS/Android) I recommend using React Native with shared API endpoints; I can scaffold an Expo project that reuses the existing APIs.

Suggested app names:

- HealthLedger (default)
- MedChain
- CareLedger
- PatientVault
- LedgerCare

Tell me which app name you prefer and whether you want a native app scaffold (React Native/Expo) or just PWA-only. If you want native apps, I can scaffold an Expo project next.

