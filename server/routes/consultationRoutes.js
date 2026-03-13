import { Router } from "express";
import { saveConsultationHandler } from "../controllers/consultationController.js";

const router = Router();

router.post("/", saveConsultationHandler);

export default router;
