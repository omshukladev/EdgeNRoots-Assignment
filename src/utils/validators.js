const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9]{7,15}$/;
const POLICY_NUMBER_RE = /^[A-Za-z0-9-]{4,50}$/;

const isValidEmail = (email) => typeof email === "string" && EMAIL_RE.test(email.trim());

const isValidPhone = (phone) =>
  phone === undefined || phone === null || phone === "" ||
  (typeof phone === "string" && PHONE_RE.test(phone.trim()));

const isValidPolicyNumber = (policyNumber) =>
  typeof policyNumber === "string" && POLICY_NUMBER_RE.test(policyNumber.trim());

const isValidAmount = (amount) =>
  typeof amount === "number" && Number.isFinite(amount) && amount > 0 &&
  Math.round(amount * 100) === amount * 100;

const isValidGstRate = (rate) =>
  (typeof rate === "number" || (typeof rate === "string" && rate.trim() !== "")) &&
  Number(rate) >= 0 && Number(rate) <= 100;

const isValidDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
};

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

export {
  isValidEmail,
  isValidPhone,
  isValidPolicyNumber,
  isValidAmount,
  isValidGstRate,
  isValidDate,
  isValidId,
};
