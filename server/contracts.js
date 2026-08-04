const { PatientRecordTransaction } = require('./blockchain');

const allowedActions = {
  approveAccess: (contract, executor) => {
    if (contract.status !== 'PENDING') {
      throw new Error('Contract is not pending approval.');
    }
    contract.status = 'APPROVED';
    contract.history.push({ action: 'APPROVE_ACCESS', executor, timestamp: new Date().toISOString() });
  },
  finalize: (contract, executor) => {
    if (contract.status === 'COMPLETED') {
      throw new Error('Contract already completed.');
    }
    contract.status = 'COMPLETED';
    contract.history.push({ action: 'FINALIZE', executor, timestamp: new Date().toISOString() });
  }
};

class ContractEngine {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.contracts = [];
    this.lastId = 0;
  }

  createContract(details, creator) {
    const contract = {
      contractId: `CTR-${++this.lastId}`,
      contractType: details.contractType || 'HealthcareAgreement',
      status: 'PENDING',
      details,
      creator,
      history: [{ action: 'DEPLOY', executor: creator, timestamp: new Date().toISOString() }]
    };

    this.contracts.push(contract);
    return contract;
  }

  getContracts() {
    return this.contracts;
  }

  executeContract(contractId, action, executor) {
    const contract = this.contracts.find((item) => item.contractId === contractId);
    if (!contract) {
      throw new Error('Contract not found.');
    }

    const handler = allowedActions[action];
    if (!handler) {
      throw new Error('Invalid contract action.');
    }

    handler(contract, executor);
    if (contract.status === 'COMPLETED') {
      this.blockchain.addTransaction(new PatientRecordTransaction(
        contract.details.patientId,
        executor.name,
        {
          contractId: contract.contractId,
          event: 'Contract finalized',
          purpose: contract.details.purpose
        }
      ));
    }

    return contract;
  }
}

module.exports = { ContractEngine };
