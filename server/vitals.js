const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const ALLERGIES = ['Penicillin', 'Sulfa drugs', 'Aspirin (NSAIDs)', 'Peanuts', 'Shellfish', 'Latex', 'Iodine contrast'];
const MEDICATIONS = ['Amlodipine 5mg', 'Metformin 500mg', 'Atorvastatin 20mg', 'Levothyroxine 50mcg', 'Salbutamol inhaler', 'Atenolol 25mg'];
const CONDITIONS = ['Hypertension', 'Type-2 Diabetes', 'Asthma', 'Hypothyroidism', 'Hyperlipidemia', 'Coronary artery disease'];

// Deterministic pseudo-vitals so the emergency "vital packet" is stable across restarts
// and identical for the same patient everywhere. In production these come from the EMR.
function deriveVitals(patientId, name = '') {
  const key = String(patientId) + '|' + String(name);
  const idx = (salt, len) => {
    let h = 0;
    const s = key + salt;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % len;
  };
  return {
    bloodType: BLOOD_TYPES[idx(':bt', BLOOD_TYPES.length)],
    allergies: [ALLERGIES[idx(':al', ALLERGIES.length)]],
    medications: [MEDICATIONS[idx(':md', MEDICATIONS.length)]],
    chronicConditions: [CONDITIONS[idx(':cc', CONDITIONS.length)]],
    emergencyContact: null
  };
}

module.exports = { deriveVitals };