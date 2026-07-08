/**
 * Generates safe, unique dummy data for each test run.
 * Uses a timestamp + random suffix so parallel runs never collide.
 * No real PII — all values are clearly synthetic.
 */

function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface ResearcherFormData {
  // Account
  firstName: string;
  lastName: string;
  email: string;
  institutionEmail: string;
  phoneCode: string;
  mobileNumber: string;
  password: string;
  dateOfBirth: string;
  // Institutional
  institution: string;
  department: string;
  roleTitle: string;
  researcherType: string;
  country: string;
  city: string;
  yearsOfExperience: string;
  // Research
  researchArea: string;
  shortBio: string;
  researchInterests: string;
  platformPurpose: string;
  expectedDatasets: string;
  collaborationType: string;
  // Compliance
  usesSensitiveData: string;
  irbRequired: string;
  dataSensitivityLevel: string;
  supervisorName: string;
  supervisorEmail: string;
}

export function generateResearcherData(): ResearcherFormData {
  const id = uid();
  return {
    // Account
    firstName: 'Test',
    lastName: `Researcher${id}`,
    email: `e2e.test.${id}@example-test.invalid`,
    institutionEmail: `e2e.${id}@testuniversity.edu`,
    phoneCode: '+1',
    mobileNumber: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    password: 'E2eTest@2026!',
    dateOfBirth: '1990-06-15',
    // Institutional
    institution: 'E2E Test University',
    department: 'Department of Automated Testing',
    roleTitle: 'Graduate Researcher',
    researcherType: 'student_researcher',
    country: 'United States',
    city: 'Test City',
    yearsOfExperience: '2-4',
    // Research
    researchArea: 'Health Informatics and Data Science',
    shortBio:
      'This is an automated end-to-end test account created by the Playwright cloud test suite. ' +
      'It should be reviewed and removed by an administrator after verification.',
    researchInterests:
      'Automated testing of researcher registration workflows, ' +
      'cloud deployment validation, and API integration testing.',
    platformPurpose:
      'This account was created by an automated E2E test to verify that the ' +
      'researcher registration endpoint is functioning correctly on the cloud deployment.',
    expectedDatasets:
      'Synthetic test datasets for automated pipeline validation.',
    collaborationType: 'solo',
    // Compliance
    usesSensitiveData: 'no',
    irbRequired: 'no',
    dataSensitivityLevel: 'public',
    supervisorName: 'E2E Test Supervisor',
    supervisorEmail: `supervisor.${id}@testuniversity.edu`,
  };
}
