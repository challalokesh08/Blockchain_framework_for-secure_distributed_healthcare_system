import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data?.notifications || []);
    } catch (e) {
      setMessage('Unable to load notifications. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const open = async (n) => {
    if (!n.read) {
      try {
        const res = await api.post('/api/notifications/read', { id: n.id });
        const updated = res.data?.notification || { ...n, read: true };
        setNotifications(prev => prev.map(item => item.id === n.id ? updated : item));
      } catch (e) {
        setMessage('Could not mark this notification as read.');
      }
    }
    if (n.link === '/records' || n.patientId) {
      navigation.navigate(user?.role === 'Patient' ? 'Records' : 'StaffRecords');
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5b8ff9" /></View>;

  return (
    <View style={s.container}>
      <Text style={s.title}>Notifications</Text>
      <Text style={s.sub}>File access requests, approvals and emergency updates</Text>
      {message ? <Text style={s.msg}>{message}</Text> : null}
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#5b8ff9" />}
        ListEmptyComponent={<Text style={s.empty}>No notifications yet. New requests and decisions will appear here.</Text>}
        renderItem={({ item }) => (
          <View style={[s.card, !item.read && s.unread]}>
            <View style={s.head}>
              <Text style={s.cardTitle}>{item.title}</Text>
              {!item.read ? <Text style={s.badge}>NEW</Text> : null}
            </View>
            <Text style={s.body}>{item.body}</Text>
            <Text style={s.meta}>
              {item.actor ? `From ${item.actor} · ` : ''}{new Date(item.createdAt).toLocaleString()}
            </Text>
            <Text style={s.link} onPress={() => open(item)}>
              {item.patientId ? `Open ${item.patientId} →` : 'Mark as read →'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#08101a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 13, color: '#888', marginBottom: 12 },
  msg: { fontSize: 12, color: '#f0b84b', marginBottom: 8 },
  empty: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 32 },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 10, backgroundColor: '#111' },
  unread: { borderColor: '#5b8ff9' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flexShrink: 1 },
  badge: { fontSize: 10, color: '#08101a', backgroundColor: '#5b8ff9', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  body: { fontSize: 13, color: '#ccc', marginBottom: 6 },
  meta: { fontSize: 11, color: '#888', marginBottom: 6 },
  link: { fontSize: 12, color: '#8ab4ff', marginTop: 4 },
});
