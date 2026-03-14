/**
 * Professional Registry Service
 * Simulates verification against professional medical registries
 * In production, this would integrate with real APIs (NMC, Pharmacy Council, etc.)
 */

const REGISTRIES = {
  NMC: {
    name: 'National Medical Council',
    role: 'doctor',
    prefix: 'NMC',
    format: /^NMC\d{6,8}$/,
  },
  PCI: {
    name: 'Pharmacy Council of India',
    role: 'pharmacist',
    prefix: 'PCI',
    format: /^PCI\d{6,8}$/,
  },
  PMC: {
    name: 'Paramedical Council',
    role: 'lab',
    prefix: 'PMC',
    format: /^PMC\d{6,8}$/,
  },
};

const MOCK_REGISTRY_DATABASE = {
  // Doctors (NMC)
  'NMC123456': {
    name: 'Dr Ravi Kumar',
    role: 'doctor',
    licenseStatus: 'ACTIVE',
    specialization: 'General Medicine',
    registrationDate: '2015-03-15',
    registry: 'NMC',
  },
  'NMC789012': {
    name: 'Dr Priya Sharma',
    role: 'doctor',
    licenseStatus: 'ACTIVE',
    specialization: 'Cardiology',
    registrationDate: '2018-07-22',
    registry: 'NMC',
  },
  'NMC345678': {
    name: 'Dr Amit Patel',
    role: 'doctor',
    licenseStatus: 'SUSPENDED',
    specialization: 'Orthopedics',
    suspensionReason: 'Pending investigation',
    registry: 'NMC',
  },
  'NMC555666': {
    name: 'Dr Ananya Iyer',
    role: 'doctor',
    licenseStatus: 'ACTIVE',
    specialization: 'Pediatrics',
    registrationDate: '2020-11-05',
    registry: 'NMC',
  },
  'NMC111222': {
    name: 'Dr Arjun Mehra',
    role: 'doctor',
    licenseStatus: 'ACTIVE',
    specialization: 'Neurology',
    registrationDate: '2012-09-30',
    registry: 'NMC',
  },

  // Pharmacists (PCI)
  'PCI123456': {
    name: 'Suresh Kumar',
    role: 'pharmacist',
    licenseStatus: 'ACTIVE',
    qualification: 'B.Pharm',
    registrationDate: '2019-05-10',
    registry: 'PCI',
  },
  'PCI789012': {
    name: 'Anita Desai',
    role: 'pharmacist',
    licenseStatus: 'ACTIVE',
    qualification: 'D.Pharm',
    registrationDate: '2020-01-28',
    registry: 'PCI',
  },
  'PCI444555': {
    name: 'Rahul Varma',
    role: 'pharmacist',
    licenseStatus: 'ACTIVE',
    qualification: 'M.Pharm',
    registry: 'PCI',
  },

  // Lab Technicians (PMC)
  'PMC123456': {
    name: 'Vikram Singh',
    role: 'lab',
    licenseStatus: 'ACTIVE',
    qualification: 'DMLT',
    registrationDate: '2021-06-15',
    registry: 'PMC',
  },
  'PMC789012': {
    name: 'Kavitha Nair',
    role: 'lab',
    licenseStatus: 'ACTIVE',
    qualification: 'B.Sc MLT',
    registrationDate: '2022-02-20',
    registry: 'PMC',
  },
  'PMC999000': {
    name: 'Deepak Joshi',
    role: 'lab',
    licenseStatus: 'ACTIVE',
    qualification: 'DMLT',
    registry: 'PMC',
  },
  'PMC345678': {
    name: 'Rajesh Menon',
    role: 'lab',
    licenseStatus: 'INACTIVE',
    inactivityReason: 'License renewal pending',
    registry: 'PMC',
  },
};

/**
 * Detect which registry a registryId belongs to
 * @param {string} registryId - The professional registry ID
 * @returns {string|null} - Registry key (NMC, PCI, PMC) or null if invalid format
 */
function detectRegistry(registryId) {
  const id = String(registryId || '').toUpperCase().trim();
  for (const [key, registry] of Object.entries(REGISTRIES)) {
    if (registry.format.test(id)) {
      return key;
    }
  }
  return null;
}

/**
 * Verify a professional registry ID
 * @param {string} registryId - The professional registry ID to verify
 * @returns {Promise<object|null>} - Registry record or null if not found
 */
async function verifyRegistry(registryId) {
  if (!registryId) {
    return null;
  }

  const normalizedId = String(registryId).toUpperCase().trim();
  const registryKey = detectRegistry(normalizedId);
  if (!registryKey) {
    return null;
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check mock database (keys are uppercase)
  const record = MOCK_REGISTRY_DATABASE[normalizedId];
  if (!record) {
    return null;
  }

  return {
    registryId: normalizedId,
    registryName: REGISTRIES[registryKey].name,
    name: record.name,
    role: record.role,
    licenseStatus: record.licenseStatus,
    details: {
      specialization: record.specialization,
      qualification: record.qualification,
      registrationDate: record.registrationDate,
      suspensionReason: record.suspensionReason,
      inactivityReason: record.inactivityReason,
    },
  };
}

/**
 * Get the role for a registry ID prefix
 * @param {string} registryId - The registry ID
 * @returns {string|null} - Role (doctor, pharmacist, lab) or null
 */
function getRoleForRegistryId(registryId) {
  const id = String(registryId || '').toUpperCase().trim();
  const registryKey = detectRegistry(id);
  if (!registryKey) return null;
  return REGISTRIES[registryKey].role;
}

/**
 * Check if a registry ID format is valid
 * @param {string} registryId - The registry ID to validate
 * @returns {boolean} - True if format is valid
 */
function isValidRegistryFormat(registryId) {
  if (!registryId) return false;
  const normalizedId = String(registryId).toUpperCase().trim();
  return detectRegistry(normalizedId) !== null;
}

module.exports = {
  verifyRegistry,
  getRoleForRegistryId,
  isValidRegistryFormat,
  detectRegistry,
  REGISTRIES,
};