// Populate patients: register accounts, upload medical images, create records.
// Uses admin token for file upload + record creation, patient token registration.
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:4000';
const dataset = require('./dataset.js');
const IMG_DIR = path.join(__dirname, 'generated-images');

const ADMIN = { phone: '+15550000003', password: 'adminpass' };
const PATIENT_PASSWORD = 'patientpass';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_URL + url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function uploadFile(token, patientId, author, filePath) {
  const blob = new Blob([fs.readFileSync(filePath)]);
  const fd = new FormData();
  fd.append('patientId', patientId);
  fd.append('author', author);
  fd.append('file', blob, path.basename(filePath));
  const res = await fetch(API_URL + '/api/files/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function main() {
  console.log('=== Populating patients, images and records ===\n');

  const login = await postJson('/api/auth/login', ADMIN);
  if (!login.data.token) { console.error('Admin login failed:', login.data); return; }
  const token = login.data.token;
  console.log('Admin login OK');

  let patients = 0, images = 0, records = 0, errors = 0;

  for (const p of dataset) {
    // 1. Register patient account
    const reg = await postJson('/api/auth/register', {
      name: p.name,
      age: p.age,
      phone: p.phone,
      password: PATIENT_PASSWORD,
      patientId: p.patientId
    });
    if (reg.status !== 201 && reg.status !== 200) {
      if (!(reg.data && reg.data.error && reg.data.error.includes('already registered'))) {
        console.log(`  ✗ register ${p.patientId}: ${reg.data.error || reg.status}`);
        errors++;
        continue;
      }
    }
    patients++;

    // 2. Upload medical image
    const imgPath = path.join(IMG_DIR, `${p.patientId}.png`);
    if (fs.existsSync(imgPath)) {
      const up = await uploadFile(token, p.patientId, p.doctor, imgPath);
      if (up.status >= 200 && up.status < 300) images++;
      else console.log(`  ! image ${p.patientId}: ${up.data.error || up.status}`);
    } else {
      console.log(`  ! missing image ${p.patientId}`);
    }

    // 3. Create record
    const rec = await postJson('/api/records', {
      patientId: p.patientId,
      author: p.doctor,
      data: {
        diagnosis: p.diagnosis,
        notes: p.news,
        department: p.department,
        physician: p.doctor
      }
    }, token);
    if (rec.status >= 200 && rec.status < 300) records++;
    else { console.log(`  ✗ record ${p.patientId}: ${rec.data.error || rec.status}`); errors++; }

    if (patients % 10 === 0) console.log(`  ... ${patients} patients processed`);
    await sleep(20);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Patients registered: ${patients}`);
  console.log(`Images uploaded: ${images}`);
  console.log(`Records created: ${records}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nPatient login password: ${PATIENT_PASSWORD}`);
}

main().catch(e => { console.error(e); process.exit(1); });
