import { errorHandler } from "../../../../backend/src/middlewares/errorHandler";
import { Request, Response } from "express";
import { HttpError } from "../../../../backend/src/errors/HttpError";
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  DomainException,
} from "../../../../backend/src/shared/domain/exceptions/DomainException";

describe("errorHandler middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: "GET",
      url: "/test-url",
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it("should handle HttpError and return its status and message", () => {
    const error = new HttpError(403, "Old HTTP Error");
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Old HTTP Error" });
  });

  it("should handle ValidationError and return 400", () => {
    const error = new ValidationError("Invalid details");
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Invalid details" });
  });

  it("should handle UnauthorizedError and return 401", () => {
    const error = new UnauthorizedError("Unauthorized access");
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Unauthorized access" });
  });

  it("should handle NotFoundError and return 404", () => {
    const error = new NotFoundError("Resource not found");
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Resource not found" });
  });

  it("should handle ConflictError and return 409", () => {
    const error = new ConflictError("Data conflict");
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Data conflict" });
  });

  it("should handle generic DomainException and return 400", () => {
    class CustomDomainException extends DomainException {}
    const error = new CustomDomainException("Generic domain exception");
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Generic domain exception" });
  });

  it("should handle Mongoose CastError and return 400", () => {
    const error = new Error("Cast to ObjectId failed for value 'invalid-id'");
    error.name = "CastError";
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Định dạng ID không hợp lệ" });
  });

  it("should handle generic Error and return 500", () => {
    const error = new Error("Something broke");
    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
    });
  });
});
