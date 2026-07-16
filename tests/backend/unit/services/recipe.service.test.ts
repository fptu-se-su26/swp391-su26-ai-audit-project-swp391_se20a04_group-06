// Import đối tượng recipeService chứa các nghiệp vụ quản lý công thức cần kiểm thử
import { recipeService } from "../../../../backend/src/services/recipe.service";
// Import đối tượng recipeRepository để thiết lập giả lập các tương tác cơ sở dữ liệu công thức
import { recipeRepository } from "../../../../backend/src/repositories/recipe.repository";
// Import đối tượng userRepository để thiết lập giả lập các tương tác cơ sở dữ liệu người dùng
import { userRepository } from "../../../../backend/src/repositories/user.repository";

// Giả lập (mock) toàn bộ module recipeRepository để chặn các tương tác dữ liệu thực tế
jest.mock("../../../../backend/src/repositories/recipe.repository");
// Giả lập (mock) toàn bộ module userRepository để tránh truy vấn cơ sở dữ liệu người dùng thực tế
jest.mock("../../../../backend/src/repositories/user.repository");
// Giả lập ghi log hệ thống bằng cách mock logger ghi log lỗi để giữ màn hình console sạch sẽ
jest.mock("../../../../backend/src/utils/logger", () => ({
  // Đối tượng logger giả lập chứa các hàm thông báo rỗng
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Khởi tạo khối mô tả tổng thể cho kiểm thử đơn vị của dịch vụ Recipe Service
describe("Unit Test: Recipe Service (recipe.service.ts)", () => {
  // Định nghĩa mã ID người dùng giả lập
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  // Định nghĩa mã ID công thức giả lập
  const mockRecipeId = "60c72b2f9b1d8b2bad000002";

  // Hàm dọn dẹp trước mỗi ca kiểm thử riêng biệt
  beforeEach(() => {
    // Xóa sạch lịch sử gọi hàm của các module mock để bắt đầu ca kiểm thử mới một cách độc lập
    jest.clearAllMocks();
  });

  // Gom nhóm các ca kiểm thử cho nghiệp vụ tạo mới công thức món ăn
  describe("Nghiệp vụ create (Tạo công thức món ăn)", () => {
    // Ca kiểm thử kiểm tra tính năng chặn người dùng chưa xác minh tài khoản viết công thức
    it("Nên chặn nếu người dùng thường chưa xác minh tài khoản cố tình tạo công thức", async () => {
      // Giả lập hàm tìm kiếm tài khoản thô trả về người dùng thường có trạng thái chưa xác minh danh tính
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        // ID người dùng khớp với ID giả lập
        _id: mockUserId,
        // Trạng thái xác minh là false
        isVerified: false,
      });

      // Dữ liệu nội dung công thức món ăn muốn tạo
      const recipeData = {
        // Tiêu đề công thức
        title: "Canh chua cá mú biển",
        // Mô tả món ăn
        description: "Món canh chua giải nhiệt ngày hè",
        // Danh sách nguyên liệu cần chuẩn bị
        ingredients: ["Cá mú", "Dứa", "Cà chua"],
        // Danh sách các bước tiến hành nấu nướng
        instructions: ["Nấu nước canh sôi", "Bỏ cá mú vào đun chín"],
      };

      // Kỳ vọng cuộc gọi tạo công thức sẽ thất bại và ném lỗi 403
      await expect(
        // Gọi hàm tạo công thức trong dịch vụ với vai trò là User bình thường
        recipeService.create(mockUserId, "User", recipeData),
      ).rejects.toThrow(
        // Kiểm tra đối tượng lỗi trả về có đúng mã trạng thái và mô tả từ chối quyền hay không
        expect.objectContaining({
          // Mã lỗi HTTP 403 Forbidden
          status: 403,
          // Nội dung thông báo từ chối truy cập do tài khoản chưa xác minh
          message:
            "Chỉ Admin hoặc ngư dân đã xác minh mới được viết công thức nấu ăn",
        }),
      );
    });

    // Ca kiểm thử kiểm tra cho phép tạo công thức thành công khi tài khoản đã được xác minh danh tính
    it("Nên cho phép tạo công thức thành công đối với ngư dân đã được xác minh danh tính", async () => {
      // Giả lập hàm tìm kiếm tài khoản thô trả về tài khoản đã xác minh danh tính thành công
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        // ID tài khoản người dùng
        _id: mockUserId,
        // Trạng thái đã xác minh
        isVerified: true,
      });

      // Giả lập hàm lưu trữ công thức của recipeRepository trả về bản ghi chứa ID công thức mới
      (recipeRepository.create as jest.Mock).mockResolvedValue({
        // ID công thức vừa tạo thành công
        _id: mockRecipeId,
      });

      // Dữ liệu nội dung công thức món ăn muốn tạo
      const recipeData = {
        // Tiêu đề món ăn
        title: "Canh chua cá mú biển",
        // Mô tả món ăn
        description: "Món canh chua giải nhiệt ngày hè",
        // Danh sách nguyên liệu chuẩn bị
        ingredients: ["Cá mú", "Dứa", "Cà chua"],
        // Hướng dẫn các bước chế biến món ăn
        instructions: ["Nấu nước canh sôi", "Bỏ cá mú vào đun chín"],
      };

      // Thực thi gọi nghiệp vụ tạo công thức từ recipeService
      const result = await recipeService.create(mockUserId, "User", recipeData);
      // Kỳ vọng kết quả ID công thức trả về khớp chính xác với ID giả lập thành công
      expect(result._id).toBe(mockRecipeId);
    });
  });
});
