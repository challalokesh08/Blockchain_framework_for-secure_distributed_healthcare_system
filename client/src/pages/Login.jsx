import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';

function Login() {
  const { login } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(phone.trim(), password);
      navigate('/records');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your phone number and password.');
    }
  };

  return (
    <section className="section">
      <div className="container login-panel">
        <div className="section-heading">
          <span className="eyebrow">Secure access</span>
          <h2>Sign in with phone and password</h2>
          <p>Existing users can authenticate with their registered phone number and password.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Phone Number
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15550000004"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </label>
          <button type="submit" className="button primary">Login</button>
          {error && <p className="form-message error">{error}</p>}
        </form>

        <div className="patient-credentials">
          <p>New patient? <Link to="/register">Register here</Link> to get started.</p>
        </div>
      </div>
    </section>
  );
}

export default Login;
