class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

export { ApiResponse, sendSuccess };
export default ApiResponse;
