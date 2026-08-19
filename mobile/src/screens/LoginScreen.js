import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter phone and password.');
      return;
    }
    setLoading(true);
    try {
      await login(phone.trim(), password);
      navigation.navigate('Records');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Sign In</Text>
      <Text style={s.sub}>Enter your phone number and password</Text>

      <TextInput style={s.input} placeholder="Phone (+15550000004)" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
      <TextInput style={s.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

      {loading ? (
        <ActivityIndicator size="small" color="#5b8ff9" style={{ marginVertical: 12 }} />
      ) : (
        <Button title="Login" color="#5b8ff9" onPress={onSubmit} />
      )}

      <View style={{ marginTop: 16 }}>
        <Button title="Register as Patient" color="#58d9a6" onPress={() => navigation.navigate('Register')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 20 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 8, color: '#fff', backgroundColor: '#111', fontSize: 16 },
});
