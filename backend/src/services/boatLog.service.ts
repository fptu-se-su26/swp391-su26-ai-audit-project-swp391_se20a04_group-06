import { boatLogRepository } from "../repositories/boatlog.repository";
import { userRepository } from "../repositories/user.repository";
import { HttpError } from "../errors/HttpError";
import { parseId } from "../helpers/response.helper";

export const boatLogService = {
  async list(query: { page?: string; limit?: string; userId?: string }) {
    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "12", 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.userId) {
      if (parseId(query.userId)) {
        filter.userId = query.userId;
      } else {
        throw new HttpError(400, "ID người dùng không hợp lệ");
      }
    }

    const { boatLogs, total } = await boatLogRepository.findAll(
      filter,
      skip,
      limit,
    );

    return {
      boatLogs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async create(userId: string, data: { content: string; images?: string[] }) {
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    if (!user.isVerified && !user.isPremium && user.role !== "Admin") {
      throw new HttpError(
        403,
        "Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh.",
      );
    }

    return boatLogRepository.create({
      userId,
      userName: user.name,
      userAvatar: user.avatar || null,
      content: data.content,
      images: data.images || [],
    });
  },

  async toggleLike(logId: string, userId: string) {
    const log = await boatLogRepository.findById(logId);
    if (!log) throw new HttpError(404, "Không tìm thấy nhật ký cabin");

    const index = log.likes.indexOf(userId as any);
    let liked = false;
    let updatedLog;

    if (index === -1) {
      updatedLog = await boatLogRepository.addLike(logId, userId);
      liked = true;
    } else {
      updatedLog = await boatLogRepository.removeLike(logId, userId);
    }

    return { liked, likeCount: updatedLog?.likes.length || 0 };
  },

  async delete(logId: string, userId: string, role: string) {
    const log = await boatLogRepository.findById(logId);
    if (!log) throw new HttpError(404, "Không tìm thấy nhật ký cabin");

    if (role !== "Admin" && log.userId.toString() !== userId) {
      throw new HttpError(403, "Bạn không có quyền xóa nhật ký này");
    }

    await boatLogRepository.delete(logId);
  },
};
