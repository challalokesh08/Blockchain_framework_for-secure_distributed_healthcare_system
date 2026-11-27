import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { AuthContext } from '../AuthContext.jsx';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    async function fetchNotifications() {
      try {
        const res = await api.get('/api/notifications');
        if (mounted) setNotifications(res.data.notifications || []);
      } catch (err) {
        // ignore transient failures; the next poll retries
      }
    }
    fetchNotifications();
    const id = setInterval(fetchNotifications, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, [user]);

  const openNotification = async (n) => {
    if (!n.read) {
      try {
        const res = await api.post('/api/notifications/read', { id: n.id });
        const updated = res.data.notification || { ...n, read: true };
        setNotifications(prev => prev.map(item => item.id === n.id ? updated : item));
      } catch (err) {
        setMessage(err.response?.data?.error || 'Unable to mark the notification as read.');
      }
    }
    if (n.link) navigate(n.link);
  };

  if (!user) return null;

  return (
    <div className="notifications-panel">
      <h4>Notifications</h4>
      {message && <p className="form-message">{message}</p>}
      {notifications.length === 0 ? (
        <p>No notifications yet. Updates about access requests will appear here.</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id} className="notification-item">
              <button
                type="button"
                onClick={() => openNotification(n)}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                <div>
                  <strong>{n.title}</strong>
                  {!n.read && <span className="status-pill warning" style={{ marginLeft: '0.5rem' }}>New</span>}
                </div>
                <p className="consent-purpose">{n.body}</p>
                <p className="consent-purpose">
                  {n.actor ? `From ${n.actor} · ` : ''}{new Date(n.createdAt).toLocaleString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
