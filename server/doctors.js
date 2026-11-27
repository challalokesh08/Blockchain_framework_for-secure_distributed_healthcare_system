// Doctor directory derived from the seeded clinical dataset plus demo doctors.
// Used by patient registration so a patient can pick a department and then
// the doctor assigned to that department.
const dataset = require('../dataset');

const DEPARTMENT_ORDER = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopaedics', 'Pediatrics',
  'Neonatology', 'OB-GYN', 'Dermatology', 'General Surgery', 'Internal Medicine',
  'Oncology', 'Radiology', 'Emergency'
];

const byDoctor = new Map();
for (const row of dataset) {
  if (!row.doctor || !row.department) continue;
  if (!byDoctor.has(row.doctor)) {
    byDoctor.set(row.doctor, { name: row.doctor, department: row.department, patients: 0, specialization: '' });
  }
  byDoctor.get(row.doctor).patients += 1;
}

function listDoctors() {
  const doctors = [...byDoctor.values()];
  // Demo doctors that are not part of the 110-patient clinical dataset.
  for (const name of ['Dr. Sharma']) {
    if (!doctors.some(d => d.name === name)) {
      doctors.push({ name, department: 'General Medicine', patients: 0, specialization: '' });
    }
  }
  return doctors
    .sort((a, b) => {
      const d = DEPARTMENT_ORDER.indexOf(a.department) - DEPARTMENT_ORDER.indexOf(b.department);
      return d !== 0 ? d : a.name.localeCompare(b.name);
    });
}

function listDepartments() {
  const distinct = [...new Set(listDoctors().map(d => d.department))];
  return distinct.sort((a, b) => {
    const ia = DEPARTMENT_ORDER.indexOf(a), ib = DEPARTMENT_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });
}

function findDoctor(name, department) {
  return listDoctors().find(d =>
    d.name.toLowerCase() === String(name || '').trim().toLowerCase() &&
    (!department || d.department === department)
  ) || null;
}

module.exports = { listDoctors, listDepartments, findDoctor };
