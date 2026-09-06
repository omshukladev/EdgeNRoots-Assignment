import { describe, it, expect } from "vitest";
import { ApiError, ApiResponse, sendSuccess, asyncHandler, NotFoundError, ConflictError, ValidationError, OverpaymentError } from "../../src/utils/index.js";

describe("ApiError", () => {
  it("carries status, code, message, errors, success flag", () => {
    const err = new ApiError(422, "bad input", ["field"], "VALIDATION_ERROR");
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("bad input");
    expect(err.errors).toEqual(["field"]);
    expect(err.success).toBe(false);
  });

  it("has defaults", () => {
    const err = new ApiError(500);
    expect(err.message).toBe("Something went wrong");
    expect(err.code).toBe("ERROR");
    expect(err.errors).toEqual([]);
  });
});

describe("domain errors", () => {
  it("NotFoundError → 404", () => {
    expect(new NotFoundError().statusCode).toBe(404);
  });
  it("ConflictError → 409", () => {
    expect(new ConflictError().statusCode).toBe(409);
  });
  it("ValidationError → 422", () => {
    expect(new ValidationError().statusCode).toBe(422);
  });
  it("OverpaymentError → 422 OVERPAYMENT", () => {
    const e = new OverpaymentError();
    expect(e.statusCode).toBe(422);
    expect(e.code).toBe("OVERPAYMENT");
  });
});

describe("ApiResponse + sendSuccess", () => {
  it("envelope has statusCode, data, message, success", () => {
    const r = new ApiResponse(201, { id: 1 }, "Created");
    expect(r).toMatchObject({ statusCode: 201, data: { id: 1 }, message: "Created", success: true });
  });

  it("success is false for status >= 400", () => {
    const r = new ApiResponse(404, null, "nope");
    expect(r.success).toBe(false);
  });

  it("sendSuccess writes correct status + json", () => {
    const res = {
      statusCode: null,
      payload: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = payload; return this; },
    };
    sendSuccess(res, { ok: 1 }, "Done", 201);
    expect(res.statusCode).toBe(201);
    expect(res.payload).toMatchObject({ statusCode: 201, data: { ok: 1 }, message: "Done", success: true });
  });
});

describe("asyncHandler", () => {
  it("passes resolved values through", async () => {
    const handler = asyncHandler(async (req, res, next) => {
      res.body = "ok";
    });
    const res = {};
    await handler({}, res, () => {});
    expect(res.body).toBe("ok");
  });

  it("forwards rejections to next(err)", async () => {
    const boom = new Error("boom");
    const handler = asyncHandler(async () => {
      throw boom;
    });
    let caught = null;
    const next = (err) => { caught = err; };
    await handler({}, {}, next);
    expect(caught).toBe(boom);
  });
});
