import axios from 'axios';

const API_BASE = 'http://10.0.2.2:4000/api';

export async function fetchStatus() {
  const res = await axios.get(`${API_BASE}/status`);
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
