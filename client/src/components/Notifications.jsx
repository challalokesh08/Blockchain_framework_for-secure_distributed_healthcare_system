import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { AuthContext } from '../AuthContext.jsx';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    let mounted = true;
    async function load() {
      try {
        const [n, r] = await Promise.all([
          api.get('/api/notifications'),
          api.get('/api/access-request').catch(() => ({ data: { requests: [] } }))
        ]);
        if (mounted) {
          setNotifications(n.data.notifications || []);
          setRequests(r.data.requests || []);
        }
      } catch (err) {
        // transient failure — the next poll retries
      }
    }
    load();
    const id = setInterval(load, 2000);
    return () => { mounted = false; clearInterval(id); };
  }, [user]);

  const markRead = async (n) => {
    if (n.read) return;
    try {
      const res = await api.post('/api/notifications/read', { id: n.id });
      const updated = res.data.notification || { ...n, read: true };
      setNotifications(prev => prev.map(item => item.id === n.id ? updated : item));
    } catch (err) {
      setMessage('Unable to mark the notification as read.');
    }
  };

  const decide = async (n, approved) => {
    setBusy(true); setMessage('');
    try {
      const res = await api.post(`/api/access-request/confirm/${n.requestId}`, { approved });
      setMessage(res.data.message || `Request ${approved ? 'approved' : 'rejected'}.`);
      await markRead(n);
      const [nr, rr] = await Promise.all([
        api.get('/api/notifications'), api.get('/api/access-request')
      ]);
      setNotifications(nr.data.notifications || []);
      setRequests(rr.data.requests || []);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to update the request.');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (n) => {
    const req = requests.find(r => r.id === n.requestId);
    if (!req) return;
    setBusy(true); setMessage('');
    try {
      await api.delete('/api/consent', { data: { providerName: req.requester, providerType: 'Doctor' } });
      setMessage(`Access revoked for ${req.requester}.`);
      await markRead(n);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to revoke access.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  const canDecide = user.role === 'Patient' || user.role === 'Admin';

  return (
    <div className="notifications-panel">
      <h4>Notifications</h4>
      {message && <p className="form-message">{message}</p>}
      {notifications.length === 0 ? (
        <p>No notifications yet. Updates about access requests will appear here.</p>
      ) : (
        <ul>
          {notifications.map((n) => {
            const request = requests.find(r => r.id === n.requestId);
            const showActions = canDecide && n.type === 'file_request' && request;
            return (
              <li key={n.id} className="notification-item">
                <div>
                  <strong>{n.title}</strong>
                  {!n.read && <span className="status-pill warning" style={{ marginLeft: '0.5rem' }}>New</span>}
                </div>
                <p className="consent-purpose">{n.body}</p>
                <p className="consent-purpose">
                  {n.actor ? `From ${n.actor} · ` : ''}{new Date(n.createdAt).toLocaleString()}
                </p>
                {showActions && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {request.status === 'PENDING' ? (
                      <>
                        <button type="button" className="button primary" disabled={busy} onClick={() => decide(n, true)}>Grant</button>
                        <button type="button" className="button secondary" disabled={busy} onClick={() => decide(n, false)}>Deny</button>
                      </>
                    ) : request.status === 'APPROVED' ? (
                      <button type="button" className="button secondary" disabled={busy} onClick={() => revoke(n)}>Revoke access</button>
                    ) : null}
                  </div>
                )}
                {n.link && (
                  <button type="button" className="button secondary" style={{ marginTop: '0.5rem' }}
                    onClick={() => { markRead(n); navigate(n.link); }}>
                    Open
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
