# Performance & Integrity Evidence

Measured on the live system to support the report's operational-overhead claims.
All timings are real measurements (2026-09-05), not estimates.

## 1. Chain integrity validation — sub-millisecond to millisecond

`GET /api/validate` runs `isChainValid()` over every block: recomputes each hash, checks
`previousHash` linkage, and verifies every PoA HMAC validator signature.

| Node | Samples | Min | Median | Max |
|------|---------|-----|--------|-----|
| Local (localhost) | 10 | 1.07 ms | ~1.2 ms | 1.85 ms |
| Deployed (Render, TLS + cold instance) | 3 | 222 ms | 223 ms | 250 ms |

Full-chain verification of a 176-transaction, 4-block ledger: **~1.2 ms**.

## 2. Record retrieval — decrypt + integrity check

`GET /api/records?patientId=…` decrypts each off-chain payload (RSA-2048 wrap + AES-256-GCM),
re-hashes the plaintext, and compares it to the on-chain `dataHash` before returning.

| Node | Samples | Min | Median | Max |
|------|---------|-----|--------|-----|
| Local (localhost) | 10 | 4.05 ms | ~4.4 ms | 12.97 ms (cold) |
| Deployed (Render, TLS + cold instance) | 3 | 199 ms | 280 ms | 323 ms |

A patient record is fetched, decrypted, verified, and parsed in **~4 ms** on the application node.

## 3. PoA block sealing

`POST /api/mine` seals pending transactions into a validator-signed block.

Sealing one block: **~0.95 ms** (validated by the rotating validator set).

## 4. Consent — instant grant / revoke (vs days of manual paperwork)

Patient revokes → provider **immediately** blocked (HTTP 403).
Patient grants → provider **immediately** allowed (HTTP 200).

```
1. after revoke, lab read: 403
2. after grant,  lab read: 200
```

Consent grant API completes in **~23 ms** including client overhead. No manual approval
queue, no paperwork — access control reflects instantly.

## 5. Tamper detection

An attacker who forges a single transaction (alters an on-chain `dataHash`) is caught
immediately by two independent checks:

```
Sealed 2 blocks, 2 encrypted records. Chain valid before tampering: true
After altering a transaction hash (forged record): false
```

- `isChainValid()` → **false** (hash + previousHash + signature recomputation fails)
- The forged record cannot even be decrypted/resolved (off-chain payload is keyed to the
  original hash), and a mismatched plaintext would fail the decrypt-then-hash check.

## How this supports the report

Legacy overhead — days of manual record request/consent paperwork, hours of audit
reconciliation — is replaced by:
- **~4 ms** record verification (integrity + authenticity),
- **instant** consent enforcement,
- **automatic** immutable audit trail (every read/record/consent is hash-chained).

Stated cost-saving percentages (e.g. "25–30% reduction in administrative overhead") should
therefore be presented as **projections justified by these demonstrated timings**, not as a
measured before/after study.

## Reproduce

```bash
# local node
cd server && npm install && cp .env.example .env
PORT=4000 node index.js

# validate timing
curl -w "%{time_total}s" /api/validate -H "Authorization: Bearer <admin>"

# record timing (decrypt + verify)
curl -w "%{time_total}s" "/api/records?patientId=P-2001" -H "Authorization: Bearer <doctor>"

# tamper demo
node /tmp/tamper_proof.js
```