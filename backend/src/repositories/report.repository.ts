// Import mô hình Report và kiểu IReport để tương tác dữ liệu báo cáo sai phạm
import { Report, IReport } from "../models/Report";
// Import thư viện mongoose để thực hiện xử lý kiểu dữ liệu ObjectId
import mongoose from "mongoose";

// Xuất ra đối tượng reportRepository chứa các phương thức tương tác cơ sở dữ liệu cho báo cáo sai phạm
export const reportRepository = {
  // Tìm báo cáo sai phạm dựa vào ID người báo cáo và ID sản phẩm
  async findByReporterAndProduct(
    // ID người báo cáo
    reporterId: string,
    // ID sản phẩm bị báo cáo
    productId: string,
  ): Promise<IReport | null> {
    // Tìm một tài liệu Report khớp với điều kiện truyền vào (được ép kiểu sang ObjectId)
    return Report.findOne({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      productId: new mongoose.Types.ObjectId(productId),
    });
  },

  // Đếm tổng số lượng báo cáo sai phạm dựa trên trạng thái của báo cáo
  async countByStatus(
    // Trạng thái của báo cáo (Chờ xử lý, Đã xử lý, Đã bác bỏ)
    status: "Pending" | "Resolved" | "Dismissed",
  ): Promise<number> {
    // Đếm số lượng tài liệu có trường status tương ứng trong cơ sở dữ liệu
    return Report.countDocuments({ status });
  },

  // Lấy danh sách báo cáo sai phạm theo trạng thái có phân trang
  async findByStatusPaginated(
    // Trạng thái của báo cáo cần lấy
    status: "Pending" | "Resolved" | "Dismissed",
    // Số dòng bỏ qua để phân trang
    offset: number,
    // Số dòng giới hạn tối đa trên một trang
    limit: number,
  ): Promise<IReport[]> {
    // Tìm kiếm các báo cáo có trạng thái tương ứng
    return Report.find({ status })
      // Liên kết lấy thông tin tên của người báo cáo (reporterId)
      .populate("reporterId", "name")
      // Liên kết lồng để lấy thông tin sản phẩm (productId) gồm tên và ID người bán
      .populate({
        path: "productId",
        select: "name sellerId",
        // Trong sản phẩm lại liên kết lấy thông tin tên của người bán (sellerId)
        populate: {
          path: "sellerId",
          select: "name",
        },
      })
      // Sắp xếp các báo cáo theo thời gian tạo giảm dần (mới nhất lên đầu)
      .sort({ createdAt: -1 })
      // Bỏ qua offset dòng
      .skip(offset)
      // Giới hạn tối đa limit dòng trả về
      .limit(limit);
  },

  // Tìm kiếm báo cáo sai phạm theo ID
  async findById(reportId: string): Promise<IReport | null> {
    // Tìm kiếm và trả về báo cáo theo ID truyền vào
    return Report.findById(reportId);
  },

  // Tạo mới một báo cáo sai phạm
  async create(data: {
    // ID người gửi báo cáo
    reporterId: string;
    // ID sản phẩm bị báo cáo
    productId: string;
    // Lý do báo cáo
    reason: string;
  }): Promise<IReport> {
    // Khởi tạo thực thể Report mới, chuyển các ID chuỗi sang ObjectId của MongoDB
    const report = new Report({
      reporterId: new mongoose.Types.ObjectId(data.reporterId),
      productId: new mongoose.Types.ObjectId(data.productId),
      reason: data.reason,
    });
    // Lưu báo cáo vào cơ sở dữ liệu và trả về kết quả
    return report.save();
  },

  // Xóa các báo cáo sai phạm liên quan đến một sản phẩm cụ thể
  async deleteByProductId(productId: string): Promise<any> {
    // Gọi phương thức deleteMany để xóa tất cả các báo cáo có trường productId khớp với giá trị truyền vào
    return Report.deleteMany({
      productId: new mongoose.Types.ObjectId(productId) as any,
    });
  },

  // Xóa các báo cáo sai phạm được gửi bởi một người dùng cụ thể
  async deleteByReporterId(reporterId: string): Promise<any> {
    // Gọi phương thức deleteMany để xóa tất cả các báo cáo có trường reporterId khớp với giá trị truyền vào
    return Report.deleteMany({
      reporterId: new mongoose.Types.ObjectId(reporterId),
    });
  },
};
