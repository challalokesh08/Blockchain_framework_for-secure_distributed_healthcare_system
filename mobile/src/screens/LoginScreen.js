import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!phone.trim() || !password.trim()) {
      setError('Please enter phone number and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(phone.trim(), password);
      navigation.navigate('Records');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Enter your phone number and password</Text>

      <TextInput style={styles.input} placeholder="Phone (+15550000004)" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />

      {loading ? (
        <ActivityIndicator size="small" color="#5b8ff9" style={{ marginVertical: 12 }} />
      ) : (
        <Button title="Login" onPress={onSubmit} color="#5b8ff9" />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 16 }}>
        <Button title="Register as Patient" onPress={() => navigation.navigate('Register')} color="#58d9a6" />
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
