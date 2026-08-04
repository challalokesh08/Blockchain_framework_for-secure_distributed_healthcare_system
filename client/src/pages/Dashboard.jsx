import { useContext } from 'react';
import { AuthContext } from '../AuthContext.jsx';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const role = user?.role;

  const cards = {
    Doctor: [
      { title: 'Clinical record management', description: 'View encrypted patient records, update diagnoses, and prepare care plans.' },
      { title: 'Live ledger integrity', description: 'Monitor the tamper-proof ledger and validate block history for audit readiness.' },
      { title: 'Patient engagement', description: 'Collaborate with staff and review patient record updates securely.' }
    ],
    Nurse: [
      { title: 'Care coordination', description: 'Access patient treatment notes and support clinician workflows with secure record access.' },
      { title: 'Clinical tasks', description: 'Track daily patient status and update nursing notes under a protected audit trail.' },
      { title: 'Secure shift handoff', description: 'Keep patient data consistent across handoff and care transitions.' }
    ],
    Admin: [
      { title: 'Governance & compliance', description: 'Manage contracts, review audit logs, and configure access workflows.' },
      { title: 'Network validation', description: 'Mine ledger blocks and maintain a validated healthcare blockchain environment.' },
      { title: 'Enterprise controls', description: 'Oversee staff roles, patient privacy, and secure distributed data access.' }
    ],
    Patient: [
      { title: 'Personal health view', description: 'Review your protected medical history and encrypted record metadata.' },
      { title: 'Data privacy first', description: 'Your health data stays encrypted and accessible only through secure authentication.' },
      { title: 'Trusted access', description: 'See the same audit-ready ledger technology your care team uses for security.' }
    ]
  };

  return (
    <section className="section section-alt">
      <div className="container dashboard-grid">
        <div className="dashboard-panel">
          <div className="section-heading">
            <span className="eyebrow">Dashboard</span>
            <h2>{user ? `Welcome back, ${user.name}` : 'Healthcare blockchain dashboard'}</h2>
            <p>HealthLedger adapts to your role — whether you are providing care, supporting hospital operations, or accessing your personal medical record.</p>
          </div>
          <div className="dashboard-meta">
            <p><strong>Role:</strong> {role}</p>
            {user?.patientId && <p><strong>Patient ID:</strong> {user.patientId}</p>}
          </div>
        </div>
        <div className="dashboard-cards">
          {(cards[role] || []).map(card => (
            <article key={card.title} className="dashboard-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
