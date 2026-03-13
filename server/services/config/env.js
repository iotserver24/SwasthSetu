export const env = {
  mongoUri:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/clinical-system",
  port: process.env.PORT || 5000,
  sttProvider: process.env.STT_PROVIDER || "sarvam",
  summarizerProvider: process.env.SUMMARIZER_PROVIDER || "proxy",
  sarvamApiKey: process.env.SARVAM_API_KEY || "",
  sarvamBaseUrl: process.env.SARVAM_BASE_URL || "https://api.sarvam.ai",
  aiProxyBaseUrl: process.env.AI_PROXY_BASE_URL || "",
  aiModel: process.env.AI_MODEL || "",
  aiModelId: process.env.AI_MODEL_ID || "",
};
