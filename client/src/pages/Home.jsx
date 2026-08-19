import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    axios.get('/api/status')
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
            <p>HealthLedger supports doctors, hospital staff, and patients with trusted data access, encrypted medical workflows, and audit-ready infrastructure.</p>
            <div className="hero-actions">
              <Link className="button primary" to="/features">Discover Features</Link>
              <Link className="button secondary" to="/login">Sign In</Link>
            </div>
          </div>
          <div className="hero-panel">
            <div className="status-card">
              <h3>Live ledger status</h3>
              {status ? (
                <ul>
                  <li>Network status: <strong>{status.status}</strong></li>
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
              <p>Control access policies, approve contracts, and maintain compliance with a polished enterprise-grade dashboard.</p>
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
