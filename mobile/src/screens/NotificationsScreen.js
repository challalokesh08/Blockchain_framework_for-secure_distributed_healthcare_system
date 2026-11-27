import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Button
} from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [n, r] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/access-request').catch(() => ({ data: { requests: [] } }))
      ]);
      setNotifications(n.data?.notifications || []);
      setRequests(r.data?.requests || []);
    } catch (e) {
      setMessage('Unable to load notifications. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [load]);

  const markRead = async (n) => {
    if (n.read) return;
    try {
      const res = await api.post('/api/notifications/read', { id: n.id });
      setNotifications(prev => prev.map(x => x.id === n.id ? (res.data?.notification || { ...n, read: true }) : x));
    } catch (e) { /* ignore */ }
  };

  const decide = async (n, approved) => {
    setBusy(true); setMessage('');
    try {
      const res = await api.post(`/api/access-request/confirm/${n.requestId}`, { approved });
      setMessage(res.data?.message || `Request ${approved ? 'approved' : 'rejected'}.`);
      await markRead(n);
      await load();
    } catch (e) {
      setMessage(e.response?.data?.error || 'Unable to update the request.');
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
    } catch (e) {
      setMessage(e.response?.data?.error || 'Unable to revoke access.');
    } finally {
      setBusy(false);
    }
  };

  const open = async (n) => {
    await markRead(n);
    if (n.link === '/records' || n.patientId) {
      navigation.navigate(user?.role === 'Patient' ? 'Records' : 'StaffRecords');
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5b8ff9" /></View>;

  const canDecide = user?.role === 'Patient' || user?.role === 'Admin';

  return (
    <View style={s.container}>
      <Text style={s.title}>Notifications</Text>
      <Text style={s.sub}>Requests and decisions update every 2 seconds</Text>
      {message ? <Text style={s.msg}>{message}</Text> : null}
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#5b8ff9" />}
        ListEmptyComponent={<Text style={s.empty}>No notifications yet. New requests and decisions will appear here.</Text>}
        renderItem={({ item }) => {
          const request = requests.find(r => r.id === item.requestId);
          const showActions = canDecide && item.type === 'file_request' && request;
          return (
            <View style={[s.card, !item.read && s.unread]}>
              <View style={s.head}>
                <Text style={s.cardTitle}>{item.title}</Text>
                {!item.read ? <Text style={s.badge}>NEW</Text> : null}
              </View>
              <Text style={s.body}>{item.body}</Text>
              <Text style={s.meta}>
                {item.actor ? `From ${item.actor} · ` : ''}{new Date(item.createdAt).toLocaleString()}
              </Text>
              {showActions && (
                <View style={s.actions}>
                  {request.status === 'PENDING' ? (
                    <>
                      <View style={s.btn}><Button title="Grant" color="#2fbf9f" disabled={busy} onPress={() => decide(item, true)} /></View>
                      <View style={s.btn}><Button title="Deny" color="#ff7a6b" disabled={busy} onPress={() => decide(item, false)} /></View>
                    </>
                  ) : request.status === 'APPROVED' ? (
                    <View style={s.btn}><Button title="Revoke access" color="#ff7a6b" disabled={busy} onPress={() => revoke(item)} /></View>
                  ) : null}
                </View>
              )}
              <Text style={s.link} onPress={() => open(item)}>Open →</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#08101a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 12, color: '#888', marginBottom: 12 },
  msg: { fontSize: 12, color: '#f0b84b', marginBottom: 8 },
  empty: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 32 },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 10, backgroundColor: '#111' },
  unread: { borderColor: '#5b8ff9' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flexShrink: 1 },
  badge: { fontSize: 10, color: '#08101a', backgroundColor: '#5b8ff9', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  body: { fontSize: 13, color: '#ccc', marginBottom: 6 },
  meta: { fontSize: 11, color: '#888', marginBottom: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  btn: { flexGrow: 1, minWidth: 100 },
  link: { fontSize: 12, color: '#8ab4ff', marginTop: 4 },
});
