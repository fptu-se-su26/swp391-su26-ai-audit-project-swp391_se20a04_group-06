import { reportService } from "./report.service";
import { reportRepository } from "../repositories/report.repository";
import { productRepository } from "../repositories/product.repository";
import mongoose from "mongoose";

jest.mock("../repositories/report.repository");
jest.mock("../repositories/product.repository");
jest.mock("./product.service", () => ({
  productService: { delete: jest.fn() },
}));

describe("Unit Test: Report Service", () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockProductId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Nên throw 400 nếu ID sản phẩm không phải ObjectId hợp lệ", async () => {
    await expect(
      reportService.createReport(mockUserId, "invalid_id", "Hàng fake"),
    ).rejects.toThrow(/hợp lệ/);
  });

  it("Nên throw 404 nếu sản phẩm không tồn tại", async () => {
    (productRepository.findOne as jest.Mock).mockResolvedValue(null);
    await expect(
      reportService.createReport(mockUserId, mockProductId, "Spam"),
    ).rejects.toThrow(/không tồn tại/);
  });

  it("Nên tạo báo cáo thành công", async () => {
    (productRepository.findOne as jest.Mock).mockResolvedValue({
      _id: mockProductId,
      sellerId: new mongoose.Types.ObjectId().toString(),
    });
    (reportRepository.findByReporterAndProduct as jest.Mock).mockResolvedValue(
      null,
    );
    (reportRepository.create as jest.Mock).mockResolvedValue({
      _id: "report_1",
    });

    await reportService.createReport(
      mockUserId,
      mockProductId,
      "Hàng không tươi",
    );
    expect(reportRepository.create).toHaveBeenCalled();
  });
});
