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
  const [form, setForm] = useState({ patientId: '', author: '', diagnosis: '', notes: '', lab: '' });
  const [reportPhoto, setReportPhoto] = useState(null);
  const [reportPhotoPreview, setReportPhotoPreview] = useState('');
  const [message, setMessage] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', phone: '', password: '' });
  const [addPatientMessage, setAddPatientMessage] = useState('');
  const [emergencyForm, setEmergencyForm] = useState({ reason: '', triageCode: '3' });
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [emergencyMsg, setEmergencyMsg] = useState('');
  const [vitalPacket, setVitalPacket] = useState(null);

  const canAddPatient = isStaff && (user?.role === 'Doctor' || user?.role === 'Admin');

  const loadEmergency = useCallback(() => {
    api.get('/api/emergency')
      .then(r => setEmergencyRequests(r.data.requests || []))
      .catch(() => setEmergencyRequests([]));
  }, []);

  useEffect(() => {
    loadEmergency();
  }, [loadEmergency]);

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
    setVitalPacket(null);
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
    const fd = new FormData();
    fd.append('patientId', targetPid);
    fd.append('author', form.author);
    fd.append('diagnosis', form.diagnosis);
    fd.append('notes', form.notes);
    fd.append('lab', form.lab);
    if (reportPhoto) fd.append('file', reportPhoto);
    try {
      const response = await api.post('/api/records/with-report', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(response.data.message);
      setForm({ patientId: '', author: '', diagnosis: '', notes: '', lab: '' });
      setReportPhoto(null);
      setReportPhotoPreview('');
      if (targetPid) loadPatientData(targetPid);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Submission failed');
    }
  };

  const handleReportPhoto = (e) => {
    const f = e.target.files[0];
    setReportPhoto(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setReportPhotoPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setReportPhotoPreview('');
    }
  };

  const addPatient = async (event) => {
    event.preventDefault();
    setAddPatientMessage('');
    try {
      const response = await api.post('/api/auth/register-patient', newPatient);
      setAddPatientMessage(response.data.message);
      const createdPatientId = response.data.user?.patientId;
      setNewPatient({ name: '', age: '', phone: '', password: '' });
      setShowAddPatient(false);
      setPatientFilter('');
      api.get('/api/patients')
        .then(r => {
          setPatients(r.data.patients || []);
          if (createdPatientId) loadPatientData(createdPatientId);
        })
        .catch(() => {});
    } catch (error) {
      setAddPatientMessage(error.response?.data?.error || 'Unable to add patient.');
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

  const requestEmergency = async (event) => {
    event.preventDefault();
    setEmergencyMsg('');
    try {
      const response = await api.post('/api/emergency/request', {
        patientId: selectedPatientId,
        reason: emergencyForm.reason,
        triageCode: emergencyForm.triageCode
      });
      setEmergencyMsg(response.data.message);
      setEmergencyForm({ reason: '', triageCode: '3' });
      loadEmergency();
    } catch (error) {
      setEmergencyMsg(error.response?.data?.error || 'Unable to raise emergency request.');
    }
  };

  const confirmEmergency = async (id, approved) => {
    setEmergencyMsg('');
    try {
      const response = await api.post(`/api/emergency/confirm/${id}`, { approved });
      setEmergencyMsg(response.data.message);
      loadEmergency();
    } catch (error) {
      setEmergencyMsg(error.response?.data?.error || 'Unable to update the emergency request.');
    }
  };

  const viewVitalPacket = async () => {
    setEmergencyMsg('');
    try {
      const response = await api.get('/api/records', { params: { patientId: selectedPatientId, emergency: '1' } });
      setVitalPacket(response.data.vitals || {});
      setRecords([]);
      setFiles([]);
    } catch (error) {
      setEmergencyMsg(error.response?.data?.error || 'Unable to load the vital packet.');
    }
  };

  const pendingRequest = emergencyRequests.find(r => r.patientId === selectedPatientId && r.status === 'PENDING');
  const activeUnlock = emergencyRequests.find(r =>
    r.patientId === selectedPatientId &&
    r.status === 'APPROVED' &&
    r.unlockExpiresAt &&
    new Date(r.unlockExpiresAt).getTime() > Date.now()
  );

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
              {canAddPatient && (
                <>
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="button secondary" onClick={() => setShowAddPatient(!showAddPatient)}>
                      {showAddPatient ? 'Cancel' : '+ Add new patient'}
                    </button>
                  </div>
                  {showAddPatient && (
                    <form className="record-form" onSubmit={addPatient} style={{ marginTop: '1rem' }}>
                      <h4>Register a new patient</h4>
                      <label>
                        Full name
                        <input value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} required placeholder="e.g. Rama Devi" />
                      </label>
                      <label>
                        Age
                        <input type="number" min="0" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} required placeholder="e.g. 32" />
                      </label>
                      <label>
                        Phone number
                        <input value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} required placeholder="e.g. +9163xxxxxx" />
                      </label>
                      <label>
                        Password (min 6 characters)
                        <input type="text" value={newPatient.password} onChange={e => setNewPatient({ ...newPatient, password: e.target.value })} required placeholder="Login password for the patient" />
                      </label>
                      <button type="submit" className="button primary">Register patient</button>
                      {addPatientMessage && <p className="form-message">{addPatientMessage}</p>}
                    </form>
                  )}
                </>
              )}
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
              {canAddPatient && selectedPatient && (
                <div className="consent-panel" style={{ marginTop: '1.5rem' }}>
                  <h4>Emergency access (break-glass)</h4>
                  {activeUnlock ? (
                    <>
                      <p><span className="status-pill success">ACTIVE UNLOCK</span> expires {new Date(activeUnlock.unlockExpiresAt).toLocaleString()}</p>
                      <p className="consent-purpose">Requested by {activeUnlock.doctor} · approved by {activeUnlock.confirmedBy} · triage {activeUnlock.triageCode}</p>
                      <p className="consent-purpose">Scope is vital information only — full history stays locked. The whole event is logged on the ledger.</p>
                      <button type="button" className="button primary" onClick={viewVitalPacket}>View vital packet</button>
                    </>
                  ) : pendingRequest ? (
                    <p className="consent-purpose">
                      <span className="status-pill warning">PENDING</span> Emergency request {pendingRequest.id} (triage {pendingRequest.triageCode}) is awaiting admin approval. No access until then.
                    </p>
                  ) : (
                    <>
                      <p className="consent-purpose">Patient unable to consent? Request a time-boxed, vital-only emergency unlock. It requires a second approval (admin) and is permanently recorded on the ledger.</p>
                      <form className="record-form" onSubmit={requestEmergency}>
                        <label>
                          Reason
                          <textarea rows="2" value={emergencyForm.reason} onChange={e => setEmergencyForm({ ...emergencyForm, reason: e.target.value })} required placeholder="e.g. Trauma — patient unconscious at ER intake" />
                        </label>
                        <label>
                          Triage code
                          <select value={emergencyForm.triageCode} onChange={e => setEmergencyForm({ ...emergencyForm, triageCode: e.target.value })}>
                            <option value="1">1 — Resuscitation</option>
                            <option value="2">2 — Emergency</option>
                            <option value="3">3 — Urgent</option>
                          </select>
                        </label>
                        <p className="consent-purpose">Only critical cases (triage 1-3) qualify. Non-urgent access requires normal patient consent.</p>
                        <button type="submit" className="button primary">Request emergency unlock</button>
                      </form>
                    </>
                  )}
                  {emergencyMsg && <p className="form-message">{emergencyMsg}</p>}
                </div>
              )}
              {user?.role === 'Admin' && (
                <div className="consent-panel" style={{ marginTop: '1.5rem' }}>
                  <h4>Emergency requests — admin approval</h4>
                  {emergencyRequests.filter(r => r.status === 'PENDING').length === 0
                    ? <p className="consent-purpose">No pending emergency requests.</p>
                    : emergencyRequests.filter(r => r.status === 'PENDING').map(r => (
                      <div key={r.id} className="consent-row">
                        <div>
                          <strong>{r.patientId}</strong> — requested by {r.doctor} (triage {r.triageCode})
                          <p className="consent-purpose">{r.reason}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" className="button primary" onClick={() => confirmEmergency(r.id, true)}>Approve</button>
                          <button type="button" className="button secondary" onClick={() => confirmEmergency(r.id, false)}>Reject</button>
                        </div>
                      </div>
                    ))}
                  {emergencyMsg && <p className="form-message">{emergencyMsg}</p>}
                </div>
              )}
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
                  <label>
                    Lab / department
                    <input value={form.lab} onChange={e => setForm({ ...form, lab: e.target.value })} placeholder="e.g. Metropolis Diagnostics Lab" />
                  </label>
                  <label>
                    Report photo (optional)
                    <input type="file" accept="image/*" onChange={handleReportPhoto} />
                  </label>
                  {reportPhotoPreview && (
                    <div className="report-photo-preview">
                      <img src={reportPhotoPreview} alt="Selected report preview" />
                      <p>Attached: {reportPhoto.name}</p>
                    </div>
                  )}
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
                          <strong>{c.providerName}</strong> ({c.providerType}) — <span className={`status-pill ${c.status === 'ACTIVE' ? 'success' : c.status === 'REVOKED' ? 'revoked' : 'warning'}`}>{c.status}</span>
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
              <div className="consent-panel" style={{ marginTop: '1.5rem' }}>
                <h4>Emergency access events</h4>
                <p>Any time an emergency unlock is requested or granted on your records, it is recorded on the ledger and listed here.</p>
                {emergencyRequests.length === 0 ? (
                  <p className="consent-purpose">No emergency access events.</p>
                ) : (
                  emergencyRequests.map(r => (
                    <div key={r.id} className="consent-row">
                      <div>
                        <strong>{r.id}</strong> — {r.doctor} ({r.triageCode}) — <span className={`status-pill ${r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'revoked' : r.status === 'PENDING' ? 'warning' : 'warning'}`}>{r.status}</span>
                        <p className="consent-purpose">{r.reason}</p>
                        {r.unlockExpiresAt && <p className="consent-purpose">Unlock expires: {new Date(r.unlockExpiresAt).toLocaleString()}</p>}
                      </div>
                    </div>
                  ))
                )}
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
          {vitalPacket && (
            <article className="history-card vital-card">
              <div className="history-card-meta">
                <span><strong>Emergency vital packet</strong></span>
                <span>Scope: VITAL ONLY</span>
              </div>
              <p><strong>Blood type:</strong> {vitalPacket.bloodType}</p>
              <p><strong>Allergies:</strong> {vitalPacket.allergies?.join(', ') || 'None'}</p>
              <p><strong>Medications:</strong> {vitalPacket.medications?.join(', ') || 'None'}</p>
              <p><strong>Chronic conditions:</strong> {vitalPacket.chronicConditions?.join(', ') || 'None'}</p>
              {activeUnlock && (
                <p className="history-card-hash">Unlock {activeUnlock.unlockId} expires {new Date(activeUnlock.unlockExpiresAt).toLocaleString()}. Full history remains locked without patient consent.</p>
              )}
            </article>
          )}
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
                {record.data?.lab && <p><strong>Lab / department:</strong> {record.data.lab}</p>}
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
                    {f.mimetype && f.mimetype.startsWith('image/') && <ReportPhoto filename={f.filename} originalname={f.originalname} />}
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

function ReportPhoto({ filename, originalname }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let objectUrl = null;
    api.get(`/api/files/${encodeURIComponent(filename)}`, { responseType: 'blob' })
      .then(r => {
        objectUrl = window.URL.createObjectURL(new Blob([r.data]));
        setSrc(objectUrl);
      })
      .catch(() => {});
    return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl); };
  }, [filename]);
  if (!src) return <p>Loading preview…</p>;
  return (
    <div className="report-photo-preview">
      <img src={src} alt={originalname} />
    </div>
  );
}