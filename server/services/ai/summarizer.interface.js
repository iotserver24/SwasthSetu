import { env } from "../config/env.js";
import { generateWithProxy } from "./proxy.summarizer.js";
import { generateWithMock } from "./mock.summarizer.js";

export function getSummarizerProvider() {
  const provider = env.summarizerProvider.toLowerCase();
  if (provider === "proxy") return generateWithProxy;
  if (provider === "mock") return generateWithMock;
  throw new Error(`Unsupported summarizer provider: ${env.summarizerProvider}`);
}
