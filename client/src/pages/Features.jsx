function Features() {
  const features = [
    { title: 'Encrypted patient data', description: 'Records are encrypted before they are stored, ensuring privacy and compliance readiness.' },
    { title: 'Proof of integrity', description: 'Every block is cryptographically linked to the previous block, making tampering transparent.' },
    { title: 'Audit-ready ledger', description: 'View block history and transactions with a data-driven medical audit trail.' },
    { title: 'Role-aware access', description: 'Designed for doctor, nurse, and administrator workflows in a healthcare environment.' },
    { title: 'Modern UX', description: 'Professional dashboard design with clear metrics, forms, and record explorer pages.' }
  ];

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Platform features</span>
          <h2>Built for secure healthcare collaboration</h2>
          <p>HealthLedger delivers a polished interface for managing encrypted patient records across a distributed healthcare network.</p>
        </div>
        <div className="feature-grid">
          {features.map(feature => (
            <article key={feature.title} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
