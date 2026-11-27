import React, { useEffect, useMemo, useState, useContext } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert,
  Modal, FlatList, TouchableOpacity
} from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

function OptionPicker({ label, value, options, placeholder, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity
        style={[s.input, disabled && s.inputDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text style={value ? s.pickerValue : s.pickerPlaceholder}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{label}</Text>
              <Button title="Close" color="#888" onPress={() => setOpen(false)} />
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.option} onPress={() => { onSelect(item.value); setOpen(false); }}>
                  <Text style={s.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/doctors')
      .then(r => { setDepartments(r.data?.departments || []); setDoctors(r.data?.doctors || []); })
      .catch(() => Alert.alert('Error', 'Could not load the doctor directory.'));
  }, []);

  const doctorOptions = useMemo(() => doctors
    .filter(d => d.department === department)
    .map(d => ({ value: d.name, label: d.name + (d.patients ? ` · ${d.patients} patients` : '') })), [doctors, department]);

  const onSubmit = async () => {
    if (!name.trim() || !age.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields required.');
      return;
    }
    if (!department || !assignedDoctor) {
      Alert.alert('Error', 'Please choose a department and a doctor.');
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), age: age.trim(), phone: phone.trim(), password, department, assignedDoctor });
      navigation.popToTop();
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
      <OptionPicker
        label="Department"
        value={department}
        placeholder="Select a department"
        options={departments.map(d => ({ value: d, label: d }))}
        onSelect={(v) => { setDepartment(v); setAssignedDoctor(''); }}
      />
      <OptionPicker
        label="Assigned Doctor"
        value={assignedDoctor}
        placeholder={department ? 'Select a doctor' : 'Choose a department first'}
        options={doctorOptions}
        onSelect={setAssignedDoctor}
        disabled={!department}
      />
      {loading ? <ActivityIndicator size="small" color="#58d9a6" style={{ marginVertical: 12 }} /> : <Button title="Register" color="#58d9a6" onPress={onSubmit} />}
      <View style={{ marginTop: 16 }}><Button title="Back to Login" color="#5b8ff9" onPress={() => navigation.goBack()} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 20 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 12, borderRadius: 8, color: '#fff', backgroundColor: '#111', fontSize: 16 },
  inputDisabled: { opacity: 0.5 },
  label: { fontSize: 13, color: '#aaa', marginBottom: 6 },
  pickerValue: { fontSize: 15, color: '#fff' },
  pickerPlaceholder: { fontSize: 15, color: '#666' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { maxHeight: '70%', backgroundColor: '#111', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#222' },
  optionText: { fontSize: 15, color: '#ddd' },
});
