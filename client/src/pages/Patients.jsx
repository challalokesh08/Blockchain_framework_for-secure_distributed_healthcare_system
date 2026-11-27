import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api.js';
import { AuthContext } from '../AuthContext.jsx';

export default function Patients() {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('Request to review medical records');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const prevStatuses = useRef({});
  const selectedRef = useRef('');

  const loadPatients = useCallback(() => {
    api.get('/api/patients')
      .then(r => setPatients(r.data.patients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadRequests = useCallback(() => {
    api.get('/api/access-request')
      .then(r => {
        const list = r.data.requests || [];
        const statuses = {};
        list.forEach(x => { statuses[x.id] = x.status; });
        const pid = selectedRef.current;
        const approvedNow = !!pid && list.some(x =>
          x.patientId === pid && prevStatuses.current[x.id] === 'PENDING' && statuses[x.id] === 'APPROVED'
        );
        prevStatuses.current = statuses;
        setAccessRequests(list);
        if (approvedNow) loadDetail(pid);
      })
      .catch(() => {});
  }, []); // loadDetail is reached through a ref below

  const loadDetailRef = useRef(null);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  const loadDetail = useCallback(async (pid) => {
    if (!pid) return;
    setDetailLoading(true); setAccessError(''); setRecords([]); setFiles([]);
    try {
      const r = await api.get('/api/records', { params: { patientId: pid } });
      setRecords(r.data.records || []);
    } catch (err) {
      if (err.response?.status === 403) setAccessError(err.response.data?.error || 'Patient consent required.');
      else setMessage('Unable to load records.');
    }
    try {
      const f = await api.get('/api/files', { params: { patientId: pid } });
      setFiles(f.data.files || []);
    } catch (err) {
      if (err.response?.status === 403) setAccessError(err.response.data?.error || 'Patient consent required for files.');
    }
    setDetailLoading(false);
  }, []);
  loadDetailRef.current = loadDetail;

  useEffect(() => {
    loadPatients();
    const t1 = setInterval(loadPatients, 2000);
    const t2 = setInterval(loadRequests, 2000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [loadPatients, loadRequests]);

  const select = (p) => {
    setSelectedId(p.patientId);
    selectedRef.current = p.patientId;
    setMessage('');
    loadDetail(p.patientId);
    loadRequests();
  };

  const requestAccess = async () => {
    setConfirmOpen(false);
    if (!selectedId) return;
    setBusy(true); setMessage('');
    try {
      const res = await api.post('/api/access-request', {
        patientId: selectedId,
        reason: reason || 'Request to review medical records'
      });
      setMessage(res.data.message || 'Access request sent.');
      loadRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to send the request.');
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id, approved) => {
    setBusy(true); setMessage('');
    try {
      const res = await api.post(`/api/access-request/confirm/${id}`, { approved });
      setMessage(res.data.message || `Request ${approved ? 'approved' : 'rejected'}.`);
      loadRequests();
      if (approved && selectedRef.current) loadDetail(selectedRef.current);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to update the request.');
    } finally {
      setBusy(false);
    }
  };

  const download = async (f) => {
    try {
      const res = await api.get(`/api/files/${encodeURIComponent(f.filename)}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: f.mimetype || 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url; a.download = f.originalname || f.filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('Unable to download this file.');
    }
  };

  const view = async (f) => {
    try {
      const res = await api.get(`/api/files/link/${encodeURIComponent(f.filename)}`);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to open this file.');
    }
  };

  const mine = patients.filter(p => p.assignedToYou);
  const others = patients.filter(p => !p.assignedToYou &&
    `${p.patientId} ${p.name}`.toLowerCase().includes(search.toLowerCase()));
  const selected = patients.find(p => p.patientId === selectedId);
  const selectedRequests = accessRequests.filter(r => r.patientId === selectedId);
  const pending = accessRequests.filter(r => r.status === 'PENDING');

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Care team</span>
          <h2>Patients</h2>
          <p>Your assigned patients open directly. For everyone else, request access — the patient and administrator must approve.</p>
        </div>

        {message && <p className="form-message">{message}</p>}
        {loading ? <p>Loading patients…</p> : (
          <div className="records-grid">
            <div>
              <div className="consent-panel">
                <h4>My patients ({mine.length})</h4>
                {mine.length === 0 ? <p className="consent-purpose">No patients are assigned to you.</p> : mine.map(p => (
                  <div key={p.patientId} className="consent-row">
                    <div>
                      <strong>{p.name}</strong> · <span className="patient-row-id">{p.patientId}</span>
                      <p className="consent-purpose">{p.department || '—'} · {p.doctor || '—'}</p>
                      {p.diagnosis ? <p className="consent-purpose">Condition: {p.diagnosis}</p> : null}
                    </div>
                    <button type="button" className="button primary" onClick={() => select(p)}>View records</button>
                  </div>
                ))}
              </div>

              <div className="consent-panel" style={{ marginTop: '1rem' }}>
                <h4>Other patients</h4>
                <input
                  className="search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or patient ID..."
                />
                <div className="patient-list" style={{ marginTop: '0.75rem' }}>
                  {others.length === 0 ? <p className="consent-purpose">No patients found.</p> : others.map(p => (
                    <button key={p.patientId} type="button"
                      className={`patient-row ${p.patientId === selectedId ? 'active' : ''}`}
                      onClick={() => select(p)}>
                      <span className="patient-row-id">{p.patientId}</span>
                      <span className="patient-row-name">{p.name}</span>
                      <span className="patient-row-phone">Request access required</span>
                    </button>
                  ))}
                </div>
              </div>

              {user?.role === 'Admin' && (
                <div className="consent-panel" style={{ marginTop: '1rem' }}>
                  <h4>Pending access requests — approval</h4>
                  {pending.length === 0 ? <p className="consent-purpose">No pending requests.</p> : pending.map(r => (
                    <div key={r.id} className="consent-row">
                      <div>
                        <strong>{r.patientId}</strong> — {r.requester} ({r.role})
                        <p className="consent-purpose">{r.reason}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="button primary" disabled={busy} onClick={() => decide(r.id, true)}>Approve</button>
                        <button type="button" className="button secondary" disabled={busy} onClick={() => decide(r.id, false)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="record-panel patients-detail-panel">
              {!selected ? (
                <p className="consent-purpose">Select a patient to view their records.</p>
              ) : (
                <>
                  <div className="section-heading">
                    <span className="eyebrow">{selected.assignedToYou ? 'Assigned patient' : 'Access restricted'}</span>
                    <h3>{selected.name}</h3>
                    <p>{selected.patientId} · {selected.department || '—'} · {selected.doctor || '—'}</p>
                  </div>
                  {detailLoading ? <p>Loading…</p> : (
                    <>
                      {accessError ? (
                        <div className="consent-panel">
                          <h4>Permission required</h4>
                          <p className="consent-warning">{accessError}</p>
                          <p className="consent-purpose">The patient and administrator are both notified; you'll see records automatically once approved.</p>
                          <button type="button" className="button primary" disabled={busy} onClick={() => setConfirmOpen(true)}>
                            Request access
                          </button>
                          {selectedRequests.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                              {selectedRequests.map(r => (
                                <p key={r.id} className="consent-purpose">
                                  <span className={`status-pill ${r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'revoked' : 'warning'}`}>{r.status}</span>
                                  {' '}{r.id} · {r.reason}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="consent-panel">
                            <h4>Records ({records.length})</h4>
                            {records.length === 0 ? <p className="consent-purpose">No records yet.</p> : records.map((r, i) => (
                              <div key={`${r.hash}-${i}`} className="consent-row">
                                <div>
                                  <strong>{r.data?.diagnosis || 'Clinical record'}</strong>
                                  {r.data?.department ? <p className="consent-purpose">Department: {r.data.department}</p> : null}
                                  {r.data?.physician ? <p className="consent-purpose">Physician: {r.data.physician}</p> : null}
                                  {r.data?.notes ? <p className="consent-purpose">{r.data.notes}</p> : null}
                                  <p className="consent-purpose">Block: {String(r.hash || '').substring(0, 16)}…</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="consent-panel" style={{ marginTop: '1rem' }}>
                            <h4>Files ({files.length})</h4>
                            {files.length === 0 ? <p className="consent-purpose">No files yet.</p> : files.map(f => (
                              <div key={f.filename} className="consent-row">
                                <div>
                                  <strong>{f.originalname}</strong>
                                  <p className="consent-purpose">{f.mimetype} · {(f.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button type="button" className="button primary" onClick={() => view(f)}>View</button>
                                  <button type="button" className="button secondary" onClick={() => download(f)}>Download</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Request access?</h3>
            <p className="consent-purpose">
              Ask the patient and administrator for permission to open <strong>{selected?.name}</strong>'s records and files.
            </p>
            <label>
              Reason (optional)
              <textarea rows="2" value={reason} onChange={e => setReason(e.target.value)} />
            </label>
            <div className="modal-actions">
              <button type="button" className="button secondary" onClick={() => setConfirmOpen(false)}>No, cancel</button>
              <button type="button" className="button primary" disabled={busy} onClick={requestAccess}>Yes, request access</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
