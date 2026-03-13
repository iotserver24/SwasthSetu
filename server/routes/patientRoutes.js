import { Router } from "express";
import { createPatientHandler, getPatientHandler } from "../controllers/patientController.js";

const router = Router();

router.post("/", createPatientHandler);
router.get("/:id", getPatientHandler);

export default router;
