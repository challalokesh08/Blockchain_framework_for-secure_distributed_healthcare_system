import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';
import { fetchStatus } from '../api';

export default function HomeScreen({ navigation }) {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HealthLedger</Text>
      <Text style={styles.subtitle}>Secure Healthcare Blockchain</Text>

      {status ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Network: {status.status}</Text>
          <Text style={styles.statusLabel}>Blocks: {status.blocks}</Text>
          <Text style={styles.statusLabel}>Pending: {status.pendingTransactions}</Text>
          <Text style={styles.statusLabel}>Valid: {status.valid ? 'Yes' : 'No'}</Text>
        </View>
      ) : (
        <ActivityIndicator size="small" color="#5b8ff9" style={{ marginVertical: 12 }} />
      )}

      <View style={styles.buttonGroup}>
        {isAuthenticated && (
          <>
            <Button title="My Records" onPress={() => navigation.navigate('Records')} color="#5b8ff9" />
            {user.role !== 'Patient' && (
              <View style={{ marginTop: 8 }}>
                <Button title="Upload File" onPress={() => navigation.navigate('Upload')} color="#58d9a6" />
              </View>
            )}
          </>
        )}

        {!isAuthenticated ? (
          <View style={{ marginTop: 8 }}>
            <Button title="Sign In" onPress={() => navigation.navigate('Login')} color="#5b8ff9" />
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Button title="Logout" onPress={() => { logout(); navigation.navigate('Home'); }} color="#ff6b6b" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  statusCard: { padding: 16, borderWidth: 1, borderColor: '#333', borderRadius: 12, marginBottom: 20, backgroundColor: '#111' },
  statusLabel: { fontSize: 14, color: '#ccc', marginBottom: 4 },
  buttonGroup: { gap: 4 }
});
