// Import đối tượng reportService chứa nghiệp vụ quản lý báo cáo vi phạm cần kiểm thử
import { reportService } from "./report.service";
// Import đối tượng reportRepository để giả lập các tương tác cơ sở dữ liệu báo cáo
import { reportRepository } from "../repositories/report.repository";
// Import đối tượng productRepository để giả lập các tương tác cơ sở dữ liệu sản phẩm
import { productRepository } from "../repositories/product.repository";
// Import thư viện mongoose phục vụ khởi tạo ngẫu nhiên các mã ObjectId hợp lệ cho kiểm thử
import mongoose from "mongoose";

// Thiết lập giả lập (mock) toàn bộ module reportRepository để tránh ghi vào cơ sở dữ liệu thật
jest.mock("../repositories/report.repository");
// Thiết lập giả lập (mock) toàn bộ module productRepository để tránh truy xuất cơ sở dữ liệu thật
jest.mock("../repositories/product.repository");
// Thiết lập giả lập (mock) đối tượng productService để kiểm soát hành vi xóa sản phẩm trong ca kiểm thử
jest.mock("./product.service", () => ({
  // Giả lập hàm delete rỗng của productService
  productService: { delete: jest.fn() },
}));

// Khởi tạo khối describe gom các ca kiểm thử đơn vị cho nghiệp vụ dịch vụ báo cáo
describe("Unit Test: Report Service", () => {
  // Tạo ngẫu nhiên một chuỗi ID người dùng giả lập dạng ObjectId hợp lệ
  const mockUserId = new mongoose.Types.ObjectId().toString();
  // Tạo ngẫu nhiên một chuỗi ID sản phẩm giả lập dạng ObjectId hợp lệ
  const mockProductId = new mongoose.Types.ObjectId().toString();

  // Chạy thiết lập lại trước mỗi ca kiểm thử đơn lẻ
  beforeEach(() => {
    // Xóa toàn bộ lịch sử gọi hàm của các hàm giả lập
    jest.clearAllMocks();
  });

  // Ca kiểm thử kiểm tra ném lỗi 400 nếu truyền ID sản phẩm sai định dạng MongoDB
  it("Nên throw 400 nếu ID sản phẩm không phải ObjectId hợp lệ", async () => {
    // Kỳ vọng lời gọi hàm tạo báo cáo sẽ bị từ chối và ném ra thông báo lỗi định dạng
    await expect(
      // Thực thi tạo báo cáo với ID sản phẩm sai định dạng "invalid_id"
      reportService.createReport(mockUserId, "invalid_id", "Hàng fake"),
    ).rejects.toThrow(/hợp lệ/);
  });

  // Ca kiểm thử kiểm tra ném lỗi 404 nếu sản phẩm cần báo cáo không tồn tại trong hệ thống
  it("Nên throw 404 nếu sản phẩm không tồn tại", async () => {
    // Giả lập hàm findOne của productRepository trả về null (sản phẩm không tồn tại)
    (productRepository.findOne as jest.Mock).mockResolvedValue(null);
    // Kỳ vọng lời gọi hàm tạo báo cáo sẽ bị từ chối và ném ra lỗi không tồn tại
    await expect(
      // Thực thi tạo báo cáo với lý do "Spam"
      reportService.createReport(mockUserId, mockProductId, "Spam"),
    ).rejects.toThrow(/không tồn tại/);
  });

  // Ca kiểm thử kiểm tra tạo báo cáo thành công khi đáp ứng đầy đủ điều kiện hợp lệ
  it("Nên tạo báo cáo thành công", async () => {
    // Giả lập tìm kiếm sản phẩm trả về thông tin sản phẩm và ID người bán hợp lệ
    (productRepository.findOne as jest.Mock).mockResolvedValue({
      // ID sản phẩm bị báo cáo
      _id: mockProductId,
      // ID người bán ngẫu nhiên khác với người báo cáo
      sellerId: new mongoose.Types.ObjectId().toString(),
    });
    // Giả lập chưa từng tồn tại báo cáo nào từ người dùng này cho sản phẩm này (trả về null)
    (reportRepository.findByReporterAndProduct as jest.Mock).mockResolvedValue(
      null,
    );
    // Giả lập hàm lưu báo cáo của reportRepository trả về đối tượng báo cáo đã tạo thành công
    (reportRepository.create as jest.Mock).mockResolvedValue({
      // ID bản ghi báo cáo
      _id: "report_1",
    });

    // Thực thi gọi nghiệp vụ tạo báo cáo vi phạm
    await reportService.createReport(
      // ID người gửi báo cáo
      mockUserId,
      // ID sản phẩm bị báo cáo
      mockProductId,
      // Lý do báo cáo vi phạm
      "Hàng không tươi",
    );
    // Kiểm tra xem hàm lưu báo cáo của reportRepository đã được gọi hay chưa
    expect(reportRepository.create).toHaveBeenCalled();
  });
});
