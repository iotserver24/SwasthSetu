export async function transcribeWithMock() {
  return [
    "Patient: I have fever for two days and headache.",
    "Doctor: Take paracetamol and do a blood test.",
  ].join("\n");
}
