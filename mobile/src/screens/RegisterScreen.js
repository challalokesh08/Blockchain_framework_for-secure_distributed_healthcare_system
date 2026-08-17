import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !age.trim() || !phone.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), age: age.trim(), phone: phone.trim(), password });
      navigation.navigate('Records');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Text style={styles.subtitle}>Create your patient account</Text>

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#666" value={age} onChangeText={setAge} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Phone (+15550000004)" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Choose a password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />

      {loading ? (
        <ActivityIndicator size="small" color="#58d9a6" style={{ marginVertical: 12 }} />
      ) : (
        <Button title="Register" onPress={onSubmit} color="#58d9a6" />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 16 }}>
        <Button title="Back to Login" onPress={() => navigation.navigate('Login')} color="#5b8ff9" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 8, color: '#fff', backgroundColor: '#111' },
  error: { color: '#ff6b6b', marginTop: 12, fontSize: 14 }
});
