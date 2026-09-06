import { asyncHandler, sendSuccess } from "../utils/index.js";
import healthService from "../services/healthService.js";

const health = asyncHandler(async (req, res) => {
  const data = await healthService.checkHealth();
  return sendSuccess(res, data, "OK");
});

export default { health };
