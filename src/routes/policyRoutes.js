import { Router } from "express";
import policyController from "../controllers/policyController.js";
import policyReadController from "../controllers/policyReadController.js";

const router = Router();

router.post("/policies", policyController.createPolicy);
router.get("/policies/:id", policyReadController.getPolicy);
router.get("/policies/:id/ledger", policyReadController.getLedger);
router.get("/policies/:id/summary", policyReadController.getSummary);

export default router;
