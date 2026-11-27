import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, Button, StyleSheet, ActivityIndicator,
  RefreshControl, Linking, Alert
} from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import api from '../api';
import { getFileViewUrl, saveFileToDevice } from '../files';

export default function FilesScreen() {
  const { user } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    if (!user?.patientId) { setLoading(false); return; }
    try {
      const res = await api.get('/api/files', { params: { patientId: user.patientId } });
      const list = res.data?.files || [];
      setFiles(list);
      const pairs = await Promise.all(list.map(async f => {
        try { return [f.filename, await getFileViewUrl(f)]; }
        catch (e) { return [f.filename, null]; }
      }));
      setLinks(Object.fromEntries(pairs));
    } catch (e) {
      Alert.alert('Error', 'Unable to load your files.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [load]);

  const view = async (f) => {
    const url = links[f.filename] || await getFileViewUrl(f);
    try { await Linking.openURL(url); }
    catch (e) { Alert.alert('Error', 'Unable to open this file.'); }
  };

  const download = async (f) => {
    setBusy(f.filename);
    try {
      await saveFileToDevice(f);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Unable to save this file.');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#5b8ff9" /></View>;

  return (
    <View style={s.container}>
      <Text style={s.title}>My Files</Text>
      <Text style={s.sub}>Patient: {user?.patientId || '—'} · updates every 2 seconds</Text>
      <FlatList
        data={files}
        keyExtractor={f => f.filename}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#5b8ff9" />}
        ListEmptyComponent={<Text style={s.empty}>No files have been uploaded for you yet.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.originalname}</Text>
            <Text style={s.meta}>{item.mimetype} · {(item.size / 1024).toFixed(1)} KB</Text>
            {item.mimetype?.startsWith('image/') && links[item.filename] ? (
              <Image source={{ uri: links[item.filename] }} style={s.preview} resizeMode="contain" />
            ) : null}
            <View style={s.actions}>
              <View style={s.btn}><Button title="View" color="#5b8ff9" onPress={() => view(item)} /></View>
              <View style={s.btn}>
                <Button
                  title={busy === item.filename ? 'Saving…' : 'Download'}
                  color="#58d9a6"
                  disabled={!!busy}
                  onPress={() => download(item)}
                />
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#08101a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#08101a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub: { fontSize: 12, color: '#888', marginBottom: 12 },
  empty: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 40 },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 12, backgroundColor: '#111' },
  name: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  meta: { fontSize: 12, color: '#888', marginBottom: 8 },
  preview: { width: '100%', height: 180, backgroundColor: '#000', borderRadius: 8, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1 },
});
