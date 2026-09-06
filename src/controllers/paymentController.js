import { asyncHandler, sendSuccess } from "../utils/index.js";
import paymentService from "../services/paymentService.js";

const createPayment = asyncHandler(async (req, res) => {
  const { policy_id, amount, payment_date } = req.body ?? {};
  const result = await paymentService.recordPayment({
    policyId: policy_id,
    amount,
    paymentDate: payment_date,
  });
  return sendSuccess(res, result, "Payment recorded", 201);
});

export default { createPayment };
