import { useContext, useEffect, useState } from 'react';
import api from '../api.js';
import { AuthContext } from '../AuthContext.jsx';

function Contracts() {
  const { user } = useContext(AuthContext);
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState({ patientId: 'P-1001', authorizedProvider: 'Dr. Sharma', purpose: 'Data access for care coordination' });
  const [message, setMessage] = useState('');

  const loadContracts = async () => {
    const response = await api.get('/api/contracts');
    setContracts(response.data.contracts);
  };

  useEffect(() => {
    loadContracts().catch(() => setContracts([]));
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      await api.post('/api/contracts', {
        contractType: 'DataAccessAgreement',
        patientId: form.patientId,
        authorizedProvider: form.authorizedProvider,
        purpose: form.purpose
      });
      setMessage('Contract created successfully.');
      setForm({ patientId: '', authorizedProvider: '', purpose: '' });
      loadContracts();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to create contract.');
    }
  };

  const handleAction = async (contractId, action) => {
    setMessage('');
    try {
      await api.post(`/api/contracts/${contractId}/execute`, { action, comment: `${action} requested by ${user?.name}` });
      setMessage('Contract action applied successfully.');
      loadContracts();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to process contract action.');
    }
  };

  return (
    <section className="section section-alt">
      <div className="container contracts-grid">
        <div className="contract-panel">
          <div className="section-heading">
            <span className="eyebrow">Smart contracts</span>
            <h2>Healthcare workflow contract engine</h2>
            <p>Create, approve, and finalize smart healthcare access agreements with role-aware contract actions.</p>
          </div>
          {user?.role === 'Admin' ? (
            <form className="contract-form" onSubmit={handleCreate}>
              <label>
                Patient ID
                <input value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} placeholder="P-1001" required />
              </label>
              <label>
                Authorized Provider
                <input value={form.authorizedProvider} onChange={(e) => setForm({ ...form, authorizedProvider: e.target.value })} placeholder="Dr. Sharma" required />
              </label>
              <label>
                Purpose
                <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows="3" required />
              </label>
              <button type="submit" className="button primary">Deploy contract</button>
            </form>
          ) : (
            <p className="section-note">Only administrators may create new contracts. Doctors and nurses may approve and execute contract actions.</p>
          )}
          {message && <p className="form-message">{message}</p>}
        </div>

        <div className="contract-list-panel">
          <div className="section-heading">
            <span className="eyebrow">Contract registry</span>
            <h3>Current smart contracts</h3>
            <p>Review the contract state and approval history for healthcare data access agreements.</p>
          </div>
          {contracts.length === 0 ? (
            <p>No active contracts yet.</p>
          ) : (
            contracts.map((contract) => (
              <article key={contract.contractId} className="contract-card">
                <div className="contract-heading">
                  <h4>{contract.contractType}</h4>
                  <span>{contract.status}</span>
                </div>
                <p><strong>Contract ID:</strong> {contract.contractId}</p>
                <p><strong>Patient:</strong> {contract.details?.patientId}</p>
                <p><strong>Authorized provider:</strong> {contract.details?.authorizedProvider}</p>
                <p><strong>Purpose:</strong> {contract.details?.purpose}</p>
                <div className="contract-actions">
                  {(contract.status === 'PENDING' && ['Doctor', 'Admin'].includes(user?.role)) && (
                    <button className="button secondary" onClick={() => handleAction(contract.contractId, 'approveAccess')}>Approve Access</button>
                  )}
                  {(contract.status !== 'COMPLETED' && user?.role === 'Admin') && (
                    <button className="button secondary" onClick={() => handleAction(contract.contractId, 'finalize')}>Finalize Contract</button>
                  )}
                </div>
                {contract.history?.length > 0 && (
                  <div className="contract-history">
                    <h5>History</h5>
                    {contract.history.map((event, index) => (
                      <p key={`${contract.contractId}-${index}`} className="contract-history-item">
                        {event.timestamp} — {event.action} by {event.executor?.name || 'System'} ({event.executor?.role || 'System'})
                      </p>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default Contracts;
