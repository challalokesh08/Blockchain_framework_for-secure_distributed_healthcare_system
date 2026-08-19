import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !age.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields required.');
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), age: age.trim(), phone: phone.trim(), password });
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.error || 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Register</Text>
      <Text style={s.sub}>Create your patient account</Text>
      <TextInput style={s.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
      <TextInput style={s.input} placeholder="Age" placeholderTextColor="#666" value={age} onChangeText={setAge} keyboardType="numeric" />
      <TextInput style={s.input} placeholder="Phone (+15550000004)" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
      <TextInput style={s.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      {loading ? <ActivityIndicator size="small" color="#58d9a6" style={{ marginVertical: 12 }} /> : <Button title="Register" color="#58d9a6" onPress={onSubmit} />}
      <View style={{ marginTop: 16 }}><Button title="Back to Login" color="#5b8ff9" onPress={() => navigation.navigate('Login')} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 20 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 8, color: '#fff', backgroundColor: '#111', fontSize: 16 },
});
