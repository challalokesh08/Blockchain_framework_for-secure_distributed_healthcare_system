const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_DIR = path.join(__dirname, 'keys');
const PUBLIC_KEY_FILE = path.join(KEYS_DIR, 'public.pem');
const PRIVATE_KEY_FILE = path.join(KEYS_DIR, 'private.pem');

let cachedPublicKey = null;
let cachedPrivateKey = null;

function ensureKeys() {
  if (cachedPrivateKey && cachedPublicKey) return;

  if (fs.existsSync(PUBLIC_KEY_FILE) && fs.existsSync(PRIVATE_KEY_FILE)) {
    cachedPublicKey = fs.readFileSync(PUBLIC_KEY_FILE, 'utf8');
    cachedPrivateKey = fs.readFileSync(PRIVATE_KEY_FILE, 'utf8');
    return;
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(PUBLIC_KEY_FILE, publicKey, { mode: 0o600 });
  fs.writeFileSync(PRIVATE_KEY_FILE, privateKey, { mode: 0o600 });

  cachedPublicKey = publicKey;
  cachedPrivateKey = privateKey;
}

function getPublicKeyPem() {
  ensureKeys();
  return cachedPublicKey;
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function encrypt(plaintext) {
  ensureKeys();

  const dataKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  const encryptedKey = crypto.publicEncrypt(
    { key: cachedPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    dataKey
  );

  return JSON.stringify({
    alg: 'AES-256-GCM+RSA-OAEP',
    dk: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    ct: ciphertext.toString('base64'),
    tag: authTag.toString('base64')
  });
}

function decrypt(serialized) {
  ensureKeys();

  const payload = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  if (!payload || !payload.ct) throw new Error('Invalid encrypted payload.');

  let dataKey;
  try {
    dataKey = crypto.privateDecrypt(
      { key: cachedPrivateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      Buffer.from(payload.dk, 'base64')
    );
  } catch (err) {
    throw new Error('Unable to decrypt data key with private key: ' + err.message);
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ct, 'base64')),
    decipher.final()
  ]);
  return plaintext.toString('utf8');
}

module.exports = { ensureKeys, getPublicKeyPem, encrypt, decrypt, sha256 };