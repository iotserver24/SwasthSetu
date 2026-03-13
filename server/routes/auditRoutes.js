import { Router } from "express";
import { getPatientAuditHandler } from "../controllers/auditController.js";

const router = Router();

router.get("/patient/:id", getPatientAuditHandler);

export default router;

