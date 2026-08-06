import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../AuthContext';
import axios from 'axios';

export default function RecordsScreen() {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!user) return;
    const pid = user.patientId || '';
    axios.get(`http://10.0.2.2:4000/api/records?patientId=${pid}`).then(r => setRecords(r.data.records || [])).catch(() => setRecords([]));
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Records</Text>
      <FlatList data={records} keyExtractor={(i, idx) => `${idx}`} renderItem={({ item }) => (
        <View style={styles.card}><Text>{JSON.stringify(item.data || item)}</Text></View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 }, title: { fontSize: 22, marginBottom: 12 }, card: { padding: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 8 } });
