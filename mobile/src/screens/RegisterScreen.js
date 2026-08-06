import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { AuthContext } from '../AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [details, setDetails] = useState({ name: '', age: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async () => {
    try {
      await register(details);
      navigation.navigate('Records');
    } catch (err) {
      setError('Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput style={styles.input} placeholder="Full name" value={details.name} onChangeText={(t) => setDetails({ ...details, name: t })} />
      <TextInput style={styles.input} placeholder="Age" value={details.age} onChangeText={(t) => setDetails({ ...details, age: t })} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Phone" value={details.phone} onChangeText={(t) => setDetails({ ...details, phone: t })} />
      <TextInput style={styles.input} placeholder="Password" value={details.password} onChangeText={(t) => setDetails({ ...details, password: t })} secureTextEntry />
      <Button title="Register" onPress={onSubmit} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, marginBottom: 12 },
  input: { borderColor: '#ccc', borderWidth: 1, padding: 8, marginBottom: 12 },
  error: { color: 'red', marginTop: 12 }
});
