# HealthLedger: Secure Distributed Healthcare Blockchain Framework

## Project Documentation

---

## 1. Project Overview

HealthLedger is a full-stack healthcare blockchain application that provides encrypted patient record storage, a tamper-proof distributed ledger, smart contracts, and a modern responsive UI. It is designed for doctors, nurses, hospital administrators, and patients to manage and access secure medical records.

---

## 2. Project Structure

```
Blockchain_framework_for-secure_distributed_healthcare_system/
├── server/                 # Node.js + Express backend
│   ├── index.js            # API routes, file upload, mining
│   ├── blockchain.js       # Blockchain, Block, AES encryption
│   ├── auth.js             # JWT auth, role-based access control
│   ├── contracts.js        # Smart contract engine
│   ├── db.js               # SQLite for file metadata
│   └── notifications.js    # Twilio SMS + file fallback
├── client/                 # React + Vite frontend
│   └── src/
│       ├── pages/          # Home, Features, Explorer, Records, Dashboard, Contracts, Login, Register, About
│       ├── components/     # Navbar, Footer, UploadForm, ProtectedRoute, AuthStatus, Notifications
│       └── AuthContext.jsx # Auth state management
├── mobile/                 # Expo React Native mobile app
│   └── src/screens/        # HomeScreen, LoginScreen, RegisterScreen, RecordsScreen, UploadScreen
├── docs/                   # Built frontend for GitHub Pages deployment
├── render.yaml             # Render cloud deployment config
└── docker-compose.yml      # Docker deployment
```

---

## 3. How Blockchain is Used

### 3.1 Block Structure

Each block in the ledger contains:

| Field | Description |
|-------|-------------|
| timestamp | When the block was created |
| transactions | Array of encrypted patient records |
| previousHash | SHA-256 hash of the previous block |
| nonce | Proof-of-work counter |
| hash | SHA-256 hash of the current block |

### 3.2 Block Hash Computation

```
hash = SHA256(previousHash + timestamp + JSON(transactions) + nonce)
```

### 3.3 Mining (Proof of Work)

- Difficulty level: 3 (hash must start with "000")
- The miner increments the nonce until a valid hash is found
- Only Admin users can mine
- Mining confirms pending transactions into a permanent block

### 3.4 Chain Validation

The `isChainValid()` function checks:
1. Each block's computed hash matches its stored hash
2. Each block's `previousHash` matches the prior block's hash
3. If any check fails, the chain is considered tampered

### 3.5 Data Encryption

- Patient records are encrypted using **AES-256** (CryptoJS) before blockchain storage
- Decryption uses the same `ENCRYPTION_KEY` from environment variables
- Only authorized users can view decrypted data

---

## 4. Key Features

### 4.1 Encrypted Patient Records
- Records (diagnosis, notes) are encrypted with AES before storage
- Stored as transactions in the blockchain ledger
- Decrypted only when accessed by authorized users

### 4.2 Tamper-Proof Ledger
- SHA-256 hash chain links every block
- Proof-of-work mining prevents easy modification
- One-click integrity validation

### 4.3 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Doctor | View records, submit records, upload files, approve contracts |
| Nurse | View records, submit records, upload files, approve contracts |
| Admin | All Doctor/Nurse permissions + mine blocks, create contracts, reset ledger |
| Patient | View own records, view own files |

### 4.4 Smart Contracts
- Healthcare data access agreements
- Workflow: PENDING → APPROVED → COMPLETED
- Full action history with timestamps and executor info

### 4.5 File Upload & Signed URLs
- Hospital staff upload medical files (reports, scans)
- Server generates signed, expiring download URLs (24h default)
- File metadata stored in SQLite database
- Patients notified via SMS when files are uploaded

### 4.6 SMS Notifications
- Twilio integration for real-time patient alerts
- Falls back to local file logging when Twilio is not configured
- Notifications sent on record creation and file upload

### 4.7 Blockchain Explorer
- Visual browser for all blocks in the ledger
- Shows block hash, previous hash, timestamp, transaction count
- Real-time ledger status (block count, pending items, validity)

---

## 5. Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | REST API framework |
| CryptoJS | AES encryption for patient data |
| Node crypto | SHA-256 block hashing |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| SQLite3 | File metadata persistence |
| Multer | File upload handling |
| Twilio | SMS notifications |
| dotenv | Environment configuration |

