# HealthLedger Sample Data

This directory contains sample medical records for all hospital departments.

## Quick Start

### Option 1: Run the API and populate via HTTP

```bash
# Start the server
cd /tmp/healthcare-blockchain
npm run dev

# In another terminal, populate the database
node populate-records.js
```

### Option 2: Use the seed script directly

```bash
cd /tmp/healthcare-blockchain
node seed-records.js
```

## Departments & Records

| Department | Records | Doctors |
|------------|---------|---------|
| Cardiology | 12 | Dr. Rajesh Varma, Dr. Sunita Rao |
| Neurology & Neurosurgery | 12 | Dr. Arvind Swaminathan, Dr. Preeti Nair |
| Orthopaedics & Joint Replacement | 12 | Dr. Vikramaditya Rathore, Dr. Neha Kulkarni |
| Pediatrics & Neonatology | 12 | Dr. Amit Mehra, Dr. Shalini Deshmukh |
| Obstetrics & Gynecology | 12 | Dr. Ananya Sen, Dr. Ritu Bhargava |
| General & Laparoscopic Surgery | 12 | Dr. Harish Chandra, Dr. Pooja Joshi |
| Internal Medicine | 12 | Dr. Sanjay Nambiar, Dr. Kavita Hegde |
| Oncology | 12 | Dr. Siddharth Menon, Dr. Maya Pillai |
| Dermatology & Cosmetology | 12 | Dr. Tanya Kapoor, Dr. Rohan Chawla |
| Radiology & Diagnostics | 12 | Dr. Deepa Natarajan, Dr. Kunal Singhania |
| Emergency & Critical Care | 12 | Dr. Manish Tandon, Dr. Sneha Patil |

**Total: 132 records across 11 departments**

## Sample Patient IDs

- P-1001 to P-1012: Cardiology
- P-1013 to P-1024: Neurology & Neurosurgery
- P-1025 to P-1036: Orthopaedics & Joint Replacement
- P-1037 to P-1048: Pediatrics & Neonatology
- P-1049 to P-1060: Obstetrics & Gynecology
- P-1061 to P-1072: General & Laparoscopic Surgery
- P-1073 to P-1084: Internal Medicine
- P-1085 to P-1096: Oncology
- P-1097 to P-1108: Dermatology & Cosmetology
- P-1109 to P-1120: Radiology & Diagnostics
- P-1121 to P-1132: Emergency & Critical Care

## Demo Credentials

| Role | Phone | Password |
|------|-------|----------|
| Admin | +15550000003 | adminpass |
| Doctor | +15550000001 | doctorpass |
| Nurse | +15550000002 | nursepass |
| Patient | +15550000004 | patientpass |

## Viewing Records

1. Login as Admin or Doctor
2. Go to Records page
3. Enter any Patient ID (e.g., P-1001)
4. View the decrypted medical records from the blockchain

## Record Structure

Each record contains:
- **patientId**: Unique patient identifier
- **author**: Doctor who created the record
- **data**: Medical information including:
  - diagnosis: Primary diagnosis
  - notes: Clinical notes and treatment details
  - department: Hospital department
  - vitals: Patient vital signs (where applicable)

## For Presentations

These sample records are designed to demonstrate:
1. **Encrypted Patient Records**: All data is AES-encrypted before blockchain storage
2. **Tamper-Proof Ledger**: SHA-256 hash chain with proof-of-work validation
3. **Role-Based Access Control**: Different access levels for doctors, nurses, admins, and patients
4. **Comprehensive Medical Data**: Realistic diagnoses across all hospital departments
5. **Audit Trail**: Complete history of all record changes stored on the blockchain
