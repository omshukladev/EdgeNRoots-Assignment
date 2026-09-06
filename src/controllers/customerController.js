import { asyncHandler, sendSuccess } from "../utils/index.js";
import customerService from "../services/customerService.js";

const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body ?? {};
  const customer = await customerService.createCustomer({ name, email, phone });
  return sendSuccess(res, customer, "Customer created", 201);
});

export default { createCustomer };
