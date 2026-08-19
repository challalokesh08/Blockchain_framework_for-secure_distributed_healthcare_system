import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="section section-alt">
      <div className="container notfound-card">
        <h2>Page not found</h2>
        <p>The page you are looking for doesn't exist.</p>
        <Link className="button primary" to="/" style={{ marginTop: '1rem', display: 'inline-flex' }}>Go to Home</Link>
      </div>
    </section>
  );
}

export default NotFound;
