import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';
import api from '../api.js';

function Register() {
  const { register } = useContext(AuthContext);
  const [details, setDetails] = useState({ name: '', age: '', phone: '', password: '', department: '', assignedDoctor: '' });
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/doctors')
      .then(r => { setDepartments(r.data.departments || []); setDoctors(r.data.doctors || []); })
      .catch(() => setError('Could not load the doctor directory. Please try again.'));
  }, []);

  const doctorsForDepartment = doctors.filter(d => d.department === details.department);

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
          <label>
            Department
            <select
              value={details.department}
              onChange={(e) => setDetails({ ...details, department: e.target.value, assignedDoctor: '' })}
              required
            >
              <option value="">Select a department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>
            Assigned Doctor
            <select
              value={details.assignedDoctor}
              onChange={(e) => setDetails({ ...details, assignedDoctor: e.target.value })}
              required
              disabled={!details.department}
            >
              <option value="">{details.department ? 'Select a doctor' : 'Choose a department first'}</option>
              {doctorsForDepartment.map(d => (
                <option key={d.name} value={d.name}>{d.name}{d.patients ? ` · ${d.patients} patients` : ''}</option>
              ))}
            </select>
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
