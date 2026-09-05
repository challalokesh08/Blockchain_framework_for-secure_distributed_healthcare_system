function About() {
  return (
    <section className="section">
      <div className="container about-grid">
        <div>
          <span className="eyebrow">About HealthLedger</span>
          <h2>Professional healthcare blockchain solution</h2>
          <p>HealthLedger is designed to protect patient privacy and support clinical audit workflows with a secure distributed ledger, modern interface, and network-ready architecture.</p>
        </div>
        <div className="about-cards">
          <article className="about-card">
            <h3>Asymmetric security</h3>
            <p>Patient records are encrypted with hybrid RSA/AES cryptography and hashed onto a Proof-of-Authority ledger.</p>
          </article>
          <article className="about-card">
            <h3>Patient-controlled access</h3>
            <p>Consent smart contracts decide who may read a patient's records — revoking consent revokes access instantly.</p>
          </article>
          <article className="about-card">
            <h3>Stakeholder-ready</h3>
            <p>Built for doctors, hospitals, laboratories, insurers, and patients with a role-aware, audit-ready workflow.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default About;
