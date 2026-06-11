import { Request, Response } from "express";
import mongoose from "mongoose";
import { BoatLog } from "../models/BoatLog";
import { User } from "../models/User";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getBoatLogs(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  try {
    const filter: any = {};
    if (req.query.userId) {
      if (typeof req.query.userId === "string" && mongoose.Types.ObjectId.isValid(req.query.userId)) {
        filter.userId = req.query.userId;
      } else {
        return res.status(400).json({ message: "ID người dùng không hợp lệ" });
      }
    }
    
    const boatLogs = await BoatLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BoatLog.countDocuments(filter);

    return res.json({
      data: boatLogs,
      boatLogs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function createBoatLog(req: Request, res: Response) {
  const { userId } = req.user;
  const { content, images } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ message: "Nội dung nhật ký không được để trống" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Limit creation to verified sellers/fishermen or Admin
    if (!user.isVerified && !user.isPremium && user.role !== "Admin") {
      return res.status(403).json({
        message: "Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh.",
      });
    }

    const log = new BoatLog({
      userId,
      userName: user.name,
      userAvatar: user.avatar || null,
      content: content.trim(),
      images: Array.isArray(images) ? images : [],
    });

    await log.save();
    return res.status(201).json({ message: "Đăng nhật ký cabin thành công", boatLog: log });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function toggleLikeBoatLog(req: Request, res: Response) {
  const { userId } = req.user;
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "ID nhật ký không hợp lệ" });
  }

  try {
    const log = await BoatLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký cabin" });
    }

    const index = log.likes.indexOf(userId as any);
    let liked = false;
    if (index === -1) {
      log.likes.push(userId as any);
      liked = true;
    } else {
      log.likes.splice(index, 1);
    }

    await log.save();
    return res.json({ liked, likeCount: log.likes.length });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function deleteBoatLog(req: Request, res: Response) {
  const { userId, role } = req.user;
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "ID nhật ký không hợp lệ" });
  }

  try {
    const log = await BoatLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký cabin" });
    }

    if (role !== "Admin" && log.userId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa nhật ký này" });
    }

    await log.deleteOne();
    return res.json({ message: "Xóa nhật ký cabin thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}
