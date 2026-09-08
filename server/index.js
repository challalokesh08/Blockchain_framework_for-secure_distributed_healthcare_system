require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');
const { Blockchain, PatientRecordTransaction, VALIDATORS, roleForValidator } = require('./blockchain');
const { findUser, findUserByPhone, verifyPassword, generateToken, authenticateToken, authorizeRoles, createPatientUser, getAllPatients, seedPatient, seedDoctor, loadPersistedUsers, setDb, STAFF_ROLES } = require('./auth');
const { getUserByPatientId } = require('./auth');
const { sendSMS } = require('./notifications');
const multer = require('multer');
const fs = require('fs');
const { encrypt, getPublicKeyPem } = require('./crypto');
const offchain = require('./offchain');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// initialize sqlite DB for file metadata
const { init: initDb, saveFileMeta, getFileMeta, listFilesForPatient } = require('./db');
const db = initDb();
setDb(db);

// migrate old metadata.json into sqlite (if present)
const metadataFile = path.join(__dirname, 'uploads', 'metadata.json');
if (fs.existsSync(metadataFile)) {
  try {
    const raw = fs.readFileSync(metadataFile, 'utf8');
    const map = JSON.parse(raw || '{}');
    for (const [filename, meta] of Object.entries(map)) {
      saveFileMeta(db, meta).catch(err => console.error('migrate save failed', err));
    }
    try { fs.unlinkSync(metadataFile); } catch (e) {}
  } catch (err) {
    console.error('Migration failed:', err.message || err);
  }
}
const { ContractEngine } = require('./contracts');
const { ConsentRegistry } = require('./consent');

const app = express();
const port = process.env.PORT || 4000;
const ledger = new Blockchain();
const contractEngine = new ContractEngine(ledger);
const consentRegistry = new ConsentRegistry();

const STAFF_OR_PATIENT = [...STAFF_ROLES, 'Patient'];
const WRITE_ROLES = ['Doctor', 'Nurse', 'Admin', 'Hospital', 'Laboratory'];

// Seed 110 patients + medical records + image files + doctors + consents on startup so data persists across redeploys
(async () => {
  try {
    const restoredUsers = await loadPersistedUsers();
    if (restoredUsers > 0) console.log(`Restored ${restoredUsers} previously registered user(s) from sqlite.`);
    const dataset = require('../dataset');
    const seedImageDir = path.join(__dirname, 'seed-images');
    let seeded = 0;
    let seededFiles = 0;
    let seededDoctors = 0;

    const uniqueDoctors = [];
    const seenDoctors = new Set();
    for (const p of dataset) {
      if (!seenDoctors.has(p.doctor)) {
        seenDoctors.add(p.doctor);
        uniqueDoctors.push(p.doctor);
      }
    }
    uniqueDoctors.forEach((doctorName, i) => {
      if (seedDoctor({ name: doctorName, phone: `+1555${String(10010001 + i)}` })) {
        seededDoctors++;
      }
    });

    for (const p of dataset) {
      const user = seedPatient({ patientId: p.patientId, name: p.name, age: p.age, phone: p.phone });
      if (user) {
        seeded++;
        ledger.addTransaction({ patientId: p.patientId, author: p.doctor, data: { diagnosis: p.diagnosis, notes: p.news, department: p.department, physician: p.doctor } });
        consentRegistry.grant({ patientId: p.patientId, providerName: p.doctor, providerType: 'Doctor', purpose: 'Primary care coordination', requester: { name: 'System (seed)' } });
        consentRegistry.grant({ patientId: p.patientId, providerName: 'City General Hospital', providerType: 'Hospital', purpose: 'Hospital care operations', requester: { name: 'System (seed)' } });
      }

      const src = path.join(seedImageDir, `${p.patientId}.png`);
      if (fs.existsSync(src)) {
        const storedName = `seed-${p.patientId}.png`;
        const dest = path.join(uploadDir, storedName);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          seededFiles++;
        }
        const st = fs.statSync(dest);
        const meta = {
          patientId: p.patientId,
          originalname: `${p.name} - Medical Report.png`,
          filename: storedName,
          path: dest,
          mimetype: 'image/png',
          size: st.size,
          timestamp: new Date().toISOString()
        };
        const existing = await getFileMeta(db, storedName);
        if (!existing) {
          await saveFileMeta(db, meta);
          ledger.addTransaction({ patientId: p.patientId, author: p.doctor, data: { file: { originalname: meta.originalname, filename: meta.filename, mimetype: meta.mimetype, size: meta.size } } });
        }
      }
    }
    if (seeded > 0) {
      ledger.finalizeBlock('VALIDATOR-CARE-NODE-A');
      console.log(`Seeded ${seeded} patients, medical records, ${seededFiles} image files, ${seededDoctors} doctors, and consents on startup`);
    }
  } catch (err) {
    console.error('Seed failed (non-fatal):', err.message);
  }
})();

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required.' });
  }

  const normalizedPhone = String(phone).trim();
  const user = findUserByPhone(normalizedPhone);
  if (!user) {
    return res.status(404).json({ error: 'No user found with that phone number.' });
  }

  if (!verifyPassword(user, password)) {
    return res.status(401).json({ error: 'Invalid phone number or password.' });
  }

  const token = generateToken(user);
  const publicPayload = { username: user.username, role: user.role, name: user.name, patientId: user.patientId || null, phone: user.phone, organization: user.organization || null };
  res.json({ token, user: publicPayload });
});

