import { Router } from "express";
import { saveConsultationHandler, previewTranscriptHandler } from "../controllers/consultationController.js";

const router = Router();

router.post("/", saveConsultationHandler);
router.get("/transcript/preview", previewTranscriptHandler);

export default router;
