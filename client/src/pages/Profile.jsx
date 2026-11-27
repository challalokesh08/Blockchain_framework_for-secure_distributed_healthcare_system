import { useEffect, useState } from 'react';
import api from '../api.js';

function Row({ label, value }) {
  return (
    <div className="consent-row">
      <strong>{label}</strong>
      <span>{value || 'Not assigned'}</span>
    </div>
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/profile')
      .then(r => setProfile(r.data.profile))
      .catch(() => setError('Could not load your profile.'));
  }, []);

  if (error) return <section className="section"><div className="container"><p className="form-message error">{error}</p></div></section>;
  if (!profile) return <section className="section"><div className="container"><p>Loading profile…</p></div></section>;

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Account</span>
          <h2>My Profile</h2>
          <p>Your registered details and assigned care team.</p>
        </div>
        <div className="consent-panel">
          <h4>Personal details</h4>
          <Row label="Name" value={profile.name} />
          <Row label="Role" value={profile.role} />
          <Row label="Patient ID" value={profile.patientId} />
          <Row label="Age" value={profile.age} />
          <Row label="Phone" value={profile.phone} />
        </div>
        <div className="consent-panel" style={{ marginTop: '1.5rem' }}>
          <h4>Care assignment</h4>
          <Row label="Department" value={profile.department} />
          <Row label="Assigned doctor" value={profile.assignedDoctor} />
          {profile.organization ? <Row label="Organization" value={profile.organization} /> : null}
        </div>
      </div>
    </section>
  );
}

export default Profile;
