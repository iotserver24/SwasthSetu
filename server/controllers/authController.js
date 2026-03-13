import { registerHospital, loginHospital } from "../services/authService.js";

export async function registerHandler(req, res) {
  try {
    const { name, email, password, city, type } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    const { hospital, token } = await registerHospital({ name, email, password, city, type });
    return res.status(201).json({ success: true, data: { hospital, token } });
  } catch (err) {
    const status = err.message.includes("already exists") ? 409 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    const { hospital, token } = await loginHospital({ email, password });
    return res.json({ success: true, data: { hospital, token } });
  } catch (err) {
    const status = err.message.includes("No account") || err.message.includes("Incorrect") ? 401 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
}

export async function meHandler(req, res) {
  return res.json({ success: true, data: req.hospital });
}
