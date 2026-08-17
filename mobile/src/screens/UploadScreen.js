import React, { useContext, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../AuthContext';
import { uploadFile } from '../api';

export default function UploadScreen() {
  const { user, token } = useContext(AuthContext);
  const [patientId, setPatientId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const pickAndUpload = async () => {
    if (!patientId.trim()) {
      Alert.alert('Error', 'Please enter a Patient ID.');
      return;
    }

    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const file = res.assets[0];
      setLoading(true);
      setMessage('');
      const data = await uploadFile(token, file.uri, file.name, patientId.trim(), user?.name || 'Staff');
      setMessage('Uploaded: ' + (data.file?.originalname || 'Success'));
      setPatientId('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Report</Text>
      <Text style={styles.subtitle}>Upload a file for a patient record</Text>

      <TextInput
        style={styles.input}
        placeholder="Patient ID (e.g. P-1001)"
        placeholderTextColor="#666"
        value={patientId}
        onChangeText={setPatientId}
      />

      {loading ? (
        <ActivityIndicator size="small" color="#58d9a6" style={{ marginVertical: 12 }} />
      ) : (
        <Button title="Pick & Upload File" onPress={pickAndUpload} color="#58d9a6" />
      )}

      {message ? <Text style={[styles.message, message.includes('fail') || message.includes('Error') ? styles.error : styles.success]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 8, color: '#fff', backgroundColor: '#111' },
  message: { marginTop: 16, fontSize: 14 },
  success: { color: '#58d9a6' },
  error: { color: '#ff6b6b' }
});
