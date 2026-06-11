import { reportRepository } from "../repositories/report.repository";
import { productRepository } from "../repositories/product.repository";
import { productService } from "./product.service";
import { HttpError } from "../errors/HttpError";
import mongoose from "mongoose";

export const reportService = {
  async createReport(userId: string, productId: string, reason: string) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, "ID mẻ hàng không hợp lệ");
    }

    const product = await productRepository.findOne({
      _id: productId,
      status: { $ne: "Deleted" },
    });
    if (!product) {
      throw new HttpError(404, "Sản phẩm không tồn tại hoặc đã bị ẩn");
    }

    if (product.sellerId.toString() === userId) {
      throw new HttpError(400, "Bạn không thể báo cáo mẻ hàng của chính mình!");
    }

    const existing = await reportRepository.findByReporterAndProduct(
      userId,
      productId,
    );
    if (existing) {
      throw new HttpError(400, "Bạn đã báo cáo mẻ hàng này rồi");
    }

    const cleanReason = reason
      .trim()
      .replace(/<[^>]*>/g, "")
      .slice(0, 500);
    await reportRepository.create({
      reporterId: userId,
      productId,
      reason: cleanReason,
    });
  },

  async listReports(
    status: "Pending" | "Resolved" | "Dismissed",
    offset: number,
    limit: number,
  ) {
    const total = await reportRepository.countByStatus(status);
    const reports = await reportRepository.findByStatusPaginated(
      status,
      offset,
      limit,
    );

    const formattedRows = reports.map((r: any) => ({
      id: r._id.toString(),
      reason: r.reason,
      status: r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
      reporterName: r.reporterId?.name || "Một người dùng",
      productName: r.productId?.name || "Sản phẩm đã bị xoá",
      productId: r.productId?._id?.toString() || null,
      sellerId: r.productId?.sellerId?._id?.toString() || null,
      sellerName: r.productId?.sellerId?.name || "Một ngư dân",
    }));

    return { formattedRows, total };
  },

  async handleReport(
    reportId: string,
    action: "resolve" | "dismiss",
    adminNote: string | undefined,
    adminId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new HttpError(400, "ID báo cáo không hợp lệ");
    }

    const report = await reportRepository.findById(reportId);
    if (!report) throw new HttpError(404, "Không tìm thấy báo cáo");

    const newStatus = action === "resolve" ? "Resolved" : "Dismissed";

    if (action === "resolve" && report.productId) {
      await productService.delete(
        report.productId.toString(),
        adminId,
        "Admin",
      );
    }

    report.status = newStatus;
    report.adminNote = adminNote || null;
    await report.save();
  },
};
