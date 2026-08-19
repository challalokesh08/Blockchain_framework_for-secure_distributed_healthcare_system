import React, { useContext, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function UploadScreen() {
  const { user, token } = useContext(AuthContext);
  const [patientId, setPatientId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const pickAndUpload = async () => {
    if (!patientId.trim()) {
      Alert.alert('Error', 'Enter a Patient ID first.');
      return;
    }

    const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (res.canceled || !res.assets?.length) return;

    const file = res.assets[0];
    setLoading(true);
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('patientId', patientId.trim());
      fd.append('author', user?.name || 'Staff');
      fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      await api.post('/api/files/upload', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Upload successful!');
      setPatientId('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Upload Report</Text>
      <Text style={s.sub}>Upload a file for a patient record</Text>

      <TextInput style={s.input} placeholder="Patient ID (e.g. P-1001)" placeholderTextColor="#666" value={patientId} onChangeText={setPatientId} />

      {loading ? (
        <ActivityIndicator size="small" color="#58d9a6" style={{ marginVertical: 12 }} />
      ) : (
        <Button title="Pick & Upload File" color="#58d9a6" onPress={pickAndUpload} />
      )}

      {message ? <Text style={[s.msg, message.includes('fail') || message.includes('Error') ? { color: '#ff6b6b' } : { color: '#58d9a6' }]}>{message}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 20 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 8, color: '#fff', backgroundColor: '#111', fontSize: 16 },
  msg: { marginTop: 16, fontSize: 14 },
});
