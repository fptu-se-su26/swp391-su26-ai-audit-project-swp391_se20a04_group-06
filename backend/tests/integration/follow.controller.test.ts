import { toggleFollow } from "../../src/controllers/follow.controller";
import { followService } from "../../src/services/follow.service";
import { Request, Response } from "express";

// Giả lập followService ở tầng nghiệp vụ bên dưới
jest.mock("../../src/services/follow.service");

describe("Integration Test (Controller): Follow Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();

    // Giả lập đối tượng Response của Express
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it("Nên trả về dữ liệu định dạng JSON thành công khi followService xử lý thành công", async () => {
    // Giả lập thông tin phiên đăng nhập và tham số truyền lên từ Client
    mockRequest = {
      user: { userId: "user_123", role: "User" },
      params: { sellerId: "seller_456" },
    };

    const expectedResult = {
      isFollowing: true,
      message: "Đã theo dõi thành công",
    };
    (followService.toggleFollow as jest.Mock).mockResolvedValue(expectedResult);

    await toggleFollow(mockRequest as Request, mockResponse as Response);

    expect(followService.toggleFollow).toHaveBeenCalledWith(
      "user_123",
      "seller_456",
    );
    expect(jsonMock).toHaveBeenCalledWith(expectedResult);
  });

  it("Nên phản hồi đúng mã lỗi HTTP tương ứng khi followService ném ra lỗi nghiệp vụ", async () => {
    mockRequest = {
      user: { userId: "user_123", role: "User" },
      params: { sellerId: "seller_456" },
    };

    const mockError = {
      status: 400,
      message: "Không thể tự theo dõi chính mình",
    };
    (followService.toggleFollow as jest.Mock).mockRejectedValue(mockError);

    await toggleFollow(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Không thể tự theo dõi chính mình",
    });
  });
});