### Frontend (Web)
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router | Client-side routing (HashRouter) |
| Axios | API communication |

### Mobile
| Technology | Purpose |
|------------|---------|
| Expo SDK 54 | React Native framework |
| React Navigation | Screen navigation |
| AsyncStorage | Token persistence |
| Expo Document Picker | File selection |
| Axios | API communication |

### Deployment
| Platform | Purpose |
|----------|---------|
| GitHub Pages | Static frontend hosting |
| Render | Cloud backend hosting |
| Docker | Containerized full-stack deployment |

---

## 6. API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | /api/auth/login | No | Login with phone + password |
| POST | /api/auth/register | No | Register new patient |
| GET | /api/status | No | Blockchain status |
| GET | /api/ledger | Yes | Full blockchain ledger |
| GET | /api/records?patientId=X | Yes | Get patient records |
| POST | /api/records | Doctor/Nurse/Admin | Add record transaction |
| POST | /api/files/upload | Doctor/Nurse/Admin | Upload file + notify patient |
| GET | /api/files/:filename | Yes / Signed URL | Download file |
| GET | /api/files | Yes | List files for patient |
| POST | /api/mine | Admin | Mine pending transactions |
| GET | /api/validate | Yes | Validate chain integrity |
| GET | /api/contracts | Yes | List smart contracts |
| POST | /api/contracts | Admin | Create contract |
| POST | /api/contracts/:id/execute | Doctor/Admin | Execute contract action |
| POST | /api/reset-ledger | Admin | Reset blockchain |

---

## 7. Demo Credentials

| Role | Name | Phone Number | Password |
|------|------|-------------|----------|
| Doctor | Dr. Sharma | +15550000001 | doctorpass |
| Nurse | Nurse Patel | +15550000002 | nursepass |
| Admin | Administrator | +15550000003 | adminpass |
| Patient | Asha Kumar | +15550000004 | patientpass |
| Hospital | City General Hospital | +15550000005 | hospitalpass |
| Laboratory | Metropolis Diagnostics Lab | +15550000006 | labpass |
| Insurance | InsureHealth Insurance | +15550000007 | insurancepass |

---

## 8. Live Deployment Links

| Resource | URL |
|----------|-----|
| Website | https://challalokesh08.github.io/Blockchain_framework_for-secure_distributed_healthcare_system/ |
| Backend API | https://healthledger-api.onrender.com |
| GitHub Repo | https://github.com/challalokesh08/Blockchain_framework_for-secure_distributed_healthcare_system |

---

## 9. Running Locally

```bash
# Clone the repository
git clone https://github.com/challalokesh08/Blockchain_framework_for-secure_distributed_healthcare_system.git
cd Blockchain_framework_for-secure_distributed_healthcare_system

# Install dependencies
npm install
npm run install-all

# Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend API: http://localhost:4000/api
```

---

## 10. Blockchain Workflow Diagram

```
Patient Data (plaintext)
        │
        ▼
  AES Encryption
        │
        ▼
  Encrypted Transaction
        │
        ▼
  Added to Pending Pool
        │
        ▼
  Admin Mines Block (Proof of Work)
        │
        ▼
  Block Hash = SHA256(prev + timestamp + txns + nonce)
        │
        ▼
  Block Added to Chain
        │
        ▼
  Chain Validated: isChainValid()
```

---

## 11. Security Features

- **AES-256 encryption** for all patient data before blockchain storage
- **SHA-256 hashing** for block integrity verification
- **JWT authentication** with 8-hour token expiry
- **bcrypt password hashing** (10 salt rounds)
- **Role-based access control** (Doctor, Nurse, Admin, Patient)
- **Signed download URLs** with configurable expiry for file access
- **CORS enabled** for cross-origin API access
- **Environment variables** for secrets (ENCRYPTION_KEY, JWT_SECRET)

---

## 12. Future Enhancements

- Distributed multi-node blockchain network
- IPFS integration for decentralized file storage
- HIPAA compliance auditing
- Real-time WebSocket notifications
- Two-factor authentication
- Electronic health record (EHR) integration
- Doctor-to-doctor secure messaging

---

*Document generated for HealthLedger Project*
*Repository: https://github.com/challalokesh08/Blockchain_framework_for-secure_distributed_healthcare_system*
