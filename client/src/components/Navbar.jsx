import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';
import AuthStatus from './AuthStatus.jsx';

const publicLinks = [
  { path: '/', label: 'Home' },
  { path: '/features', label: 'Features' },
  { path: '/explorer', label: 'Explorer' },
  { path: '/about', label: 'About' }
];

const authenticatedLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/records', label: 'Records' },
  { path: '/contracts', label: 'Contracts' }
];

function Navbar() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="brand">
          <span className="brand-mark">H</span>
          <div>
            <h1>HealthLedger</h1>
            <p>Secure healthcare blockchain</p>
          </div>
        </div>
        <nav>
          {publicLinks.map(link => (
            <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && authenticatedLinks.map(link => (
            <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <AuthStatus />
              <button className="nav-button" onClick={() => { logout(); navigate('/login'); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">Login</NavLink>
              <NavLink to="/register" className="nav-link">Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
