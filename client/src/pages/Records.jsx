import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext.jsx';

function Records() {
  const { user } = useContext(AuthContext);
  const [patientId, setPatientId] = useState(user?.role === 'Patient' ? user?.patientId || 'P-1001' : 'P-1001');
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ patientId: '', author: '', diagnosis: '', notes: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = user?.role === 'Patient' ? {} : { patientId };
    axios.get('/api/records', { params })
      .then(response => setRecords(response.data.records))
      .catch(() => setRecords([]));
  }, [patientId, user]);

  const submitRecord = async (event) => {
    event.preventDefault();
    const payload = {
      patientId: form.patientId || patientId,
      author: form.author,
      data: {
        diagnosis: form.diagnosis,
        notes: form.notes
      }
    };

    try {
      const response = await axios.post('/api/records', payload);
      setMessage(response.data.message);
      setForm({ patientId: '', author: '', diagnosis: '', notes: '' });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Submission failed');
    }
  };

  return (
    <section className="section section-alt">
      <div className="container records-grid">
        <div className="record-panel">
          <div className="section-heading">
            <span className="eyebrow">Patient records</span>
            <h2>{user?.role === 'Patient' ? 'Your secure health record' : 'Manage secure healthcare transactions'}</h2>
            <p>{user?.role === 'Patient'
              ? 'Review your protected medical history and audit trail entries stored in the HealthLedger blockchain.'
              : 'Submit encrypted record updates and review decrypted entries for an encrypted patient ledger.'
            }</p>
          </div>
          {['Doctor', 'Nurse', 'Admin'].includes(user?.role) ? (
            <form className="record-form" onSubmit={submitRecord}>
              <label>
                Patient ID
                <input value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} placeholder="e.g. P-1002" />
              </label>
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
          ) : (
            <div className="patient-note">
              <p>You can view your own medical history below. Contact your healthcare provider for record updates.</p>
            </div>
          )}
        </div>

        <div className="history-panel">
          <div className="section-heading">
            <span className="eyebrow">Audit history</span>
            <h3>Patient record history</h3>
            <p>Review decrypted records pulled from the secure blockchain ledger by patient identifier.</p>
          </div>
          <label className="search-label">
            View records for Patient ID
            <input value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="P-1001" />
          </label>
          {records.length === 0 ? (
            <p>No records found for this patient yet.</p>
          ) : (
            records.map((record, index) => (
              <article key={`${record.hash}-${index}`} className="history-card">
                <div className="history-card-meta">
                  <span><strong>{record.author}</strong></span>
                  <span>{new Date(record.timestamp).toLocaleString()}</span>
                </div>
                <p><strong>Diagnosis:</strong> {record.data.diagnosis}</p>
                <p><strong>Notes:</strong> {record.data.notes}</p>
                <p className="history-card-hash">Block Hash: {record.hash}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default Records;
