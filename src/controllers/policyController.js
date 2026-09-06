import { asyncHandler, sendSuccess } from "../utils/index.js";
import policyService from "../services/policyService.js";

const createPolicy = asyncHandler(async (req, res) => {
  const { customer_id, policy_number, premium, gst_rate, start_date, end_date } = req.body ?? {};
  const result = await policyService.createPolicy({
    customerId: customer_id,
    policyNumber: policy_number,
    premium,
    gstRate: gst_rate ?? 18,
    startDate: start_date,
    endDate: end_date,
  });
  return sendSuccess(res, result, "Policy created", 201);
});

export default { createPolicy };
