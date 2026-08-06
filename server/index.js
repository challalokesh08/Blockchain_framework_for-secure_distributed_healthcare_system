require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Blockchain, PatientRecordTransaction } = require('./blockchain');
const { findUser, findUserByPhone, verifyPassword, generateToken, authenticateToken, authorizeRoles, createPatientUser } = require('./auth');
const { getUserByPatientId } = require('./auth');
const { sendSMS } = require('./notifications');
const multer = require('multer');
const fs = require('fs');
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

// migrate old metadata.json into sqlite (if present)
const metadataFile = path.join(__dirname, 'uploads', 'metadata.json');
if (fs.existsSync(metadataFile)) {
  try {
    const raw = fs.readFileSync(metadataFile, 'utf8');
    const map = JSON.parse(raw || '{}');
    for (const [filename, meta] of Object.entries(map)) {
      saveFileMeta(db, meta).catch(err => console.error('migrate save failed', err));
    }
    // remove metadata file after migration
    try { fs.unlinkSync(metadataFile); } catch (e) {}
  } catch (err) {
    console.error('Migration failed:', err.message || err);
  }
}
const { ContractEngine } = require('./contracts');

const app = express();
const port = process.env.PORT || 4000;
const ledger = new Blockchain();
const contractEngine = new ContractEngine(ledger);

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
  res.json({ token, user: { username: user.username, role: user.role, name: user.name, patientId: user.patientId || null, phone: user.phone } });
});

app.post('/api/auth/register', (req, res) => {
  const { name, age, phone, password } = req.body;
  if (!name || !age || !phone || !password) {
    return res.status(400).json({ error: 'Name, age, phone number, and password are required for registration.' });
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
  res.json({
    status: 'online',
    blocks: ledger.chain.length,
    pendingTransactions: ledger.pendingTransactions.length,
    valid: ledger.isChainValid()
  });
});

app.get('/api/ledger', authenticateToken, authorizeRoles('Doctor', 'Nurse', 'Admin', 'Patient'), (req, res) => {
  res.json(ledger.chain);
});

app.get('/api/records', authenticateToken, authorizeRoles('Doctor', 'Nurse', 'Admin', 'Patient'), (req, res) => {
  const requestedPatientId = req.query.patientId || req.user.patientId;
  if (!requestedPatientId) {
    return res.status(400).json({ error: 'Missing patientId query parameter.' });
  }

  if (req.user.role === 'Patient' && requestedPatientId !== req.user.patientId) {
    return res.status(403).json({ error: 'Patients may only access their own records.' });
  }

  const records = ledger.getPatientRecords(requestedPatientId);
  res.json({ patientId: requestedPatientId, records });
});

app.post('/api/records', authenticateToken, authorizeRoles('Doctor', 'Nurse', 'Admin'), (req, res) => {
  const { patientId, author, data } = req.body;
  if (!patientId || !author || !data) {
    return res.status(400).json({ error: 'patientId, author, and data are required.' });
  }

  try {
    const transaction = ledger.addTransaction({ patientId, author, data });
    // Notify patient by phone if available
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

// Upload file endpoint for hospital staff. Stores file and creates a ledger transaction with file metadata.
app.post('/api/files/upload', authenticateToken, authorizeRoles('Doctor', 'Nurse', 'Admin'), upload.single('file'), (req, res) => {
  const { patientId, author } = req.body;
  if (!patientId || !author) {
    // cleanup uploaded file
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

  // persist metadata to sqlite
  saveFileMeta(db, meta).catch(err => console.error('saveFileMeta error', err));

  // add to ledger as a transaction (encrypted file metadata)
  ledger.addTransaction({ patientId, author, data: { file: { originalname: meta.originalname, filename: meta.filename, mimetype: meta.mimetype, size: meta.size } } });

  // generate signed download URL valid for configured expiry
  const jwt = require('jsonwebtoken');
  const downloadSecret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET;
  const expirySeconds = parseInt(process.env.DOWNLOAD_URL_EXPIRY || '86400', 10); // default 24h
  const token = jwt.sign({ filename: meta.filename }, downloadSecret, { expiresIn: expirySeconds });
  const signedLink = `${req.protocol}://${req.get('host')}/api/files/${encodeURIComponent(meta.filename)}?token=${token}`;

  // notify patient
  const patientUser = getUserByPatientId(patientId);
  if (patientUser && patientUser.phone) {
    const message = `A new report has been uploaded for you. View it here: ${signedLink}`;
    sendSMS(patientUser.phone, message).catch(() => {});
  }

  res.status(201).json({ message: 'File uploaded and recorded in ledger.', file: meta, signedLink });
});

// Serve uploaded files with access control: only hospital staff or the owning patient can fetch the file
app.get('/api/files/:filename', async (req, res) => {
  const filename = req.params.filename;
  const qtoken = req.query.token;

  // try query token first (signed URL)
  const jwtLib = require('jsonwebtoken');
  const downloadSecret = process.env.DOWNLOAD_SECRET || process.env.JWT_SECRET;
  let allowed = false;

  if (qtoken) {
    try {
      const payload = jwtLib.verify(qtoken, downloadSecret);
      if (payload && payload.filename === filename) allowed = true;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired download token.' });
    }
  }

  // if not allowed via token, try regular auth
  let meta;
  try {
    meta = await getFileMeta(db, filename);
  } catch (err) {
    console.error('getFileMeta error', err);
    return res.status(500).json({ error: 'Server error' });
  }

  if (!meta) return res.status(404).json({ error: 'File not found.' });

  if (!allowed) {
    // check Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authentication required.' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    try {
      const payload = jwtLib.verify(token, process.env.JWT_SECRET || 'HealthcareJwtSecret2026!');
      const user = payload;
      const hospitalRoles = ['Doctor', 'Nurse', 'Admin'];
      if (hospitalRoles.includes(user.role) || (user.role === 'Patient' && user.patientId === meta.patientId)) {
        allowed = true;
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
  return res.status(403).json({ error: 'Not authorized to access this file.' });
});

app.post('/api/mine', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const miner = req.body.miner || req.user.name || 'NetworkValidator';
  const block = ledger.minePendingTransactions(miner);
  if (!block) {
    return res.status(400).json({ error: 'No pending transactions to mine.' });
  }

  res.json({ message: 'New block mined successfully.', block, pendingTransactions: ledger.pendingTransactions });
});

app.get('/api/validate', authenticateToken, authorizeRoles('Doctor', 'Nurse', 'Admin', 'Patient'), (req, res) => {
  res.json({ valid: ledger.isChainValid() });
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

// List files for a patient. Doctors and staff can specify patientId; patients see own files.
app.get('/api/files', authenticateToken, (req, res) => {
  const requestedPatientId = req.query.patientId || req.user.patientId;
  if (!requestedPatientId) return res.status(400).json({ error: 'Missing patientId' });

  if (req.user.role === 'Patient' && requestedPatientId !== req.user.patientId) {
    return res.status(403).json({ error: 'Patients may only access their own files.' });
  }

  listFilesForPatient(db, requestedPatientId).then(rows => {
    // mask internal path before sending
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
