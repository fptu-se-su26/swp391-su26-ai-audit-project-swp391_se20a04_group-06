import { Report, IReport } from "../models/Report";
import mongoose from "mongoose";

export const reportRepository = {
  async findByReporterAndProduct(
    reporterId: string,
    productId: string,
  ): Promise<IReport | null> {
    return Report.findOne({
      reporterId: new mongoose.Types.ObjectId(reporterId),
      productId: new mongoose.Types.ObjectId(productId),
    });
  },

  async countByStatus(
    status: "Pending" | "Resolved" | "Dismissed",
  ): Promise<number> {
    return Report.countDocuments({ status });
  },

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
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  },

  async findById(reportId: string): Promise<IReport | null> {
    return Report.findById(reportId);
  },

  async create(data: {
    reporterId: string;
    productId: string;
    reason: string;
  }): Promise<IReport> {
    const report = new Report({
      reporterId: new mongoose.Types.ObjectId(data.reporterId),
      productId: new mongoose.Types.ObjectId(data.productId),
      reason: data.reason,
    });
    return report.save();
  },

  async deleteByProductId(productId: string): Promise<any> {
    return Report.deleteMany({
      productId: new mongoose.Types.ObjectId(productId) as any,
    });
  },

  async deleteByReporterId(reporterId: string): Promise<any> {
    return Report.deleteMany({
      reporterId: new mongoose.Types.ObjectId(reporterId),
    });
  },
};
