import { useContext, useEffect, useState, useCallback } from 'react';
import api from '../api.js';
import { AuthContext } from '../AuthContext.jsx';

const STAFF_ROLES = ['Doctor', 'Nurse', 'Admin', 'Hospital', 'Laboratory', 'Insurance'];
const PROVIDER_TYPES = ['Doctor', 'Hospital', 'Laboratory', 'Insurance'];

function Records() {
  const { user } = useContext(AuthContext);
  const isStaff = STAFF_ROLES.includes(user?.role);

  const [patients, setPatients] = useState([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [accessMessage, setAccessMessage] = useState('');
  const [consents, setConsents] = useState([]);
  const [consentForm, setConsentForm] = useState({ providerName: '', providerType: 'Doctor', purpose: 'Healthcare data access' });
  const [consentMessage, setConsentMessage] = useState('');
  const [form, setForm] = useState({ patientId: '', author: '', diagnosis: '', notes: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isStaff) {
      api.get('/api/patients').then(r => setPatients(r.data.patients || [])).catch(() => {});
    } else if (user?.patientId) {
      loadConsents(user.patientId);
    }
  }, [isStaff, user]);

  const loadConsents = (pid) => {
    api.get('/api/consent', { params: { patientId: pid } })
      .then(r => setConsents(r.data.consents || []))
      .catch(() => setConsents([]));
  };

  const loadPatientData = useCallback((pid) => {
    setSelectedPatientId(pid);
    setAccessMessage('');
    const params = { patientId: pid };
    api.get('/api/records', { params })
      .then(r => setRecords((r.data.records || []).filter(rec => rec.data?.diagnosis)))
      .catch(err => {
        setRecords([]);
        setFiles([]);
        setAccessMessage(err.response?.data?.error || 'Unable to load records.');
      });
    api.get('/api/files', { params })
      .then(r => setFiles(r.data.files || []))
      .catch(() => {});
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

  const grantConsent = async (event) => {
    event.preventDefault();
    setConsentMessage('');
    try {
      await api.post('/api/consent', consentForm);
      setConsentMessage('Consent granted. The provider can now access your records.');
      setConsentForm({ providerName: '', providerType: 'Doctor', purpose: 'Healthcare data access' });
      loadConsents(user.patientId);
    } catch (err) {
      setConsentMessage(err.response?.data?.error || 'Unable to grant consent.');
    }
  };

  const revokeConsent = async (c) => {
    setConsentMessage('');
    try {
      await api.delete('/api/consent', { data: { providerName: c.providerName, providerType: c.providerType } });
      setConsentMessage(`Consent for ${c.providerName} revoked.`);
      loadConsents(user.patientId);
    } catch (err) {
      setConsentMessage(err.response?.data?.error || 'Unable to revoke consent.');
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
              ? 'Access is patient-controlled. You can only view records for patients who have granted you consent.'
              : 'Review your protected medical history and control who may access it via consent management.'
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
              {accessMessage && <p className="consent-warning">{accessMessage}</p>}
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
            <>
              <div className="patient-note">
                <p>You can view your own medical history below. Contact your healthcare provider for record updates.</p>
              </div>
              <div className="consent-panel" style={{ marginTop: '1.5rem' }}>
                <h4>Consent management</h4>
                <p>Grant or revoke access to your records. Providers without active consent are blocked by the smart contract.</p>
                <form className="record-form" onSubmit={grantConsent}>
                  <label>
                    Provider
                    <input value={consentForm.providerName} onChange={e => setConsentForm({ ...consentForm, providerName: e.target.value })} placeholder="e.g. Metropolis Diagnostics Lab" required />
                  </label>
                  <label>
                    Provider type
                    <select value={consentForm.providerType} onChange={e => setConsentForm({ ...consentForm, providerType: e.target.value })}>
                      {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label>
                    Purpose
                    <input value={consentForm.purpose} onChange={e => setConsentForm({ ...consentForm, purpose: e.target.value })} required />
                  </label>
                  <button type="submit" className="button primary">Grant consent</button>
                </form>
                {consentMessage && <p className="form-message">{consentMessage}</p>}
                <div style={{ marginTop: '1rem' }}>
                  {consents.length === 0 ? <p>No consents yet.</p> : (
                    consents.map(c => (
                      <div key={c.consentId} className="consent-row">
                        <div>
                          <strong>{c.providerName}</strong> ({c.providerType}) — <span>{c.status}</span>
                          <p className="consent-purpose">{c.purpose}</p>
                        </div>
                        {c.status === 'ACTIVE' && (
                          <button className="button secondary" onClick={() => revokeConsent(c)}>Revoke</button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="history-panel">
          <div className="section-heading">
            <span className="eyebrow">Audit history</span>
            <h3>{selectedPatient ? `${selectedPatient.name} (${selectedPatient.patientId})` : 'Your'} record history</h3>
            <p>Review decrypted records pulled from the secure blockchain ledger.</p>
          </div>
          {!isStaff && records.length === 0 && accessMessage ? (
            <p className="consent-warning">{accessMessage}</p>
          ) : records.length === 0 ? (
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
                <p className="history-card-hash">Data Hash: {record.dataHash?.substring(0, 32)}… | Sealed by {record.validator}</p>
              </article>
            ))
          )}
          {!accessMessage && (
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
          )}
        </div>
      </div>
    </section>
  );
}

export default Records;