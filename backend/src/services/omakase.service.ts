import { HttpError } from "../errors/HttpError";
import { OmakaseSubscription } from "../models/OmakaseSubscription";
import { userRepository } from "../repositories/user.repository";
import { sanitizeText } from "../utils/security";

function calculateNextDelivery(plan: "Weekly" | "Monthly") {
  const next = new Date();
  if (plan === "Weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

export const omakaseService = {
  async getMine(userId: string) {
    return OmakaseSubscription.findOne({ userId }).lean();
  },

  async subscribe(
    userId: string,
    data: {
      plan: "Weekly" | "Monthly";
      deliveryAddress: string;
      phone: string;
    },
  ) {
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");
    if (!user.isPremium && user.role !== "Admin") {
      throw new HttpError(
        403,
        "Bạn cần nâng cấp Premium trước khi đăng ký Omakase",
      );
    }

    return OmakaseSubscription.findOneAndUpdate(
      { userId },
      {
        $set: {
          plan: data.plan,
          deliveryAddress: sanitizeText(data.deliveryAddress, 300),
          phone: sanitizeText(data.phone, 20),
          status: "Active",
          nextDeliveryAt: calculateNextDelivery(data.plan),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
  },

  async cancel(userId: string) {
    const subscription = await OmakaseSubscription.findOneAndUpdate(
      { userId, status: "Active" },
      { $set: { status: "Cancelled" } },
      { new: true },
    ).lean();
    if (!subscription) {
      throw new HttpError(404, "Không có gói Omakase đang hoạt động");
    }
    return subscription;
  },
};
