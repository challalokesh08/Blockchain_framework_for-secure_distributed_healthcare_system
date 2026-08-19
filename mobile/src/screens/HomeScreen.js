import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function HomeScreen({ navigation }) {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/api/status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>HealthLedger</Text>
      <Text style={s.sub}>Secure Healthcare Blockchain</Text>

      {status ? (
        <View style={s.card}>
          <Text style={s.label}>Network: {status.status}</Text>
          <Text style={s.label}>Blocks: {status.blocks}</Text>
          <Text style={s.label}>Pending: {status.pendingTransactions}</Text>
          <Text style={s.label}>Valid: {status.valid ? 'Yes' : 'No'}</Text>
        </View>
      ) : (
        <ActivityIndicator size="small" color="#5b8ff9" style={{ marginVertical: 16 }} />
      )}

      {isAuthenticated ? (
        <>
          <Btn title="My Records" color="#5b8ff9" onPress={() => navigation.navigate('Records')} />
          {user?.role !== 'Patient' && <Btn title="Upload File" color="#58d9a6" onPress={() => navigation.navigate('Upload')} />}
          <View style={{ marginTop: 16 }}>
            <Btn title="Logout" color="#ff6b6b" onPress={() => { logout(); }} />
          </View>
        </>
      ) : (
        <>
          <Btn title="Sign In" color="#5b8ff9" onPress={() => navigation.navigate('Login')} />
          <View style={{ marginTop: 8 }}>
            <Btn title="Register" color="#58d9a6" onPress={() => navigation.navigate('Register')} />
          </View>
        </>
      )}
    </View>
  );
}

function Btn({ title, color, onPress }) {
  return <Button title={title} color={color} onPress={onPress} />;
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 20 },
  card: { padding: 16, borderWidth: 1, borderColor: '#333', borderRadius: 12, marginBottom: 24, backgroundColor: '#111' },
  label: { fontSize: 14, color: '#ccc', marginBottom: 4 },
});
