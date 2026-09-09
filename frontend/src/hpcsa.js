/**
 * HPCSA-aligned clinician specialty / role catalog for admin doctor onboarding.
 * Mirror of backend HpcsaCatalog — keep labels in sync for offline form rendering.
 */

export const HPCSA_SPECIALITIES = [
  { speciality: 'Anaesthesiology', designation: 'Anaesthesiologist', code: 'ANAES', board: 'MEDICAL' },
  { speciality: 'Cardiothoracic Surgery', designation: 'Cardiothoracic Surgeon', code: 'CTS', board: 'MEDICAL' },
  { speciality: 'Clinical Pharmacology', designation: 'Clinical Pharmacologist', code: 'CLINPHARM', board: 'MEDICAL' },
  { speciality: 'Community Health', designation: 'Specialist in Community Health', code: 'COMMHEALTH', board: 'MEDICAL' },
  { speciality: 'Dermatology', designation: 'Dermatologist', code: 'DERM', board: 'MEDICAL' },
  { speciality: 'Diagnostic Radiology', designation: 'Diagnostic Radiologist', code: 'RAD', board: 'MEDICAL' },
  { speciality: 'Family Medicine', designation: 'Family Physician', code: 'FAMMED', board: 'MEDICAL' },
  { speciality: 'Internal Medicine', designation: 'Physician', code: 'PHYS', board: 'MEDICAL' },
  { speciality: 'Neurology', designation: 'Neurologist', code: 'NEURO', board: 'MEDICAL' },
  { speciality: 'Neurosurgery', designation: 'Neurosurgeon', code: 'NSURG', board: 'MEDICAL' },
  { speciality: 'Nuclear Medicine', designation: 'Specialist in Nuclear Medicine', code: 'NUCMED', board: 'MEDICAL' },
  { speciality: 'Obstetrics and Gynaecology', designation: 'Obstetrician and Gynaecologist', code: 'OANDG', board: 'MEDICAL' },
  { speciality: 'Ophthalmology', designation: 'Ophthalmologist', code: 'OPHTH', board: 'MEDICAL' },
  { speciality: 'Orthopaedics', designation: 'Orthopaedic Surgeon', code: 'ORTHO', board: 'MEDICAL' },
  { speciality: 'Otorhinolaryngology (ENT)', designation: 'Otorhinolaryngologist', code: 'ENT', board: 'MEDICAL' },
  { speciality: 'Paediatrics', designation: 'Paediatrician', code: 'PAEDS', board: 'MEDICAL' },
  { speciality: 'Pathology', designation: 'Pathologist', code: 'PATH', board: 'MEDICAL' },
  { speciality: 'Plastic and Reconstructive Surgery', designation: 'Plastic and Reconstructive Surgeon', code: 'PLAST', board: 'MEDICAL' },
  { speciality: 'Psychiatry', designation: 'Psychiatrist', code: 'PSYCH', board: 'MEDICAL' },
  { speciality: 'Radiation Oncology', designation: 'Radiation Oncologist', code: 'RADONC', board: 'MEDICAL' },
  { speciality: 'Sports and Exercise Medicine', designation: 'Specialist in Sports and Exercise Medicine', code: 'SEM', board: 'MEDICAL' },
  { speciality: 'Surgery', designation: 'Surgeon', code: 'SURG', board: 'MEDICAL' },
  { speciality: 'Urology', designation: 'Urologist', code: 'UROL', board: 'MEDICAL' },
  { speciality: 'Maxillo-facial and Oral Surgery', designation: 'Maxillo-facial and Oral Surgeon', code: 'MFOS', board: 'DENTAL' },
  { speciality: 'Oral Medicine and Periodontics', designation: 'Specialist in Oral Medicine and Periodontics', code: 'OMP', board: 'DENTAL' },
  { speciality: 'Oral and Maxillofacial Pathology', designation: 'Oral and Maxillofacial Pathologist', code: 'OMFP', board: 'DENTAL' },
  { speciality: 'General Practice', designation: 'General Practitioner', code: 'GP', board: 'MEDICAL' },
];

