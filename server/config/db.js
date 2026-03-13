import mongoose from "mongoose";
import { env } from "../services/config/env.js";

export async function connectDB() {
  const uri = env.mongoUri;
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}
