import { Router } from "express";
import policyController from "../controllers/policyController.js";

const router = Router();

router.post("/policies", policyController.createPolicy);

export default router;
