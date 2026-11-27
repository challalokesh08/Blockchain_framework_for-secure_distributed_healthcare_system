import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { AuthContext } from '../AuthContext';
import api from '../api';

export default function StaffRecordsScreen() {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [accessError, setAccessError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showEmerForm, setShowEmerForm] = useState(false);
  const [emerReason, setEmerReason] = useState('');
  const [emerTriage, setEmerTriage] = useState('3');
  const [emerMsg, setEmerMsg] = useState('');
  const [vitals, setVitals] = useState(null);
  const [emerBusy, setEmerBusy] = useState(false);
  const [accessRequests, setAccessRequests] = useState([]);
  const [accessReason] = useState('Request to review medical records');
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessMsg, setAccessMsg] = useState('');
  const selectedRef = useRef(null);
  const prevStatusesRef = useRef({});
  const reloadingRef = useRef(false);
  const reloadRef = useRef(null);
  const isDoctorOrAdmin = user?.role === 'Doctor' || user?.role === 'Admin';
  const isAdmin = user?.role === 'Admin';

  const loadEmergency = () => {
    api.get('/api/emergency')
      .then(r => setRequests(r.data.requests || []))
      .catch(() => setRequests([]));
  };

  useEffect(() => {
    api.get('/api/patients')
      .then(r => setPatients(r.data.patients || []))
      .catch(() => Alert.alert('Error', 'Could not load patient list.'))
      .finally(() => setLoading(false));
    loadEmergency();
    // Keep emergency status in sync: the admin may approve on another device.
    const timer = setInterval(loadEmergency, 2000);
    return () => clearInterval(timer);
  }, []);

  const loadEmergencyDetail = () => {
    try {
      loadEmergency();
    } catch (e) {}
  };

  const loadAccessRequests = useCallback(async () => {
    try {
      const res = await api.get('/api/access-request');
      const list = res.data?.requests || [];
      setAccessRequests(list);
      const statuses = {};
      list.forEach(r => { statuses[r.id] = r.status; });
      const pid = selectedRef.current?.patientId;
      const justApproved = !!pid && list.some(r =>
        r.patientId === pid &&
        prevStatusesRef.current[r.id] === 'PENDING' &&
        statuses[r.id] === 'APPROVED'
      );
      // Record statuses before reloading so the next poll cannot re-trigger this transition.
      prevStatusesRef.current = statuses;
      if (justApproved && !reloadingRef.current) {
        reloadingRef.current = true;
        setAccessError('');
        setAccessMsg('File access approved — reloading records.');
        try {
          if (reloadRef.current) await reloadRef.current();
        } finally {
          reloadingRef.current = false;
        }
      }
    } catch (e) {
      // Polling is best-effort; keep the current screen usable.
    }
  }, []);

  useEffect(() => {
    loadAccessRequests();
    const timer = setInterval(loadAccessRequests, 2000);
    return () => clearInterval(timer);
  }, [loadAccessRequests]);

  const selectPatient = async (p) => {
    const changed = selectedRef.current?.patientId !== p.patientId;
    selectedRef.current = p;
    setSelected(p); setLoadingDetail(true); setAccessError(''); setRecords([]); setFiles([]); setVitals(null); setEmerMsg('');
    if (changed) { setAccessMsg(''); }
    loadEmergency();
    loadAccessRequests();
    try {
      const rRes = await api.get('/api/records', { params: { patientId: p.patientId } });
      let fRes = { data: { files: [] } };
      try {
        fRes = await api.get('/api/files', { params: { patientId: p.patientId } });
      } catch (err) {
        if (err.response?.status === 403) {
          setAccessError(err.response.data?.error || 'Patient consent required for files.');
        }
      }
      setRecords((rRes.data.records || []).filter(r => r.data?.diagnosis));
      setFiles(fRes.data.files || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessError(err.response.data?.error || 'Patient consent required.');
        setRecords([]);
        setFiles([]);
      } else {
        Alert.alert('Error', 'Could not load records.');
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  // Indirection keeps the polling callback from capturing a stale selectPatient.
  reloadRef.current = () => selectPatient(selectedRef.current);

  const requestFileAccess = () => {
    if (!selected) return;
    Alert.alert(
      'Request access?',
      `Ask the patient and administrator for permission to open ${selected.name}'s records and files.`,
      [
        { text: 'No, cancel', style: 'cancel' },
        { text: 'Yes, request', onPress: () => sendAccessRequest() }
      ]
    );
  };

  const sendAccessRequest = async () => {
    setAccessBusy(true); setAccessMsg('');
    try {
      const response = await api.post('/api/access-request', {
        patientId: selected.patientId,
        reason: accessReason.trim()
      });
      setAccessMsg(response.data?.message || 'Access request sent to the patient.');
      await loadAccessRequests();
    } catch (error) {
      setAccessMsg(error.response?.data?.error || 'Unable to submit the access request.');
    } finally {
      setAccessBusy(false);
    }
  };

  const openFile = async (f) => {
    try {
      const res = await api.get(`/api/files/link/${encodeURIComponent(f.filename)}`);
      await Linking.openURL(res.data.url);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Unable to open this file.');
    }
  };

  const requestEmergency = async () => {
    if (!emerReason.trim()) { Alert.alert('Emergency unlock', 'Please describe the emergency reason.'); return; }
    const t = parseInt(emerTriage, 10);
    if (isNaN(t) || t < 1 || t > 3) { Alert.alert('Emergency unlock', 'Triage code must be 1, 2 or 3 (critical cases only).'); return; }
    setEmerBusy(true); setEmerMsg('');
    try {
      const response = await api.post('/api/emergency/request', { patientId: selected.patientId, reason: emerReason.trim(), triageCode: t });
      setEmerMsg(response.data.message);
      setShowEmerForm(false); setEmerReason('');
      loadEmergencyDetail();
    } catch (error) {
      setEmerMsg(error.response?.data?.error || 'Unable to raise emergency request.');
    } finally {
      setEmerBusy(false);
    }
  };

  const confirmEmergency = async (id, approved) => {
    setEmerBusy(true); setEmerMsg('');
    try {
      const response = await api.post(`/api/emergency/confirm/${id}`, { approved });
      setEmerMsg(response.data.message);
      loadEmergencyDetail();
    } catch (error) {
      setEmerMsg(error.response?.data?.error || 'Unable to update the emergency request.');
    } finally {
      setEmerBusy(false);
    }
  };

  const viewVitalPacket = async () => {
    setEmerBusy(true); setEmerMsg('');
    try {
      const response = await api.get('/api/records', { params: { patientId: selected.patientId, emergency: '1' } });
      setVitals(response.data.vitals || {});
      setRecords([]);
      setFiles([]);
    } catch (error) {
      setEmerMsg(error.response?.data?.error || 'Unable to load the vital packet.');
    } finally {
      setEmerBusy(false);
    }
  };

  const activeForPatient = (pid) => requests.find(r =>
    r.patientId === pid && r.status === 'APPROVED' && r.unlockExpiresAt && new Date(r.unlockExpiresAt).getTime() > Date.now()
  );

  const EmergencySection = ({ pid }) => {
    const active = activeForPatient(pid);
    const pendingList = requests.filter(r => r.patientId === pid && r.status === 'PENDING');
    if (!isDoctorOrAdmin) return null;
    return (
      <View style={s.card}>
        <View style={s.btnRow}>
          <Text style={s.sectHead}>Emergency access (break-glass)</Text>
          <Button title="Refresh" color="#5b8ff9" onPress={loadEmergencyDetail} disabled={emerBusy} />
        </View>
        {active ? (
          <>
            <Text style={s.good}>ACTIVE UNLOCK — expires {new Date(active.unlockExpiresAt).toLocaleString()}</Text>
            <Text style={s.muted}>Requested by {active.doctor} · approved by {active.confirmedBy} · triage {active.triageCode}. Vital info only — full history stays locked.</Text>
            <Button title="View vital packet" color="#2fbf9f" onPress={viewVitalPacket} disabled={emerBusy} />
          </>
        ) : pendingList.length > 0 ? (
          pendingList.map(r => (
            <View key={r.id}>
              <Text style={s.warn}>PENDING — request {r.id} (triage {r.triageCode}) by {r.doctor} awaits admin approval.</Text>
              <Text style={s.muted}>{r.reason}</Text>
              {isAdmin ? (
                <View style={s.btnRow}>
                  <Button title="Approve" color="#2fbf9f" onPress={() => confirmEmergency(r.id, true)} disabled={emerBusy} />
                  <Button title="Reject" color="#ff7a6b" onPress={() => confirmEmergency(r.id, false)} disabled={emerBusy} />
                </View>
              ) : null}
            </View>
          ))
        ) : user?.role === 'Admin' ? (
          <Text style={s.muted}>No pending emergency requests for this patient.</Text>
        ) : (
          <>
            <Text style={s.muted}>Patient unable to consent? Request a time-boxed, vital-only unlock. Requires admin approval and is recorded on the ledger.</Text>
            {showEmerForm ? (
              <>
                <TextInput
                  style={s.input}
                  placeholder="Reason (e.g. RTA victim, unconscious)"
                  placeholderTextColor="#666"
                  multiline
                  value={emerReason}
                  onChangeText={setEmerReason}
                />
                <TextInput
                  style={s.input}
                  placeholder="Triage code (1-3, critical only)"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={emerTriage}
                  onChangeText={setEmerTriage}
                />
                <View style={s.btnRow}>
                  <Button title="Request unlock" color="#5b8ff9" onPress={requestEmergency} disabled={emerBusy} />
                  <Button title="Cancel" color="#888" onPress={() => setShowEmerForm(false)} />
                </View>
              </>
            ) : (
              <Button title="Request emergency unlock" color="#5b8ff9" onPress={() => setShowEmerForm(true)} />
            )}
          </>
        )}
        {emerMsg ? <Text style={s.msg}>{emerMsg}</Text> : null}
      </View>
    );
  };

  const VitalCard = () => {
    if (!vitals) return null;
    return (
      <View style={[s.card, { borderColor: '#2fbf9f' }]}>
        <Text style={s.sectHead}>Emergency vital packet — VITAL ONLY</Text>
        <Text style={s.text}>Blood type: {vitals.bloodType}</Text>
        <Text style={s.text}>Allergies: {(vitals.allergies || []).join(', ') || 'None'}</Text>
        <Text style={s.text}>Medications: {(vitals.medications || []).join(', ') || 'None'}</Text>
        <Text style={s.text}>Chronic conditions: {(vitals.chronicConditions || []).join(', ') || 'None'}</Text>
      </View>
    );
  };

  const AccessSection = ({ pid, assigned }) => {
    const latest = accessRequests
      .filter(r => r.patientId === pid)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const statusStyle = latest?.status === 'APPROVED' ? s.good
      : latest?.status === 'REJECTED' ? s.accessError : s.warn;
    return (
      <View style={s.card}>
        <View style={s.btnRow}>
          <Text style={s.sectHead}>File access</Text>
          <Button title="Refresh" color="#5b8ff9" onPress={loadAccessRequests} disabled={accessBusy} />
        </View>
        {latest ? (
          <Text style={statusStyle}>
            Request status: {latest.status} · requester {latest.requester} · {new Date(latest.createdAt).toLocaleString()}
          </Text>
        ) : (
          <Text style={s.muted}>No file access requests for this patient yet.</Text>
        )}
        {assigned ? (
          <Text style={s.good}>Assigned care team — direct access. No permission request needed.</Text>
        ) : accessError ? (
          <Button title="Request file access" color="#5b8ff9" onPress={requestFileAccess} disabled={accessBusy} />
        ) : null}
        {accessMsg ? <Text style={s.msg}>{accessMsg}</Text> : null}
      </View>
    );
  };

  const assignedToMe = !!selected && (
    user?.role === 'Admin' ||
    ((user?.role === 'Doctor' || user?.role === 'Nurse') && selected.doctor === user.name) ||
    (user?.role === 'Hospital' && !!selected.hospital &&
      selected.hospital.toLowerCase() === String(user.organization || user.name).toLowerCase())
  );

  const filtered = patients.filter(p =>
    `${p.patientId} ${p.name} ${p.phone}`.toLowerCase().includes(filter.toLowerCase())
  );
  const myPatients = patients.filter(p => p.assignedToYou);

  if (selected) {
    const items = [
      ...records.map(r => ({ type: 'record', key: `r-${r.hash}-${r.timestamp}`, data: r })),
      ...files.map(f => ({ type: 'file', key: `f-${f.filename}`, data: f }))
    ];
    return (
      <View style={s.container}>
        <View style={s.headRow}>
          <Text style={s.title}>{selected.name}</Text>
          <Button title="Back" color="#888" onPress={() => {
            selectedRef.current = null; setSelected(null); setRecords([]); setFiles([]); setAccessMsg('');
          }} />
        </View>
        <Text style={s.sub}>Patient: {selected.patientId} | {selected.phone}</Text>
        {loadingDetail ? <ActivityIndicator size="large" color="#5b8ff9" style={{ marginTop: 24 }} /> : (
          <>
            <EmergencySection pid={selected.patientId} />
            <VitalCard />
            <AccessSection pid={selected.patientId} assigned={assignedToMe} />
            {accessError ? (
              <>
                <Text style={s.accessError}>{accessError}</Text>
                <Text style={s.hint}>Ask the patient to grant consent on their Records screen, then try again.</Text>
              </>
            ) : (
              <>
                <Text style={s.resultHead}>{records.length} record(s) · {files.length} file(s)</Text>
                <FlatList
                  data={items}
                  keyExtractor={i => i.key}
                  style={{ marginTop: 10 }}
                  renderItem={({ item }) => {
                if (item.type === 'record') {
                  const r = item.data;
                  return (
                    <View style={s.card}>
                      <View style={s.head}><Text style={s.author}>{r.author}</Text><Text style={s.date}>{new Date(r.timestamp).toLocaleDateString()}</Text></View>
                      {r.data?.department ? <Text style={s.text}>Department: {r.data.department}</Text> : null}
                      {r.data?.diagnosis ? <Text style={s.text}>Diagnosis: {r.data.diagnosis}</Text> : null}
                      {r.data?.physician ? <Text style={s.text}>Physician: {r.data.physician}</Text> : null}
                      {r.data?.lab ? <Text style={s.text}>Lab: {r.data.lab}</Text> : null}
                      {r.data?.notes ? <Text style={s.text}>Notes: {r.data.notes}</Text> : null}
                      <Text style={s.hash}>Block: {r.hash?.substring(0, 16)}...</Text>
                    </View>
                  );
                }
                const f = item.data;
                return (
                  <View style={s.card}>
                    <View style={s.head}><Text style={s.author}>{f.originalname}</Text><Text style={s.date}>{new Date(f.timestamp).toLocaleDateString()}</Text></View>
                    <Text style={s.text}>Type: {f.mimetype}</Text>
                    <Text style={s.text}>Size: {(f.size / 1024).toFixed(1)} KB</Text>
                    <View style={s.btnRow}>
                      <Button title="View" color="#5b8ff9" onPress={() => openFile(f)} />
                      <Button title="Download" color="#58d9a6" onPress={() => openFile(f)} />
                    </View>
                  </View>
                );
              }}
            />
              </>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>All Patients</Text>
      <Text style={s.sub}>Logged in as: {user?.name} ({user?.role})</Text>
      {user?.role !== 'Admin' && (
        <View style={{ marginBottom: 12 }}>
          <Text style={s.sectHead}>My patients ({myPatients.length})</Text>
          {myPatients.length === 0 ? <Text style={s.hint}>No patients assigned to you yet.</Text> : (
            <FlatList
              data={myPatients}
              keyExtractor={p => `my-${p.patientId}`}
              style={{ maxHeight: 210 }}
              renderItem={({ item }) => (
                <View style={[s.card, { borderColor: '#2fbf9f' }]}>
                  <View style={s.head}><Text style={s.author}>{item.name}</Text><Text style={s.date}>{item.patientId}</Text></View>
                  <Text style={s.text}>{item.department || '—'} · Dr: {item.doctor || '—'}</Text>
                  {item.diagnosis ? <Text style={s.text}>Condition: {item.diagnosis}</Text> : null}
                  {item.summary ? <Text style={s.muted}>{item.summary}</Text> : null}
                  <Text style={s.text}>Phone: {item.phone || '—'}</Text>
                  <Button title="View Records" color="#2fbf9f" onPress={() => selectPatient(item)} />
                </View>
              )}
            />
          )}
        </View>
      )}
      <TextInput
        style={s.input}
        placeholder="Search name, ID or phone..."
        placeholderTextColor="#666"
        value={filter}
        onChangeText={setFilter}
      />
      {loading ? <ActivityIndicator size="large" color="#5b8ff9" style={{ marginTop: 24 }} /> : (
        <>
          <Text style={s.resultHead}>{filtered.length} patient(s)</Text>
          {filtered.length === 0 && <Text style={s.hint}>No patients match your search.</Text>}
          <FlatList
            data={filtered}
            keyExtractor={p => p.patientId}
            style={{ marginTop: 10 }}
            renderItem={({ item }) => (
              <View style={s.card}>
                <View style={s.head}><Text style={s.author}>{item.name}</Text><Text style={s.date}>{item.patientId}</Text></View>
                <Text style={s.text}>Phone: {item.phone}</Text>
                <Text style={s.text}>Age: {item.age}</Text>
                <Button title="View Records" color="#5b8ff9" onPress={() => selectPatient(item)} />
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#08101a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 13, color: '#888', marginBottom: 16 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  input: { borderColor: '#333', borderWidth: 1, padding: 12, marginBottom: 10, borderRadius: 8, color: '#fff', backgroundColor: '#111', fontSize: 16 },
  hint: { fontSize: 13, color: '#666', marginTop: 8, textAlign: 'center' },
  accessError: { fontSize: 14, color: '#ffb063', marginTop: 16, textAlign: 'center', lineHeight: 20 },
  resultHead: { fontSize: 13, color: '#888', marginTop: 4 },
  card: { padding: 14, borderWidth: 1, borderColor: '#333', borderRadius: 10, marginBottom: 10, backgroundColor: '#111' },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  author: { fontSize: 14, fontWeight: '600', color: '#fff' },
  date: { fontSize: 12, color: '#888' },
  text: { fontSize: 13, color: '#ccc', marginBottom: 2 },
  hash: { fontSize: 11, color: '#666', marginTop: 6 },
  sectHead: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 8 },
  good: { fontSize: 14, color: '#2fbf9f', fontWeight: '700', marginBottom: 4 },
  warn: { fontSize: 13, color: '#f0b84b', marginBottom: 4 },
  muted: { fontSize: 12, color: '#888', marginBottom: 6 },
  msg: { fontSize: 12, color: '#8ab4ff', marginTop: 6 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 },
});