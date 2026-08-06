import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../AuthContext';
import { fetchStatus } from '../api';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HealthLedger</Text>
      <Text>Ledger status: {status ? status.status : 'loading...'}</Text>
      <Button title="Records" onPress={() => navigation.navigate('Records')} />
      {user && user.role !== 'Patient' ? <Button title="Upload" onPress={() => navigation.navigate('Upload')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 }, title: { fontSize: 22, marginBottom: 12 } });
