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
            <h3>Secure design</h3>
            <p>Encrypted patient records and cryptographic validation guard against unauthorized access and tampering.</p>
          </article>
          <article className="about-card">
            <h3>Clinical insights</h3>
            <p>Maintain traceable record history for clinicians, auditors, and administrators with a clean interface.</p>
          </article>
          <article className="about-card">
            <h3>Enterprise-ready</h3>
            <p>The framework is built to integrate with distributed nodes, API services, and healthcare workflow platforms.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default About;
