// Import lớp MongooseUserRepository ở tầng hạ tầng của module iam để thực hiện các thao tác DDD
import { MongooseUserRepository } from "../modules/iam/infrastructure/persistence/mongoose/MongooseUserRepository";
// Import thực thể miền User (Domain Entity) của module iam để quản lý logic nghiệp vụ
import { User as DomainUser } from "../modules/iam/domain/entities/User";
// Import mô hình User của Mongoose để thực hiện các câu lệnh truy vấn thô tối ưu hóa
import { User as MongooseUser } from "../models/User";
// Import thư viện mongoose để kiểm định tính hợp lệ của ObjectId
import mongoose from "mongoose";

// Khởi tạo đối tượng Repository DDD quản lý thực thể miền Người dùng
const dddUserRepository = new MongooseUserRepository();

// Xuất ra đối tượng userRepository đóng vai trò lớp Chống Tham Nhũng (Anti-Corruption Layer)
export const userRepository = {
  // Tìm kiếm người dùng bằng email
  async findByEmail(email: string) {
    // Gọi phương thức findByEmail của DDD repository
    const user = await dddUserRepository.findByEmail(email);
    // Nếu không tìm thấy người dùng, trả về null
    if (!user) return null;
    // Chuyển đổi thực thể miền sang đối tượng thuộc tính thô để trả về cho hệ thống cũ
    const props = user.toProps();
    return {
      userId: props.id,
      name: props.name,
      email: props.email,
      passwordHash: props.passwordHash,
      role: props.role,
      isActive: props.isActive,
      isVerified: props.isVerified,
      avatar: props.avatar,
      isPremium: props.isPremium,
      badges: props.badges || [],
    };
  },

  // Tìm kiếm tài liệu Mongoose thô theo ID người dùng
  async findRawById(userId: string) {
    // Nếu định dạng ID không hợp lệ thì trả về null tránh lỗi ép kiểu
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    // Truy vấn và trả về tài liệu Mongoose thô của người dùng theo ID
    return MongooseUser.findById(userId);
  },

  // Tìm kiếm người dùng theo ID và trả về đối tượng thuộc tính đã chuẩn hóa
  async findById(userId: string) {
    // Gọi phương thức findById của DDD repository để tìm thực thể miền
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy người dùng, trả về null
    if (!user) return null;
    // Chuyển đổi thực thể miền sang đối tượng thuộc tính thô
    const props = user.toProps();
    return {
      id: props.id,
      name: props.name,
      email: props.email,
      role: props.role,
      isActive: props.isActive,
      isVerified: props.isVerified,
      avatarUrl: props.avatar,
      isPremium: props.isPremium,
      badges: props.badges || [],
    };
  },

  // Tìm kiếm người dùng theo ID và lấy danh sách sản phẩm yêu thích đã được liên kết thông tin
  async findFavoritesPopulated(userId: string) {
    // Nếu định dạng ID không hợp lệ thì trả về null tránh lỗi ép kiểu
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    // Tìm người dùng theo ID và liên kết trường danh sách yêu thích (favorites)
    return MongooseUser.findById(userId).populate({
      path: "favorites",
      // Trong từng sản phẩm yêu thích lại liên kết thông tin của người bán (sellerId) gồm tên và trạng thái xác thực
      populate: { path: "sellerId", select: "name isVerified" },
    });
  },

  // Kiểm tra sự tồn tại của người dùng dựa theo điều kiện lọc
  async exists(query: any): Promise<boolean> {
    // Gọi exists của Mongoose model và chuyển đổi sang kiểu Boolean
    return !!(await MongooseUser.exists(query));
  },

  // Đếm tổng số lượng người dùng khớp với bộ lọc
  async countDocuments(filter: any): Promise<number> {
    // Gọi phương thức countDocuments của Mongoose model
    return MongooseUser.countDocuments(filter);
  },

  // Tìm danh sách người dùng theo bộ lọc, sắp xếp và phân trang
  async find(filter: any, sort: any = {}, skip = 0, limit = 100) {
    // Thực hiện truy vấn danh sách người dùng
    return MongooseUser.find(filter).sort(sort).skip(skip).limit(limit);
  },

  // Kiểm tra xem email có bị trùng lặp với người dùng khác trong hệ thống không
  async emailExistsForOther(email: string, excludeUserId: any): Promise<boolean> {
    // Nếu ID loại trừ không hợp lệ thì trả về false
    if (!mongoose.Types.ObjectId.isValid(excludeUserId)) return false;
    // Tìm kiếm xem có tài liệu nào trùng email nhưng khác ID người dùng này hay không
    const user = await MongooseUser.findOne({ email: email.toLowerCase().trim(), _id: { $ne: excludeUserId } });
    // Trả về kết quả chuyển đổi kiểu Boolean
    return !!user;
  },

  // Tạo mới một người dùng trong hệ thống
  async create(name: string, email: string, passwordHash: string): Promise<string> {
    // Khởi tạo một thực thể miền Domain User mới với các dữ liệu mặc định ban đầu
    const user = new DomainUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "User",
      isActive: true,
      isVerified: false,
      isPremium: false,
      avatar: null,
      badges: [],
      favorites: [],
      following: [],
    });
    // Gọi DDD repository để thực hiện kiểm chứng và lưu thực thể miền này xuống database
    await dddUserRepository.save(user);
    // Trả về ID của thực thể miền vừa tạo
    return user.id;
  },

  // Lấy tên của người dùng từ ID
  async getNameById(userId: any): Promise<string | null> {
    // Tìm kiếm thực thể miền của người dùng bằng ID chuyển sang chuỗi
    const user = await dddUserRepository.findById(userId.toString());
    // Trả về tên người dùng nếu tìm thấy, ngược lại trả về null
    return user ? user.name : null;
  },

  // Cập nhật thông tin hồ sơ của người dùng
  async updateProfile(
    // ID người dùng cần cập nhật
    userId: any,
    // Các trường dữ liệu cho phép cập nhật thông tin hồ sơ
    fields: {
      name?: string;
      email?: string;
      avatar?: string;
      isVerified?: boolean;
    }
  ): Promise<void> {
    // Tìm thực thể miền người dùng thông qua DDD repository
    const user = await dddUserRepository.findById(userId.toString());
    // Nếu không tìm thấy người dùng thì kết thúc sớm
    if (!user) return;
    
    // Gọi hàm nghiệp vụ cập nhật hồ sơ trên thực thể miền
    user.updateProfile(
      fields.name ?? user.name,
      fields.email ?? user.email,
      fields.avatar ?? (user.avatar || undefined)
    );
    // Nếu có giá trị trạng thái xác thực truyền vào thì gọi hàm cập nhật xác thực
    if (fields.isVerified !== undefined) {
      user.updateVerification(fields.isVerified);
    }
    // Lưu lại trạng thái của thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
  },

  // Cập nhật trạng thái hoạt động (khóa/mở khóa tài khoản) của người dùng
  async updateActiveStatus(userId: string, isActive: boolean) {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy, trả về null
    if (!user) return null;
    // Gọi hàm nghiệp vụ cập nhật trạng thái hoạt động trên thực thể miền
    user.updateActiveStatus(isActive);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
    // Trả về tài liệu Mongoose thô sau khi đã lưu thành công
    return MongooseUser.findById(userId);
  },

  // Cập nhật trạng thái xác minh danh tính người dùng
  async updateVerificationStatus(userId: string, isVerified: boolean) {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy, trả về null
    if (!user) return null;
    // Gọi hàm nghiệp vụ cập nhật xác thực trên thực thể miền
    user.updateVerification(isVerified);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
    // Trả về tài liệu Mongoose thô sau khi đã lưu thành công
    return MongooseUser.findById(userId);
  },

  // Cập nhật danh sách huy hiệu của người dùng
  async updateBadges(userId: string, badges: string[]): Promise<void> {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy thì kết thúc
    if (!user) return;
    // Gọi hàm nghiệp vụ cập nhật huy hiệu trên thực thể miền
    user.updateBadges(badges);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
  },

  // Thêm một sản phẩm vào danh sách sản phẩm yêu thích của người dùng
  async addFavorite(userId: string, productId: string) {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy, trả về null
    if (!user) return null;
    // Gọi hàm nghiệp vụ thêm sản phẩm yêu thích trên thực thể miền
    user.addFavorite(productId);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
    // Trả về tài liệu Mongoose thô sau khi cập nhật
    return MongooseUser.findById(userId);
  },

  // Xóa một sản phẩm khỏi danh sách sản phẩm yêu thích của người dùng
  async removeFavorite(userId: string, productId: string) {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy, trả về null
    if (!user) return null;
    // Gọi hàm nghiệp vụ xóa sản phẩm yêu thích trên thực thể miền
    user.removeFavorite(productId);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
    // Trả về tài liệu Mongoose thô sau khi cập nhật
    return MongooseUser.findById(userId);
  },

  // Lấy chuỗi băm mật khẩu của người dùng từ ID
  async getPasswordHash(userId: any): Promise<string | null> {
    // Tìm thực thể miền người dùng bằng ID chuyển sang chuỗi
    const user = await dddUserRepository.findById(userId.toString());
    // Trả về mã băm mật khẩu nếu tìm thấy thực thể miền, ngược lại trả về null
    return user ? user.passwordHash : null;
  },

  // Cập nhật mật khẩu mới cho người dùng
  async updatePassword(userId: any, newHash: string): Promise<void> {
    // Tìm thực thể miền người dùng bằng ID chuyển sang chuỗi
    const user = await dddUserRepository.findById(userId.toString());
    // Nếu không tìm thấy thì kết thúc
    if (!user) return;
    // Gọi hàm nghiệp vụ cập nhật mật khẩu trên thực thể miền
    user.updatePassword(newHash);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
  },

  // Kiểm tra xem người dùng này có đang theo dõi người bán cụ thể không
  async isFollowing(userId: string, sellerId: string): Promise<boolean> {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy, trả về false
    if (!user) return false;
    // Kiểm tra xem sellerId có tồn tại trong danh sách đang theo dõi của thực thể miền hay không
    return user.following.includes(sellerId);
  },

  // Theo dõi một người bán hàng
  async followSeller(userId: string, sellerId: string): Promise<void> {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy thì kết thúc
    if (!user) return;
    // Gọi hàm nghiệp vụ theo dõi trên thực thể miền
    user.follow(sellerId);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
  },

  // Hủy theo dõi một người bán hàng
  async unfollowSeller(userId: string, sellerId: string): Promise<void> {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy thì kết thúc
    if (!user) return;
    // Gọi hàm nghiệp vụ hủy theo dõi trên thực thể miền
    user.unfollow(sellerId);
    // Lưu trạng thái thực thể miền xuống database thông qua DDD repository
    await dddUserRepository.save(user);
  },

  // Xóa tài khoản người dùng theo ID
  async deleteById(userId: string): Promise<any> {
    // Tìm thực thể miền người dùng bằng ID
    const user = await dddUserRepository.findById(userId);
    // Nếu không tìm thấy, trả về null
    if (!user) return null;
    // Gọi hàm nghiệp vụ xóa thực thể miền thông qua DDD repository
    await dddUserRepository.delete(user);
    // Trả về true báo hiệu xóa thành công
    return true;
  },

  // Cập nhật đồng loạt thông tin của nhiều người dùng khớp với bộ lọc
  async updateMany(filter: any, update: any): Promise<any> {
    // Thực hiện cập nhật hàng loạt bằng phương thức của Mongoose Model
    return MongooseUser.updateMany(filter, update);
  },

  // Thực hiện truy vấn tổng hợp phức tạp (Aggregation) trên tập hợp người dùng
  async aggregate(pipeline: any[]): Promise<any[]> {
    // Gọi aggregate với pipeline được truyền vào
    return MongooseUser.aggregate(pipeline);
  },
};
