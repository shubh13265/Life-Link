export interface Doctor {
  name: string;
  specialization: string;
  qualification: string;
  experience: number; // years
  status: 'on-duty' | 'off-duty';
  avatarInitials: string;
}

export interface Hospital {
  id: string;
  name: string;
  distance: number;
  driveTime: number;
  phone: string;
  lat: number;
  lng: number;
  address: string;
  type: string;
  rating: number;
  totalBeds: number;
  established: number;
  emergency: boolean;
  specializations: string[];
  resources: {
    icuBeds: number;
    oxygenCylinders: number;
    bloodAvailable: string;
    ambulances: number;
    generalBeds: number;
    ventilators: number;
  };
  doctors: Doctor[];
}

export const mockHospitalsDatabase: Hospital[] = [
  {
    id: '1',
    name: 'AIIMS (All India Institute of Medical Sciences)',
    distance: 2.3,
    driveTime: 8,
    phone: '+911126588500',
    lat: 28.5659,
    lng: 77.2095,
    address: 'Ansari Nagar East, New Delhi, Delhi 110029',
    type: 'Government Teaching Hospital',
    rating: 4.8,
    totalBeds: 2478,
    established: 1956,
    emergency: true,
    specializations: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Transplant Surgery'],
    resources: { icuBeds: 45, oxygenCylinders: 120, bloodAvailable: 'B+, O-', ambulances: 8, generalBeds: 180, ventilators: 40 },
    doctors: [
      { name: 'Dr. Priya Sharma', specialization: 'Cardiologist', qualification: 'MBBS, MD, DM', experience: 18, status: 'on-duty', avatarInitials: 'PS' },
      { name: 'Dr. Arvind Mehta', specialization: 'Neurologist', qualification: 'MBBS, MD, DM', experience: 22, status: 'on-duty', avatarInitials: 'AM' },
      { name: 'Dr. Sunita Rao', specialization: 'Oncologist', qualification: 'MBBS, MD (Onco)', experience: 15, status: 'off-duty', avatarInitials: 'SR' },
      { name: 'Dr. Rakesh Kumar', specialization: 'Orthopedic Surgeon', qualification: 'MBBS, MS (Ortho)', experience: 12, status: 'on-duty', avatarInitials: 'RK' },
      { name: 'Dr. Anjali Singh', specialization: 'Transplant Surgeon', qualification: 'MBBS, MS, MCh', experience: 20, status: 'off-duty', avatarInitials: 'AS' },
      { name: 'Dr. Vikram Patel', specialization: 'Intensivist (ICU)', qualification: 'MBBS, MD (Pulm)', experience: 9, status: 'on-duty', avatarInitials: 'VP' },
    ]
  },
  {
    id: '2',
    name: 'Safdarjung Hospital',
    distance: 3.1,
    driveTime: 12,
    phone: '+911126165060',
    lat: 28.5684,
    lng: 77.2059,
    address: 'Ansari Nagar West, New Delhi, Delhi 110029',
    type: 'Government Hospital',
    rating: 4.1,
    totalBeds: 1531,
    established: 1942,
    emergency: true,
    specializations: ['General Medicine', 'Obstetrics', 'Pediatrics', 'ENT', 'Ophthalmology'],
    resources: { icuBeds: 0, oxygenCylinders: 5, bloodAvailable: 'A+', ambulances: 0, generalBeds: 60, ventilators: 4 },
    doctors: [
      { name: 'Dr. Neeraj Gupta', specialization: 'General Physician', qualification: 'MBBS, MD', experience: 10, status: 'on-duty', avatarInitials: 'NG' },
      { name: 'Dr. Meena Rawat', specialization: 'Obstetrician', qualification: 'MBBS, MD (OBG)', experience: 14, status: 'on-duty', avatarInitials: 'MR' },
      { name: 'Dr. Sanjay Tripathi', specialization: 'Pediatrician', qualification: 'MBBS, MD (Peds)', experience: 8, status: 'off-duty', avatarInitials: 'ST' },
      { name: 'Dr. Leena Kapoor', specialization: 'ENT Specialist', qualification: 'MBBS, MS (ENT)', experience: 11, status: 'on-duty', avatarInitials: 'LK' },
    ]
  },
  {
    id: '3',
    name: 'Sir Ganga Ram Hospital',
    distance: 4.8,
    driveTime: 15,
    phone: '+911125750000',
    lat: 28.6385,
    lng: 77.1895,
    address: 'Sir Ganga Ram Hospital Marg, Old Rajinder Nagar, Delhi 110060',
    type: 'Private Multi-Specialty',
    rating: 4.6,
    totalBeds: 675,
    established: 1954,
    emergency: true,
    specializations: ['Gastroenterology', 'Nephrology', 'Urology', 'Rheumatology', 'Endocrinology'],
    resources: { icuBeds: 12, oxygenCylinders: 50, bloodAvailable: 'O-', ambulances: 3, generalBeds: 95, ventilators: 10 },
    doctors: [
      { name: 'Dr. Anil Batra', specialization: 'Gastroenterologist', qualification: 'MBBS, MD, DM', experience: 19, status: 'on-duty', avatarInitials: 'AB' },
      { name: 'Dr. Kavita Mishra', specialization: 'Nephrologist', qualification: 'MBBS, MD, DM', experience: 16, status: 'off-duty', avatarInitials: 'KM' },
      { name: 'Dr. Rajeev Joshi', specialization: 'Urologist', qualification: 'MBBS, MS, MCh', experience: 13, status: 'on-duty', avatarInitials: 'RJ' },
      { name: 'Dr. Smita Verma', specialization: 'Endocrinologist', qualification: 'MBBS, MD, DM', experience: 11, status: 'on-duty', avatarInitials: 'SV' },
      { name: 'Dr. Harish Chandra', specialization: 'Rheumatologist', qualification: 'MBBS, MD', experience: 7, status: 'off-duty', avatarInitials: 'HC' },
    ]
  },
  {
    id: '4',
    name: 'Indraprastha Apollo Hospitals',
    distance: 6.5,
    driveTime: 22,
    phone: '+911126925858',
    lat: 28.5414,
    lng: 77.2847,
    address: 'Mathura Road, Sarita Vihar, New Delhi, Delhi 110076',
    type: 'Private Super Specialty',
    rating: 4.7,
    totalBeds: 710,
    established: 1996,
    emergency: true,
    specializations: ['Cardiac Surgery', 'Robotic Surgery', 'Bone Marrow Transplant', 'Spine Surgery', 'Liver Transplant'],
    resources: { icuBeds: 2, oxygenCylinders: 0, bloodAvailable: 'None', ambulances: 1, generalBeds: 30, ventilators: 2 },
    doctors: [
      { name: 'Dr. Samuel George', specialization: 'Cardiac Surgeon', qualification: 'MBBS, MS, MCh', experience: 24, status: 'on-duty', avatarInitials: 'SG' },
      { name: 'Dr. Deepa Nair', specialization: 'Robotic Surgeon', qualification: 'MBBS, MS, FMAS', experience: 17, status: 'off-duty', avatarInitials: 'DN' },
      { name: 'Dr. Mohit Arora', specialization: 'Spine Surgeon', qualification: 'MBBS, MS (Ortho)', experience: 15, status: 'on-duty', avatarInitials: 'MA' },
      { name: 'Dr. Farida Khan', specialization: 'Hepatologist', qualification: 'MBBS, MD, DM', experience: 21, status: 'on-duty', avatarInitials: 'FK' },
    ]
  },
  {
    id: '5',
    name: 'Max Super Speciality Saket',
    distance: 8.2,
    driveTime: 28,
    phone: '+911126515050',
    lat: 28.5276,
    lng: 77.2114,
    address: '1, Press Enclave Road, Saket, New Delhi, Delhi 110017',
    type: 'Private Super Specialty',
    rating: 4.5,
    totalBeds: 500,
    established: 2000,
    emergency: true,
    specializations: ['Oncology', 'Neurosurgery', 'Orthopedics', 'Bariatric Surgery', 'IVF & Fertility'],
    resources: { icuBeds: 0, oxygenCylinders: 18, bloodAvailable: 'AB+', ambulances: 0, generalBeds: 45, ventilators: 8 },
    doctors: [
      { name: 'Dr. Rajesh Koul', specialization: 'Medical Oncologist', qualification: 'MBBS, MD (Onco)', experience: 20, status: 'off-duty', avatarInitials: 'RKl' },
      { name: 'Dr. Prerna Bahl', specialization: 'Neurosurgeon', qualification: 'MBBS, MS, MCh', experience: 16, status: 'on-duty', avatarInitials: 'PB' },
      { name: 'Dr. Sunil Seth', specialization: 'Bariatric Surgeon', qualification: 'MBBS, MS', experience: 12, status: 'on-duty', avatarInitials: 'SS' },
      { name: 'Dr. Aastha Jain', specialization: 'Fertility Specialist', qualification: 'MBBS, MD (OBG)', experience: 9, status: 'off-duty', avatarInitials: 'AJ' },
    ]
  },
  {
    id: '6',
    name: 'Fortis Escorts Heart Institute',
    distance: 7.9,
    driveTime: 25,
    phone: '+911147135000',
    lat: 28.5583,
    lng: 77.2764,
    address: 'Okhla Road, New Delhi, Delhi 110025',
    type: 'Private Cardiac Specialty',
    rating: 4.9,
    totalBeds: 310,
    established: 1988,
    emergency: true,
    specializations: ['Interventional Cardiology', 'Cardiac Electrophysiology', 'Heart Failure', 'Vascular Surgery', 'Cardiac Anesthesia'],
    resources: { icuBeds: 25, oxygenCylinders: 100, bloodAvailable: 'B-, O+', ambulances: 5, generalBeds: 120, ventilators: 22 },
    doctors: [
      { name: 'Dr. T.S. Kler', specialization: 'Interventional Cardiologist', qualification: 'MBBS, MD, DM', experience: 30, status: 'on-duty', avatarInitials: 'TK' },
      { name: 'Dr. Manish Bansal', specialization: 'Electrophysiologist', qualification: 'MBBS, MD, DM', experience: 18, status: 'on-duty', avatarInitials: 'MB' },
      { name: 'Dr. Sonia Gupta', specialization: 'Vascular Surgeon', qualification: 'MBBS, MS, MCh', experience: 14, status: 'off-duty', avatarInitials: 'SoG' },
      { name: 'Dr. Ajay Kohli', specialization: 'Cardiac Anesthetist', qualification: 'MBBS, MD (Anaes)', experience: 22, status: 'on-duty', avatarInitials: 'AK' },
      { name: 'Dr. Renu Sharma', specialization: 'Heart Failure Specialist', qualification: 'MBBS, MD, DM', experience: 11, status: 'on-duty', avatarInitials: 'RS' },
    ]
  },
  {
    id: '7',
    name: 'BLK Super Speciality Hospital',
    distance: 5.4,
    driveTime: 19,
    phone: '+911130403040',
    lat: 28.6436,
    lng: 77.1782,
    address: 'Pusa Road, New Delhi, Delhi 110005',
    type: 'Private Super Specialty',
    rating: 4.4,
    totalBeds: 650,
    established: 1959,
    emergency: true,
    specializations: ['Hematology', 'Bone Marrow Transplant', 'Dermatology', 'Psychiatry', 'Pulmonology'],
    resources: { icuBeds: 4, oxygenCylinders: 0, bloodAvailable: 'A-', ambulances: 2, generalBeds: 70, ventilators: 6 },
    doctors: [
      { name: 'Dr. Hari Goyal', specialization: 'Hematologist', qualification: 'MBBS, MD, DM', experience: 17, status: 'on-duty', avatarInitials: 'HG' },
      { name: 'Dr. Swati Misra', specialization: 'Dermatologist', qualification: 'MBBS, MD (Derm)', experience: 10, status: 'off-duty', avatarInitials: 'SwM' },
      { name: 'Dr. Pratap Sharan', specialization: 'Psychiatrist', qualification: 'MBBS, MD (Psych)', experience: 20, status: 'on-duty', avatarInitials: 'PS2' },
      { name: 'Dr. Lalit Mohan', specialization: 'Pulmonologist', qualification: 'MBBS, MD (Pulm)', experience: 13, status: 'on-duty', avatarInitials: 'LM' },
    ]
  },
  {
    id: '8',
    name: 'RML (Dr. Ram Manohar Lohia) Hospital',
    distance: 1.5,
    driveTime: 5,
    phone: '+911123365525',
    lat: 28.6256,
    lng: 77.1996,
    address: 'Baba Kharak Singh Marg, New Delhi, Delhi 110001',
    type: 'Government Hospital',
    rating: 3.9,
    totalBeds: 1600,
    established: 1954,
    emergency: true,
    specializations: ['General Surgery', 'Emergency Medicine', 'Radiology', 'Pathology', 'Anesthesiology'],
    resources: { icuBeds: 0, oxygenCylinders: 25, bloodAvailable: 'O+', ambulances: 0, generalBeds: 100, ventilators: 5 },
    doctors: [
      { name: 'Dr. B.K. Singh', specialization: 'General Surgeon', qualification: 'MBBS, MS', experience: 16, status: 'on-duty', avatarInitials: 'BK' },
      { name: 'Dr. Pooja Khanna', specialization: 'Emergency Physician', qualification: 'MBBS, MD (EM)', experience: 8, status: 'on-duty', avatarInitials: 'PK' },
      { name: 'Dr. Ramesh Chand', specialization: 'Radiologist', qualification: 'MBBS, MD (Radio)', experience: 14, status: 'off-duty', avatarInitials: 'RC' },
      { name: 'Dr. Alka Yadav', specialization: 'Anesthesiologist', qualification: 'MBBS, MD (Anaes)', experience: 11, status: 'on-duty', avatarInitials: 'AY' },
    ]
  },
  {
    id: '9',
    name: 'Lok Nayak (LNJP) Hospital',
    distance: 5.2,
    driveTime: 18,
    phone: '+911123232400',
    lat: 28.6389,
    lng: 77.2393,
    address: 'Jawahar Lal Nehru Marg, New Delhi, Delhi 110002',
    type: 'Government Hospital',
    rating: 3.8,
    totalBeds: 2000,
    established: 1963,
    emergency: true,
    specializations: ['Trauma Surgery', 'Burns & Plastic Surgery', 'Forensic Medicine', 'Community Medicine'],
    resources: { icuBeds: 8, oxygenCylinders: 35, bloodAvailable: 'None', ambulances: 3, generalBeds: 130, ventilators: 9 },
    doctors: [
      { name: 'Dr. Suresh Kumar', specialization: 'Trauma Surgeon', qualification: 'MBBS, MS', experience: 19, status: 'on-duty', avatarInitials: 'SK' },
      { name: 'Dr. Mona Bhatnagar', specialization: 'Plastic Surgeon', qualification: 'MBBS, MS, MCh', experience: 15, status: 'off-duty', avatarInitials: 'MB2' },
      { name: 'Dr. Jagdish Prasad', specialization: 'Forensic Expert', qualification: 'MBBS, MD (FSM)', experience: 23, status: 'on-duty', avatarInitials: 'JP' },
      { name: 'Dr. Asha Tiwari', specialization: 'Community Medicine', qualification: 'MBBS, MD (CM)', experience: 10, status: 'off-duty', avatarInitials: 'AT' },
    ]
  },
  {
    id: '10',
    name: 'Holy Family Hospital',
    distance: 9.1,
    driveTime: 30,
    phone: '+911126845900',
    lat: 28.5626,
    lng: 77.2750,
    address: 'Okhla Road, New Delhi, Delhi 110025',
    type: 'Private Multi-Specialty',
    rating: 4.3,
    totalBeds: 450,
    established: 1953,
    emergency: true,
    specializations: ['Nephrology', 'Diabetology', 'Geriatrics', 'Ophthalmology', 'Physiotherapy'],
    resources: { icuBeds: 15, oxygenCylinders: 80, bloodAvailable: 'O-, A+, B+', ambulances: 4, generalBeds: 110, ventilators: 14 },
    doctors: [
      { name: 'Dr. Isaac D\'Souza', specialization: 'Nephrologist', qualification: 'MBBS, MD, DM', experience: 21, status: 'on-duty', avatarInitials: 'ID' },
      { name: 'Dr. Ruth Mathew', specialization: 'Diabetologist', qualification: 'MBBS, MD (Endo)', experience: 16, status: 'on-duty', avatarInitials: 'RM' },
      { name: 'Dr. George Philip', specialization: 'Geriatrician', qualification: 'MBBS, MD, DNB', experience: 18, status: 'off-duty', avatarInitials: 'GP' },
      { name: 'Dr. Anita Jose', specialization: 'Ophthalmologist', qualification: 'MBBS, MS (Ophth)', experience: 12, status: 'on-duty', avatarInitials: 'AnJ' },
      { name: 'Dr. Thomas Kurien', specialization: 'Physiotherapist', qualification: 'BPT, MPT', experience: 9, status: 'on-duty', avatarInitials: 'TK2' },
    ]
  }
];
