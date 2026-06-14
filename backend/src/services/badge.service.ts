// Import đối tượng userRepository để cập nhật thông tin danh sách huy hiệu của người dùng
import { userRepository } from "../repositories/user.repository";
// Import đối tượng productRepository để đếm số lượng tin đăng bán hải sản
import { productRepository } from "../repositories/product.repository";
// Import đối tượng reviewRepository để tính toán thống kê đánh giá sao và đếm số lượng đánh giá gửi đi
import { reviewRepository } from "../repositories/review.repository";
// Import đối tượng postRepository để đếm số lượng bài viết trên diễn đàn
import { postRepository } from "../repositories/post.repository";
// Import đối tượng logger phục vụ việc ghi nhận lỗi hệ thống
import { logger } from "../utils/logger";

// Hàm xử lý nghiệp vụ tự động cập nhật danh sách huy hiệu cho người dùng dựa trên hoạt động tích lũy
export async function updateUserBadges(userId: any): Promise<string[]> {
  try {
    // Khởi tạo mảng rỗng để lưu trữ các huy hiệu đạt tiêu chuẩn của người dùng
    const badges: string[] = [];
    // Chuyển đổi ID người dùng sang dạng chuỗi
    const userIdStr = userId.toString();

    // 1. Huy hiệu "Lão ngư bám biển": Khi người bán đăng bán ít nhất 5 sản phẩm ở trạng thái đang hoạt động (Active)
    const productCount = await productRepository.countDocuments({
      sellerId: userIdStr,
      status: "Active",
    });
    // Nếu số lượng tin đăng lớn hơn hoặc bằng 5
    if (productCount >= 5) {
      // Đẩy tên huy hiệu tương ứng vào mảng
      badges.push("Lão ngư bám biển");
    }

    // 2. Huy hiệu "Vua Mực Nháy": Khi người dùng đăng bán sản phẩm thuộc danh mục "Squid" (mực) và đang bán (Active)
    const hasSquid = await productRepository.findOne({
      sellerId: userIdStr,
      category: "Squid",
      status: "Active",
    });
    // Nếu tìm thấy sản phẩm mực đang bán
    if (hasSquid) {
      // Đẩy tên huy hiệu tương ứng vào mảng
      badges.push("Vua Mực Nháy");
    }

    // 3. Huy hiệu "Đệ nhất mẻ tươi": Khi người bán được đánh giá trung bình từ 4.5 sao trở lên và có ít nhất 1 bài đánh giá
    const reviewStats = await reviewRepository.aggregate([
      // Lọc các bản ghi review thuộc về người bán này
      { $match: { sellerId: userId } },
      {
        // Nhóm tất cả lại để tính trung bình cộng rating và đếm tổng số bản ghi review
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    // Trích xuất điểm trung bình rating, mặc định là 0 nếu chưa có đánh giá nào
    const avgRating = reviewStats[0]?.avgRating || 0;
    // Trích xuất tổng số lượng lượt đánh giá
    const ratingCount = reviewStats[0]?.totalReviews || 0;
    // Nếu điểm trung bình từ 4.5 trở lên và có tối thiểu 1 người đánh giá
    if (avgRating >= 4.5 && ratingCount >= 1) {
      // Đẩy tên huy hiệu tương ứng vào mảng
      badges.push("Đệ nhất mẻ tươi");
    }

    // 4. Huy hiệu "Đại sứ biển khơi": Khi người dùng đăng ít nhất 3 bài viết chia sẻ trên diễn đàn
    const postCount = await postRepository.countDocuments({
      userId: userIdStr,
    });
    // Nếu tổng số bài đăng diễn đàn lớn hơn hoặc bằng 3
    if (postCount >= 3) {
      // Đẩy tên huy hiệu tương ứng vào mảng
      badges.push("Đại sứ biển khơi");
    }

    // 5. Huy hiệu "Khách quen nhà tàu": Khi người dùng đi mua hàng và gửi đi ít nhất 3 bài đánh giá sản phẩm/người bán khác
    const writtenReviewsCount = await reviewRepository.countDocuments({
      reviewerId: userIdStr,
    });
    // Nếu tổng số đánh giá đã gửi lớn hơn hoặc bằng 3
    if (writtenReviewsCount >= 3) {
      // Đẩy tên huy hiệu tương ứng vào mảng
      badges.push("Khách quen nhà tàu");
    }

    // Thực hiện gọi hàm cập nhật mảng danh sách huy hiệu này vào hồ sơ của người dùng trong DB
    await userRepository.updateBadges(userIdStr, badges);
    // Trả về danh sách huy hiệu đạt được
    return badges;
  } catch (err: any) {
    // Ghi log lỗi nếu quá trình tính toán hoặc lưu trữ huy hiệu bị trục trặc
    logger.error(`Error updating user badges for ${userId}: ${err.message}`);
    // Trả về mảng trống
    return [];
  }
}
