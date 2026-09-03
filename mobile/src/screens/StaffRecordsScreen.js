import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function StaffRecordsScreen() {
  const { user } = useContext(AuthContext);
  const [pid, setPid] = useState('');
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    const id = pid.trim();
    if (!id) { Alert.alert('Error', 'Enter a patient ID (e.g. P-2001)'); return; }
    setLoading(true); setSearched(true);
    try {
      const [rRes, fRes] = await Promise.all([
        api.get('/api/records', { params: { patientId: id } }).catch(() => ({ data: { records: [] } })),
        api.get('/api/files', { params: { patientId: id } }).catch(() => ({ data: { files: [] } }))
      ]);
      const allRecords = (rRes.data?.records || []).filter(r => r.data?.diagnosis);
      setRecords(allRecords);
      setFiles(fRes.data?.files || []);
    } catch {
      Alert.alert('Error', 'Could not load records.');
    } finally {
      setLoading(false);
    }
  };

  const items = [
    ...records.map(r => ({ type: 'record', key: `r-${r.hash}-${r.timestamp}`, data: r })),
    ...files.map(f => ({ type: 'file', key: `f-${f.filename}`, data: f }))
  ];

  return (
    <View style={s.container}>
      <Text style={s.title}>Staff Record Viewer</Text>
      <Text style={s.sub}>Logged in as: {user?.name} ({user?.role})</Text>
      <View style={s.search}>
        <TextInput style={s.input} placeholder="Patient ID (e.g. P-2001)" placeholderTextColor="#666" value={pid} onChangeText={setPid} autoCapitalize="characters" />
        {loading ? <ActivityIndicator size="small" color="#5b8ff9" style={{ marginTop: 10 }} /> : <Button title="Search" color="#5b8ff9" onPress={search} />}
      </View>
      {!searched && <Text style={s.hint}>Enter a patient ID above to view their records and files.</Text>}
      {searched && !loading && items.length === 0 && <Text style={s.hint}>No records or files found for {pid.trim()}.</Text>}
      {items.length > 0 && (
        <Text style={s.resultHead}>Showing {records.length} record(s) and {files.length} file(s) for {pid.trim()}</Text>
      )}
      <FlatList
        data={items}
        keyExtractor={i => i.key}
        style={{ marginTop: 10 }}
        renderItem={({ item }) => {
          if (item.type === 'record') {
            const r = item.data;
            return (
              <View style={s.card}>
                <View style={s.head}><Text style={s.author}>{r.author}</Text><Text style={s.date}>{new Date(r.timestamp).toLocaleDateString()}</Text></View>
                {r.data?.department ? <Text style={s.text}>Department: {r.data.department}</Text> : null}
                {r.data?.diagnosis ? <Text style={s.text}>Diagnosis: {r.data.diagnosis}</Text> : null}
                {r.data?.physician ? <Text style={s.text}>Physician: {r.data.physician}</Text> : null}
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
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 13, color: '#888', marginBottom: 16 },
  search: { marginBottom: 16 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 10, borderRadius: 8, color: '#fff', backgroundColor: '#111', fontSize: 16 },
  hint: { fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center' },
  resultHead: { fontSize: 13, color: '#888', marginTop: 4 },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 10, backgroundColor: '#111' },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  author: { fontSize: 14, fontWeight: '600', color: '#fff' },
  date: { fontSize: 12, color: '#888' },
  text: { fontSize: 13, color: '#ccc', marginBottom: 2 },
  hash: { fontSize: 11, color: '#666', marginTop: 6 },
});
