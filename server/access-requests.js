// Patient-controlled file access requests: a clinician asks, the patient
// (or an admin, for oversight) approves, and approval grants scoped consent.
class AccessRequestRegistry {
  constructor() {
    this.requests = new Map();
    this.seq = 0;
  }

  create({ patientId, requester, reason }) {
    const request = {
      id: `AR-${(this.seq++ + 1).toString().padStart(3, '0')}-${Date.now().toString().slice(-6)}`,
      patientId,
      requester: requester.name,
      role: requester.role,
      reason: reason || 'Access to medical files',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      decidedBy: null,
      decidedAt: null,
      consentId: null
    };
    this.requests.set(request.id, request);
    return request;
  }

  get(id) {
    return this.requests.get(id) || null;
  }

  listFor(user) {
    const all = [...this.requests.values()];
    if (user.role === 'Admin') return all;
    if (user.role === 'Patient') return all.filter(r => r.patientId === user.patientId);
    return all.filter(r => r.requester === user.name);
  }

  decide(id, { approved, user, consentId = null }) {
    const r = this.requests.get(id);
    if (!r) throw new Error('File access request not found.');
    if (r.status !== 'PENDING') throw new Error(`Request already ${r.status.toLowerCase()}.`);
    r.status = approved ? 'APPROVED' : 'REJECTED';
    r.decidedBy = user.name;
    r.decidedAt = new Date().toISOString();
    r.consentId = consentId;
    return r;
  }
}

module.exports = { AccessRequestRegistry };
