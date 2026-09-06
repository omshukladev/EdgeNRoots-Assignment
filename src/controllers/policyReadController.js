import { asyncHandler, sendSuccess } from "../utils/index.js";
import policyReadService from "../services/policyReadService.js";

const getPolicy = asyncHandler(async (req, res) => {
  const data = await policyReadService.getPolicyDetail(req.params.id);
  return sendSuccess(res, data, "Policy fetched");
});

const getLedger = asyncHandler(async (req, res) => {
  const data = await policyReadService.getPolicyLedger(req.params.id);
  return sendSuccess(res, data, "Ledger fetched");
});

const getSummary = asyncHandler(async (req, res) => {
  const data = await policyReadService.getPolicySummary(req.params.id);
  return sendSuccess(res, data, "Summary fetched");
});

export default { getPolicy, getLedger, getSummary };
