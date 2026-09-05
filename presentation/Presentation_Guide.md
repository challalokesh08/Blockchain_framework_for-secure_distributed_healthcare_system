# HealthLedger — Team Guide & Presentation Playbook

*For the team (Challa Lokesh, Nandushree.M, Ruchitha.H) — everything you need to understand the project, run the demo, and explain it confidently to internal & external examiners.*

---

## PART 0 · The 30-Second Story (memorize this)

> "HealthLedger is a blockchain-based system where patients own their medical data. Hospitals, labs, and insurers can verify and share records securely — but only if the **patient allows it**. Records are **encrypted**, stored off-chain as ciphertext, and their fingerprints (hashes) are written into an **immutable, tamper-proof ledger** sealed by authorized validators. Patients give and revoke access **instantly** — no paperwork. We built a web app, a mobile app, and deployed both live."

**Three sentences for the hallway:** *"It's a tamper-proof healthcare record system. Patients control who sees their data through consent, and the data is encrypted and verified on a permissioned blockchain. Everything is live and demonstrable."*

---

## PART 1 · The Problem (say this to set context)

1. Medical records are **siloed** — every hospital/lab/insurer keeps their own copy; no shared truth.
2. Sharing is **slow and manual** — patient consent is paperwork that takes days.
3. Records can be **tampered with** — no cheap way to prove a record wasn't altered.
4. Privacy — patients don't know **who** accessed **what**.

**One-liner:** *"The system that governs health data still runs on faxes and paper consent forms — we replace that with a programmable, patient-controlled ledger."*

---

## PART 2 · What We Built (plain language)

A working **full-stack application**:

| Piece | What it is | Status |
|---|---|---|
| Web app | React + Vite UI — login, records, consent, upload, block explorer | Live on GitHub Pages |
| Mobile app | Expo/React Native — same features on a phone | Connects to same backend |
| Backend API | Node.js + Express — blockchain engine, crypto, consent, files | Live on Render |
| Blockchain | Custom Proof-of-Authority ledger | Runs inside the backend |

---

## PART 3 · How It Works — The 4 Pillars (with analogies)

### Pillar 1 — Permissioned Blockchain with Proof-of-Authority (PoA)

**Analogy:** A trust company's ledger book. Only **licensed notaries** (validators) are allowed to stamp new pages. Anyone can read the book, but only 5 trusted institutions can sign new entries.

