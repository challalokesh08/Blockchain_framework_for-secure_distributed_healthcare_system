import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { AuthContext } from '../AuthContext.jsx';

function Home() {
  const { isAuthenticated } = useContext(AuthContext);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/api/status')
      .then(response => setStatus(response.data))
      .catch(() => setStatus(null));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Healthcare blockchain</span>
            <h2>Secure patient records on a tamper-proof distributed ledger</h2>
            <p>HealthLedger connects doctors, hospitals, laboratories, insurers, and patients with encrypted records, patient-controlled consent, and a Proof-of-Authority blockchain.</p>
            <div className="hero-actions">
              <Link className="button primary" to="/features">Discover Features</Link>
              {!isAuthenticated && <Link className="button secondary" to="/login">Sign In</Link>}
              {isAuthenticated && <Link className="button secondary" to="/records">My Records</Link>}
            </div>
          </div>
          <div className="hero-panel">
            <div className="status-card">
              <h3>Live ledger status</h3>
              {status ? (
                <ul>
                  <li>Network status: <strong>{status.status}</strong></li>
                  <li>Consensus: <strong>{status.consensus}</strong></li>
                  <li>Validators: <strong>{status.validators}</strong></li>
                  <li>Blocks: <strong>{status.blocks}</strong></li>
                  <li>Pending items: <strong>{status.pendingTransactions}</strong></li>
                  <li>Ledger valid: <strong>{status.valid ? 'Yes' : 'No'}</strong></li>
                </ul>
              ) : (
                <p>Connecting to API...</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-slate">
        <div className="container">
          <div className="feature-highlight-grid">
            <article className="feature-highlight-card">
              <h3>Doctors & clinicians</h3>
              <p>Securely document diagnoses, manage treatment notes, and track care progression with full blockchain proof.</p>
            </article>
            <article className="feature-highlight-card">
              <h3>Hospital staff & administrators</h3>
              <p>Control access policies, approve contracts, and maintain compliance with an enterprise-grade consent-aware dashboard.</p>
            </article>
            <article className="feature-highlight-card">
              <h3>Laboratories & insurers</h3>
              <p>Share test results and verify claims on-chain — access is unlocked only when the patient grants consent.</p>
            </article>
            <article className="feature-highlight-card">
              <h3>Connected patients</h3>
              <p>Access your own encrypted medical history, review audit trails, and trust that your data remains protected.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
