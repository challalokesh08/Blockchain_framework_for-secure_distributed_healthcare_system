const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { saveUser, loadUsers } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'HealthcareJwtSecret2026!';

const STAFF_ROLES = ['Doctor', 'Nurse', 'Admin', 'Hospital', 'Laboratory', 'Insurance'];

let dbRef = null;

function setDb(db) {
  dbRef = db;
}

const users = [
  { username: 'doctor1', password: bcrypt.hashSync('doctorpass', 10), role: 'Doctor', name: 'Dr. Sharma', phone: '+15550000001', age: 45 },
  { username: 'nurse1', password: bcrypt.hashSync('nursepass', 10), role: 'Nurse', name: 'Nurse Patel', phone: '+15550000002', age: 32 },
  { username: 'admin1', password: bcrypt.hashSync('adminpass', 10), role: 'Admin', name: 'Administrator', phone: '+15550000003', age: 38 },
  { username: 'patient1', password: bcrypt.hashSync('patientpass', 10), role: 'Patient', name: 'Asha Kumar', patientId: 'P-1001', phone: '+15550000004', age: 29 },
  { username: 'hospital1', password: bcrypt.hashSync('hospitalpass', 10), role: 'Hospital', name: 'City General Hospital', phone: '+15550000005', age: 0, organization: 'City General Hospital' },
  { username: 'lab1', password: bcrypt.hashSync('labpass', 10), role: 'Laboratory', name: 'Metropolis Diagnostics Lab', phone: '+15550000006', age: 0, organization: 'Metropolis Diagnostics Lab' },
  { username: 'insurance1', password: bcrypt.hashSync('insurancepass', 10), role: 'Insurance', name: 'InsureHealth Insurance', phone: '+15550000007', age: 0, organization: 'InsureHealth Insurance' }
];

let doctorSeq = 10000;

function seedDoctor({ name, phone }) {
  if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) return null;
  const user = {
    username: `doctor_${++doctorSeq}`,
    password: bcrypt.hashSync('doctorpass', 10),
    role: 'Doctor',
    name,
    phone: phone || '+15550010001',
    age: 45
  };
  users.push(user);
  return user;
}

function findUser(username) {
  return users.find(user => user.username === username);
}

function findUserByPhone(phone) {
  return users.find(user => user.phone === phone);
}

function getUserByPatientId(patientId) {
  return users.find(user => user.patientId === patientId);
}

function verifyPassword(user, rawPassword) {
  if (!user || !user.password) {
    return false;
  }
  return bcrypt.compareSync(rawPassword, user.password);
}

function nextPatientId() {
  let maxNum = 3000;
  for (const u of users) {
    if (u.patientId && /^P-(\d+)$/.test(u.patientId)) {
      const n = parseInt(u.patientId.slice(2), 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `P-${maxNum + 1}`;
}

function createPatientUser(details) {
  const nextId = users.filter(u => u.role === 'Patient').length + 2;
  const username = `patient${nextId}`;
  const patientId = nextPatientId();
  const user = {
    username,
    password: bcrypt.hashSync(details.password, 10),
    role: 'Patient',
    name: details.name,
    age: details.age,
    phone: details.phone,
    patientId
  };
  users.push(user);
  if (dbRef) {
    saveUser(dbRef, user).catch(err => console.error('[auth] failed to persist user:', err.message));
  }
  return user;
}

async function loadPersistedUsers() {
  if (!dbRef) return 0;
  try {
    const rows = await loadUsers(dbRef);
    let added = 0;
    for (const row of rows) {
      if (users.some(u => u.phone === row.phone)) continue;
      if (users.some(u => u.username === row.username)) continue;
      users.push({
        username: row.username,
        password: row.password,
        role: row.role,
        name: row.name,
        age: row.age,
        phone: row.phone,
        patientId: row.patientId || null
      });
      added++;
    }
    return added;
  } catch (err) {
    console.error('[auth] failed to load persisted users:', err.message);
    return 0;
  }
}

function seedPatient(details) {
  if (users.find(u => u.patientId === details.patientId)) return null;
  const user = {
    username: `patient_${details.patientId}`,
    password: bcrypt.hashSync('patientpass', 10),
    role: 'Patient',
    name: details.name,
    age: details.age,
    phone: details.phone,
    patientId: details.patientId
  };
  users.push(user);
  return user;
}

function generateToken(user) {
  return jwt.sign({ username: user.username, role: user.role, name: user.name, patientId: user.patientId || null, phone: user.phone || null }, JWT_SECRET, { expiresIn: '8h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is missing.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Role not authorized for this action.' });
    }
    next();
  };
}

function getAllPatients() {
  return users.filter(u => u.role === 'Patient').map(u => ({
    name: u.name,
    patientId: u.patientId,
    phone: u.phone,
    age: u.age
  }));
}

module.exports = {
  findUser,
  findUserByPhone,
  getUserByPatientId,
  verifyPassword,
  generateToken,
  authenticateToken,
  authorizeRoles,
  createPatientUser,
  loadPersistedUsers,
  setDb,
  getAllPatients,
  seedPatient,
  seedDoctor,
  STAFF_ROLES
};
