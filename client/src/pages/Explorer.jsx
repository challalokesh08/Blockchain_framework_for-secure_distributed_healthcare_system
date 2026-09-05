import { useEffect, useState } from 'react';
import api from '../api.js';

function Explorer() {
  const [ledger, setLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/api/ledger')
      .then(response => setLedger(response.data))
      .catch(() => setLedger([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
<div className="section-heading">
            <span className="eyebrow">Blockchain explorer</span>
            <h2>Inspect the healthcare ledger</h2>
            <p>Explore Proof-of-Authority sealed blocks, transaction data-hashes, and encrypted off-chain record references for transparency and audit compliance.</p>
          </div>
        {isLoading ? (
          <p>Loading ledger data…</p>
        ) : (
          <div className="ledger-grid">
            {ledger.map((block, index) => (
              <article key={block.hash} className="ledger-card">
                <div className="ledger-card-header">
                  <h3>Block {index}</h3>
                  <span>{new Date(block.timestamp).toLocaleString()}</span>
                </div>
                <div className="ledger-card-body">
                  <p><strong>Hash:</strong> {block.hash}</p>
                  <p><strong>Previous:</strong> {block.previousHash}</p>
                  <p><strong>Sealed by:</strong> {block.validator}</p>
                  <p><strong>Signature:</strong> {block.signature?.substring(0, 24)}…</p>
                  <p><strong>Transactions:</strong> {block.transactions.length}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Explorer;
