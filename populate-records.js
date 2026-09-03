// Using built-in fetch (Node.js 18+)

const API_URL = 'http://localhost:4000';

const loginData = {
  phone: '+15550000003',
  password: 'adminpass'
};

const departments = [
  {
    name: "Cardiology",
    doctors: [
      { name: "Dr. Rajesh Varma", designation: "Senior Consultant Cardiologist" },
      { name: "Dr. Sunita Rao", designation: "Associate Consultant" }
    ]
  },
  {
    name: "Neurology & Neurosurgery",
    doctors: [
      { name: "Dr. Arvind Swaminathan", designation: "Head of Department & Chief Neurosurgeon" },
      { name: "Dr. Preeti Nair", designation: "Consultant Neurologist" }
    ]
  },
  {
    name: "Orthopaedics & Joint Replacement",
    doctors: [
      { name: "Dr. Vikramaditya Rathore", designation: "Senior Joint Replacement Surgeon" },
      { name: "Dr. Neha Kulkarni", designation: "Consultant Orthopedic Surgeon" }
    ]
  },
  {
    name: "Pediatrics & Neonatology",
    doctors: [
      { name: "Dr. Amit Mehra", designation: "Lead Pediatrician" },
      { name: "Dr. Shalini Deshmukh", designation: "Consultant Neonatologist" }
    ]
  },
  {
    name: "Obstetrics & Gynecology",
    doctors: [
      { name: "Dr. Ananya Sen", designation: "Senior Obstetrician & Gynecologist" },
      { name: "Dr. Ritu Bhargava", designation: "Consultant & Laparoscopic Surgeon" }
    ]
  },
  {
    name: "General & Laparoscopic Surgery",
    doctors: [
      { name: "Dr. Harish Chandra", designation: "Chief Laparoscopic Surgeon" },
      { name: "Dr. Pooja Joshi", designation: "General Surgeon" }
    ]
  },
  {
    name: "Internal Medicine",
    doctors: [
      { name: "Dr. Sanjay Nambiar", designation: "Senior Consultant Physician" },
      { name: "Dr. Kavita Hegde", designation: "Consultant Physician" }
    ]
  },
  {
    name: "Oncology",
    doctors: [
      { name: "Dr. Siddharth Menon", designation: "Senior Medical Oncologist" },
      { name: "Dr. Maya Pillai", designation: "Consultant Onco-Surgeon" }
    ]
  },
  {
    name: "Dermatology & Cosmetology",
    doctors: [
      { name: "Dr. Tanya Kapoor", designation: "Lead Dermatologist" },
      { name: "Dr. Rohan Chawla", designation: "Cosmetic Dermatologist" }
    ]
  },
  {
    name: "Radiology & Diagnostics",
    doctors: [
      { name: "Dr. Deepa Natarajan", designation: "Chief Radiologist" },
      { name: "Dr. Kunal Singhania", designation: "Consultant Radiologist" }
    ]
  },
  {
    name: "Emergency & Critical Care",
    doctors: [
      { name: "Dr. Manish Tandon", designation: "Head of Emergency Care" },
      { name: "Dr. Sneha Patil", designation: "Critical Care Specialist" }
    ]
  }
];

