// Import thư viện mongoose để thực hiện kiểm chứng kiểu dữ liệu ObjectId
import mongoose from "mongoose";
// Import đối tượng userRepository để truy vấn thông tin tài khoản và yêu thích của người dùng
import { userRepository } from "../repositories/user.repository";
// Import đối tượng productRepository để xác minh xem sản phẩm muốn thêm yêu thích có tồn tại hay không
import { productRepository } from "../repositories/product.repository";
// Import lớp lỗi HttpError phục vụ ném lỗi HTTP kèm mã trạng thái
import { HttpError } from "../errors/HttpError";

// Xuất đối tượng favoriteService chứa logic nghiệp vụ quản lý danh sách sản phẩm yêu thích
export const favoriteService = {
  // Nghiệp vụ lấy danh sách đầy đủ thông tin các sản phẩm yêu thích của người dùng hiện tại
  async getMyFavorites(userId: string) {
    // Truy vấn thông tin người dùng cùng danh sách sản phẩm yêu thích được populate đầy đủ
    const user = await userRepository.findFavoritesPopulated(userId);
    // Nếu không tìm thấy người dùng, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Chuẩn hóa và làm sạch cấu trúc dữ liệu của các sản phẩm yêu thích trước khi trả về Client
    return (user.favorites as any[])
      .filter((p) => p !== null && p !== undefined)
      .map((p) => ({
        id: p._id, // ID sản phẩm
        name: p.name, // Tên sản phẩm
        price: p.price, // Giá bán sản phẩm
        type: p.type, // Loại sản phẩm (Fresh/Dried)
        status: p.status, // Trạng thái bài đăng sản phẩm
        remainingWeight: p.remainingWeight, // Khối lượng sản phẩm còn lại
        viewCount: p.viewCount, // Số lượt xem
        sellerName: p.sellerId?.name || "Một ngư dân", // Tên của người bán hàng (ngư dân)
        sellerIsVerified: p.sellerId?.isVerified ? 1 : 0, // Trả về 1 nếu người bán đã được xác minh tích xanh, ngược lại 0
        coverImg: p.images?.[0] || null, // Ảnh bìa sản phẩm (ảnh đầu tiên hoặc null nếu không có)
        savedAt: p.createdAt, // Thời gian lưu bài đăng (hoặc tạo sản phẩm)
      }));
  },

  // Nghiệp vụ bật hoặc tắt trạng thái yêu thích một sản phẩm dựa trên productId
  async toggleFavorite(userId: string, productId: string) {
    // Đảm bảo productId được truyền vào đầy đủ và là một ObjectId hợp lệ của MongoDB
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, "ID không hợp lệ");
    }

    // Lấy thông tin tài khoản người dùng thô từ cơ sở dữ liệu
    const user = await userRepository.findRawById(userId);
    // Nếu không tìm thấy người dùng, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Kiểm tra xem ID sản phẩm này đã tồn tại trong mảng yêu thích (favorites) của người dùng chưa
    const isFavorited = user.favorites.some(
      (id) => id.toString() === productId,
    );

    // Nếu người dùng chưa từng yêu thích sản phẩm này
    if (!isFavorited) {
      // Xác minh sản phẩm này có tồn tại thật trong DB và trạng thái của nó không phải là "Deleted"
      const productExists = await productRepository.exists({
        _id: productId,
        status: { $ne: "Deleted" },
      });
      // Nếu sản phẩm không tồn tại hoặc đã bị xóa
      if (!productExists) {
        // Ném lỗi 404
        throw new HttpError(404, "Sản phẩm không tồn tại hoặc đã bị xóa");
      }
      // Gọi repository để thêm ID sản phẩm này vào danh sách yêu thích của người dùng
      await userRepository.addFavorite(userId, productId);
      // Trả về trạng thái là đã yêu thích (favorited: true)
      return { favorited: true };
    }

    // Nếu người dùng đã yêu thích sản phẩm này từ trước, thực hiện hành động hủy yêu thích
    await userRepository.removeFavorite(userId, productId);
    // Trả về trạng thái là đã hủy yêu thích (favorited: false)
    return { favorited: false };
  },
};
