const UNLOCK_MINUTES = Number(process.env.EMERGENCY_UNLOCK_MINUTES || 30);
const REQUEST_MINUTES = Number(process.env.EMERGENCY_REQUEST_MINUTES || 60);

// Emergency access is break-glass only: a doctor requests, an admin approves (2-of-2),
// access is time-boxed, scoped to vital info only, and every step lands on the ledger.
class EmergencyRegistry {
  constructor() {
    this.requests = new Map();
    this.seq = 0;
  }

  request({ patientId, doctor, doctorPhone, reason, triageCode }) {
    const id = `ER-${(this.seq++ + 1).toString().padStart(3, '0')}-${Date.now().toString().slice(-6)}`;
    const request = {
      id,
      patientId,
      doctor,
      doctorPhone,
      reason,
      triageCode,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + REQUEST_MINUTES * 60 * 1000).toISOString(),
      confirmedBy: null,
      unlockId: null,
      unlockExpiresAt: null
    };
    this.requests.set(id, request);
    return request;
  }

  confirm(id, adminName, approved) {
    const r = this.requests.get(id);
    if (!r) throw new Error('Emergency request not found.');
    if (r.status !== 'PENDING') throw new Error(`Request already ${r.status.toLowerCase()}.`);
    if (Date.now() > new Date(r.expiresAt).getTime()) {
      r.status = 'EXPIRED';
      throw new Error('Emergency request has expired. Ask the doctor to raise a new request.');
    }
    r.confirmedBy = adminName;
    if (approved) {
      r.status = 'APPROVED';
      r.unlockId = `UL-${r.id}`;
      r.unlockExpiresAt = new Date(Date.now() + UNLOCK_MINUTES * 60 * 1000).toISOString();
    } else {
      r.status = 'REJECTED';
      r.rejectedAt = new Date().toISOString();
    }
    return r;
  }

  getActiveUnlock(patientId) {
    this.pruneExpired();
    for (const r of this.requests.values()) {
      if (
        r.status === 'APPROVED' &&
        r.patientId === patientId &&
        new Date(r.unlockExpiresAt).getTime() > Date.now()
      ) {
        return r;
      }
    }
    return null;
  }

  list({ role, doctor, patientId } = {}) {
    this.pruneExpired();
    const all = [...this.requests.values()];
    if (role === 'Admin') return all;
    if (role === 'Patient') return all.filter(r => r.patientId === patientId);
    return all.filter(r => r.doctor === doctor);
  }

  pruneExpired() {
    for (const [id, r] of this.requests) {
      if (r.status === 'PENDING' && Date.now() > new Date(r.expiresAt).getTime()) {
        r.status = 'EXPIRED';
      }
      if (
        r.status === 'APPROVED' &&
        r.unlockExpiresAt &&
        Date.now() > new Date(r.unlockExpiresAt).getTime()
      ) {
        r.status = 'EXPIRED';
      }
    }
  }
}

module.exports = { EmergencyRegistry };