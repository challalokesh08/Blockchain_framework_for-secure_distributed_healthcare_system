const crypto = require('crypto');
const { encrypt, decrypt, sha256 } = require('./crypto');
const offchain = require('./offchain');

const VALIDATORS = [
  'VALIDATOR-CARE-NODE-A',
  'VALIDATOR-CARE-NODE-B',
  'VALIDATOR-LAB-NODE',
  'VALIDATOR-INSURANCE-NODE',
  'VALIDATOR-HOSPITAL-NODE'
];

const VALIDATOR_SECRET = process.env.VALIDATOR_SECRET || 'ProofOfAuthorityHealthcareSigningKey2026';

function roleForValidator(validator) {
  if (validator.includes('LAB')) return 'Laboratory';
  if (validator.includes('INSURANCE')) return 'Insurance';
  if (validator.includes('HOSPITAL')) return 'Hospital';
  return 'Doctor';
}

class PatientRecordTransaction {
  constructor({ patientId, author, contentType, dataHash, dataRef }) {
    this.patientId = patientId;
    this.author = author;
    this.contentType = contentType || 'record';
    this.dataHash = dataHash;
    this.dataRef = dataRef || `offchain:${dataHash}`;
    this.timestamp = new Date().toISOString();
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '', validator = '') {
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.validator = validator;
    this.signature = '';
    this.hash = this.computeHash();
  }

  computeHash() {
    return sha256(
      this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.validator + this.signature
    );
  }

  sign(validator) {
    this.validator = validator;
    this.signature = crypto
      .createHmac('sha256', VALIDATOR_SECRET)
      .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + validator)
      .digest('hex');
    this.hash = this.computeHash();
    return this;
  }

  verifySignature() {
    if (!this.signature || !this.validator) return false;
    const expected = crypto
      .createHmac('sha256', VALIDATOR_SECRET)
      .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.validator)
      .digest('hex');
    return expected === this.signature;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.validatorIndex = 0;
  }

  createGenesisBlock() {
    return new Block(new Date().toISOString(), [{ message: 'Genesis block for Healthcare Ledger' }], '0', 'VALIDATOR-GENESIS');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction({ patientId, author, data, contentType }) {
    if (!patientId || !author || data === undefined || data === null) {
      throw new Error('Invalid transaction: missing required fields.');
    }

    const plain = JSON.stringify(data);
    const dataHash = sha256(plain);

    const encryptedPayload = encrypt(plain);
    offchain.save(dataHash, { ciphertext: encryptedPayload });

    const txn = new PatientRecordTransaction({ patientId, author, dataHash, contentType });
    this.pendingTransactions.push(txn);
    return txn;
  }

  finalizeBlock(validatorName) {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    const validator = this.resolveValidator(validatorName);
    const block = new Block(
      new Date().toISOString(),
      this.pendingTransactions,
      this.getLatestBlock().hash,
      validator
    );
    block.sign(validator);

    this.chain.push(block);
    this.pendingTransactions = [];
    this.validatorIndex = (this.validatorIndex + 1) % VALIDATORS.length;
    return block;
  }

  resolveValidator(name) {
    if (name && VALIDATORS.some(v => v.toLowerCase() === String(name).toLowerCase())) {
      return name;
    }
    return VALIDATORS[this.validatorIndex % VALIDATORS.length];
  }

  getPatientRecords(patientId) {
    const records = [];
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.patientId === patientId) {
          records.push(this.resolveRecord(transaction, block));
        }
      }
    }
    return records;
  }

  resolveRecord(transaction, block) {
    const base = {
      patientId: transaction.patientId,
      author: transaction.author,
      contentType: transaction.contentType,
      dataHash: transaction.dataHash,
      dataRef: transaction.dataRef,
      timestamp: transaction.timestamp,
      hash: block.hash,
      previousHash: block.previousHash,
      validator: block.validator
    };

    const stored = offchain.get(transaction.dataHash);
    if (!stored || !stored.ciphertext) {
      return { ...base, data: { error: 'Off-chain payload unavailable for this record.' } };
    }

    let decrypted;
    try {
      decrypted = decrypt(stored.ciphertext);
    } catch (err) {
      return { ...base, data: { error: 'Unable to decrypt off-chain payload: ' + err.message } };
    }

    if (sha256(decrypted) !== transaction.dataHash) {
      return { ...base, data: { error: 'Off-chain payload hash mismatch — integrity check failed.' } };
    }

    let data;
    try {
      data = JSON.parse(decrypted);
    } catch (err) {
      return { ...base, data: { error: 'Decrypted payload is not valid JSON.' } };
    }

    return { ...base, data };
  }

  isChainValid() {
    for (let idx = 1; idx < this.chain.length; idx += 1) {
      const currentBlock = this.chain[idx];
      const previousBlock = this.chain[idx - 1];

      if (currentBlock.hash !== currentBlock.computeHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if (!currentBlock.verifySignature()) {
        return false;
      }
    }
    return true;
  }

  getStatus() {
    return {
      consensus: 'Proof-of-Authority (PoA)',
      validators: VALIDATORS.length,
      validatorRotation: VALIDATORS[this.validatorIndex % VALIDATORS.length],
      blocks: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      valid: this.isChainValid()
    };
  }
}

module.exports = { Blockchain, PatientRecordTransaction, VALIDATORS, roleForValidator };