import { NotFoundError, ValidationError } from "../utils/index.js";
import policyReadRepository from "../repositories/policyReadRepository.js";

const validateId = (id) => {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw new ValidationError("Invalid policy id", [], "INVALID_POLICY");
  }
  return Number(id);
};

const getPolicyDetail = async (id) => {
  const policyId = validateId(id);
  const detail = await policyReadRepository.getPolicyDetail(policyId);
  if (!detail) {
    throw new NotFoundError(`Policy ${policyId} not found`, "POLICY_NOT_FOUND");
  }
  return {
    id: detail.id,
    policy_number: detail.policy_number,
    customer: {
      id: detail.customer_id,
      name: detail.customer_name,
      email: detail.customer_email,
    },
    premium: Number(detail.premium),
    gst_rate: Number(detail.gst_rate),
    gst_amount: Number(detail.gst_amount),
    total_premium: Number(detail.total_premium),
    start_date: detail.start_date,
    end_date: detail.end_date,
    status: detail.status,
    outstanding: Number(detail.outstanding),
    created_at: detail.created_at,
  };
};

const getPolicyLedger = async (id) => {
  const policyId = validateId(id);
  const exists = await policyReadRepository.findPolicyById(policyId);
  if (!exists) {
    throw new NotFoundError(`Policy ${policyId} not found`, "POLICY_NOT_FOUND");
  }
  const ledger = await policyReadRepository.getPolicyLedger(policyId);
  return {
    policy_id: policyId,
    ...ledger,
    balanced: ledger.total_debit === ledger.total_credit,
  };
};

const getPolicySummary = async (id) => {
  const policyId = validateId(id);
  const exists = await policyReadRepository.findPolicyById(policyId);
  if (!exists) {
    throw new NotFoundError(`Policy ${policyId} not found`, "POLICY_NOT_FOUND");
  }
  const summary = await policyReadRepository.getPolicySummary(policyId);
  return {
    policy_id: policyId,
    ...summary,
  };
};

export default { getPolicyDetail, getPolicyLedger, getPolicySummary };
