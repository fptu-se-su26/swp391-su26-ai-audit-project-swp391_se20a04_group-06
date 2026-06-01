import { Request, Response } from 'express';
import { Report } from '../models/Report';
import { Product } from '../models/Product';
import { sendServerError, parseId } from '../helpers/response.helper';
import { productService } from "../services/product.service";
import { parsePagination } from '../utils/pagination';

export async function createReport(req: Request, res: Response) {
  const { userId } = req.user;
  const productId = req.params.productId;
  const { reason } = req.body;

  if (!productId || !reason)
    return res.status(400).json({ message: 'Thiếu thông tin' });

  try {
    // 🌟 GIẢI PHÁP NGHIỆP VỤ: Xác minh sản phẩm tồn tại và không phải của chính mình
    const product = await Product.findOne({ _id: productId, status: { $ne: "Deleted" } });
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại hoặc đã bị ẩn vĩnh viễn" });
    }

    if (product.sellerId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Bạn không thể tự gửi báo cáo sản phẩm của chính mình!" });
    }

    const existing = await Report.findOne({ reporterId: userId, productId });
    if (existing)
      return res.status(400).json({ message: 'Bạn đã báo cáo bài đăng này rồi' });

    // Làm sạch ký tự HTML cơ bản để chống chèn mã độc
    const cleanReason = reason.trim().replace(/<[^>]*>/g, "").slice(0, 500);

    const newReport = new Report({
      reporterId: userId,
      productId,
      reason: cleanReason,
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

  // 🌟 GIẢI PHÁP: Sử dụng Helper phân trang dùng chung an toàn của dự án
  const rawPage = typeof req.query.page === "string" ? req.query.page : undefined;
  const rawLimit = typeof req.query.limit === "string" ? req.query.limit : undefined;
  const { page, limit, offset } = parsePagination(rawPage, rawLimit, 100);

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
      .skip(offset) // Sử dụng offset an toàn đã sửa lỗi NaN
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

    // 🌟 GIẢI PHÁP: Gọi hàm Service dọn dẹp cascade đồng bộ nếu Admin duyệt ẩn tin vi phạm
    if (action === 'resolve' && report.productId) {
      await productService.delete(
        report.productId.toString(),
        req.user.userId,
        "Admin" // Truyền quyền Admin để vượt qua kiểm tra chủ sở hữu sản phẩm
      );
    }

    report.status = newStatus;
    report.adminNote = adminNote || null;
    await report.save();

    return res.json({ message: 'Đã xử lý báo cáo và dọn dẹp tài nguyên thành công!' });
  } catch (err) {
    return sendServerError(res, err);
  }
}

