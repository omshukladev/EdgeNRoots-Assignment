import { ConflictError, ValidationError, isValidEmail, isValidPhone } from "../utils/index.js";
import customerRepository from "../repositories/customerRepository.js";

const createCustomer = async ({ name, email, phone }) => {
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new ValidationError("Name must be a string of at least 2 characters", [], "INVALID_NAME");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Invalid email format", [], "INVALID_EMAIL");
  }
  if (!isValidPhone(phone)) {
    throw new ValidationError("Phone must contain 7-15 digits", [], "INVALID_PHONE");
  }

  const existing = await customerRepository.findByEmail(email.trim().toLowerCase());
  if (existing) {
    throw new ConflictError("A customer with this email already exists", "DUPLICATE_EMAIL");
  }

  return customerRepository.createCustomer(name.trim(), email.trim().toLowerCase(), phone?.trim() ?? null);
};

export default { createCustomer };
