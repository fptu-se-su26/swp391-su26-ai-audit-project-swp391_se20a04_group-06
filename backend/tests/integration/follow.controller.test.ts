// Import hàm controller toggleFollow để thực hiện kiểm thử tích hợp ở tầng trình diễn HTTP
import { toggleFollow } from "../../src/controllers/follow.controller";
// Import dịch vụ nghiệp vụ followService để thiết lập giả lập hành vi
import { followService } from "../../src/services/follow.service";
// Import giao diện Request và Response của Express để định kiểu cho các đối tượng giả lập
import { Request, Response } from "express";

// Giả lập (mock) toàn bộ module followService ở tầng nghiệp vụ bên dưới
jest.mock("../../src/services/follow.service");

// Khởi tạo khối describe gom các ca kiểm thử tích hợp (ở tầng Controller) cho Follow Controller
describe("Integration Test (Controller): Follow Controller", () => {
  // Khai báo đối tượng Express Request giả lập
  let mockRequest: Partial<Request>;
  // Khai báo đối tượng Express Response giả lập
  let mockResponse: Partial<Response>;
  // Khai báo hàm giả lập status của Express Response
  let statusMock: jest.Mock;
  // Khai báo hàm giả lập json của Express Response
  let jsonMock: jest.Mock;

  // Hàm chạy trước mỗi ca kiểm thử đơn lẻ để thiết lập lại các đối tượng giả lập sạch sẽ
  beforeEach(() => {
    // Xóa sạch lịch sử gọi hàm của tất cả các mock
    jest.clearAllMocks();
    // Tạo hàm giả lập statusMock và thiết lập trả về chính đối tượng Response hiện hành để cho phép gọi chuỗi (chaining)
    statusMock = jest.fn().mockReturnThis();
    // Tạo hàm giả lập jsonMock và thiết lập trả về chính đối tượng Response
    jsonMock = jest.fn().mockReturnThis();

    // Giả lập đối tượng Response của Express chứa các phương thức tương tác
    mockResponse = {
      // Gán hàm giả lập status
      status: statusMock,
      // Gán hàm giả lập json
      json: jsonMock,
    };
  });

  // Ca kiểm thử kiểm tra trả về đúng dữ liệu định dạng JSON và mã 200 khi nghiệp vụ thành công
  it("Nên trả về dữ liệu định dạng JSON thành công khi followService xử lý thành công", async () => {
    // Giả lập thông tin phiên đăng nhập của người dùng và các tham số truyền lên từ URL Client
    mockRequest = {
      // Giả lập thông tin user đã xác thực qua middleware auth
      user: { userId: "user_123", role: "User" },
      // Giả lập tham số params chứa ID người bán
      params: { sellerId: "seller_456" },
    };

    // Định nghĩa kết quả mong đợi trả về từ followService
    const expectedResult = {
      // Đã theo dõi
      isFollowing: true,
      // Chuỗi thông báo thành công
      message: "Đã theo dõi thành công",
    };
    // Cấu hình hàm giả lập toggleFollow của followService trả về kết quả mong đợi
    (followService.toggleFollow as jest.Mock).mockResolvedValue(expectedResult);

    // Chạy thực thi trực tiếp hàm controller toggleFollow với các đối tượng giả lập
    await toggleFollow(mockRequest as Request, mockResponse as Response);

    // Đảm bảo dịch vụ toggelFollow được gọi đúng tham số ID người theo dõi và ID người bán
    expect(followService.toggleFollow).toHaveBeenCalledWith(
      "user_123",
      "seller_456",
    );
    // Kỳ vọng phương thức json của Response được gọi truyền vào đúng cấu trúc expectedResult thành công
    expect(jsonMock).toHaveBeenCalledWith(expectedResult);
  });

  // Ca kiểm thử kiểm tra phản hồi đúng mã lỗi HTTP và thông điệp tương ứng khi nghiệp vụ thất bại
  it("Nên phản hồi đúng mã lỗi HTTP tương ứng khi followService ném ra lỗi nghiệp vụ", async () => {
    // Giả lập thông tin yêu cầu chứa ID người dùng và ID người bán
    mockRequest = {
      user: { userId: "user_123", role: "User" },
      params: { sellerId: "seller_456" },
    };

    // Định nghĩa đối tượng lỗi nghiệp vụ giả lập ném ra từ followService
    const mockError = {
      // Mã lỗi HTTP 400 Bad Request
      status: 400,
      // Thông điệp báo lỗi chi tiết
      message: "Không thể tự theo dõi chính mình",
    };
    // Cấu hình hàm giả lập toggleFollow của followService ném ra đối tượng lỗi giả lập
    (followService.toggleFollow as jest.Mock).mockRejectedValue(mockError);

    // Thực thi chạy hàm controller toggleFollow
    await toggleFollow(mockRequest as Request, mockResponse as Response);

    // Kỳ vọng phương thức status của Response được gọi truyền vào đúng mã lỗi 400
    expect(statusMock).toHaveBeenCalledWith(400);
    // Kỳ vọng phương thức json của Response được gọi truyền vào đúng thông điệp mô tả lỗi
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Không thể tự theo dõi chính mình",
    });
  });
});
