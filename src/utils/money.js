import { ValidationError } from "./errors.js";

const parseMoney = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100) / 100;
  }
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/[₹,]/g, "");
    if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) {
      throw new ValidationError(`Invalid money value: ${value}`, [], "INVALID_AMOUNT");
    }
    return Number(cleaned);
  }
  throw new ValidationError(`Invalid money value: ${value}`, [], "INVALID_AMOUNT");
};

export { parseMoney };