const sampleRecords = {
  "Cardiology": [
    { patientId: "P-1001", author: "Dr. Rajesh Varma", data: { diagnosis: "Acute Myocardial Infarction (STEMI)", notes: "Patient presented with crushing chest pain, diaphoresis. ECG showed ST elevation in leads II, III, aVF. Troponin T elevated at 2.4 ng/mL. Emergency PCI performed with stent placement in RCA.", department: "Cardiology" } },
    { patientId: "P-1002", author: "Dr. Sunita Rao", data: { diagnosis: "Chronic Heart Failure (NYHA Class III)", notes: "Echocardiography shows EF 35%, LV dilation. BNP elevated at 890 pg/mL. Started on ACE inhibitor, beta-blocker, and diuretic therapy.", department: "Cardiology" } },
    { patientId: "P-1003", author: "Dr. Rajesh Varma", data: { diagnosis: "Atrial Fibrillation with Rapid Ventricular Response", notes: "ECG confirmed AFib with HR 142 bpm. CHA2DS2-VASc score: 3. Started on anticoagulation with Apixaban.", department: "Cardiology" } },
    { patientId: "P-1004", author: "Dr. Sunita Rao", data: { diagnosis: "Hypertensive Emergency", notes: "BP recorded at 220/120 mmHg on arrival. End-organ damage noted. Admitted to ICU, IV Labetalol infusion initiated.", department: "Cardiology" } },
    { patientId: "P-1005", author: "Dr. Rajesh Varma", data: { diagnosis: "Stable Angina Pectoris", notes: "Chest pain on exertion, relieved by rest. Stress test positive at 7 METs. Coronary angiography revealed 70% LAD stenosis.", department: "Cardiology" } },
    { patientId: "P-1006", author: "Dr. Sunita Rao", data: { diagnosis: "Deep Vein Thrombosis - Left Lower Extremity", notes: "Duplex ultrasound confirmed DVT in left popliteal and femoral veins. Started on therapeutic anticoagulation.", department: "Cardiology" } },
    { patientId: "P-1007", author: "Dr. Rajesh Varma", data: { diagnosis: "Mitral Valve Regurgitation - Severe", notes: "Echocardiography shows severe MR with regurgitant fraction 62%. Referred for mitral valve repair surgery.", department: "Cardiology" } },
    { patientId: "P-1008", author: "Dr. Sunita Rao", data: { diagnosis: "Paroxysmal Supraventricular Tachycardia", notes: "Recurrent episodes of palpitations. ECG during episode: SVT at 180 bpm. Electrophysiology study and ablation planned.", department: "Cardiology" } },
    { patientId: "P-1009", author: "Dr. Rajesh Varma", data: { diagnosis: "Pericarditis - Acute", notes: "Presented with sharp retrosternal chest pain. ECG: diffuse ST elevation. CRP elevated at 85 mg/L. Started on NSAIDs and Colchicine.", department: "Cardiology" } },
    { patientId: "P-1010", author: "Dr. Sunita Rao", data: { diagnosis: "Cardiomyopathy - Dilated", notes: "Echocardiography: EF 28%, global hypokinesia. Family history notable for sudden cardiac death. Genetic testing recommended.", department: "Cardiology" } },
    { patientId: "P-1011", author: "Dr. Rajesh Varma", data: { diagnosis: "Post-PCI Follow-up", notes: "3-month follow-up after LAD stent placement. Patient asymptomatic. Repeat stress test normal.", department: "Cardiology" } },
    { patientId: "P-1012", author: "Dr. Sunita Rao", data: { diagnosis: "Syncope - Vasovagal", notes: "Recurrent syncope episodes. Tilt-table test positive. No cardiac etiology identified.", department: "Cardiology" } }
  ],
  "Neurology & Neurosurgery": [
    { patientId: "P-1013", author: "Dr. Arvind Swaminathan", data: { diagnosis: "Acute Ischemic Stroke - MCA Territory", notes: "CT head negative for hemorrhage. NIHSS score: 14. Alteplase administered.", department: "Neurology" } },
    { patientId: "P-1014", author: "Dr. Preeti Nair", data: { diagnosis: "Temporal Lobe Epilepsy", notes: "EEG shows left temporal sharp waves. MRI: left hippocampal sclerosis. Started on Levetiracetam.", department: "Neurology" } },
    { patientId: "P-1015", author: "Dr. Arvind Swaminathan", data: { diagnosis: "Cervical Disc Herniation - C5/C6", notes: "MRI shows C5/C6 disc herniation with right foraminal stenosis. Scheduled for anterior cervical discectomy and fusion.", department: "Neurosurgery" } },
    { patientId: "P-1016", author: "Dr. Preeti Nair", data: { diagnosis: "Multiple Sclerosis - Relapsing Remitting", notes: "MRI brain shows 8 periventricular and juxtacortical T2/FLAIR lesions. Started on high-dose IV methylprednisolone.", department: "Neurology" } },
    { patientId: "P-1017", author: "Dr. Arvind Swaminathan", data: { diagnosis: "Chronic Subdural Hematoma", notes: "CT head shows right frontoparietal chronic SDH with 12mm midline shift. Burr hole drainage planned.", department: "Neurosurgery" } },
    { patientId: "P-1018", author: "Dr. Preeti Nair", data: { diagnosis: "Migraine with Aura", notes: "Patient experiences 2-3 episodes monthly with visual aura. Topiramate 50mg BID initiated.", department: "Neurology" } },
    { patientId: "P-1019", author: "Dr. Arvind Swaminathan", data: { diagnosis: "Posterior Fossa Tumor - Suspected Meningioma", notes: "MRI shows 3.5cm extra-axial posterior fossa mass. Neurosurgical resection planned.", department: "Neurosurgery" } },
    { patientId: "P-1020", author: "Dr. Preeti Nair", data: { diagnosis: "Peripheral Neuropathy - Diabetic", notes: "Nerve conduction studies: sensory and motor axonal polyneuropathy. Started on Pregabalin.", department: "Neurology" } },
    { patientId: "P-1021", author: "Dr. Arvind Swaminathan", data: { diagnosis: "Traumatic Brain Injury - Moderate", notes: "GCS 12 on arrival. CT head: small right frontal contusion. Managed conservatively in Neuro-ICU.", department: "Neurosurgery" } },
    { patientId: "P-1022", author: "Dr. Preeti Nair", data: { diagnosis: "Myasthenia Gravis - Generalized", notes: "Repetitive nerve stimulation: 40% decrement. AChR antibodies positive. Started on Pyridostigmine.", department: "Neurology" } },
    { patientId: "P-1023", author: "Dr. Arvind Swaminathan", data: { diagnosis: "Lumbar Spinal Stenosis - L4/L5", notes: "MRI shows severe central canal stenosis at L4/L5. Laminectomy and decompression planned.", department: "Neurosurgery" } },
    { patientId: "P-1024", author: "Dr. Preeti Nair", data: { diagnosis: "Bell's Palsy - Left", notes: "Acute onset left facial weakness. Started on Prednisone 60mg daily.", department: "Neurology" } }
  ],
  "Orthopaedics & Joint Replacement": [
    { patientId: "P-1025", author: "Dr. Vikramaditya Rathore", data: { diagnosis: "Right Total Knee Replacement", notes: "Severe OA right knee. Implant: posterior stabilized cemented. Procedure uncomplicated.", department: "Orthopaedics" } },
    { patientId: "P-1026", author: "Dr. Neha Kulkarni", data: { diagnosis: "Left Rotator Cuff Tear - Full Thickness", notes: "MRI shows full-thickness tear of supraspinatus. Arthroscopic repair performed.", department: "Orthopaedics" } },
    { patientId: "P-1027", author: "Dr. Vikramaditya Rathore", data: { diagnosis: "Left Total Hip Replacement", notes: "Severe AVN of left femoral head. Used ceramic-on-ceramic bearing with cementless acetabular cup.", department: "Orthopaedics" } },
    { patientId: "P-1028", author: "Dr. Neha Kulkarni", data: { diagnosis: "ACL Reconstruction - Right Knee", notes: "Complete ACL tear. Reconstruction performed using hamstring autograft.", department: "Orthopaedics" } },
    { patientId: "P-1029", author: "Dr. Vikramaditya Rathore", data: { diagnosis: "Open Fracture Right Tibia (Gustilo II)", notes: "Road traffic accident. External fixator applied. Definitive fixation planned.", department: "Orthopaedics" } },
    { patientId: "P-1030", author: "Dr. Neha Kulkarni", data: { diagnosis: "Carpal Tunnel Syndrome - Bilateral", notes: "Severe bilateral median nerve compression. Bilateral endoscopic carpal tunnel release performed.", department: "Orthopaedics" } },
    { patientId: "P-1031", author: "Dr. Vikramaditya Rathore", data: { diagnosis: "Achilles Tendon Rupture - Left", notes: "Complete rupture. Managed conservatively with functional bracing.", department: "Orthopaedics" } },
    { patientId: "P-1032", author: "Dr. Neha Kulkarni", data: { diagnosis: "Dupuytren's Contracture - Right Hand", notes: "Progressive flexion contracture. Collagenase injection performed.", department: "Orthopaedics" } },
    { patientId: "P-1033", author: "Dr. Vikramaditya Rathore", data: { diagnosis: "Osteoporotic Compression Fracture - L1", notes: "Kyphosting performed. Started on Denosumab.", department: "Orthopaedics" } },
    { patientId: "P-1034", author: "Dr. Neha Kulkarni", data: { diagnosis: "Frozen Shoulder - Right", notes: "Under anesthesia manipulation performed. Aggressive physiotherapy initiated.", department: "Orthopaedics" } },
    { patientId: "P-1035", author: "Dr. Vikramaditya Rathore", data: { diagnosis: "Revision Total Knee Replacement", notes: "Revision using stemmed components with augments. Constrained condylar knee implant used.", department: "Orthopaedics" } },
    { patientId: "P-1036", author: "Dr. Neha Kulkarni", data: { diagnosis: "Ganglion Cyst - Left Wrist", notes: "Excision performed, pedicle traced to scapholunate ligament. Histology confirmed benign ganglion.", department: "Orthopaedics" } }
  ],
  "Pediatrics & Neonatology": [
    { patientId: "P-1037", author: "Dr. Amit Mehra", data: { diagnosis: "Acute Viral Bronchiolitis", notes: "8-month-old with RSV positive. Managed with nasal suctioning and supplemental oxygen.", department: "Pediatrics" } },
    { patientId: "P-1038", author: "Dr. Shalini Deshmukh", data: { diagnosis: "Neonatal Sepsis - Late Onset", notes: "3-week-old with fever. Started on Ampicillin + Gentamicin.", department: "Neonatology" } },
    { patientId: "P-1039", author: "Dr. Amit Mehra", data: { diagnosis: "Kawasaki Disease - Incomplete", notes: "5-year-old with fever >5 days. Echo: small RCA aneurysm. Started on IVIG.", department: "Pediatrics" } },
    { patientId: "P-1040", author: "Dr. Shalini Deshmukh", data: { diagnosis: "Neonatal Jaundice - Physiological", notes: "Day 2 of life. TSB 12 mg/dL. Phototherapy initiated.", department: "Neonatology" } },
    { patientId: "P-1041", author: "Dr. Amit Mehra", data: { diagnosis: "Febrile Seizure - Simple", notes: "2-year-old with first febrile seizure. Otitis media identified as source.", department: "Pediatrics" } },
    { patientId: "P-1042", author: "Dr. Shalini Deshmukh", data: { diagnosis: "Respiratory Distress Syndrome - Premature", notes: "Born at 30 weeks. Required intubation and surfactant replacement.", department: "Neonatology" } },
    { patientId: "P-1043", author: "Dr. Amit Mehra", data: { diagnosis: "Childhood Asthma - Moderate Persistent", notes: "Spirometry: FEV1 68% predicted. Started on Fluticasone.", department: "Pediatrics" } },
    { patientId: "P-1044", author: "Dr. Shalini Deshmukh", data: { diagnosis: "Necrotizing Enterocolitis - Stage II", notes: "Premature infant. Pneumatosis intestinalis on abdominal X-ray.", department: "Neonatology" } },
    { patientId: "P-1045", author: "Dr. Amit Mehra", data: { diagnosis: "Iron Deficiency Anemia", notes: "18-month-old with Hb 7.2 g/dL. Started on Ferrous sulfate.", department: "Pediatrics" } },
    { patientId: "P-1046", author: "Dr. Shalini Deshmukh", data: { diagnosis: "Retinopathy of Prematurity - Stage 2", notes: "Laser photocoagulation performed in both eyes.", department: "Neonatology" } },
    { patientId: "P-1047", author: "Dr. Amit Mehra", data: { diagnosis: "Type 1 Diabetes Mellitus - New Onset", notes: "9-year-old with HbA1c 11.2%. Started on basal-bolus insulin.", department: "Pediatrics" } },
    { patientId: "P-1048", author: "Dr. Shalini Deshmukh", data: { diagnosis: "Transient Tachypnea of Newborn", notes: "Term infant. Managed with supplemental O2. Resolved by 48 hours.", department: "Neonatology" } }
  ],
  "Obstetrics & Gynecology": [
    { patientId: "P-1049", author: "Dr. Ananya Sen", data: { diagnosis: "Gestational Diabetes Mellitus", notes: "28-year-old at 26 weeks. Started on diet control and glucose monitoring.", department: "OB-GYN" } },
    { patientId: "P-1050", author: "Dr. Ritu Bhargava", data: { diagnosis: "Endometriosis - Stage III", notes: "Diagnostic laparoscopy performed. Started on GnRH agonist.", department: "OB-GYN" } },
    { patientId: "P-1051", author: "Dr. Ananya Sen", data: { diagnosis: "Preeclampsia - Severe", notes: "34-year-old at 34 weeks. Cesarean section performed.", department: "OB-GYN" } },
    { patientId: "P-1052", author: "Dr. Ritu Bhargava", data: { diagnosis: "Uterine Fibroids - Symptomatic", notes: "Multiple fibroids causing menorrhagia. Scheduled for hysteroscopic myomectomy.", department: "OB-GYN" } },
    { patientId: "P-1053", author: "Dr. Ananya Sen", data: { diagnosis: "Ectopic Pregnancy - Left Tube", notes: "Emergency laparoscopy: left salpingectomy performed.", department: "OB-GYN" } },
    { patientId: "P-1054", author: "Dr. Ritu Bhargava", data: { diagnosis: "Polycystic Ovarian Syndrome (PCOS)", notes: "Started on Metformin and OCP. Lifestyle modification counseling provided.", department: "OB-GYN" } },
    { patientId: "P-1055", author: "Dr. Ananya Sen", data: { diagnosis: "Placenta Previa - Complete", notes: "Placenta completely covering internal os. Planned cesarean at 37 weeks.", department: "OB-GYN" } },
    { patientId: "P-1056", author: "Dr. Ritu Bhargava", data: { diagnosis: "Ovarian Cyst - Complex", notes: "7cm complex ovarian cyst. Diagnostic laparoscopy planned.", department: "OB-GYN" } },
    { patientId: "P-1057", author: "Dr. Ananya Sen", data: { diagnosis: "Postpartum Hemorrhage", notes: "PPH due to uterine atony. Managed with medications and transfusion.", department: "OB-GYN" } },
    { patientId: "P-1058", author: "Dr. Ritu Bhargava", data: { diagnosis: "Cervical Dysplasia - HSIL (CIN II/III)", notes: "LEEP procedure performed. Margins clear.", department: "OB-GYN" } },
    { patientId: "P-1059", author: "Dr. Ananya Sen", data: { diagnosis: "Fibroid Uterus with Infertility", notes: "Hysteroscopic myomectomy performed. IUI planned.", department: "OB-GYN" } },
    { patientId: "P-1060", author: "Dr. Ritu Bhargava", data: { diagnosis: "Pelvic Inflammatory Disease", notes: "Treated with Ceftriaxone + Doxycycline. Partner notified.", department: "OB-GYN" } }
  ],
  "General & Laparoscopic Surgery": [
    { patientId: "P-1061", author: "Dr. Harish Chandra", data: { diagnosis: "Laparoscopic Cholecystectomy - Acute Cholecystitis", notes: "Laparoscopic cholecystectomy performed. Discharged day 1.", department: "General Surgery" } },
    { patientId: "P-1062", author: "Dr. Pooja Joshi", data: { diagnosis: "Inguinal Hernia - Right Direct", notes: "Lichtenstein tension-free mesh repair performed.", department: "General Surgery" } },
    { patientId: "P-1063", author: "Dr. Harish Chandra", data: { diagnosis: "Acute Appendicitis", notes: "Laparoscopic appendectomy performed. Appendix gangrenous.", department: "General Surgery" } },
    { patientId: "P-1064", author: "Dr. Pooja Joshi", data: { diagnosis: "Incisional Hernia", notes: "Laparoscopic IPOM repair performed.", department: "General Surgery" } },
    { patientId: "P-1065", author: "Dr. Harish Chandra", data: { diagnosis: "Laparoscopic Appendectomy - Complicated", notes: "Interval appendectomy performed after abscess drainage.", department: "General Surgery" } },
    { patientId: "P-1066", author: "Dr. Pooja Joshi", data: { diagnosis: "Umbilical Hernia", notes: "Umbilical hernia repair with mesh performed.", department: "General Surgery" } },
    { patientId: "P-1067", author: "Dr. Harish Chandra", data: { diagnosis: "Laparoscopic Fundoplication - GERD", notes: "Laparoscopic Nissen fundoplication performed.", department: "General Surgery" } },
    { patientId: "P-1068", author: "Dr. Pooja Joshi", data: { diagnosis: "Excision of Breast Lump - Fibroadenoma", notes: "Excision biopsy performed. Histopathology: confirmed fibroadenoma.", department: "General Surgery" } },
    { patientId: "P-1069", author: "Dr. Harish Chandra", data: { diagnosis: "Strangulated Femoral Hernia", notes: "Emergency surgery: femoral hernia repair with mesh.", department: "General Surgery" } },
    { patientId: "P-1070", author: "Dr. Pooja Joshi", data: { diagnosis: "Hemorrhoids - Grade III", notes: "Stapled hemorrhoidopexy (PPH) performed.", department: "General Surgery" } },
    { patientId: "P-1071", author: "Dr. Harish Chandra", data: { diagnosis: "Ventral Hernia - Epigastric", notes: "Mesh repair (sublay technique) performed.", department: "General Surgery" } },
    { patientId: "P-1072", author: "Dr. Pooja Joshi", data: { diagnosis: "Laparoscopic Sigmoid Colectomy - Diverticular Disease", notes: "Laparoscopic anterior resection performed.", department: "General Surgery" } }
  ],
  "Internal Medicine": [
    { patientId: "P-1073", author: "Dr. Sanjay Nambiar", data: { diagnosis: "Type 2 Diabetes Mellitus - Uncontrolled", notes: "HbA1c 10.2%. Started on Empagliflozin + Linagliptin.", department: "Internal Medicine" } },
    { patientId: "P-1074", author: "Dr. Kavita Hegde", data: { diagnosis: "Community Acquired Pneumonia", notes: "Admitted for IV Ceftriaxone + Azithromycin.", department: "Internal Medicine" } },
    { patientId: "P-1075", author: "Dr. Sanjay Nambiar", data: { diagnosis: "Hypertension - Resistant", notes: "Added Spironolactone 25mg to triple therapy.", department: "Internal Medicine" } },
    { patientId: "P-1076", author: "Dr. Kavita Hegde", data: { diagnosis: "Urinary Tract Infection - Complicated", notes: "Treated with Ciprofloxacin 500mg BID x 7 days.", department: "Internal Medicine" } },
    { patientId: "P-1077", author: "Dr. Sanjay Nambiar", data: { diagnosis: "Hyperthyroidism - Graves' Disease", notes: "Started on Carbimazole 20mg TID.", department: "Internal Medicine" } },
    { patientId: "P-1078", author: "Dr. Kavita Hegde", data: { diagnosis: "Chronic Kidney Disease - Stage 3b", notes: "Started on Dapagliflozin for renal protection.", department: "Internal Medicine" } },
    { patientId: "P-1079", author: "Dr. Sanjay Nambiar", data: { diagnosis: "Acute Gastroenteritis", notes: "Oral rehydration therapy initiated.", department: "Internal Medicine" } },
    { patientId: "P-1080", author: "Dr. Kavita Hegde", data: { diagnosis: "COPD Exacerbation", notes: "Started on Nebulized Salbutamol + Ipratropium.", department: "Internal Medicine" } },
    { patientId: "P-1081", author: "Dr. Sanjay Nambiar", data: { diagnosis: "Hypothyroidism", notes: "Started on Levothyroxine 75mcg daily.", department: "Internal Medicine" } },
    { patientId: "P-1082", author: "Dr. Kavita Hegde", data: { diagnosis: "DVT - Left Lower Extremity", notes: "Started on Rivaroxaban.", department: "Internal Medicine" } },
    { patientId: "P-1083", author: "Dr. Sanjay Nambiar", data: { diagnosis: "Sepsis - Urinary Source", notes: "Admitted to ICU. Started on Meropenem.", department: "Internal Medicine" } },
    { patientId: "P-1084", author: "Dr. Kavita Hegde", data: { diagnosis: "Anemia - Iron Deficiency", notes: "Started on Ferrous fumarate 210mg TID.", department: "Internal Medicine" } }
  ],
  "Oncology": [
    { patientId: "P-1085", author: "Dr. Siddharth Menon", data: { diagnosis: "Invasive Ductal Carcinoma - Left Breast (Stage IIA)", notes: "Plan: Neoadjuvant chemotherapy (AC-T regimen).", department: "Oncology" } },
    { patientId: "P-1086", author: "Dr. Maya Pillai", data: { diagnosis: "Right Hemicolectomy - Cecal Adenocarcinoma", notes: "Adjuvant chemotherapy (FOLFOX) planned.", department: "Oncology" } },
    { patientId: "P-1087", author: "Dr. Siddharth Menon", data: { diagnosis: "Non-Small Cell Lung Cancer - Adenocarcinoma (Stage IV)", notes: "Started on Osimertinib 80mg daily.", department: "Oncology" } },
    { patientId: "P-1088", author: "Dr. Maya Pillai", data: { diagnosis: "Thyroid Carcinoma - Papillary", notes: "Total thyroidectomy performed. Radioactive iodine ablation planned.", department: "Oncology" } },
    { patientId: "P-1089", author: "Dr. Siddharth Menon", data: { diagnosis: "Colorectal Liver Metastases", notes: "FOLFOX chemotherapy x 6 cycles.", department: "Oncology" } },
    { patientId: "P-1090", author: "Dr. Maya Pillai", data: { diagnosis: "Gastrointestinal Stromal Tumor (GIST) - Gastric", notes: "Laparoscopic wedge gastrectomy performed. Started on Imatinib.", department: "Oncology" } },
    { patientId: "P-1091", author: "Dr. Siddharth Menon", data: { diagnosis: "Chronic Lymphocytic Leukemia (CLL) - Rai Stage I", notes: "Watch and wait approach.", department: "Oncology" } },
    { patientId: "P-1092", author: "Dr. Maya Pillai", data: { diagnosis: "Endometrial Carcinoma - Grade 1", notes: "Total abdominal hysterectomy performed. Stage IA.", department: "Oncology" } },
    { patientId: "P-1093", author: "Dr. Siddharth Menon", data: { diagnosis: "Multiple Myeloma - ISS Stage II", notes: "Started on VRd regimen.", department: "Oncology" } },
    { patientId: "P-1094", author: "Dr. Maya Pillai", data: { diagnosis: "Gallbladder Carcinoma - Incidental Finding", notes: "Radical second-look surgery performed.", department: "Oncology" } },
    { patientId: "P-1095", author: "Dr. Siddharth Menon", data: { diagnosis: "Head & Neck Cancer - Oral Cavity (Stage III)", notes: "Planned: Transoral resection + adjuvant chemoradiation.", department: "Oncology" } },
    { patientId: "P-1096", author: "Dr. Maya Pillai", data: { diagnosis: "Hepatocellular Carcinoma - Early Stage", notes: "Right hepatectomy planned.", department: "Oncology" } }
  ],
  "Dermatology & Cosmetology": [
    { patientId: "P-1097", author: "Dr. Tanya Kapoor", data: { diagnosis: "Psoriasis - Chronic Plaque", notes: "Started on Methotrexate 15mg weekly.", department: "Dermatology" } },
    { patientId: "P-1098", author: "Dr. Rohan Chawla", data: { diagnosis: "Acne Vulgaris - Moderate", notes: "Started on Isotretinoin 0.5mg/kg/day.", department: "Dermatology" } },
    { patientId: "P-1099", author: "Dr. Tanya Kapoor", data: { diagnosis: "Melanoma - Superficial Spreading (Stage IB)", notes: "Wide local excision performed. Sentinel lymph node negative.", department: "Dermatology" } },
    { patientId: "P-1100", author: "Dr. Rohan Chawla", data: { diagnosis: "Rosacea - Erythematotelangiectatic", notes: "Started on topical Ivermectin 1% cream.", department: "Dermatology" } },
    { patientId: "P-1101", author: "Dr. Tanya Kapoor", data: { diagnosis: "Contact Dermatitis - Allergic", notes: "Patch testing positive for Nickel. Avoidance counseling.", department: "Dermatology" } },
    { patientId: "P-1102", author: "Dr. Rohan Chawla", data: { diagnosis: "Androgenetic Alopecia - Male Pattern (Norwood IV)", notes: "Started on Finasteride 1mg + Minoxidil 5%.", department: "Dermatology" } },
    { patientId: "P-1103", author: "Dr. Tanya Kapoor", data: { diagnosis: "Vitiligo - Segmental", notes: "Started on topical Tacrolimus. Phototherapy initiated.", department: "Dermatology" } },
    { patientId: "P-1104", author: "Dr. Rohan Chawla", data: { diagnosis: "Photoaging & Solar Lentigines", notes: "Q-switched Nd:YAG laser performed.", department: "Dermatology" } },
    { patientId: "P-1105", author: "Dr. Tanya Kapoor", data: { diagnosis: "Seborrheic Dermatitis", notes: "Ketoconazole 2% cream for face.", department: "Dermatology" } },
    { patientId: "P-1106", author: "Dr. Rohan Chawla", data: { diagnosis: "Chemical Peel - Melasma", notes: "Glycolic acid peel 35% performed.", department: "Dermatology" } },
    { patientId: "P-1107", author: "Dr. Tanya Kapoor", data: { diagnosis: "Urticaria - Chronic Spontaneous", notes: "Started on Cetirizine 10mg doubled dose.", department: "Dermatology" } },
    { patientId: "P-1108", author: "Dr. Rohan Chawla", data: { diagnosis: "Botulinum Toxin - Cosmetic", notes: "OnabotulinumtoxinA injected to forehead, glabella, and crow's feet.", department: "Dermatology" } }
  ],
  "Radiology & Diagnostics": [
    { patientId: "P-1109", author: "Dr. Deepa Natarajan", data: { diagnosis: "MRI Brain - Normal Study", notes: "Normal MRI brain. No mass lesion.", department: "Radiology", modality: "MRI", body_part: "Brain" } },
    { patientId: "P-1110", author: "Dr. Kunal Singhania", data: { diagnosis: "CT Chest - Pulmonary Embolism", notes: "Bilateral segmental pulmonary emboli.", department: "Radiology", modality: "CT", body_part: "Chest" } },
    { patientId: "P-1111", author: "Dr. Deepa Natarajan", data: { diagnosis: "Mammography - BI-RADS 4B", notes: "Right breast: irregular spiculated mass. Biopsy recommended.", department: "Radiology", modality: "Mammography", body_part: "Bilateral Breasts" } },
    { patientId: "P-1112", author: "Dr. Kunal Singhania", data: { diagnosis: "Ultrasound Abdomen - Cholelithiasis", notes: "Multiple gallbladder stones.", department: "Radiology", modality: "Ultrasound", body_part: "Abdomen" } },
    { patientId: "P-1113", author: "Dr. Deepa Natarajan", data: { diagnosis: "CT Abdomen - Appendicitis", notes: "Acute uncomplicated appendicitis.", department: "Radiology", modality: "CT", body_part: "Abdomen & Pelvis" } },
    { patientId: "P-1114", author: "Dr. Kunal Singhania", data: { diagnosis: "X-Ray Chest - Pneumonia", notes: "Right lower lobe consolidation.", department: "Radiology", modality: "X-Ray", body_part: "Chest" } },
    { patientId: "P-1115", author: "Dr. Deepa Natarajan", data: { diagnosis: "MRI Spine - Lumbar Disc Herniation", notes: "L4/L5 disc herniation with left foraminal stenosis.", department: "Radiology", modality: "MRI", body_part: "Lumbar Spine" } },
    { patientId: "P-1116", author: "Dr. Kunal Singhania", data: { diagnosis: "CT Head - Acute Hemorrhage", notes: "Right basal ganglia intracerebral hemorrhage.", department: "Radiology", modality: "CT", body_part: "Head" } },
    { patientId: "P-1117", author: "Dr. Deepa Natarajan", data: { diagnosis: "DEXA Scan - Osteoporosis", notes: "Lumbar spine T-score -3.2. Started on Denosumab.", department: "Radiology", modality: "DEXA", body_part: "Lumbar Spine & Femoral Neck" } },
    { patientId: "P-1118", author: "Dr. Kunal Singhania", data: { diagnosis: "CT Pulmonary Angiography - Normal", notes: "Negative for pulmonary embolism.", department: "Radiology", modality: "CT", body_part: "Chest (CTPA)" } },
    { patientId: "P-1119", author: "Dr. Deepa Natarajan", data: { diagnosis: "Ultrasound Obstetrics - Normal Growth Scan", notes: "Single live fetus, normal growth parameters.", department: "Radiology", modality: "Ultrasound", body_part: "Obstetric" } },
    { patientId: "P-1120", author: "Dr. Kunal Singhania", data: { diagnosis: "PET-CT - Lymphoma Staging", notes: "Stage III Hodgkin lymphoma.", department: "Radiology", modality: "PET-CT", body_part: "Whole Body" } }
  ],
  "Emergency & Critical Care": [
    { patientId: "P-1121", author: "Dr. Manish Tandon", data: { diagnosis: "Polytrauma - Road Traffic Accident", notes: "Multiple rib fractures, small hemothorax. Chest tube placed.", department: "Emergency", vitals: { gcs: 14 } } },
    { patientId: "P-1122", author: "Dr. Sneha Patil", data: { diagnosis: "Anaphylaxis", notes: "Immediate IM Epinephrine administered. Response within 10 minutes.", department: "Emergency", vitals: { bp: "78/50", hr: 130 } } },
    { patientId: "P-1123", author: "Dr. Manish Tandon", data: { diagnosis: "Acute Myocardial Infarction - STEMI", notes: "Emergency PCI with stent placement. Door-to-balloon time: 52 minutes.", department: "Emergency", vitals: { bp: "95/60", hr: 108 } } },
    { patientId: "P-1124", author: "Dr. Sneha Patil", data: { diagnosis: "Diabetic Ketoacidosis", notes: "IV insulin infusion and aggressive fluid resuscitation.", department: "Emergency", vitals: { glucose: "580mg/dL", ph: "7.12" } } },
    { patientId: "P-1125", author: "Dr. Manish Tandon", data: { diagnosis: "Acute Asthma Exacerbation - Severe", notes: "Triple therapy: Nebulized Bronchodilators + IV Steroids.", department: "Emergency", vitals: { spo2: "88%" } } },
    { patientId: "P-1126", author: "Dr. Sneha Patil", data: { diagnosis: "Subarachnoid Hemorrhage", notes: "CT head: diffuse SAH. Nimodipine started.", department: "Critical Care", vitals: { bp: "178/105", gcs: 14 } } },
    { patientId: "P-1127", author: "Dr. Manish Tandon", data: { diagnosis: "Severe Sepsis - Pneumonia", notes: "Norepinephrine infusion. Broad-spectrum antibiotics.", department: "Critical Care", vitals: { lactate: "4.5", bp: "82/50" } } },
    { patientId: "P-1128", author: "Dr. Sneha Patil", data: { diagnosis: "Cardiac Arrest - ROSC Achieved", notes: "Targeted temperature management. Emergent cath lab.", department: "Critical Care", vitals: { temp: "33°C" } } },
    { patientId: "P-1129", author: "Dr. Manish Tandon", data: { diagnosis: "Status Epilepticus", notes: "Lorazepam IV administered. Levetiracetam loaded.", department: "Emergency", vitals: { gcs: 6 } } },
    { patientId: "P-1130", author: "Dr. Sneha Patil", data: { diagnosis: "Intoxications - Methanol", notes: "Fomepizole started. Hemodialysis initiated.", department: "Critical Care", vitals: { ph: "7.1" } } },
    { patientId: "P-1131", author: "Dr. Manish Tandon", data: { diagnosis: "Traumatic Brain Injury - Severe", notes: "Emergency craniotomy and hematoma evacuation.", department: "Critical Care", vitals: { gcs: 7, icp: "22mmHg" } } },
    { patientId: "P-1132", author: "Dr. Sneha Patil", data: { diagnosis: "Tension Pneumothorax", notes: "Needle decompression followed by chest tube insertion.", department: "Emergency", vitals: { bp: "80/50" } } }
  ]
};

