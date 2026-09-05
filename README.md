# HealthLedger: Secure Distributed Healthcare Blockchain Framework

A professional full-stack healthcare blockchain application with encrypted patient records, a tamper-proof distributed ledger, smart contracts, and a modern responsive UI.

---

## Live Demo

| Link | URL |
|------|-----|
| Website (GitHub Pages) | [https://challalokesh08.github.io/Blockchain_framework_for-secure_distributed_healthcare_system/](https://challalokesh08.github.io/Blockchain_framework_for-secure_distributed_healthcare_system/) |
| API Backend (deployed) | [https://healthledger-api.onrender.com](https://healthledger-api.onrender.com) |
| Mobile App | Install via Expo — see [Mobile App Setup](#mobile-app-setup) below |

> **Live:** The GitHub Pages site talks to the deployed backend at `healthledger-api.onrender.com`, which already contains **110 seeded patient accounts** (each with a medical record + report image). You can log in and explore immediately — no local setup needed.
>
> To **run locally** instead, see [Quick Start](#quick-start-as-demo) below.

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

| Role    | Phone Number | Password     |
|---------|--------------|--------------|
| Doctor  | +15550000001 | doctorpass   |
| Nurse   | +15550000002 | nursepass    |
| Admin   | +15550000003 | adminpass    |
| Patient | +15550000004 | patientpass  |
| Hospital | +15550000005 | hospitalpass |
| Laboratory | +15550000006 | labpass   |
| Insurance | +15550000007 | insurancepass |

### 22 department doctors

Each of the 22 seeded doctors (phone `+155510010001` … `+155510010022`, password `doctorpass`) has **consented access to their own 5 patients** — the patient-first consent flow.

| Phone Number | Doctor | Department |
|--------------|--------|-----------|
| +155510010001 | Dr. Rajesh Varma | Cardiology |
| +155510010002 | Dr. Sunita Rao | Cardiology |
| +155510010003 | Dr. Arvind Swaminathan | Neurology |
| +155510010004 | Dr. Preeti Nair | Neurology |
| +155510010005 | Dr. Vikramaditya Rathore | Orthopaedics |
| +155510010006 | Dr. Neha Kulkarni | Orthopaedics |
| +155510010007 | Dr. Amit Mehra | Pediatrics |
| +155510010008 | Dr. Shalini Deshmukh | Neonatology |
| +155510010009 | Dr. Ananya Sen | OB-GYN |
| +155510010010 | Dr. Ritu Bhargava | OB-GYN |
| +155510010011 | Dr. Harish Chandra | General Surgery |
| +155510010012 | Dr. Pooja Joshi | General Surgery |
| +155510010013 | Dr. Sanjay Nambiar | Internal Medicine |
| +155510010014 | Dr. Kavita Hegde | Internal Medicine |
| +155510010015 | Dr. Siddharth Menon | Oncology |
| +155510010016 | Dr. Maya Pillai | Oncology |
| +155510010017 | Dr. Tanya Kapoor | Dermatology |
| +155510010018 | Dr. Rohan Chawla | Dermatology |
| +155510010019 | Dr. Deepa Natarajan | Radiology |
| +155510010020 | Dr. Kunal Singhania | Radiology |
| +155510010021 | Dr. Manish Tandon | Emergency |
| +155510010022 | Dr. Sneha Patil | Emergency |

> **Consent demo:** Log in as a patient (e.g. `+15552100001` / `patientpass`) → **Records** page. Grant or revoke consent for any provider. A Laboratory user (`+15550000006` / `labpass`) is **blocked** from reading a patient until the patient grants consent — try it.
>
> **PoA demo:** Admin can seal pending transactions into a block via `POST /api/mine`. Blocks show the sealed-by validator and signature.

---

## Patient Accounts (110 seeded patients)

Every patient below has a **live login account** on the deployed backend.

- **Login phone** = the number shown (e.g. `+15552100001`)
- **Password** = `patientpass`
- **Role** = Patient (can only view their own records)
- All have a medical record **and** an uploaded report image on the blockchain.

### Cardiology — Dr. Rajesh Varma
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2001 | Ramesh Iyer | +15552100001 | Acute Coronary Syndrome |
| P-2002 | Meena Krishnan | +15552100002 | Hypertrophic Cardiomyopathy |
| P-2003 | Suresh Reddy | +15552100003 | Congestive Heart Failure |
| P-2004 | Lakshmi Venkatesh | +15552100004 | Ventricular Tachycardia |
| P-2005 | Anil Kumar | +15552100005 | Rheumatic Heart Disease |

### Cardiology — Dr. Sunita Rao
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2006 | Divya Sharma | +15552100006 | Supraventricular Tachycardia |
| P-2007 | Vikram Naidu | +15552100007 | Coronary Artery Disease |
| P-2008 | Padma Rao | +15552100008 | Atrial Septal Defect |
| P-2009 | Gopal Menon | +15552100009 | Peripheral Arterial Disease |
| P-2010 | Revathi Subramanian | +15552100010 | Myocarditis |

### Neurology — Dr. Arvind Swaminathan
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2011 | Joseph Mathew | +15552100011 | Glioblastoma Multiforme |
| P-2012 | Shanti Devi | +15552100012 | Acute Subdural Hematoma |
| P-2013 | Hari Prasad | +15552100013 | Cerebral Aneurysm |
| P-2014 | Kavitha Pillai | +15552100014 | Meningioma |
| P-2015 | Raghavan Iyer | +15552100015 | Hydrocephalus |

### Neurology — Dr. Preeti Nair
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2016 | Sunita Verma | +15552100016 | Epilepsy - Focal |
| P-2017 | Arjun Nair | +15552100017 | Multiple Sclerosis |
| P-2018 | Geetha Raman | +15552100018 | Parkinson's Disease |
| P-2019 | Karthik Raja | +15552100019 | Migraine - Chronic |
| P-2020 | Lalitha Devi | +15552100020 | Alzheimer's Disease |

### Orthopaedics — Dr. Vikramaditya Rathore
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2021 | Mohammed Fareed | +15552100021 | Right Hip Fracture |
| P-2022 | Sharad Joshi | +15552100022 | Total Knee Replacement |
| P-2023 | Nalini Suresh | +15552100023 | Osteoporotic Vertebral Fracture |
| P-2024 | Prakash Gowda | +15552100024 | Shoulder Arthritis |
| P-2025 | Vasanth Kumar | +15552100025 | Tibial Plateau Fracture |

### Orthopaedics — Dr. Neha Kulkarni
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2026 | Ranjith Menon | +15552100026 | ACL Tear |
| P-2027 | Deepika Rao | +15552100027 | Rotator Cuff Tear |
| P-2028 | Mahesh Babu | +15552100028 | Carpal Tunnel Syndrome |
| P-2029 | Sneha Majumdar | +15552100029 | Patellar Dislocation |
| P-2030 | Rajendra Singh | +15552100030 | Lumbar Spondylosis |

### Pediatrics — Dr. Amit Mehra
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2031 | Aarav Gupta | +15552100031 | Acute Lymphoblastic Leukemia |
| P-2032 | Ishaan Kapoor | +15552100032 | Pneumonia |
| P-2033 | Anaya Shetty | +15552100033 | Bronchial Asthma |
| P-2034 | Vihaan Reddy | +15552100034 | Gastroenteritis with Dehydration |
| P-2035 | Diya Nair | +15552100035 | Juvenile Diabetes |

### Neonatology — Dr. Shalini Deshmukh
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2036 | Baby Rohan | +15552100036 | Neonatal Jaundice |
| P-2037 | Baby Anika | +15552100037 | Preterm Infant RDS |
| P-2038 | Baby Kabir | +15552100038 | Low Birth Weight |
| P-2039 | Baby Meera | +15552100039 | Neonatal Sepsis |
| P-2040 | Baby Arha | +15552100040 | Congenital Heart Disease |

### OB-GYN — Dr. Ananya Sen
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2041 | Priya Das | +15552100041 | Normal Pregnancy Follow-up |
| P-2042 | Neelam Joshi | +15552100042 | Gestational Hypertension |
| P-2043 | Sandhya Menon | +15552100043 | Multiple Pregnancy |
| P-2044 | Farah Khan | +15552100044 | Threatened Miscarriage |
| P-2045 | Rekha Kulkarni | +15552100045 | Advanced Maternal Age Pregnancy |

### OB-GYN — Dr. Ritu Bhargava
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2046 | Madhuri Rao | +15552100046 | Uterine Fibroids |
| P-2047 | Gayatri Nair | +15552100047 | PCOS |
| P-2048 | Swati Patil | +15552100048 | Ovarian Cyst |
| P-2049 | Anjali Desai | +15552100049 | Endometriosis |
| P-2050 | Prema Singh | +15552100050 | Postmenopausal Bleeding |

### General Surgery — Dr. Harish Chandra
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2051 | Ravi Shankar | +15552100051 | Cholecystitis |
| P-2052 | Sudhir Prabhu | +15552100052 | Inguinal Hernia |
| P-2053 | Kiran Jain | +15552100053 | Appendicitis |
| P-2054 | Bhaskar Rao | +15552100054 | Colorectal Carcinoma |
| P-2055 | Manikandan | +15552100055 | Umbilical Hernia |

### General Surgery — Dr. Pooja Joshi
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2056 | Sheela Thomas | +15552100056 | Breast Lump |
| P-2057 | Ganesh Naik | +15552100057 | Abdominal Wall Hernia |
| P-2058 | Rekha Bhide | +15552100058 | Thyroid Nodule |
| P-2059 | Vinod Agarwal | +15552100059 | Varicose Veins |
| P-2060 | Priyanka Roy | +15552100060 | Pilonidal Sinus |

### Internal Medicine — Dr. Sanjay Nambiar
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2061 | Murugan Vel | +15552100061 | Type 2 Diabetes |
| P-2062 | Vasantha Rao | +15552100062 | Hypertension |
| P-2063 | Devanand | +15552100063 | Chronic Kidney Disease |
| P-2064 | Chandran Pillai | +15552100064 | Diabetic Ketoacidosis |
| P-2065 | Kamala Krishnan | +15552100065 | Anemia of Chronic Disease |

### Internal Medicine — Dr. Kavita Hegde
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2066 | Sivakami Natarajan | +15552100066 | Hypothyroidism |
| P-2067 | Ramesh Acharya | +15552100067 | COPD |
| P-2068 | Latha Reddy | +15552100068 | Systemic Lupus Erythematosus |
| P-2069 | Balu Venkata | +15552100069 | Gastroesophageal Reflux |
| P-2070 | Kamini Devi | +15552100070 | Iron Deficiency Anemia |

### Oncology — Dr. Siddharth Menon
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2071 | Sundar Raj | +15552100071 | Lung Carcinoma |
| P-2072 | Rukmini Devi | +15552100072 | Breast Carcinoma |
| P-2073 | Keshav Prasad | +15552100073 | Hodgkin Lymphoma |
| P-2074 | Vandana Gupta | +15552100074 | Ovarian Carcinoma |
| P-2075 | Pradeep Kumar | +15552100075 | Colon Carcinoma |

### Oncology — Dr. Maya Pillai
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2076 | Shalini Raghunath | +15552100076 | Gastric Carcinoma |
| P-2077 | Anthony D'Souza | +15552100077 | Pancreatic Carcinoma |
| P-2078 | Bharathi Rao | +15552100078 | Cervical Carcinoma |
| P-2079 | Mohan Das | +15552100079 | Esophageal Carcinoma |
| P-2080 | Radhika Iyer | +15552100080 | Thyroid Carcinoma |

### Dermatology — Dr. Tanya Kapoor
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2081 | Naveen Kumar | +15552100081 | Acne Vulgaris |
| P-2082 | Shruti Aggarwal | +15552100082 | Eczema |
| P-2083 | Arvind Rao | +15552100083 | Psoriasis |
| P-2084 | Nisha Menon | +15552100084 | Melasma |
| P-2085 | Rohit Sharma | +15552100085 | Fungal Infection |

### Dermatology — Dr. Rohan Chawla
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2086 | Deepa Krishnan | +15552100086 | Skin Aging |
| P-2087 | Manish Verma | +15552100087 | Hair Loss |
| P-2088 | Kavya Shetty | +15552100088 | Hypertrophic Scar |
| P-2089 | Akash Jain | +15552100089 | Benign Mole |
| P-2090 | Sonal Mehta | +15552100090 | Under Eye Dark Circles |

### Radiology — Dr. Deepa Natarajan
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2091 | Dinesh Kumar | +15552100091 | Cerebral Ischemia |
| P-2092 | Kalpana Devi | +15552100092 | Hepatic Hemangioma |
| P-2093 | Senthil Kumar | +15552100093 | Prostate Enlargement |
| P-2094 | Ambika Rao | +15552100094 | Renal Cyst |
| P-2095 | Harish Chandra | +15552100095 | Shoulder MRI |

### Radiology — Dr. Kunal Singhania
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2096 | Kavita Rao | +15552100096 | Ankle Fracture |
| P-2097 | Suresh Bhat | +15552100097 | Pulmonary Nodule |
| P-2098 | Nancy Abraham | +15552100098 | Sinusitis |
| P-2099 | Raghu Varma | +15552100099 | Abdominal Aortic Aneurysm |
| P-2100 | Pooja Bhat | +15552100100 | Liver Fatty Change |

### Emergency — Dr. Manish Tandon
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2101 | Wilson Peter | +15552100101 | Cardiac Arrest |
| P-2102 | Arumugam | +15552100102 | Respiratory Failure |
| P-2103 | Sakthi Vel | +15552100103 | Polytrauma |
| P-2104 | Deepthi Nair | +15552100104 | Septic Shock |
| P-2105 | Ramesh Babu | +15552100105 | Stroke |

### Emergency — Dr. Sneha Patil
| ID | Name | Phone | Diagnosis |
|----|------|-------|-----------|
| P-2106 | Farida Begum | +15552100106 | Anaphylaxis |
| P-2107 | Nithin Raj | +15552100107 | Drug Overdose |
| P-2108 | Sandhya Reddy | +15552100108 | Diabetic Emergency |
| P-2109 | Vijay Kumar | +15552100109 | Upper GI Bleed |
| P-2110 | Megha Nair | +15552100110 | Status Epilepticus |

---

## Mobile App Setup

The `mobile/` directory contains an Expo React Native app that talks to the same deployed backend — the same patient accounts work here.

```bash
cd mobile
npm install
npx expo start
```

- Scan the QR code with Expo Go (iOS/Android)
- The app connects to the deployed backend (`healthledger-api.onrender.com`) by default
- For a local backend, update `mobile/src/api.js` with your machine's IP (e.g. `http://192.168.x.x:4000`)

### Mobile screens

| Screen | Visible to | What it does |
|--------|-----------|--------------|
| **My Records** | All (Patient + Staff) | Shows the logged-in user's own records |
| **View Patient Records** | Doctor / Nurse / Admin only | Search **any** patient ID and see their records + files |
| **Upload File** | Doctor / Nurse / Admin only | Upload a medical file for a patient |

---

## Project Structure

```
Blockchain_framework_for-secure_distributed_healthcare_system/
├── server/                 # Node.js + Express backend
│   ├── index.js            # API routes, file upload, PoA sealing
│   ├── blockchain.js       # PoA blockchain, Block, validator signing
│   ├── crypto.js           # Hybrid RSA/AES-256-GCM encryption + keypair
│   ├── consent.js          # Patient-controlled consent registry (smart contracts)
│   ├── contracts.js        # Healthcare workflow contract engine
│   ├── offchain.js         # Off-chain encrypted payload store
│   ├── auth.js             # JWT auth, role-based access control
│   ├── db.js               # SQLite for file metadata
│   ├── notifications.js    # Twilio SMS + file fallback
│   ├── keys/               # Generated RSA keypair (not committed)
│   ├── data/offchain/      # Encrypted off-chain payloads (not committed)
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

- **Asymmetric (hybrid) Encryption** — AES-256-GCM record encryption with RSA-2048 (OAEP-SHA256) key wrapping
- **Off-chain Storage, On-chain Proof** — only hashes + metadata live on the ledger; full encrypted payloads live off-chain
- **Proof-of-Authority Consensus** — blocks are sealed by a rotating set of trusted validators; no energy-heavy mining
- **Patient-Controlled Consent** — smart-contract enforced, grant/revoke access per provider; revoked instantly blocks reads
- **Role-Based Access** — Doctor, Nurse, Hospital, Laboratory, Insurance, Admin, and Patient roles with JWT authentication
- **File Upload** — Signed download URLs for secure file sharing with consent-aware access
- **SMS Notifications** — Twilio integration with local file fallback
- **PWA Support** — Installable web app with service worker caching
- **Mobile App** — React Native/Expo app with same API integration
- **Block Explorer** — Visual inspection of PoA-sealed blocks and validator signatures
- **Audit Trail** — Complete history of all record changes, consent actions, and contract actions

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
| GET | `/api/status` | No | Blockchain status (consensus, validators, validity) |
| GET | `/api/crypto/public-key` | No | Network RSA-2048 public key (key-wrapping) |
| GET | `/api/ledger` | Yes | Full PoA blockchain ledger |
| GET | `/api/consent` | Yes | List consents for a patient |
| POST | `/api/consent` | Patient | Patient grants consent to a provider |
| DELETE | `/api/consent` | Patient | Patient revokes consent |
| GET | `/api/records?patientId=P-2001` | Yes | Patient records (consent-gated) |
| POST | `/api/records` | Staff | Add record transaction |
| POST | `/api/files/upload` | Staff | Upload file + notify patient |
| GET | `/api/files/:filename` | Yes / Signed URL | Download file |
| POST | `/api/mine` | Admin | Seal pending transactions into a PoA block |
| GET | `/api/validate` | Yes | Validate chain integrity + validator set |
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
