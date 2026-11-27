// In-app notification inbox. SMS is handled separately by notifications.js.
// Recipients are matched against the logged-in user at read time so one
// notification can target a role (all admins) or a specific named clinician.
class NotificationRegistry {
  constructor() {
    this.items = new Map();
    this.seq = 0;
  }

  add({ recipients = [], type = 'info', title, body, patientId = null, requestId = null, link = null, actor = null }) {
    const notification = {
      id: `N-${++this.seq}-${Date.now().toString().slice(-6)}`,
      recipients,
      type,
      title: title || '',
      body: body || '',
      patientId,
      requestId,
      link,
      actor,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.items.set(notification.id, notification);
    return { ...notification };
  }

  listFor(user) {
    if (!user) return [];
    return [...this.items.values()]
      .filter(n => n.recipients.some(r => matches(r, user)))
      .map(({ recipients, ...rest }) => rest)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  markRead(id, user) {
    const n = this.items.get(id);
    if (!n) return null;
    if (!n.recipients.some(r => matches(r, user))) return null;
    n.read = true;
    return { ...n };
  }
}

function matches(recipient, user) {
  // Staff means "any non-patient role", optionally narrowed to one named user.
  if (recipient.role === 'Staff') {
    return user.role !== 'Patient' && (!recipient.name || recipient.name === user.name);
  }
  if (recipient.role === 'Patient') {
    return user.role === 'Patient' && (!recipient.patientId || user.patientId === recipient.patientId);
  }
  if (recipient.role && recipient.role !== user.role) return false;
  // Other roles (e.g. Admin) may carry patientId for context — it is not a filter.
  if (recipient.name && recipient.name !== user.name) return false;
  return true;
}

module.exports = { NotificationRegistry };