- No mining, no wasting electricity (unlike Bitcoin's proof-of-work).
- 5 validators in our code: `CARE-NODE-A`, `CARE-NODE-B`, `LAB-NODE`, `INSURANCE-NODE`, `HOSPITAL-NODE` — one per stakeholder type.
- Each block is **signed** (HMAC-SHA256) by the validator in rotation → proves which institution approved it.
- Every page links to the previous page's hash → changing one page breaks the whole chain.

### Pillar 2 — Hybrid Asymmetric Encryption

**Analogy:** A bank vault with two locks: the file is locked with a fast padlock (AES), and the padlock's key is placed in a tamper-sealed envelope that only YOUR key can open (RSA).

- **AES-256-GCM** encrypts the actual record (fast, secure).
- The AES key is **wrapped with RSA-2048** (your public key) so only the holder of the matching private key can unwrap it.
- The RSA keypair is generated automatically on the server (asymmetric = public key for locking, private key for opening).

### Pillar 3 — Off-Chain Storage + On-Chain Hash (integrity)

**Analogy:** A library. The catalogue (ledger) stores only the **fingerprint** of each book. The books themselves are locked in a safe elsewhere. If anyone changes a book, its fingerprint no longer matches the catalogue → caught instantly.

- On-chain (ledger): `patientId`, `author`, `dataHash` (SHA-256), `dataRef`, `contentType`, timestamp.
- Off-chain: the encrypted payload (`server/data/offchain`) — ciphertext only, never plaintext.
- On every read: decrypt → re-hash → compare to on-chain hash → mismatch = reject.

### Pillar 4 — Patient-Controlled Consent (smart contract behavior)

**Analogy:** The patient is the doorkeeper. Each provider has a key to a specific door, and the patient decides which doors stay open.

- Consent is stored as a structured record: provider name + provider type (Doctor/Hospital/Laboratory/Insurance).
- Doctor consent = only that named doctor (e.g., "Dr. Rajesh Varma").
- Organization consent = role-matched (Hospital also covers nurses; Laboratory covers lab users; Insurance covers insurace users).
- Every record/file read is checked against the consent registry → **revoked = instantly blocked (HTTP 403)**.
- Consent actions are recorded on the ledger = automatic audit trail.

### Roles & rules (memorize the table)

| Role | Can write? | Reads | Consent needed? |
|---|---|---|---|
| Patient | No | Only their own records | — |
| Doctor | Yes | Own patients (name-scoped) | Yes |
| Nurse | Yes | Hospital-consented patients | Yes (org) |
| Hospital | Yes | Hospital-consented patients | Yes (org) |
| Laboratory | Yes | Lab-consented patients | Yes (org) |
| Insurance | **No (read-only)** | Insurace-consented patients | Yes (org) |
| Admin | Yes | Everything | Bypasses |

---

## PART 4 · The Tech Stack & Where Things Live

```
Blockchain_framework_for-secure_distributed_healthcare_system/
├── server/
│   ├── index.js        # REST API, seeding, consent + file endpoints
│   ├── blockchain.js   # PoA ledger: blocks, HMAC signatures, validation
│   ├── crypto.js       # AES-256-GCM + RSA-2048 hybrid encryption
│   ├── consent.js      # Consent registry (grant/revoke/list)
│   ├── contracts.js    # Healthcare workflow contract engine
│   ├── offchain.js     # Encrypted payload store
│   ├── auth.js         # JWT auth + role-based access control
│   └── db.js           # SQLite (file metadata)
├── client/             # React + Vite web frontend
├── mobile/             # Expo React Native app
└── docs/               # Built frontend (GitHub Pages)
```

**Live links:**
- Website: https://challalokesh08.github.io/Blockchain_framework_for-secure_distributed_healthcare_system/
- Backend API: https://healthledger-api.onrender.com

**Stack:** Node.js + Express · React + Vite · Expo/React Native · SQLite · JSON Web Tokens · GitHub Actions CI/CD · Render · GitHub Pages.

---

## PART 5 · Demo Script (practice this, minute by minute)

> Use the **live** deployment so nothing depends on your laptop. Total demo time: ~8 minutes.

### 5a. Patient view (2 min)
1. Open the website. Log in as a patient: **`+15552100001` / `patientpass`** (Ramesh Iyer, P-2001).
2. Open **Records** → show 2 records decrypted (e.g., "Acute Coronary Syndrome") + the report image.
3. Say: *"The patient sees only their own data, decrypted on the fly and verified against the blockchain."*

### 5b. Consent control (2 min)
1. In the patient's Records page open the **Consent** panel.
2. Revoke consent from "Metropolis Diagnostics Lab".
3. Switch login to a Laboratory user: **`+15550000006` / `labpass`** → open P-2001 → **blocked** ("Patient consent required").
4. Say: *"This is the money shot — revoke is instant. No paperwork, no phone calls."*
5. (Optional) Go back as patient, re-grant, show lab now sees it.

### 5c. Doctor + role matrix (2 min)
1. Log in as **`+155510010001` / `doctorpass`** (Dr. Rajesh Varma).
2. Open P-2001 → shows records (has consent). Try **P-2101** → **blocked** (someone else's patient).
3. Say: *"Consent is name-scoped for doctors and role-scoped for organizations. Every read is checked."*

### 5d. Admin / blockchain proof (2 min)
1. Log in as **`+15550000003` / `adminpass`**.
2. Open **Block Explorer** → show blocks, validators, signatures. Show `/api/status`: *“Proof-of-Authority, 5 validators, chain valid.”*
3. Say: *"Chain validation takes about a millisecond. Here's the audit trail — every record, consent, and file is hash-chained."*

### 5e. Mobile (1 min, if they care)
`cd mobile && npx expo start`, scan with Expo Go, login with the same creds. Same backend, same consent rules.

**Demo cheat codes:**
| Role | Phone | Password |
|---|---|---|
| Admin | +15550000003 | adminpass |
| Doctor (demo) | +15550000001 | doctorpass |
| Patient (demo) | +15550000004 | patientpass |
| Nurse | +15550000002 | nursepass |
| Hospital | +15550000005 | hospitalpass |
| Laboratory | +15550000006 | labpass |
| Insurance | +15550000007 | insurancepass |
| +22 doctors | +155510010001…+155510010022 | doctorpass |
| 110 patients | +15552100001…+15552100110 | patientpass |

---

## PART 6 · Who Presents What (split the 8–10 minutes)

| # | Section | Speaker |
|---|---|---|
| 1 | Problem + motivation | Lokesh |
| 2 | Architecture + PoA consensus | Nandushree |
| 3 | Encryption + off-chain/on-chain hashing | Ruchitha |
| 4 | Consent + roles demo | Lokesh |
| 5 | Performance + security results | Nandushree |
| 6 | Conclusion + future work + Q&A | All (rotate) |

**Golden rule:** whoever is NOT talking is standing ready to answer the follow-up question on their section. No one stares at the floor.

---

## PART 7 · Likely Questions & Model Answers (the part that wins marks)

**Q: Why blockchain? Why not a normal database?**
> "A normal database gives one hospital one copy. Blockchain gives us a shared, tamper-evident, auditable record that every institution can trust without a central authority. The value here is not speed — it's integrity and patient control."

**Q: Why Proof-of-Authority instead of Proof-of-Work / Proof-of-Stake?**
> "Healthcare is regulated and permissioned. PoW wastes energy and lets anonymous miners write blocks; PoA uses a fixed set of known, licensed validators, gives instant finality, and every block is signed by a responsible institution. Regulators want accountability, not anonymity."

**Q: What is stored on-chain vs off-chain? Why?**
> "Only metadata and a SHA-256 hash are on-chain; the encrypted payload is off-chain. Public blockchains are visible to everyone, so storing patient data on-chain would leak it. Hashing on-chain gives tamper-evidence: any change to the off-chain record breaks the hash match."

**Q: Explain your encryption.**
> "Hybrid: AES-256-GCM encrypts the record (fast and strong), and the AES key is wrapped with an RSA-2048 public key (asymmetric) using OAEP-SHA256. So even if the off-chain store leaks, it only holds ciphertext, and only the valid RSA keypair can unwrap it."

**Q: How does your "smart contract" work? Isn't real smart contract code needed?**
> "Our consent registry is smart-contract *behavior*: grant/revoke operations are validated, recorded on the ledger, and enforced on every read in real time. On a public chain these would be EVM contracts; here they're deterministic, permissioned operations — which is exactly how Hyperledger Fabric models chaincode. The report calls them consent contracts."

**Q: How does a doctor get access to another institution's data?**
> "They don't automatically. The patient must grant consent. Doctor consent is tied to their exact name; a hospital/lab/insurance grants cover that organization's roles. Revoking blocks access immediately — we prove it with HTTP 403 in the demo."

**Q: How do you detect tampering?**
> "Every block is linked to the previous block's hash and signed by a validator. Validation recomputes all hashes and re-verifies all signatures. And the record itself is decrypt-then-hash verified: if the decrypted content doesn't match the on-chain hash, it's rejected."

**Q: What about scalability?**
> "PoA with a small validator set is fast: whole-chain validation is ~1 ms local. For production scale you'd shard by region and move file metadata to a managed database. Honest answer: this is a single-node deployment with rotated validators — true multi-institution deployment is the next step."

**Q: Security — who holds the RSA private key and the validator HMAC secret?**
> "The RSA keypair is generated on the server and the validator secret lives in environment variables. That's fine for the PoC; production would use a hardware security module or cloud KMS for the keypair and distribute validator secrets per node."

**Q: Are the cost/reduction numbers (25–30%) real?**
> "They're projections. We back them with measured evidence: record verification ~4 ms, consent instant, audit automatic — versus manual paperwork taking days. We present them as projections justified by these measurements, not a controlled study."

**Q: What does the mobile app do differently?**
> "Nothing functionally — same API, same consent rules. It proves the framework is platform-independent: one backend, web + mobile clients."

**Q: Future work?**
> "Multi-node consortium deployment, IPFS/managed off-chain storage, key management via HSM/KMS, formal contract verification, and insurance claim verification workflows."

---

## PART 8 · Examiner Traps & How to Deflect (be honest, never bluff)

| Trap | The winning answer |
|---|---|
| "Is this really distributed?" | "The architecture is permissioned and signature-verified exactly like a distributed system; today it runs as one node with 5 rotated validators. True network distribution is deployed as future work — the design doesn't change." |
| "That's just a normal web app with hashing." | "No — the hash chain, validator signatures, consent contract enforcement, and decrypt-then-hash verification are the distributed-systems backbone; the web app is only the UI over it." |
| "Where's your proof of the 30%?" | "It's a projection. Here is the measured evidence: milliseconds to verify, instant consent, automatic audit. Show PERFORMANCE_EVIDENCE.md." |
| "How is this different from MedRec?" | "MedRec proved the concept on a research ledger; we deliver a deployed, role-based, mobile-ready system with hybrid encryption and off-chain ciphertext — and open-source everything." |
| "Can a patient sue/debug who accessed data?" | "Yes — every consent and record transaction is permanently on the ledger, so access history is auditable forever." |

---

## PART 9 · Numbers to Quote (memorize 4)

1. Chain integrity check: **~1.2 ms** (whole 176-tx ledger)
2. Record fetch + decrypt + verify: **~4 ms**
3. PoA block seal: **~1 ms**
4. Consent grant: **~23 ms**; revocation reflected **instantly**

Plus: **5 validators · 110 patients · 22 doctors · 176+ on-chain transactions.**

---

## PART 10 · Talk-Track Cheat Sheet (one page, print it)

- **1 line:** Tamper-proof, patient-controlled healthcare records on a permissioned blockchain.
- **Why:** silos + slow consent + no verifiability.
- **How:** PoA consensus + hybrid RSA/AES encryption + off-chain ciphertext with on-chain hashes + consent contracts + RBAC.
- **Proof:** live demo (patient consent blocks a lab instantly), tamper test, performance numbers.
- **Honesty points:** single-node deployment, cost numbers are projections.
- **Future:** multi-node consortium, HSM key management, IoT/insurance workflows.

**Files teammates should read before presenting:** `README.md`, `PERFORMANCE_EVIDENCE.md`, and this guide. The full written report is in `PROJECT_REPORT.docx` / `PROJECT_WRITEUP.md`.