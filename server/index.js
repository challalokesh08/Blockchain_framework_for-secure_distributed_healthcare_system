require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const jsonwebtoken = require('jsonwebtoken');
const { Blockchain, PatientRecordTransaction, VALIDATORS, roleForValidator } = require('./blockchain');
const { findUser, findUserByPhone, verifyPassword, generateToken, authenticateToken, authorizeRoles, createPatientUser, getAllPatients, seedPatient, seedDoctor, loadPersistedUsers, loadExtraSeedUsers, setDb, STAFF_ROLES } = require('./auth');
const { getUserByPatientId, getUsersByRole, getUserByName } = require('./auth');
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
const { EmergencyRegistry } = require('./emergency');
const { AccessRequestRegistry } = require('./access-requests');
const { NotificationRegistry } = require('./notification-registry');
const { deriveVitals } = require('./vitals');

const app = express();
const port = process.env.PORT || 4000;
const ledger = new Blockchain();
const contractEngine = new ContractEngine(ledger);
const consentRegistry = new ConsentRegistry();
const emergencyRegistry = new EmergencyRegistry();
const accessRequestRegistry = new AccessRequestRegistry();
const notificationRegistry = new NotificationRegistry();

const STAFF_OR_PATIENT = [...STAFF_ROLES, 'Patient'];
const WRITE_ROLES = ['Doctor', 'Nurse', 'Admin', 'Hospital', 'Laboratory'];

// One notification is delivered to an in-app inbox (all roles) and, where a
// phone number exists, as an SMS via Twilio (or the local file fallback).
function notify({ recipients = [], smsTo = [], type = 'info', title, body, patientId = null, requestId = null, link = null, actor = null }) {
  const notification = notificationRegistry.add({ recipients, type, title, body, patientId, requestId, link, actor });
  const seen = new Set();
  for (const to of smsTo) {
    if (!to || seen.has(to)) continue;
    seen.add(to);
    sendSMS(to, `${title}: ${body}`).catch(() => {});
  }
  return notification;
}

function notifyPatient(patientId, details) {
  const patient = getUserByPatientId(patientId);
  notify({
    recipients: [{ role: 'Patient', patientId }],
    smsTo: patient ? [patient.phone] : [],
    ...details
  });
}

function notifyAdmins(details) {
  notify({
    recipients: [{ role: 'Admin' }],
    smsTo: getUsersByRole('Admin').map(u => u.phone),
    ...details
  });
}

function notifyStaffByName(name, details) {
  const user = getUserByName(name);
  notify({
    recipients: [{ role: 'Staff', name }],
    smsTo: user ? [user.phone] : [],
    ...details
  });
}