async function getToken() {
  console.log('Logging in as Admin...');
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });
  const data = await response.json();
  if (data.token) {
    console.log('Login successful!');
    return data.token;
  }
  throw new Error('Login failed');
}

async function addRecord(token, record) {
  const response = await fetch(`${API_URL}/api/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      patientId: record.patientId,
      author: record.author,
      data: record.data
    })
  });
  return response.json();
}

async function mineBlock(token) {
  console.log('\nMining pending transactions...');
  const response = await fetch(`${API_URL}/api/mine`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ miner: 'Admin' })
  });
  return response.json();
}

async function main() {
  console.log('=== HealthLedger Record Population ===\n');
  
  try {
    const token = await getToken();
    
    let totalRecords = 0;
    for (const [department, records] of Object.entries(sampleRecords)) {
      console.log(`\n📁 ${department} (${records.length} records):`);
      for (const record of records) {
        try {
          const result = await addRecord(token, record);
          if (result.message) {
            console.log(`  ✓ ${record.patientId} - ${record.data.diagnosis}`);
            totalRecords++;
          } else {
            console.log(`  ✗ ${record.patientId} - ${result.error}`);
          }
        } catch (error) {
          console.log(`  ✗ ${record.patientId} - Error: ${error.message}`);
        }
      }
    }
    
    console.log(`\n\nTotal records added: ${totalRecords}`);
    
    console.log('\nMining blocks...');
    const mineResult = await mineBlock(token);
    if (mineResult.message) {
      console.log('Block mined successfully!');
      console.log(`Chain length: ${mineResult.block ? 'Extended' : 'N/A'}`);
    } else {
      console.log('Mining result:', mineResult);
    }
    
    console.log('\n=== Done! ===');
    console.log('You can now view the records in the HealthLedger application.');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the server is running on http://localhost:4000');
    console.log('Run: npm run dev (in the project root)');
  }
}

if (require.main === module) {
  main();
}

module.exports = { sampleRecords, departments };
