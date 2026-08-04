import { useContext } from 'react';
import { AuthContext } from '../AuthContext.jsx';

function AuthStatus() {
  const { user } = useContext(AuthContext);
  return user ? (
    <div className="auth-status">Signed in as {user.name} ({user.role})</div>
  ) : null;
}

export default AuthStatus;
