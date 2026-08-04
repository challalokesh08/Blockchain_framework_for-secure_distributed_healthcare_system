require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Blockchain, PatientRecordTransaction } = require('./blockchain');
const { findUser, findUserByPhone, verifyPassword, generateToken, authenticateToken, authorizeRoles, createPatientUser } = require('./auth');
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
    res.json({ message: 'Record added to pending ledger pool.', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
