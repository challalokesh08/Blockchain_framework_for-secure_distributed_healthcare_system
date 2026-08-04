import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';

function Register() {
  const { register } = useContext(AuthContext);
  const [details, setDetails] = useState({ name: '', age: '', phone: '', password: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    try {
      await register({ name: details.name.trim(), age: details.age, phone: details.phone.trim(), password: details.password });
      setStatus('Registration successful. Redirecting to your records...');
      setTimeout(() => navigate('/records'), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <section className="section">
      <div className="container login-panel">
        <div className="section-heading">
          <span className="eyebrow">New patient registration</span>
          <h2>Create your patient account</h2>
          <p>Register using your name, age, phone number, and password to access your personal healthcare ledger.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              placeholder="Asha Kumar"
              required
            />
          </label>
          <label>
            Age
            <input
              type="number"
              value={details.age}
              onChange={(e) => setDetails({ ...details, age: e.target.value })}
              placeholder="29"
              required
              min="1"
            />
          </label>
          <label>
            Phone Number
            <input
              type="tel"
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              placeholder="+15550000004"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={details.password}
              onChange={(e) => setDetails({ ...details, password: e.target.value })}
              placeholder="Choose a secure password"
              required
            />
          </label>
          <button type="submit" className="button primary">Register</button>
          {status && <p className="form-message success">{status}</p>}
          {error && <p className="form-message error">{error}</p>}
        </form>
      </div>
    </section>
  );
}

export default Register;
