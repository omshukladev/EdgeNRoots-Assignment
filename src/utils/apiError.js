class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    code = "ERROR",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.errors = errors;
    this.success = false;
    this.data = null;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
export default ApiError;
