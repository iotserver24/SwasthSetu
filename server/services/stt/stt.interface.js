import { env } from "../config/env.js";
import { transcribeWithSarvam } from "./sarvam.stt.js";
import { transcribeWithMock } from "./mock.stt.js";

export function getSttProvider() {
  const provider = env.sttProvider.toLowerCase();
  if (provider === "sarvam") return transcribeWithSarvam;
  if (provider === "mock") return transcribeWithMock;
  throw new Error(`Unsupported STT provider: ${env.sttProvider}`);
}
