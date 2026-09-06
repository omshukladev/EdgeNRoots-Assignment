import { Router } from "express";
import customerController from "../controllers/customerController.js";

const router = Router();

router.post("/customers", customerController.createCustomer);

export default router;