// Seed 110 patients + medical records + image files + doctors + consents on startup so data persists across redeploys
(async () => {
  try {
    const restoredUsers = await loadPersistedUsers();
    if (restoredUsers > 0) console.log(`Restored ${restoredUsers} previously registered user(s) from sqlite.`);
    const extraSeeded = loadExtraSeedUsers();
    if (extraSeeded > 0) console.log(`Registered ${extraSeeded} permanent demo account(s) from seed-extra-users.json.`);
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
        ledger.addTransaction({ patientId: p.patientId, author: p.doctor, data: { diagnosis: p.diagnosis, notes: p.news, department: p.department, physician: p.doctor, vitals: deriveVitals(p.patientId, p.name) } });
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
    // Permanent demo records for the extra seeded accounts (seed-extra-users.json)
    const extraUsers = require('./seed-extra-users.json');
    for (const eu of extraUsers) {
      ledger.addTransaction({
        patientId: eu.patientId,
        author: 'Dr. Rajesh Varma',
        data: {
          diagnosis: eu.name.toLowerCase().includes('lokesh') ? 'Routine health assessment' : 'Pre-visit screening',
          notes: `Permanent demo record created at startup for ${eu.name}.`,
          department: 'General Medicine',
          physician: 'Dr. Rajesh Varma',
          lab: 'City General Hospital',
          vitals: deriveVitals(eu.patientId, eu.name)
        }
      });
      consentRegistry.grant({ patientId: eu.patientId, providerName: 'Dr. Rajesh Varma', providerType: 'Doctor', purpose: 'Primary care coordination', requester: { name: 'System (seed)' } });
      consentRegistry.grant({ patientId: eu.patientId, providerName: 'City General Hospital', providerType: 'Hospital', purpose: 'Hospital care operations', requester: { name: 'System (seed)' } });
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

// Staff (Doctor/Admin) can onboard a new patient without the patient self-registering.
app.post('/api/auth/register-patient', authenticateToken, authorizeRoles('Doctor', 'Admin'), (req, res) => {
  const { name, age, phone, password } = req.body;
  if (!name || age === undefined || age === null || !phone || !password) {
    return res.status(400).json({ error: 'Name, age, phone number, and password are required.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const normalizedPhone = String(phone).trim();
  if (findUserByPhone(normalizedPhone)) {
    return res.status(409).json({ error: 'Phone number is already registered.' });
  }

  const user = createPatientUser({ name, age, phone: normalizedPhone, password });
  res.status(201).json({
    message: `Patient registered with ID ${user.patientId}.`,
    user: { username: user.username, role: user.role, name: user.name, patientId: user.patientId, phone: user.phone }
  });
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

// File access requests: a clinician asks, the patient (or admin) decides, and
// approval grants scoped consent so the clinician can actually open the files.
const ACCESS_PROVIDER_TYPE = {
  Doctor: 'Doctor', Nurse: 'Hospital', Hospital: 'Hospital',
  Laboratory: 'Laboratory', Insurance: 'Insurance', Admin: 'Doctor'
};

app.post('/api/access-request', authenticateToken, authorizeRoles(...STAFF_ROLES), (req, res) => {
  const { patientId, reason } = req.body || {};
  if (!patientId) return res.status(400).json({ error: 'patientId is required.' });
  const request = accessRequestRegistry.create({
    patientId,
    requester: { name: req.user.name, role: req.user.role },
    reason: reason || 'Request to review medical files' // registry stores requester.name as a string
  });
  try {
    ledger.addTransaction({
      patientId,
      author: req.user.name,
      data: { type: 'file-access', action: 'FILE_ACCESS_REQUEST', requestId: request.id, requester: request.requester, role: request.role, reason: request.reason, status: 'PENDING' }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  notifyPatient(patientId, {
    type: 'file_request',
    title: 'File access request',
    body: `${req.user.name} (${req.user.role}) requested access to your medical files. Reason: ${request.reason}`,
    patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });
  notifyAdmins({
    type: 'file_request',
    title: 'File access request',
    body: `${req.user.name} (${req.user.role}) requested access to ${patientId}'s files. Reason: ${request.reason}`,
    patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });

  res.status(201).json({ message: 'Request sent to the patient and administrator.', request });
});

app.get('/api/access-request', authenticateToken, authorizeRoles(...STAFF_OR_PATIENT), (req, res) => {
  res.json({ requests: accessRequestRegistry.listFor(req.user) });
});

app.post('/api/access-request/confirm/:id', authenticateToken, authorizeRoles('Patient', 'Admin'), (req, res) => {
  const request = accessRequestRegistry.get(req.params.id);
  if (!request) return res.status(404).json({ error: 'File access request not found.' });
  if (req.user.role === 'Patient' && request.patientId !== req.user.patientId) {
    return res.status(403).json({ error: 'Patients may only decide requests for their own records.' });
  }
  const approved = req.body && req.body.approved !== false;
  let consent = null;
  if (approved) {
    try {
      consent = consentRegistry.grant({
        patientId: request.patientId,
        providerName: request.requester,
        providerType: ACCESS_PROVIDER_TYPE[request.role] || 'Doctor',
        purpose: request.reason,
        requester: req.user
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  let decided;
  try {
    decided = accessRequestRegistry.decide(request.id, { approved, user: req.user, consentId: consent?.consentId || null });
    ledger.addTransaction({
      patientId: request.patientId,
      author: req.user.name,
      data: {
        type: 'file-access',
        action: approved ? 'FILE_ACCESS_APPROVED' : 'FILE_ACCESS_REJECTED',
        requestId: request.id,
        requester: request.requester,
        decidedBy: req.user.name,
        consentId: consent?.consentId || null
      }
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const outcome = approved ? 'approved' : 'rejected';
  const message = `File access request ${request.id} ${outcome}${approved ? ' — consent is now active.' : '.'}`;
  notifyStaffByName(request.requester, {
    type: 'file_decision',
    title: `File access ${outcome}`,
    body: `Your request for ${request.patientId}'s files was ${outcome} by ${req.user.name}.`,
    patientId: request.patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });
  notifyPatient(request.patientId, {
    type: 'file_decision',
    title: `File access ${outcome}`,
    body: `You ${outcome} ${request.requester}'s request${approved ? '. Their consent is active.' : '.'}`,
    patientId: request.patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });
  notifyAdmins({
    type: 'file_decision',
    title: `File access ${outcome}`,
    body: `${req.user.name} ${outcome} ${request.requester}'s file access request for ${request.patientId}.`,
    patientId: request.patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });

  res.json({ message, request: decided, consent });
});

// In-app notification inbox (SMS delivery is handled by notify() above).
app.get('/api/notifications', authenticateToken, (req, res) => {
  res.json({ notifications: notificationRegistry.listFor(req.user) });
});

app.post('/api/notifications/read', authenticateToken, (req, res) => {
  const n = notificationRegistry.markRead(req.body?.id, req.user);
  if (!n) return res.status(404).json({ error: 'Notification not found.' });
  res.json({ notification: n });
});

// Emergency (break-glass) access: doctor requests, admin approves (2-of-2), time-boxed, vital scope only, fully audited on-chain.
app.get('/api/emergency', authenticateToken, authorizeRoles(...STAFF_OR_PATIENT), (req, res) => {
  const { role, name, patientId } = req.user;
  let requests;
  if (role === 'Admin') requests = emergencyRegistry.list({ role });
  else if (role === 'Patient') requests = emergencyRegistry.list({ role, patientId });
  else requests = emergencyRegistry.list({ doctor: name });
  res.json({ requests });
});

app.post('/api/emergency/request', authenticateToken, authorizeRoles('Doctor', 'Admin'), (req, res) => {
  const { patientId, reason, triageCode } = req.body;
  if (!patientId || !reason || !triageCode) {
    return res.status(400).json({ error: 'patientId, reason, and triageCode are required.' });
  }
  const triage = Number(triageCode);
  if (!Number.isInteger(triage) || triage < 1 || triage > 5) {
    return res.status(400).json({ error: 'triageCode must be an integer between 1 and 5.' });
  }
  if (triage > 3) {
    return res.status(403).json({ error: 'Emergency unlock is only for critical cases (triage 1-3). For non-urgent access, ask the patient to grant consent normally.' });
  }
  if (emergencyRegistry.getActiveUnlock(patientId)) {
    return res.status(409).json({ error: `An active emergency unlock already exists for ${patientId}.` });
  }

  const request = emergencyRegistry.request({ patientId, doctor: req.user.name, doctorPhone: req.user.phone || null, reason, triageCode: triage });
  try {
    ledger.addTransaction({ patientId, author: req.user.name, data: { type: 'emergency', action: 'EMERGENCY_REQUEST', requestId: request.id, doctor: request.doctor, reason, triageCode: triage, status: 'PENDING' } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  notifyPatient(patientId, {
    type: 'emergency_request',
    title: 'Emergency access requested',
    body: `${req.user.name} requested a time-boxed emergency unlock of your vital information. Reason: ${reason} (triage ${triage}). An admin must approve it.`,
    patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });
  notifyAdmins({
    type: 'emergency_request',
    title: 'Emergency unlock approval needed',
    body: `${req.user.name} requested emergency access to ${patientId}'s vital information. Reason: ${reason} (triage ${triage}).`,
    patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });

  res.status(201).json({ message: 'Emergency access request logged. An admin must approve it before any access is granted.', request });
});

app.post('/api/emergency/confirm/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const approved = req.body && req.body.approved !== false;
  let request;
  try {
    request = emergencyRegistry.confirm(req.params.id, req.user.name, approved);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    ledger.addTransaction({
      patientId: request.patientId,
      author: req.user.name,
      data: { type: 'emergency', action: approved ? 'EMERGENCY_APPROVED' : 'EMERGENCY_REJECTED', requestId: request.id, doctor: request.doctor, admin: request.confirmedBy, reason: request.reason, triageCode: request.triageCode, expiresAt: request.unlockExpiresAt || null }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const outcome = approved ? 'approved' : 'rejected';
  const patientUser = getUserByPatientId(request.patientId);
  if (patientUser && patientUser.phone) {
    const message = approved
      ? `HealthLedger alert: temporary emergency access to your vital records was granted to ${request.doctor} until ${request.unlockExpiresAt}. Log in to review and revoke it.`
      : `HealthLedger notice: an emergency access request by ${request.doctor} was reviewed and not approved.`;
    sendSMS(patientUser.phone, message).catch(() => {});
  }
  // In-app copies (SMS above avoids wording duplication).
  notificationRegistry.add({
    recipients: [{ role: 'Patient', patientId: request.patientId }],
    type: 'emergency_decision',
    title: `Emergency access ${outcome}`,
    body: approved
      ? `Your vital information is unlocked for ${request.doctor} until ${request.unlockExpiresAt}.`
      : `${request.doctor}'s emergency request was not approved.`,
    patientId: request.patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });
  notificationRegistry.add({
    recipients: [{ role: 'Staff', name: request.doctor }],
    type: 'emergency_decision',
    title: `Emergency access ${outcome}`,
    body: approved
      ? `Your emergency unlock for ${request.patientId} is active until ${request.unlockExpiresAt}. Vital information only.`
      : `Your emergency request for ${request.patientId} was rejected by ${req.user.name}.`,
    patientId: request.patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });
  notificationRegistry.add({
    recipients: [{ role: 'Admin' }],
    type: 'emergency_decision',
    title: `Emergency access ${outcome}`,
    body: `${req.user.name} ${outcome} ${request.doctor}'s emergency request for ${request.patientId}.`,
    patientId: request.patientId,
    requestId: request.id,
    link: '/records',
    actor: req.user.name
  });

  res.json({
    message: approved
      ? `Emergency access approved for ${request.patientId}. Vital-only unlock active until ${request.unlockExpiresAt}.`
      : `Emergency access request ${request.id} was rejected.`,
    request
  });
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
    const records = ledger.getPatientRecords(requestedPatientId);
    return res.json({ patientId: requestedPatientId, records, consentRequired: true });
  }

  const emergencyMode = req.query.emergency === '1' || req.query.emergency === 'true';

  if (req.user.role !== 'Admin') {
    if (emergencyMode) {
      const unlock = emergencyRegistry.getActiveUnlock(requestedPatientId);
      if (!unlock) {
        return res.status(403).json({ error: `No active emergency unlock for ${requestedPatientId}. Emergency access requires a doctor's request and an admin's approval.` });
      }
      if (unlock.doctor !== req.user.name) {
        return res.status(403).json({ error: 'This emergency unlock was requested by another clinician. Only the requesting clinician may use it.' });
      }
    } else if (!consentRegistry.hasActiveConsent({ patientId: requestedPatientId, requester: req.user })) {
      return res.status(403).json({ error: `Patient consent required. No active consent for ${requestedPatientId} authorizing ${req.user.role}.` });
    }
  }

  if (emergencyMode) {
    const unlock = emergencyRegistry.getActiveUnlock(requestedPatientId);
    let vitals = null;
    for (const rec of ledger.getPatientRecords(requestedPatientId)) {
      if (rec.data && rec.data.vitals) { vitals = rec.data.vitals; break; }
    }
    if (!vitals) vitals = deriveVitals(requestedPatientId);
    return res.json({
      patientId: requestedPatientId,
      emergency: true,
      scope: 'VITAL_ONLY',
      unlock: unlock
        ? { unlockId: unlock.unlockId, approvedBy: unlock.confirmedBy, requestedBy: unlock.doctor, reason: unlock.reason, triageCode: unlock.triageCode, expiresAt: unlock.unlockExpiresAt }
        : null,
      vitals
    });
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

// Add a clinical record with an optional report photo and lab, in one multipart submission.
app.post('/api/records/with-report', authenticateToken, authorizeRoles(...WRITE_ROLES), upload.single('file'), async (req, res) => {
  const { patientId, author, diagnosis, notes, lab } = req.body;
  if (!patientId || !author) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'patientId and author are required.' });
  }

  try {
    const recordData = { diagnosis: diagnosis || '', notes: notes || '', lab: lab || '' };
    const recordTx = ledger.addTransaction({ patientId, author, data: recordData });

    let fileTx = null;
    if (req.file) {
      const meta = {
        patientId,
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        timestamp: new Date().toISOString()
      };
      await saveFileMeta(db, meta);
      fileTx = ledger.addTransaction({ patientId, author, data: { file: { originalname: meta.originalname, filename: meta.filename, mimetype: meta.mimetype, size: meta.size } } });
    }

    const patientUser = getUserByPatientId(patientId);
    if (patientUser && patientUser.phone) {
      const message = `New medical record${req.file ? ' with report photo' : ''} uploaded for you by ${author}. Log in to HealthLedger to view it.`;
      sendSMS(patientUser.phone, message).catch(() => {});
    }

    res.status(201).json({
      message: req.file ? 'Record and report photo added to the ledger pool.' : 'Record added to the ledger pool.',
      recordTransaction: recordTx,
      fileTransaction: fileTx
    });
  } catch (error) {
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
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