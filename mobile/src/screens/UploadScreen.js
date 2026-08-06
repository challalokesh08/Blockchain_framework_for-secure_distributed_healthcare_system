import React, { useContext, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../AuthContext';
import { uploadFile } from '../api';

export default function UploadScreen() {
  const { user } = useContext(AuthContext);
  const [patientId, setPatientId] = useState('');
  const [message, setMessage] = useState('');

  const pickAndUpload = async () => {
    const res = await DocumentPicker.getDocumentAsync({});
    if (res.type === 'success') {
      try {
        const token = global.localStorage?.getItem?.('token');
        const data = await uploadFile(token, res.uri, res.name, patientId, user?.name || 'Uploader');
        setMessage('Uploaded: ' + (data.file?.originalname || 'ok'));
      } catch (err) {
        setMessage('Upload failed');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload file for patient</Text>
      <TextInput style={styles.input} placeholder="Patient ID (e.g. P-1001)" value={patientId} onChangeText={setPatientId} />
      <Button title="Pick & Upload File" onPress={pickAndUpload} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 }, title: { fontSize: 18, marginBottom: 8 }, input: { borderColor: '#ccc', borderWidth: 1, padding: 8, marginBottom: 12 }, message: { marginTop: 12 } });
