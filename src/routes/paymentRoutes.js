import { Router } from "express";
import paymentController from "../controllers/paymentController.js";

const router = Router();

router.post("/payments", paymentController.createPayment);

export default router;
