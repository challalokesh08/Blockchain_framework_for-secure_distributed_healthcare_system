import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function RecordsScreen() {
  const { user, token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    const pid = user.patientId || '';
    Promise.all([
      api.get('/api/records', { params: { patientId: pid } }).catch(() => ({ data: { records: [] } })),
      api.get('/api/files', { params: { patientId: pid } }).catch(() => ({ data: { files: [] } }))
    ]).then(([rRes, fRes]) => {
      setRecords(rRes.data?.records || []);
      setFiles(fRes.data?.files || []);
    }).finally(() => setLoading(false));
  }, [user, token]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5b8ff9" /></View>;

  const items = [
    ...records.map(r => ({ type: 'record', key: `r-${r.hash}-${r.timestamp}`, data: r })),
    ...files.map(f => ({ type: 'file', key: `f-${f.filename}`, data: f }))
  ];

  return (
    <View style={s.container}>
      <Text style={s.title}>My Records</Text>
      <Text style={s.sub}>Patient: {user?.patientId || 'N/A'}</Text>
      {items.length === 0 ? <Text style={s.empty}>No records or files found.</Text> : (
        <FlatList data={items} keyExtractor={i => i.key} renderItem={({ item }) => {
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
        }} />
      )}
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
});
