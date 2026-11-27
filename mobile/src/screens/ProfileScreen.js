import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

function Detail({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || 'Not assigned'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/profile');
      setProfile(res.data?.profile || null);
      setError('');
    } catch (e) {
      setError('Unable to load your profile. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5b8ff9" /></View>;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#5b8ff9" />}
    >
      <Text style={s.title}>My Profile</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {profile ? (
        <>
          <View style={s.card}>
            <Text style={s.sectHead}>Personal details</Text>
            <Detail label="Name" value={profile.name} />
            <Detail label="Role" value={profile.role} />
            <Detail label="Patient ID" value={profile.patientId} />
            <Detail label="Age" value={profile.age} />
            <Detail label="Phone" value={profile.phone} />
          </View>
          <View style={s.card}>
            <Text style={s.sectHead}>Care assignment</Text>
            <Detail label="Department" value={profile.department} />
            <Detail label="Assigned doctor" value={profile.assignedDoctor} />
            {profile.organization ? <Detail label="Organization" value={profile.organization} /> : null}
          </View>
        </>
      ) : null}
      <Text style={s.foot}>Signed in as {user?.name || user?.username}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#08101a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  error: { fontSize: 13, color: '#ff7a6b', marginBottom: 12 },
  card: { padding: 16, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 14, backgroundColor: '#111' },
  sectHead: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  label: { fontSize: 13, color: '#888', flex: 1 },
  value: { fontSize: 14, color: '#fff', flex: 1, textAlign: 'right' },
  foot: { fontSize: 12, color: '#666', marginTop: 12, textAlign: 'center' },
});
