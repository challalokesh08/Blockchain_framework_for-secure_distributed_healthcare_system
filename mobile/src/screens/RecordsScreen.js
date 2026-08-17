import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import { fetchRecords, fetchFiles, API_BASE } from '../api';

export default function RecordsScreen() {
  const { user, token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    const pid = user.patientId || '';
    setLoading(true);

    Promise.all([
      fetchRecords(token, pid).catch(() => ({ records: [] })),
      fetchFiles(token, pid).catch(() => ({ files: [] }))
    ]).then(([recordsRes, filesRes]) => {
      setRecords(recordsRes.records || []);
      setFiles(filesRes.files || []);
    }).finally(() => setLoading(false));
  }, [user, token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5b8ff9" />
      </View>
    );
  }

  const sections = [
    ...records.map(r => ({ type: 'record', key: `record-${r.hash}-${r.timestamp}`, data: r })),
    ...files.map(f => ({ type: 'file', key: `file-${f.filename}`, data: f }))
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Records</Text>
      <Text style={styles.subtitle}>Patient: {user?.patientId || 'N/A'}</Text>

      {sections.length === 0 ? (
        <Text style={styles.empty}>No records or files found.</Text>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            if (item.type === 'record') {
              const r = item.data;
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardAuthor}>{r.author}</Text>
                    <Text style={styles.cardDate}>{new Date(r.timestamp).toLocaleDateString()}</Text>
                  </View>
                  {r.data?.diagnosis ? <Text style={styles.cardText}>Diagnosis: {r.data.diagnosis}</Text> : null}
                  {r.data?.notes ? <Text style={styles.cardText}>Notes: {r.data.notes}</Text> : null}
                  <Text style={styles.cardHash}>Block: {r.hash?.substring(0, 16)}...</Text>
                </View>
              );
            } else {
              const f = item.data;
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardAuthor}>{f.originalname}</Text>
                    <Text style={styles.cardDate}>{new Date(f.timestamp).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.cardText}>Type: {f.mimetype}</Text>
                  <Text style={styles.cardText}>Size: {(f.size / 1024).toFixed(1)} KB</Text>
                </View>
              );
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  empty: { fontSize: 14, color: '#666', marginTop: 20, textAlign: 'center' },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 10, backgroundColor: '#111' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardAuthor: { fontSize: 14, fontWeight: '600', color: '#fff' },
  cardDate: { fontSize: 12, color: '#888' },
  cardText: { fontSize: 13, color: '#ccc', marginBottom: 2 },
  cardHash: { fontSize: 11, color: '#666', marginTop: 6 }
});
