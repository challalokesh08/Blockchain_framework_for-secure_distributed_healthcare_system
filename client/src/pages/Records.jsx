import { useContext, useEffect, useState, useCallback } from 'react';
import api from '../api.js';
import { AuthContext } from '../AuthContext.jsx';

function Records() {
  const { user } = useContext(AuthContext);
  const isStaff = ['Doctor', 'Nurse', 'Admin'].includes(user?.role);

  const [patients, setPatients] = useState([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ patientId: '', author: '', diagnosis: '', notes: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isStaff) {
      api.get('/api/patients').then(r => setPatients(r.data.patients || [])).catch(() => {});
    }
  }, [isStaff]);

  const loadPatientData = useCallback((pid) => {
    setSelectedPatientId(pid);
    const params = { patientId: pid };
    api.get('/api/records', { params })
      .then(r => setRecords((r.data.records || []).filter(rec => rec.data?.diagnosis)))
      .catch(() => setRecords([]));
    api.get('/api/files', { params })
      .then(r => setFiles(r.data.files || []))
      .catch(() => setFiles([]));
  }, []);

  useEffect(() => {
    if (!isStaff && user?.patientId) {
      loadPatientData(user.patientId);
    }
  }, [isStaff, user, loadPatientData]);

  const downloadFile = async (f) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/files/${encodeURIComponent(f.filename)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = f.originalname || f.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Unable to download file. Please check your permissions.');
    }
  };

  const submitRecord = async (event) => {
    event.preventDefault();
    const targetPid = form.patientId || selectedPatientId;
    const payload = { patientId: targetPid, author: form.author, data: { diagnosis: form.diagnosis, notes: form.notes } };
    try {
      const response = await api.post('/api/records', payload);
      setMessage(response.data.message);
      setForm({ patientId: '', author: '', diagnosis: '', notes: '' });
      if (targetPid) loadPatientData(targetPid);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Submission failed');
    }
  };

  const filteredPatients = patients.filter(p =>
    `${p.patientId} ${p.name} ${p.phone}`.toLowerCase().includes(patientFilter.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.patientId === selectedPatientId);

  return (
    <section className="section section-alt">
      <div className="container records-grid">
        <div className="record-panel">
          <div className="section-heading">
            <span className="eyebrow">Patient records</span>
            <h2>{isStaff ? 'All patient records' : 'Your secure health record'}</h2>
            <p>{isStaff
              ? 'Browse all patients below or search by ID. Click a patient to view their records and files.'
              : 'Review your protected medical history and audit trail entries stored in the HealthLedger blockchain.'
            }</p>
          </div>
          {isStaff ? (
            <>
              <label className="search-label">
                Search patients
                <input value={patientFilter} onChange={e => setPatientFilter(e.target.value)} placeholder="Search by name, ID or phone..." />
              </label>
              <div className="patient-list">
                {filteredPatients.length === 0 && <p>No patients found.</p>}
                {filteredPatients.map(p => (
                  <button
                    key={p.patientId}
                    type="button"
                    className={`patient-row ${p.patientId === selectedPatientId ? 'active' : ''}`}
                    onClick={() => loadPatientData(p.patientId)}
                  >
                    <span className="patient-row-id">{p.patientId}</span>
                    <span className="patient-row-name">{p.name}</span>
                    <span className="patient-row-phone">{p.phone}</span>
                  </button>
                ))}
              </div>
              {selectedPatient && (
                <form className="record-form" onSubmit={submitRecord} style={{ marginTop: '1.5rem' }}>
                  <h4>Add record for {selectedPatient.name} ({selectedPatient.patientId})</h4>
                  <label>
                    Author
                    <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Dr. Name or Nurse" />
                  </label>
                  <label>
                    Diagnosis
                    <textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} rows="3" />
                  </label>
                  <label>
                    Notes
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="4" />
                  </label>
                  <button type="submit" className="button primary">Submit record</button>
                  {message && <p className="form-message">{message}</p>}
                </form>
              )}
            </>
          ) : (
            <div className="patient-note">
              <p>You can view your own medical history below. Contact your healthcare provider for record updates.</p>
            </div>
          )}
        </div>

        <div className="history-panel">
          <div className="section-heading">
            <span className="eyebrow">Audit history</span>
            <h3>{selectedPatient ? `${selectedPatient.name} (${selectedPatient.patientId})` : 'Your'} record history</h3>
            <p>Review decrypted records pulled from the secure blockchain ledger.</p>
          </div>
          {records.length === 0 ? (
            <p>{isStaff && !selectedPatientId ? 'Select a patient to view their records.' : 'No records found for this patient yet.'}</p>
          ) : (
            records.map((record, index) => (
              <article key={`${record.hash}-${index}`} className="history-card">
                <div className="history-card-meta">
                  <span><strong>{record.author}</strong></span>
                  <span>{new Date(record.timestamp).toLocaleString()}</span>
                </div>
                <p><strong>Department:</strong> {record.data?.department || 'General'}</p>
                <p><strong>Diagnosis:</strong> {record.data?.diagnosis || 'N/A'}</p>
                <p><strong>Notes:</strong> {record.data?.notes || 'N/A'}</p>
                {record.data?.physician && <p><strong>Physician:</strong> {record.data.physician}</p>}
                <p className="history-card-hash">Block Hash: {record.hash}</p>
              </article>
            ))
          )}
          <div style={{ marginTop: '1.5rem' }}>
            <h4>Files</h4>
            {files.length === 0 ? <p>No files uploaded for this patient.</p> : (
              files.map((f) => (
                <article key={f.filename} className="history-card">
                  <div className="history-card-meta">
                    <span><strong>{f.originalname}</strong></span>
                    <span>{new Date(f.timestamp).toLocaleString()}</span>
                  </div>
                  <p>Size: {f.size} bytes | Type: {f.mimetype}</p>
                  <p><button type="button" className="button secondary" onClick={() => downloadFile(f)}>Download</button></p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Records;
