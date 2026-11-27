import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from './api';

// Get a signed URL for a file, then save it to the device and offer the
// Android share/save sheet so the user can keep it in Downloads or Files.
export async function saveFileToDevice(f) {
  const res = await api.get(`/api/files/link/${encodeURIComponent(f.filename)}`);
  const safe = String(f.filename || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
  const target = `${FileSystem.documentDirectory}${safe}`;
  const downloaded = await FileSystem.downloadAsync(res.data.url, target);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(downloaded.uri, {
      mimeType: f.mimetype || 'application/octet-stream',
      dialogTitle: `Save ${f.originalname || f.filename}`
    });
  }
  return downloaded.uri;
}

export async function getFileViewUrl(f) {
  const res = await api.get(`/api/files/link/${encodeURIComponent(f.filename)}`);
  return res.data.url;
}
