import axios from 'axios';

// ========================================
// API BASE URL — change this for deployment
// ========================================
// Local (same WiFi):    http://YOUR_LAPTOP_IP:4000/api
// ngrok tunnel:         https://YOUR_NGROK_URL/api
// Render cloud:         https://your-app.onrender.com/api
// Emulator:             http://10.0.2.2:4000/api
// ========================================
export const API_BASE = 'http://172.29.134.223:4000/api';

export async function fetchStatus() {
  const res = await axios.get(`${API_BASE}/status`);
  return res.data;
}

export async function login(phone, password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { phone, password });
  return res.data;
}

export async function register(details) {
  const res = await axios.post(`${API_BASE}/auth/register`, details);
  return res.data;
}

export async function fetchRecords(token, patientId) {
  const res = await axios.get(`${API_BASE}/records`, {
    params: patientId ? { patientId } : {},
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function fetchFiles(token, patientId) {
  const res = await axios.get(`${API_BASE}/files`, {
    params: patientId ? { patientId } : {},
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function uploadFile(token, fileUri, filename, patientId, author) {
  const form = new FormData();
  form.append('patientId', patientId);
  form.append('author', author);
  form.append('file', { uri: fileUri, name: filename, type: 'application/octet-stream' });

  const res = await axios.post(`${API_BASE}/files/upload`, form, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}
