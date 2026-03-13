import { Router } from "express";
import { updateLabResultHandler } from "../controllers/labController.js";

const router = Router();

router.post("/update", updateLabResultHandler);

export default router;
