const PROVIDER_TYPES = ['Doctor', 'Hospital', 'Laboratory', 'Insurance'];

class ConsentRegistry {
  constructor() {
    this.consents = new Map();
    this.lastId = 0;
  }

  grant({ patientId, providerName, providerType, purpose, requester }) {
    if (!patientId || !providerName) {
      throw new Error('patientId and providerName are required for consent.');
    }
    if (providerType && !PROVIDER_TYPES.includes(providerType)) {
      throw new Error(`providerType must be one of: ${PROVIDER_TYPES.join(', ')}.`);
    }

    const entry = {
      consentId: `CNS-${++this.lastId}`,
      patientId,
      providerName,
      providerType: providerType || 'Doctor',
      purpose: purpose || 'Healthcare data access',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{
        action: 'GRANT',
        executor: requester?.name || requester || 'System',
        timestamp: new Date().toISOString()
      }]
    };

    const list = this.consents.get(patientId) || [];
    const existing = list.find(c => c.providerName.toLowerCase() === providerName.toLowerCase() && !providerTypeIgnored(c.providerType, providerType));
    if (existing) {
      existing.status = 'ACTIVE';
      existing.updatedAt = entry.updatedAt;
      existing.history.push(entry.history[0]);
      return existing;
    }

    list.push(entry);
    this.consents.set(patientId, list);
    return entry;
  }

  revoke({ patientId, providerName, providerType, requester }) {
    if (!patientId || !providerName) {
      throw new Error('patientId and providerName are required for consent.');
    }

    const list = this.consents.get(patientId) || [];
    const entry = list.find(c =>
      c.providerName.toLowerCase() === providerName.toLowerCase() &&
      (!providerType || c.providerType === providerType)
    );
    if (!entry) {
      throw new Error('No matching consent found to revoke.');
    }

    entry.status = 'REVOKED';
    entry.updatedAt = new Date().toISOString();
    entry.history.push({
      action: 'REVOKE',
      executor: requester?.name || requester || 'System',
      timestamp: entry.updatedAt
    });
    return entry;
  }

  list(patientId) {
    return (patientId ? this.consents.get(patientId) || [] : this.all()).map(c => ({ ...c }));
  }

  all() {
    const out = [];
    for (const list of this.consents.values()) {
      out.push(...list);
    }
    return out;
  }

  hasActiveConsent({ patientId, requester }) {
    const list = this.consents.get(patientId) || [];
    if (list.length === 0) return false;

    const name = (requester?.name || '').toLowerCase().trim();
    const role = (requester?.role || '').toLowerCase().trim();
    const isAdmin = role === 'admin';

    const ORG_ROLE_MATCH = {
      hospital: ['hospital', 'nurse'],
      laboratory: ['laboratory'],
      insurance: ['insurance']
    };

    return list.some(c => {
      if (c.status !== 'ACTIVE') return false;
      if (isAdmin) return true;

      const providerName = (c.providerName || '').toLowerCase();
      const providerRole = (c.providerType || '').toLowerCase();

      const nameMatch = name && (providerName === name || providerName.includes(name) || name.includes(providerName));
      const orgRoleMatch = Object.keys(ORG_ROLE_MATCH).includes(providerRole) && ORG_ROLE_MATCH[providerRole].includes(role);

      return nameMatch || orgRoleMatch;
    });
  }
}

function providerTypeIgnored(slot, incoming) {
  if (!incoming) return false;
  return slot.toLowerCase() !== incoming.toLowerCase();
}

module.exports = { ConsentRegistry, PROVIDER_TYPES };