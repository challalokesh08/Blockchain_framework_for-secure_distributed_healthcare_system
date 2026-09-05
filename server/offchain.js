const fs = require('fs');
const path = require('path');

const OFFCHAIN_DIR = path.join(__dirname, 'data', 'offchain');

function ensureDir() {
  fs.mkdirSync(OFFCHAIN_DIR, { recursive: true });
}

function fileFor(hash) {
  return path.join(OFFCHAIN_DIR, `${hash}.json`);
}

function save(hash, payload) {
  ensureDir();
  const target = fileFor(hash);
  const existing = fs.existsSync(target);
  fs.writeFileSync(target, JSON.stringify(payload), { mode: 0o600 });
  return { hash, created: !existing };
}

function get(hash) {
  const target = fileFor(hash);
  if (!fs.existsSync(target)) return null;
  try {
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (err) {
    return null;
  }
}

function remove(hash) {
  const target = fileFor(hash);
  if (fs.existsSync(target)) fs.unlinkSync(target);
}

module.exports = { save, get, remove, dir: OFFCHAIN_DIR };