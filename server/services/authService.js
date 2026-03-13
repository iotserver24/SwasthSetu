import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import Hospital from "../models/Hospital.js";

const JWT_SECRET = process.env.JWT_SECRET || "swasthyasetu_dev_secret";
const JWT_EXPIRES = "7d";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function registerHospital({ name, email, password, city, type }) {
  const existing = await Hospital.findOne({ email });
  if (existing) throw new Error("An account with this email already exists.");

  const hospitalId = "HID-" + nanoid(8).toUpperCase();
  const hospital = await Hospital.create({ hospitalId, name, email, password, city, type });

  const token = signToken({ hospitalId: hospital.hospitalId, email: hospital.email });
  return { hospital: sanitize(hospital), token };
}

export async function loginHospital({ email, password }) {
  const hospital = await Hospital.findOne({ email });
  if (!hospital) throw new Error("No account found with this email.");

  const valid = await hospital.comparePassword(password);
  if (!valid) throw new Error("Incorrect password.");

  const token = signToken({ hospitalId: hospital.hospitalId, email: hospital.email });
  return { hospital: sanitize(hospital), token };
}

function sanitize(doc) {
  const obj = doc.toObject();
  delete obj.password;
  return obj;
}
