import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext.jsx';

export default function UploadForm() {
  const { user } = useContext(AuthContext);
  const [patientId, setPatientId] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleFile = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Uploading...');
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('patientId', patientId);
      fd.append('author', user?.name || 'Staff');
      fd.append('file', file);
      const res = await axios.post('/api/files/upload', fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setStatus('Upload successful — patient notified.');
    } catch (err) {
      setStatus(err.response?.data?.error || 'Upload failed');
    }
  };

  return (
    <div className="upload-card">
      <h3>Upload report</h3>
      <form onSubmit={handleSubmit} className="upload-form">
        <label>Patient ID
          <input value={patientId} onChange={(e) => setPatientId(e.target.value)} required placeholder="P-1001" />
        </label>
        <label>File
          <input type="file" onChange={handleFile} required />
        </label>
        <div className="upload-actions">
          <button className="button primary" type="submit">Upload</button>
        </div>
      </form>
      {status && <p className="form-message">{status}</p>}
    </div>
  );
}
