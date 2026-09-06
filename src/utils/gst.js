import { ValidationError } from "./errors.js";

const round2 = (value) => Math.round(value * 100) / 100;

const validateGstRate = (rate) => {
  const numericRate = Number(rate);
  if (!Number.isFinite(numericRate) || numericRate < 0 || numericRate > 100) {
    throw new ValidationError(`GST rate must be between 0 and 100, got ${rate}`, [], "INVALID_GST_RATE");
  }
  return numericRate;
};

const validatePremium = (premium) => {
  const numericPremium = Number(premium);
  if (!Number.isFinite(numericPremium) || numericPremium <= 0) {
    throw new ValidationError(`Premium must be greater than 0, got ${premium}`, [], "INVALID_PREMIUM");
  }
  return round2(numericPremium);
};

const calculateGst = (premium, rate) => {
  const numericPremium = validatePremium(premium);
  const numericRate = validateGstRate(rate);
  const gstAmount = round2(numericPremium * (numericRate / 100));
  const totalPremium = round2(numericPremium + gstAmount);
  return { premium: numericPremium, gstRate: numericRate, gstAmount, totalPremium };
};

export { calculateGst, round2, validateGstRate, validatePremium };
