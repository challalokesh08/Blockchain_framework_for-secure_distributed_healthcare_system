const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'HealthcareJwtSecret2026!';

const users = [
  { username: 'doctor1', password: bcrypt.hashSync('doctorpass', 10), role: 'Doctor', name: 'Dr. Sharma', phone: '+15550000001', age: 45 },
  { username: 'nurse1', password: bcrypt.hashSync('nursepass', 10), role: 'Nurse', name: 'Nurse Patel', phone: '+15550000002', age: 32 },
  { username: 'admin1', password: bcrypt.hashSync('adminpass', 10), role: 'Admin', name: 'Administrator', phone: '+15550000003', age: 38 },
  { username: 'patient1', password: bcrypt.hashSync('patientpass', 10), role: 'Patient', name: 'Asha Kumar', patientId: 'P-1001', phone: '+15550000004', age: 29 }
];

function findUser(username) {
  return users.find(user => user.username === username);
}

function findUserByPhone(phone) {
  return users.find(user => user.phone === phone);
}

function verifyPassword(user, rawPassword) {
  if (!user || !user.password) {
    return false;
  }
  return bcrypt.compareSync(rawPassword, user.password);
}

function createPatientUser(details) {
  const nextId = users.filter(u => u.role === 'Patient').length + 2;
  const username = `patient${nextId}`;
  const patientId = `P-${1000 + nextId}`;
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

module.exports = {
  findUser,
  findUserByPhone,
  verifyPassword,
  generateToken,
  authenticateToken,
  authorizeRoles,
  createPatientUser
};
