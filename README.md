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
