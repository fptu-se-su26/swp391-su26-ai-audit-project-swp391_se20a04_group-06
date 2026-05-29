import { Request, Response } from 'express';
import { Report } from '../models/Report';
import { Product } from '../models/Product';
import { sendServerError, parseId } from '../helpers/response.helper';

export async function createReport(req: Request, res: Response) {
  const { userId } = req.user;
  const productId = req.params.productId;
  const { reason } = req.body;

  if (!productId || !reason)
    return res.status(400).json({ message: 'Thiếu thông tin' });

  try {
    const existing = await Report.findOne({ reporterId: userId, productId });
    if (existing)
      return res.status(400).json({ message: 'Bạn đã báo cáo bài đăng này rồi' });

    const newReport = new Report({
      reporterId: userId,
      productId,
      reason,
    });
    await newReport.save();
    return res.json({ message: 'Báo cáo đã gửi thành công' });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getReports(req: Request, res: Response) {
  const queryStatus = (req.query.status as string) || 'Pending';
  if (!['Pending', 'Resolved', 'Dismissed'].includes(queryStatus)) {
    return res.status(400).json({ message: 'Trạng thái báo cáo không hợp lệ' });
  }
  const status = queryStatus as 'Pending' | 'Resolved' | 'Dismissed';

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  try {
    const total = await Report.countDocuments({ status });
    const reports = await Report.find({ status })
      .populate("reporterId", "name")
      .populate({
        path: "productId",
        select: "name sellerId",
        populate: {
          path: "sellerId",
          select: "name"
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
      sellerName: r.productId?.sellerId?.name || "Một ngư dân"
    }));

    res.setHeader('X-Total-Count', total.toString());
    res.setHeader('X-Page', page.toString());
    res.setHeader('X-Limit', limit.toString());

    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function handleReport(req: Request, res: Response) {
  const reportId = req.params.id;
  const { action, adminNote } = req.body;

  if (!reportId || !action)
    return res.status(400).json({ message: 'Thiếu thông tin' });

  if (!['resolve', 'dismiss'].includes(action)) {
    return res.status(400).json({ message: "Hành động báo cáo không hợp lệ" });
  }

  const newStatus = action === 'resolve' ? 'Resolved' : 'Dismissed';
  try {
    const report = await Report.findById(reportId);
    if (!report)
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });

    if (action === 'resolve' && report.productId) {
      await Product.findByIdAndUpdate(report.productId, {
        $set: { status: 'Deleted' }
      });
    }

    report.status = newStatus;
    report.adminNote = adminNote || null;
    await report.save();

    return res.json({ message: 'Đã xử lý báo cáo' });
  } catch (err) {
    return sendServerError(res, err);
  }
}
