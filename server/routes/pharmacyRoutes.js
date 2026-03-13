import { Router } from "express";
import { dispenseItemHandler, dispenseAllHandler } from "../controllers/pharmacyController.js";

const router = Router();

router.post("/update", dispenseItemHandler);
router.post("/dispense-all", dispenseAllHandler);

export default router;
