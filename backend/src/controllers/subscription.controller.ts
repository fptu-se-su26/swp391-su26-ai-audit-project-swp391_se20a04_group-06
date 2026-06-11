import { Request, Response } from "express";
import { Subscription } from "../models/Subscription";
import { sendServerError } from "../helpers/response.helper";
import { SUBSCRIPTION_PRICES } from "../config/constants";

// Calculate price based on packageType using global constants
const getPrice = (packageType: "Small" | "Medium" | "Large"): number => {
  return SUBSCRIPTION_PRICES[packageType] || 0;
};

export async function createSubscription(req: Request, res: Response) {
  const { userId } = req.user;
  const { packageType, frequency, preferredDay, shippingAddress, phone, note } = req.body;

  if (!packageType || !frequency || !preferredDay || !shippingAddress || !phone) {
    return res.status(400).json({ message: "Thiếu thông tin đăng ký bắt buộc" });
  }

  if (!["Small", "Medium", "Large"].includes(packageType)) {
    return res.status(400).json({ message: "Gói đăng ký không hợp lệ" });
  }

  if (!["Weekly", "BiWeekly", "Monthly"].includes(frequency)) {
    return res.status(400).json({ message: "Tần suất giao hàng không hợp lệ" });
  }

  try {
    const price = getPrice(packageType);
    
    // Set next delivery date based on preferredDay and frequency (offline setup or standard 7 days later)
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7); // Default to next week

    const subscription = new Subscription({
      userId,
      packageType,
      price,
      frequency,
      preferredDay,
      shippingAddress,
      phone,
      note,
      status: "Pending",
      nextDeliveryDate,
    });

    await subscription.save();
    return res.status(201).json({
      message: "Đăng ký gói định kỳ thành công. Ban quản trị sẽ liên hệ sớm để xác nhận.",
      subscription,
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getMySubscriptions(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 });
    return res.json(subscriptions);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getAllSubscriptions(req: Request, res: Response) {
  try {
    const subscriptions = await Subscription.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    return res.json(subscriptions);
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function updateSubscriptionStatus(req: Request, res: Response) {
  const { userId, role } = req.user;
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["Pending", "Active", "Paused", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  try {
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ message: "Không tìm thấy gói đăng ký" });
    }

    // Authorization: User can pause/cancel their own, Admin can do anything
    if (role !== "Admin" && subscription.userId.toString() !== userId) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa đăng ký này" });
    }

    if (role !== "Admin") {
      // User can only set to Paused or Cancelled
      if (status !== "Paused" && status !== "Cancelled" && status !== "Active") {
        return res.status(403).json({ message: "Chỉ Admin mới có thể thay đổi trạng thái này" });
      }
      // User cannot resume if admin suspended/cancelled it (e.g. from Cancelled to Active)
      if (subscription.status === "Cancelled" && status === "Active") {
        return res.status(400).json({ message: "Gói đã hủy không thể kích hoạt lại bởi người dùng" });
      }
    }

    subscription.status = status;
    if (status === "Active") {
      // Refresh delivery date if activated
      const delivery = new Date();
      delivery.setDate(delivery.getDate() + 7);
      subscription.nextDeliveryDate = delivery;
    } else if (status === "Cancelled" || status === "Paused") {
      subscription.nextDeliveryDate = null;
    }

    await subscription.save();
    return res.json({ message: "Cập nhật trạng thái đăng ký thành công", subscription });
  } catch (err) {
    return sendServerError(res, err);
  }
}