app.post('/api/auth/register', (req, res) => {
  const { name, age, phone, password } = req.body;
  if (!name || age === undefined || age === null || !phone || !password) {
    return res.status(400).json({ error: 'Name, age, phone number, and password are required for registration.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedPhone = String(phone).trim();
  if (findUserByPhone(normalizedPhone)) {
    return res.status(409).json({ error: 'Phone number is already registered.' });
  }

  const user = createPatientUser({ name, age, phone: normalizedPhone, password });
  const token = generateToken(user);
  res.status(201).json({ token, user: { username: user.username, role: user.role, name: user.name, patientId: user.patientId, phone: user.phone } });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', ...ledger.getStatus() });
});

app.get('/api/crypto/public-key', (req, res) => {
  res.json({ algorithm: 'RSA-2048 (OAEP-SHA256) wrapping AES-256-GCM', publicKeyPem: getPublicKeyPem() });
});

app.get('/api/ledger', authenticateToken, authorizeRoles(...STAFF_OR_PATIENT), (req, res) => {
  res.json(ledger.chain);
});

app.get('/api/patients', authenticateToken, authorizeRoles(...STAFF_ROLES), (req, res) => {
  res.json({ patients: getAllPatients() });
});

// Consent: patient-controlled access management
app.get('/api/consent', authenticateToken, authorizeRoles(...STAFF_OR_PATIENT), (req, res) => {
  const pid = req.query.patientId || req.user.patientId;
  if (!pid) return res.status(400).json({ error: 'Missing patientId' });
  if (req.user.role === 'Patient' && pid !== req.user.patientId) {
    return res.status(403).json({ error: 'Patients may only view their own consents.' });
  }
  res.json({ patientId: pid, consents: consentRegistry.list(pid) });
});

app.post('/api/consent', authenticateToken, authorizeRoles('Patient'), (req, res) => {
  const patientId = req.user.patientId;
  const { providerName, providerType, purpose } = req.body;
  if (!patientId || !providerName) {
    return res.status(400).json({ error: 'providerName is required to grant consent.' });
  }

  try {
    const consent = consentRegistry.grant({ patientId, providerName, providerType, purpose, requester: req.user });
    const transaction = ledger.addTransaction({ patientId, author: req.user.name, data: { type: 'consent', action: 'GRANT', consentId: consent.consentId, providerName, providerType, purpose } });
    res.json({ message: 'Consent granted and recorded on the ledger.', consent, transaction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/consent', authenticateToken, authorizeRoles('Patient'), (req, res) => {
  const patientId = req.user.patientId;
  const { providerName, providerType } = req.body;
  if (!patientId || !providerName) {
    return res.status(400).json({ error: 'providerName is required to revoke consent.' });
  }

  try {
    const consent = consentRegistry.revoke({ patientId, providerName, providerType, requester: req.user });
    const transaction = ledger.addTransaction({ patientId, author: req.user.name, data: { type: 'consent', action: 'REVOKE', consentId: consent.consentId, providerName, providerType } });
    res.json({ message: 'Consent revoked and recorded on the ledger.', consent, transaction });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/records', authenticateToken, authorizeRoles(...STAFF_OR_PATIENT), (req, res) => {
  const requestedPatientId = req.query.patientId || req.user.patientId;
  if (!requestedPatientId) {
    return res.status(400).json({ error: 'Missing patientId query parameter.' });
  }

  if (req.user.role === 'Patient') {
    if (requestedPatientId !== req.user.patientId) {
      return res.status(403).json({ error: 'Patients may only access their own records.' });
    }
  } else if (req.user.role !== 'Admin' && !consentRegistry.hasActiveConsent({ patientId: requestedPatientId, requester: req.user })) {
    return res.status(403).json({ error: `Patient consent required. No active consent for ${requestedPatientId} authorizing ${req.user.role}.` });
  }

  const records = ledger.getPatientRecords(requestedPatientId);
  res.json({ patientId: requestedPatientId, records, consentRequired: true });
});

app.post('/api/records', authenticateToken, authorizeRoles(...WRITE_ROLES), (req, res) => {
  const { patientId, author, data } = req.body;
  if (!patientId || !author || !data) {
    return res.status(400).json({ error: 'patientId, author, and data are required.' });
  }

  try {
    const transaction = ledger.addTransaction({ patientId, author, data });
    const patientUser = getUserByPatientId(patientId);
    if (patientUser && patientUser.phone) {
      const message = `New medical record uploaded for you by ${author}. Log in to HealthLedger to view it.`;
      sendSMS(patientUser.phone, message).catch(() => {});
    }
    res.json({ message: 'Record added to pending ledger pool.', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file endpoint for healthcare stakeholders. Stores file and creates a ledger transaction with file metadata.
app.post('/api/files/upload', authenticateToken, authorizeRoles(...WRITE_ROLES), upload.single('file'), (req, res) => {
  const { patientId, author } = req.body;
  if (!patientId || !author) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'patientId and author are required.' });
  }

  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const meta = {
    patientId,
    originalname: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    timestamp: new Date().toISOString()
  };

  saveFileMeta(db, meta).catch(err => console.error('saveFileMeta error', err));

  ledger.addTransaction({ patientId, author, data: { file: { originalname: meta.originalname, filename: meta.filename, mimetype: meta.mimetype, size: meta.size } } });

  const downloadSecret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || 'HealthcareJwtSecret2026!';
  const expirySeconds = parseInt(process.env.DOWNLOAD_URL_EXPIRY || '86400', 10);
  const token = jsonwebtoken.sign({ filename: meta.filename }, downloadSecret, { expiresIn: expirySeconds });
  const signedLink = `${req.protocol}://${req.get('host')}/api/files/${encodeURIComponent(meta.filename)}?token=${token}`;

  const patientUser = getUserByPatientId(patientId);
  if (patientUser && patientUser.phone) {
    const message = `A new report has been uploaded for you. View it here: ${signedLink}`;
    sendSMS(patientUser.phone, message).catch(() => {});
  }

  res.status(201).json({ message: 'File uploaded and recorded in ledger.', file: meta, signedLink });
});

// Serve uploaded files with access control: staff with consent or the owning patient can fetch the file
app.get('/api/files/:filename', async (req, res) => {
  const filename = req.params.filename;
  const qtoken = req.query.token;

  const downloadSecret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET || 'HealthcareJwtSecret2026!';
  let allowed = false;

  if (qtoken) {
    try {
      const payload = jsonwebtoken.verify(qtoken, downloadSecret);
      if (payload && payload.filename === filename) allowed = true;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired download token.' });
    }
  }

  let meta;
  try {
    meta = await getFileMeta(db, filename);
  } catch (err) {
    console.error('getFileMeta error', err);
    return res.status(500).json({ error: 'Server error' });
  }

  if (!meta) return res.status(404).json({ error: 'File not found.' });

  if (!allowed) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authentication required.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    try {
      const payload = jsonwebtoken.verify(token, process.env.JWT_SECRET || 'HealthcareJwtSecret2026!');
      const user = payload;
      if (user.role === 'Patient' && user.patientId === meta.patientId) {
        allowed = true;
      } else if (user.role !== 'Patient') {
        allowed = user.role === 'Admin' || consentRegistry.hasActiveConsent({ patientId: meta.patientId, requester: user });
      } else {
        return res.status(403).json({ error: 'Not authorized to access this file.' });
      }
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }

  if (allowed) {
    return res.sendFile(path.resolve(meta.path));
  }
  return res.status(403).json({ error: 'Patient consent required to access this file.' });
});

// PoA: seal pending transactions into a block signed by a validator
app.post('/api/mine', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const validator = req.body.validator || req.user.name || VALIDATORS[0];
  const block = ledger.finalizeBlock(validator);
  if (!block) {
    return res.status(400).json({ error: 'No pending transactions to seal.' });
  }

  res.json({ message: 'Block sealed by PoA validator.', block, pendingTransactions: ledger.pendingTransactions, consensus: ledger.getStatus() });
});

app.get('/api/validate', authenticateToken, authorizeRoles(...STAFF_OR_PATIENT), (req, res) => {
  res.json({ valid: ledger.isChainValid(), ...ledger.getStatus(), validators: VALIDATORS.map(v => ({ name: v, role: roleForValidator(v) })) });
});

app.get('/api/contracts', authenticateToken, (req, res) => {
  res.json({ contracts: contractEngine.getContracts() });
});

app.post('/api/contracts', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const { contractType, patientId, authorizedProvider, purpose } = req.body;
  if (!patientId || !authorizedProvider || !purpose) {
    return res.status(400).json({ error: 'patientId, authorizedProvider, and purpose are required.' });
  }

  const contract = contractEngine.createContract(
    { contractType, patientId, authorizedProvider, purpose },
    { username: req.user.username, role: req.user.role, name: req.user.name }
  );

  res.json({ message: 'Contract deployed successfully.', contract });
});

// List files for a patient. Staff can specify patientId; patients see own files.
app.get('/api/files', authenticateToken, authorizeRoles(...STAFF_OR_PATIENT), (req, res) => {
  const requestedPatientId = req.query.patientId || req.user.patientId;
  if (!requestedPatientId) return res.status(400).json({ error: 'Missing patientId' });

  if (req.user.role === 'Patient' && requestedPatientId !== req.user.patientId) {
    return res.status(403).json({ error: 'Patients may only access their own files.' });
  }

  if (req.user.role !== 'Patient' && req.user.role !== 'Admin' && !consentRegistry.hasActiveConsent({ patientId: requestedPatientId, requester: req.user })) {
    return res.status(403).json({ error: `Patient consent required. No active consent for ${requestedPatientId} authorizing ${req.user.role}.` });
  }

  listFilesForPatient(db, requestedPatientId).then(rows => {
    const masked = rows.map(r => ({ filename: r.filename, originalname: r.originalname, mimetype: r.mimetype, size: r.size, timestamp: r.timestamp, patientId: r.patientId }));
    res.json({ patientId: requestedPatientId, files: masked });
  }).catch(err => {
    console.error('listFilesForPatient error', err);
    res.status(500).json({ error: 'Server error' });
  });
});

app.post('/api/reset-ledger', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  ledger.chain = [ledger.createGenesisBlock()];
  ledger.pendingTransactions = [];
  res.json({ message: 'Ledger has been reset to a fresh state.', chainLength: ledger.chain.length });
});

app.post('/api/contracts/:id/execute', authenticateToken, authorizeRoles('Doctor', 'Admin'), (req, res) => {
  const contractId = req.params.id;
  const { action, comment } = req.body;

  try {
    const contract = contractEngine.executeContract(contractId, action, {
      username: req.user.username,
      role: req.user.role,
      name: req.user.name,
      comment: comment || ''
    });

    res.json({ message: 'Contract action executed successfully.', contract });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(port, () => {
  console.log(`Healthcare blockchain API is running at http://localhost:${port}`);
});