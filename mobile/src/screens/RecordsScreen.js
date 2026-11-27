import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function RecordsScreen() {
  const { user, token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessRequests, setAccessRequests] = useState([]);
  const [decidingId, setDecidingId] = useState(null);
  const [msg, setMsg] = useState('');

  const loadRecords = useCallback(() => {
    if (!user || !token) return Promise.resolve();
    const pid = user.patientId || '';
    return Promise.all([
      api.get('/api/records', { params: { patientId: pid } }).catch(() => ({ data: { records: [] } })),
      api.get('/api/files', { params: { patientId: pid } }).catch(() => ({ data: { files: [] } }))
    ]).then(([rRes, fRes]) => {
      setRecords(rRes.data?.records || []);
      setFiles(fRes.data?.files || []);
    });
  }, [user, token]);

  const loadRequests = useCallback(() => {
    if (!user || !token) return Promise.resolve();
    const pid = user.patientId || '';
    return api.get('/api/access-request')
      .then(r => setAccessRequests((r.data?.requests || []).filter(r => r.patientId === pid)))
      .catch(() => setAccessRequests([]));
  }, [user, token]);

  useEffect(() => {
    if (!user || !token) return undefined;
    loadRecords().finally(() => setLoading(false));
  }, [loadRecords]);

  useEffect(() => {
    if (!user || !token) return undefined;
    loadRequests();
    // The request may be raised on a staff device while this screen is open.
    const timer = setInterval(loadRequests, 10000);
    return () => clearInterval(timer);
  }, [loadRequests]);

  const decideRequest = async (id, approved) => {
    setDecidingId(id); setMsg('');
    try {
      const response = await api.post(`/api/access-request/confirm/${id}`, { approved });
      setMsg(response.data?.message || (approved ? 'Access approved.' : 'Access rejected.'));
      await Promise.all([loadRequests(), loadRecords()]);
    } catch (error) {
      setMsg(error.response?.data?.error || 'Unable to update the file access request.');
    } finally {
      setDecidingId(null);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5b8ff9" /></View>;

  const pending = accessRequests.filter(r => r.status === 'PENDING');
  const items = [
    { type: 'requests', key: 'access-requests' },
    ...records.map(r => ({ type: 'record', key: `r-${r.hash}-${r.timestamp}`, data: r })),
    ...files.map(f => ({ type: 'file', key: `f-${f.filename}`, data: f })),
    ...(records.length + files.length === 0 ? [{ type: 'empty', key: 'empty-records' }] : [])
  ];

  return (
    <View style={s.container}>
      <Text style={s.title}>My Records</Text>
      <Text style={s.sub}>Patient: {user?.patientId || 'N/A'}</Text>
      <FlatList
        data={items}
        keyExtractor={i => i.key}
        style={{ flex: 1 }}
        renderItem={({ item }) => {
          if (item.type === 'requests') {
            return (
              <View style={[s.card, { marginBottom: 14 }]}>
                <Text style={s.sectHead}>File access requests</Text>
                {pending.length === 0 ? (
                  <Text style={s.muted}>No pending file access requests.</Text>
                ) : pending.map(r => (
                  <View key={r.id} style={{ marginBottom: 10 }}>
                    <Text style={s.text}>{r.requester} ({r.role}) requests access to your files.</Text>
                    <Text style={s.muted}>Reason: {r.reason}</Text>
                    <View style={s.btnRow}>
                      <Button title="Approve" color="#2fbf9f" onPress={() => decideRequest(r.id, true)} disabled={decidingId !== null} />
                      <Button title="Reject" color="#ff7a6b" onPress={() => decideRequest(r.id, false)} disabled={decidingId !== null} />
                    </View>
                  </View>
                ))}
                {msg ? <Text style={s.msg}>{msg}</Text> : null}
              </View>
            );
          }
          if (item.type === 'empty') return <Text style={s.empty}>No records or files found.</Text>;
          if (item.type === 'record') {
            const r = item.data;
            return (
              <View style={s.card}>
                <View style={s.head}><Text style={s.author}>{r.author}</Text><Text style={s.date}>{new Date(r.timestamp).toLocaleDateString()}</Text></View>
                {r.data?.diagnosis ? <Text style={s.text}>Diagnosis: {r.data.diagnosis}</Text> : null}
                {r.data?.notes ? <Text style={s.text}>Notes: {r.data.notes}</Text> : null}
                <Text style={s.hash}>Block: {r.hash?.substring(0, 16)}...</Text>
              </View>
            );
          }
          const f = item.data;
          return (
            <View style={s.card}>
              <View style={s.head}><Text style={s.author}>{f.originalname}</Text><Text style={s.date}>{new Date(f.timestamp).toLocaleDateString()}</Text></View>
              <Text style={s.text}>Type: {f.mimetype}</Text>
              <Text style={s.text}>Size: {(f.size / 1024).toFixed(1)} KB</Text>
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
  sub: { fontSize: 13, color: '#888', marginBottom: 16 },
  empty: { fontSize: 14, color: '#666', marginTop: 20, textAlign: 'center' },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 10, backgroundColor: '#111' },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  author: { fontSize: 14, fontWeight: '600', color: '#fff' },
  date: { fontSize: 12, color: '#888' },
  text: { fontSize: 13, color: '#ccc', marginBottom: 2 },
  hash: { fontSize: 11, color: '#666', marginTop: 6 },
  sectHead: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 8 },
  muted: { fontSize: 12, color: '#888', marginBottom: 6 },
  msg: { fontSize: 12, color: '#8ab4ff', marginTop: 6 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
});
