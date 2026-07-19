// Import mô hình Report và kiểu IReport để tương tác dữ liệu báo cáo sai phạm
import { Report, IReport } from "../models/Report";
// Import thư viện mongoose để thực hiện xử lý kiểu dữ liệu ObjectId
import mongoose from "mongoose";

// Xuất ra đối tượng reportRepository chứa các phương thức tương tác cơ sở dữ liệu cho báo cáo sai phạm
export const reportRepository = {
  // Tìm báo cáo sai phạm dựa vào ID người báo cáo và ID sản phẩm
  async findByReporterAndProduct(
    reporterId: string,
    productId: string,
  ): Promise<IReport | null> {
    if (!reporterId || !mongoose.Types.ObjectId.isValid(reporterId)) return null;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return null;
    return Report.findOne({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      productId: new mongoose.Types.ObjectId(productId),
    });
  },

  // Tìm báo cáo sai phạm dựa vào ID người báo cáo và ID bài viết
  async findByReporterAndPost(
    reporterId: string,
    postId: string,
  ): Promise<IReport | null> {
    if (!reporterId || !mongoose.Types.ObjectId.isValid(reporterId)) return null;
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) return null;
    return Report.findOne({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      postId: new mongoose.Types.ObjectId(postId),
    });
  },

  // Tìm báo cáo sai phạm dựa vào ID người báo cáo và ID công thức
  async findByReporterAndRecipe(
    reporterId: string,
    recipeId: string,
  ): Promise<IReport | null> {
    if (!reporterId || !mongoose.Types.ObjectId.isValid(reporterId)) return null;
    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) return null;
    return Report.findOne({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      recipeId: new mongoose.Types.ObjectId(recipeId),
    });
  },

  // Đếm tổng số lượng báo cáo sai phạm dựa trên trạng thái của báo cáo
  async countByStatus(
    status: "Pending" | "Resolved" | "Dismissed",
  ): Promise<number> {
    return Report.countDocuments({ status });
  },

  // Lấy danh sách báo cáo sai phạm theo trạng thái có phân trang
  async findByStatusPaginated(
    status: "Pending" | "Resolved" | "Dismissed",
    offset: number,
    limit: number,
  ): Promise<IReport[]> {
    return Report.find({ status })
      .populate("reporterId", "name")
      .populate({
        path: "productId",
        select: "name sellerId",
        populate: {
          path: "sellerId",
          select: "name",
        },
      })
      .populate({
        path: "postId",
        select: "title userId userName authorName",
      })
      .populate({
        path: "recipeId",
        select: "title authorId",
        populate: {
          path: "authorId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  },

  // Tìm kiếm báo cáo sai phạm theo ID
  async findById(reportId: string): Promise<IReport | null> {
    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) return null;
    return Report.findById(reportId);
  },

  // Tạo mới một báo cáo sai phạm
  async create(data: {
    reporterId: string;
    productId?: string;
    postId?: string;
    recipeId?: string;
    targetType: "Product" | "Post" | "Recipe";
    reason: string;
  }): Promise<IReport> {
    const report = new Report({
      reporterId: new mongoose.Types.ObjectId(data.reporterId),
      productId: data.productId ? new mongoose.Types.ObjectId(data.productId) : undefined,
      postId: data.postId ? new mongoose.Types.ObjectId(data.postId) : undefined,
      recipeId: data.recipeId ? new mongoose.Types.ObjectId(data.recipeId) : undefined,
      targetType: data.targetType,
      reason: data.reason,
    });
    return report.save();
  },

  // Xóa các báo cáo sai phạm liên quan đến một sản phẩm cụ thể
  async deleteByProductId(productId: string): Promise<any> {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return null;
    // Gọi phương thức deleteMany để xóa tất cả các báo cáo có trường productId khớp với giá trị truyền vào
    return Report.deleteMany({
      productId: new mongoose.Types.ObjectId(productId) as any,
    });
  },

  // Xóa các báo cáo sai phạm được gửi bởi một người dùng cụ thể
  async deleteByReporterId(reporterId: string): Promise<any> {
    if (!reporterId || !mongoose.Types.ObjectId.isValid(reporterId)) return null;
    // Gọi phương thức deleteMany để xóa tất cả các báo cáo có trường reporterId khớp với giá trị truyền vào
    return Report.deleteMany({
      reporterId: new mongoose.Types.ObjectId(reporterId),
    });
  },
};
