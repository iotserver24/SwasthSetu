import Patient from "../models/Patient.js";

export async function dispensePharmacyItem({ patientId, medicine }) {
  const patient = await Patient.findOne({ patientId });
  if (!patient) throw new Error(`Patient ${patientId} not found`);

  const item = patient.pharmacyItems.find((p) => p.medicine === medicine);
  if (!item) throw new Error(`Medicine "${medicine}" not found for patient ${patientId}`);

  item.dispensed = true;
  item.dispensedAt = new Date();

  await patient.save();
  return patient;
}

export async function dispenseAll({ patientId }) {
  const patient = await Patient.findOne({ patientId });
  if (!patient) throw new Error(`Patient ${patientId} not found`);

  for (const item of patient.pharmacyItems) {
    if (!item.dispensed) {
      item.dispensed = true;
      item.dispensedAt = new Date();
    }
  }

  await patient.save();
  return patient;
}
