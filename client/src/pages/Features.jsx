function Features() {
  const features = [
    { title: 'Asymmetric (hybrid) encryption', description: 'Records are encrypted with AES-256-GCM and wrapped with RSA-2048 public keys before off-chain storage.' },
    { title: 'Proof-of-Authority consensus', description: 'Blocks are sealed by a rotating set of trusted validators — no energy-intensive mining.' },
    { title: 'Off-chain data, on-chain proof', description: 'Only hashes and metadata live on the ledger; full encrypted records stay off-chain for scale.' },
    { title: 'Patient-controlled consent', description: 'Smart contracts enforce consent — providers can only read records the patient authorizes.' },
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
