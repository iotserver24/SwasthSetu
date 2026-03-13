import { verifyToken } from "../services/authService.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required. Please log in." });
  }

  try {
    req.hospital = verifyToken(token);
    req.actorId = req.hospital?.hospitalId || null;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
  }
}
