import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function StaffRecordsScreen() {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [accessError, setAccessError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api.get('/api/patients')
      .then(r => setPatients(r.data.patients || []))
      .catch(() => Alert.alert('Error', 'Could not load patient list.'))
      .finally(() => setLoading(false));
  }, []);

  const selectPatient = async (p) => {
    setSelected(p); setLoadingDetail(true); setAccessError(''); setRecords([]); setFiles([]);
    try {
      const rRes = await api.get('/api/records', { params: { patientId: p.patientId } });
      let fRes = { data: { files: [] } };
      try {
        fRes = await api.get('/api/files', { params: { patientId: p.patientId } });
      } catch (err) {
        if (err.response?.status === 403) {
          setAccessError(err.response.data?.error || 'Patient consent required for files.');
        }
      }
      setRecords((rRes.data.records || []).filter(r => r.data?.diagnosis));
      setFiles(fRes.data.files || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessError(err.response.data?.error || 'Patient consent required.');
        setRecords([]);
        setFiles([]);
      } else {
        Alert.alert('Error', 'Could not load records.');
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = patients.filter(p =>
    `${p.patientId} ${p.name} ${p.phone}`.toLowerCase().includes(filter.toLowerCase())
  );

  if (selected) {
    const items = [
      ...records.map(r => ({ type: 'record', key: `r-${r.hash}-${r.timestamp}`, data: r })),
      ...files.map(f => ({ type: 'file', key: `f-${f.filename}`, data: f }))
    ];
    return (
      <View style={s.container}>
        <View style={s.headRow}>
          <Text style={s.title}>{selected.name}</Text>
          <Button title="Back" color="#888" onPress={() => { setSelected(null); setRecords([]); setFiles([]); }} />
        </View>
        <Text style={s.sub}>Patient: {selected.patientId} | {selected.phone}</Text>
        {loadingDetail ? <ActivityIndicator size="large" color="#5b8ff9" style={{ marginTop: 24 }} /> : (
          <>
            {accessError ? (
              <>
                <Text style={s.accessError}>{accessError}</Text>
                <Text style={s.hint}>Ask the patient to grant consent on their Records screen, then try again.</Text>
              </>
            ) : (
              <>
            <Text style={s.resultHead}>{records.length} record(s) · {files.length} file(s)</Text>
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
                      {r.data?.lab ? <Text style={s.text}>Lab: {r.data.lab}</Text> : null}
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
              </>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>All Patients</Text>
      <Text style={s.sub}>Logged in as: {user?.name} ({user?.role})</Text>
      <TextInput
        style={s.input}
        placeholder="Search name, ID or phone..."
        placeholderTextColor="#666"
        value={filter}
        onChangeText={setFilter}
      />
      {loading ? <ActivityIndicator size="large" color="#5b8ff9" style={{ marginTop: 24 }} /> : (
        <>
          <Text style={s.resultHead}>{filtered.length} patient(s)</Text>
          {filtered.length === 0 && <Text style={s.hint}>No patients match your search.</Text>}
          <FlatList
            data={filtered}
            keyExtractor={p => p.patientId}
            style={{ marginTop: 10 }}
            renderItem={({ item }) => (
              <View style={s.card}>
                <View style={s.head}><Text style={s.author}>{item.name}</Text><Text style={s.date}>{item.patientId}</Text></View>
                <Text style={s.text}>Phone: {item.phone}</Text>
                <Text style={s.text}>Age: {item.age}</Text>
                <Button title="View Records" color="#5b8ff9" onPress={() => selectPatient(item)} />
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#08101a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 13, color: '#888', marginBottom: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 10, borderRadius: 8, color: '#fff', backgroundColor: '#111', fontSize: 16 },
  hint: { fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center' },
  accessError: { fontSize: 14, color: '#ffb063', marginTop: 16, textAlign: 'center', lineHeight: 20 },
  resultHead: { fontSize: 13, color: '#888', marginTop: 4 },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 10, backgroundColor: '#111' },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  author: { fontSize: 14, fontWeight: '600', color: '#fff' },
  date: { fontSize: 12, color: '#888' },
  text: { fontSize: 13, color: '#ccc', marginBottom: 2 },
  hash: { fontSize: 11, color: '#666', marginTop: 6 },
});