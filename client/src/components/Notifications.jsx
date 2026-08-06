import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext.jsx';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const pid = user.patientId || '';
    // poll for new records and files
    let mounted = true;
    async function fetchNotifications() {
      try {
        const res = await axios.get(`/api/records?patientId=${pid}`);
        const records = res.data.records || [];
        const filesRes = await axios.get(`/api/files?patientId=${pid}`);
        const files = filesRes.data.files || [];
        if (mounted) setNotifications([...records.map(r=>({type:'record',data:r})), ...files.map(f=>({type:'file',data:f}))]);
      } catch (err) {
        // ignore
      }
    }
    fetchNotifications();
    const id = setInterval(fetchNotifications, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, [user]);

  if (!user) return null;

  return (
    <div className="notifications-panel">
      <h4>Notifications</h4>
      {notifications.length === 0 ? <p>No recent items.</p> : (
        <ul>
          {notifications.map((n, idx) => (
            <li key={idx} className="notification-item">
              {n.type === 'record' ? (
                <div><strong>Record:</strong> {n.data.data?.summary || JSON.stringify(n.data.data)}</div>
              ) : (
                <div><strong>File:</strong> <a href={`/api/files/${encodeURIComponent(n.data.filename)}`} target="_blank" rel="noreferrer">{n.data.originalname}</a></div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
