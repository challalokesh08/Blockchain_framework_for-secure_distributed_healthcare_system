# HealthLedger: Secure Distributed Healthcare Blockchain Framework

A professional full-stack healthcare blockchain application with encrypted patient records, a tamper-proof distributed ledger, smart contracts, and a modern responsive UI.

---

## Live Demo

| Link | URL |
|------|-----|
| Website (GitHub Pages) | [https://challalokesh08.github.io/Blockchain_framework_for-secure_distributed_healthcare_system/](https://challalokesh08.github.io/Blockchain_framework_for-secure_distributed_healthcare_system/) |
| Mobile App | Install via Expo — see [Mobile App Setup](#mobile-app-setup) below |
| API Backend | Run locally — see [Quick Start](#quick-start) below |

> **Note:** The website above is a static build. For full functionality (login, records, mining, contracts), run the backend locally or deploy it to a platform like [Render](https://render.com), [Railway](https://railway.app), or [Vercel](https://vercel.com).

---

## Quick Start (Run as Demo)

### Option 1: Run Everything Locally

```bash
# Clone the repo
git clone https://github.com/challalokesh08/Blockchain_framework_for-secure_distributed_healthcare_system.git
cd Blockchain_framework_for-secure_distributed_healthcare_system

# Install all dependencies
npm install
npm run install-all

# Start both server and client
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

### Option 2: Deploy Frontend to GitHub Pages

1. Go to **Settings > Pages** in your repo
2. Set **Source** to **Deploy from a branch**
3. Select branch **main** and folder **/docs**
4. Save — the site auto-deploys on every push to main

> The built frontend is in the `docs/` folder and is committed to the repo. GitHub Pages serves it directly.

### Option 3: Deploy Backend (Free Hosting)

Deploy `server/` to one of these platforms:

| Platform | Steps |
|----------|-------|
| **Render** | New Web Service > Connect repo > Root directory: `server` > Start command: `node index.js` > Add env vars |
| **Railway** | New Project > Deploy from GitHub > Set root to `server/` > Add env vars |
| **Vercel** | Import repo > Framework preset: Other > Root: `server/` |

**Required environment variables for backend:**

```
PORT=4000
ENCRYPTION_KEY=YourStrongHealthcareEncryptionKey2026
JWT_SECRET=YourJwtSecret2026
```

---

## Demo Credentials

| Role    | Phone Number | Password   |
|---------|-------------|------------|
| Doctor  | +15550000001 | doctorpass |
| Nurse   | +15550000002 | nursepass  |
| Admin   | +15550000003 | adminpass  |
| Patient | +15550000004 | patientpass |

---

## Mobile App Setup

The `mobile/` directory contains an Expo React Native app.

```bash
cd mobile
npm install
npx expo start
```

- Scan the QR code with Expo Go (iOS/Android)
- The app connects to `http://10.0.2.2:4000` by default (Android emulator)
- For physical device, update `mobile/src/api.js` with your machine's local IP

---

## Project Structure

```
Blockchain_framework_for-secure_distributed_healthcare_system/
├── server/                 # Node.js + Express backend
│   ├── index.js            # API routes, file upload, mining
│   ├── blockchain.js       # Blockchain, Block, AES encryption
│   ├── auth.js             # JWT auth, role-based access control
│   ├── contracts.js        # Smart contract engine
│   ├── db.js               # SQLite for file metadata
│   ├── notifications.js    # Twilio SMS + file fallback
│   └── .env                # Environment config (not committed)
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # Home, Features, Explorer, Records, Dashboard, Contracts, Login, Register, About
│   │   ├── components/     # Navbar, Footer, UploadForm, ProtectedRoute, AuthStatus, Notifications
│   │   └── AuthContext.jsx # Auth state management
│   └── dist/               # Production build (auto-deployed to GitHub Pages)
├── mobile/                 # Expo React Native mobile app
│   └── src/screens/        # HomeScreen, LoginScreen, RegisterScreen, RecordsScreen, UploadScreen
└── .github/workflows/      # GitHub Actions CI/CD
```

---

## Key Features

- **Encrypted Records** — AES encryption for all patient data before blockchain storage
- **Tamper-Proof Ledger** — SHA-256 hash chain with proof-of-work validation
- **Smart Contracts** — Healthcare data access agreements with approval/finalization workflows
- **Role-Based Access** — Doctor, Nurse, Admin, and Patient roles with JWT authentication
- **File Upload** — Signed download URLs for secure file sharing
- **SMS Notifications** — Twilio integration with local file fallback
- **PWA Support** — Installable web app with service worker caching
- **Mobile App** — React Native/Expo app with same API integration
- **Block Explorer** — Visual inspection of the blockchain ledger
- **Audit Trail** — Complete history of all record changes and contract actions

---

## Build & Deploy

```bash
# Build client for production
npm run build

# Start server in production mode
npm start

# Docker deployment
npm run docker-build
npm run docker-up
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with phone + password |
| POST | `/api/auth/register` | No | Register new patient |
| GET | `/api/status` | No | Blockchain status |
| GET | `/api/ledger` | Yes | Full blockchain ledger |
| GET | `/api/records?patientId=P-1001` | Yes | Patient records |
| POST | `/api/records` | Doctor/Nurse/Admin | Add record transaction |
| POST | `/api/files/upload` | Doctor/Nurse/Admin | Upload file + notify patient |
| GET | `/api/files/:filename` | Yes / Signed URL | Download file |
| POST | `/api/mine` | Admin | Mine pending transactions |
| GET | `/api/validate` | Yes | Validate chain integrity |
| GET | `/api/contracts` | Yes | List smart contracts |
| POST | `/api/contracts` | Admin | Create contract |
| POST | `/api/contracts/:id/execute` | Doctor/Admin | Execute contract action |
| POST | `/api/reset-ledger` | Admin | Reset blockchain |

---

## SMS Notifications (Twilio)

Set these in `server/.env` to enable SMS:

```
TWILIO_SID=your_account_sid
TWILIO_TOKEN=your_auth_token
TWILIO_FROM=+1XXXXXXXXXX
```

Without Twilio, notifications are saved to `server/notifications/`.

---

## License

This project is for educational and demonstration purposes.
