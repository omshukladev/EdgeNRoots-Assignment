import { ApiError } from "./apiError.js";

class NotFoundError extends ApiError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(404, message, [], code);
  }
}

class ConflictError extends ApiError {
  constructor(message = "Resource already exists", code = "CONFLICT") {
    super(409, message, [], code);
  }
}

class ValidationError extends ApiError {
  constructor(message = "Validation failed", errors = [], code = "VALIDATION_ERROR") {
    super(422, message, errors, code);
  }
}

class OverpaymentError extends ApiError {
  constructor(message = "Payment amount exceeds outstanding amount", code = "OVERPAYMENT") {
    super(422, message, [], code);
  }
}

export { NotFoundError, ConflictError, ValidationError, OverpaymentError };
