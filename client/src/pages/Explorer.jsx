import { useEffect, useState } from 'react';
import axios from 'axios';

function Explorer() {
  const [ledger, setLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/ledger')
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
          <p>Explore the chain blocks, transaction summaries, and encrypted patient record entries for transparency and audit compliance.</p>
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
