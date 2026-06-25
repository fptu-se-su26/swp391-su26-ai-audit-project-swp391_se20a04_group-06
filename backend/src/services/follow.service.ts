// Import thư viện mongoose để thực hiện kiểm duyệt định dạng ObjectId
import mongoose from "mongoose";
// Import đối tượng userRepository để tương tác dữ liệu tài khoản và quan hệ theo dõi
import { userRepository } from "../repositories/user.repository";
// Import lớp lỗi HttpError phục vụ ném lỗi kèm mã trạng thái HTTP
import { HttpError } from "../errors/HttpError";

// Xuất đối tượng followService chứa logic nghiệp vụ theo dõi/hủy theo dõi người bán
export const followService = {
  // Nghiệp vụ bật hoặc tắt trạng thái theo dõi một người bán (sellerId) từ người dùng (userId)
  async toggleFollow(userId: string, sellerId: string) {
    // Đảm bảo sellerId được truyền vào đầy đủ và đúng cấu trúc ObjectId của MongoDB
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      throw new HttpError(400, "ID người bán không hợp lệ");
    }
    // Chặn người dùng thực hiện tự theo dõi chính tài khoản của họ
    if (userId === sellerId) {
      throw new HttpError(400, "Không thể tự theo dõi chính mình");
    }

    // Tìm kiếm thông tin tài khoản người dùng thực hiện theo dõi trong database
    const user = await userRepository.findRawById(userId);
    // Nếu không tồn tại người dùng tương ứng, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Kiểm tra xem người dùng hiện tại đã theo dõi người bán này từ trước chưa
    const isFollowing = await userRepository.isFollowing(userId, sellerId);

    // Nếu người dùng chưa từng theo dõi người bán này
    if (!isFollowing) {
      // Xác minh xem tài khoản người bán có tồn tại thật và đang ở trạng thái hoạt động (isActive = true) không
      const sellerExists = await userRepository.exists({
        _id: sellerId,
        isActive: true,
      });
      // Nếu người bán không tồn tại hoặc đã bị khóa tài khoản
      if (!sellerExists) {
        // Ném lỗi 404
        throw new HttpError(404, "Người bán không tồn tại hoặc đã bị khóa");
      }
      // Gọi repository thực hiện ghi nhận thao tác theo dõi người bán
      await userRepository.followSeller(userId, sellerId);
      // Trả về kết quả là đang theo dõi thành công
      return { isFollowing: true, message: "Đã theo dõi thành công" };
    }

    // Nếu người dùng đã theo dõi từ trước, thực hiện nghiệp vụ hủy theo dõi
    await userRepository.unfollowSeller(userId, sellerId);
    // Trả về kết quả đã hủy theo dõi thành công
    return { isFollowing: false, message: "Đã hủy theo dõi" };
  },
};
