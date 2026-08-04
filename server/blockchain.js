const CryptoJS = require('crypto-js');
const { createHash } = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'HealthcareSecureNetwork2026!';

class PatientRecordTransaction {
  constructor(patientId, author, data) {
    this.patientId = patientId;
    this.author = author;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

class Block {
  constructor(timestamp, transactions, previousHash = '') {
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.nonce = 0;
    this.hash = this.computeHash();
  }

  computeHash() {
    return createHash('sha256')
      .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
      .digest('hex');
  }

  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== '0'.repeat(difficulty)) {
      this.nonce += 1;
      this.hash = this.computeHash();
    }
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
    this.pendingTransactions = [];
    this.records = [];
  }

  createGenesisBlock() {
    return new Block(new Date().toISOString(), [{ message: 'Genesis block for Healthcare Ledger' }], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    if (!transaction.patientId || !transaction.author || !transaction.data) {
      throw new Error('Invalid transaction: missing required fields.');
    }

    const encryptedPayload = this.encryptData(JSON.stringify(transaction.data));
    const storedTransaction = new PatientRecordTransaction(
      transaction.patientId,
      transaction.author,
      encryptedPayload
    );

    this.pendingTransactions.push(storedTransaction);
    return storedTransaction;
  }

  minePendingTransactions(minerAddress) {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    const block = new Block(new Date().toISOString(), this.pendingTransactions, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [];

    const rewardTransaction = new PatientRecordTransaction(minerAddress, 'System', { reward: 'Healthcare ledger validation completed' });
    this.pendingTransactions.push(rewardTransaction);
    return block;
  }

  getPatientRecords(patientId) {
    const records = [];
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.patientId === patientId) {
          const decrypted = this.decryptData(transaction.data);
          records.push({
            patientId: transaction.patientId,
            author: transaction.author,
            timestamp: transaction.timestamp,
            data: decrypted,
            hash: block.hash,
            previousHash: block.previousHash
          });
        }
      }
    }
    return records;
  }

  encryptData(data) {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }

  decryptData(cipherText) {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      return { error: 'Unable to decrypt data' };
    }
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
    }
    return true;
  }
}

module.exports = { Blockchain, PatientRecordTransaction };