export const HPCSA_SUB_SPECIALITIES = [
  { name: 'Cardiology', parentSpeciality: 'Internal Medicine' },
  { name: 'Child & Adolescent Psychiatry', parentSpeciality: 'Psychiatry' },
  { name: 'Critical Care', parentSpeciality: 'Various' },
  { name: 'Endocrinology', parentSpeciality: 'Internal Medicine / Paediatrics' },
  { name: 'Gastroenterology', parentSpeciality: 'Internal Medicine' },
  { name: 'Geriatric Medicine', parentSpeciality: 'Internal Medicine' },
  { name: 'Infectious Diseases', parentSpeciality: 'Internal Medicine / Paediatrics' },
  { name: 'Nephrology', parentSpeciality: 'Internal Medicine / Paediatrics' },
  { name: 'Paediatric Surgery', parentSpeciality: 'Surgery' },
  { name: 'Pulmonology', parentSpeciality: 'Internal Medicine / Paediatrics' },
  { name: 'Rheumatology', parentSpeciality: 'Internal Medicine' },
  { name: 'Vascular Surgery', parentSpeciality: 'Surgery' },
  { name: 'Medical Oncology', parentSpeciality: 'Internal Medicine' },
  { name: 'Gynaecological Oncology', parentSpeciality: 'Obstetrics and Gynaecology' },
];

export const CLINICIAN_CATEGORIES = [
  { code: 'INTERN', title: 'Medical Intern', hpcsaRegistration: 'HPCSA Intern' },
  { code: 'COMMUNITY_SERVICE', title: 'Community Service Medical Officer', hpcsaRegistration: 'HPCSA Independent Practice (CS)' },
  { code: 'MEDICAL_OFFICER', title: 'Medical Officer', hpcsaRegistration: 'HPCSA Independent Practice' },
  { code: 'GP', title: 'General Practitioner', hpcsaRegistration: 'HPCSA Independent Practice' },
  { code: 'SPECIALIST', title: 'Medical Specialist', hpcsaRegistration: 'HPCSA Specialist' },
  { code: 'SUB_SPECIALIST', title: 'Sub-specialist', hpcsaRegistration: 'HPCSA Sub-specialist' },
  { code: 'DENTAL_SPECIALIST', title: 'Dental Specialist', hpcsaRegistration: 'HPCSA Dental Specialist' },
];

export const SPECIALIST_GRADES = ['1', '2', '3'];

const GRADE_APPLICABLE = new Set([
  'MEDICAL_OFFICER',
  'SPECIALIST',
  'SUB_SPECIALIST',
  'DENTAL_SPECIALIST',
]);

export function designationFor(speciality) {
  return HPCSA_SPECIALITIES.find((s) => s.speciality === speciality)?.designation || speciality || '';
}

export function codeForSpecialty(speciality) {
  return HPCSA_SPECIALITIES.find((s) => s.speciality === speciality)?.code || 'GEN';
}

export function gradeApplicable(category) {
  return GRADE_APPLICABLE.has(category);
}

export function deriveSystemRoleCode(clinicianCategory, grade, specialty) {
  const category = (clinicianCategory || 'MEDICAL_OFFICER').toUpperCase();
  const specCode = codeForSpecialty(specialty);
  const g = grade || 1;
  switch (category) {
    case 'INTERN':
      return 'INTERN';
    case 'COMMUNITY_SERVICE':
      return 'MO_CS';
    case 'GP':
      return 'GP';
    case 'MEDICAL_OFFICER':
      return `MO_GR${g}`;
    case 'SPECIALIST':
      return `SPEC_${specCode}_GR${g}`;
    case 'SUB_SPECIALIST':
      return `SUBSPEC_${specCode}_GR${g}`;
    case 'DENTAL_SPECIALIST':
      return `DENT_${specCode}_GR${g}`;
    default:
      return category;
  }
}

export function hpcsaCategoryLabel(clinicianCategory, specialty) {
  const category = (clinicianCategory || '').toUpperCase();
  switch (category) {
    case 'INTERN':
      return 'HPCSA Intern';
    case 'COMMUNITY_SERVICE':
      return 'HPCSA Independent Practice (Community Service)';
    case 'MEDICAL_OFFICER':
    case 'GP':
      return 'HPCSA Independent Practice';
    case 'SPECIALIST':
      return specialty ? `HPCSA Specialist (${specialty})` : 'HPCSA Specialist';
    case 'SUB_SPECIALIST':
      return specialty ? `HPCSA Sub-specialist (${specialty})` : 'HPCSA Sub-specialist';
    case 'DENTAL_SPECIALIST':
      return specialty ? `HPCSA Dental Specialist (${specialty})` : 'HPCSA Dental Specialist';
    default:
      return 'HPCSA Registered Practitioner';
  }
}

export function requiresCosign(clinicianCategory) {
  return (clinicianCategory || '').toUpperCase() === 'INTERN';
}
