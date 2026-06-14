// Import lớp cha AggregateRoot để xây dựng thực thể chính (Aggregate Root) quản lý vòng đời và các sự kiện nghiệp vụ
import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
// Import lỗi nghiệp vụ ValidationError để ném ra khi vi phạm các quy tắc bất biến (invariants)
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";
// Import sự kiện Domain báo hiệu tài khoản người dùng được nâng cấp thành công lên Premium
import { UserPremiumUpgradedEvent } from "../events/UserPremiumUpgradedEvent";

// Định nghĩa giao diện chứa các thuộc tính cốt lõi của thực thể User (Domain Properties)
export interface UserProps {
  name: string;               // Tên hiển thị của người dùng
  email: string;              // Địa chỉ email (được chuẩn hóa chữ thường)
  passwordHash: string;       // Mật khẩu đã mã hóa hash (hoặc chuỗi trống đối với Google OAuth)
  role: "User" | "Admin";     // Vai trò phân quyền trong hệ thống
  isActive: boolean;          // Trạng thái hoạt động (khóa hay mở khóa)
  isVerified: boolean;        // Trạng thái đã được xác minh/chứng thực uy tín (đặc biệt là ngư dân)
  isPremium: boolean;         // Trạng thái tài khoản nâng cấp Premium (được đăng tin không giới hạn, không quảng cáo)
  avatar: string | null;      // Đường dẫn URL ảnh đại diện
  badges: string[];           // Danh sách danh hiệu/huy hiệu đạt được
  favorites: string[];        // Danh sách ID sản phẩm hải sản yêu thích (thả tim)
  following: string[];        // Danh sách ID những người bán/ngư dân mà người dùng này theo dõi
}

/**
 * THỰC THỂ USER - AGGREGATE ROOT QUẢN LÝ TOÀN BỘ NGHIỆP VỤ LIÊN QUAN ĐẾN TÀI KHOẢN NGƯỜI DÙNG
 */
export class User extends AggregateRoot<UserProps> {
  
  /**
   * KIỂM TRA TÀI KHOẢN CÓ ĐANG HOẠT ĐỘNG HAY KHÔNG
   * Nếu tài khoản đã bị khóa (isActive = false), lập tức chặn và ném ra lỗi nghiệp vụ
   */
  public checkActive(): void {
    if (!this.props.isActive) {
      throw new ValidationError("Tài khoản đã bị khoá. Vui lòng liên hệ admin.");
    }
  }

  /**
   * NÂNG CẤP TÀI KHOẢN LÊN PREMIUM
   * Thực hiện thay đổi trạng thái và phát đi sự kiện miền (Domain Event) để các phân hệ khác (như xác thực token Redis) lắng nghe và xử lý đồng bộ
   */
  public upgradeToPremium(): void {
    // Nếu đã là thành viên Premium thì không làm gì cả
    if (this.props.isPremium) return;
    // Cập nhật trạng thái Premium thành true
    this.props.isPremium = true;
    // Gắn sự kiện miền UserPremiumUpgradedEvent vào danh sách sự kiện chờ phát tán
    this.addDomainEvent(new UserPremiumUpgradedEvent(this.id));
  }

  /**
   * CẬP NHẬT THÔNG TIN HỒ SƠ CÁ NHÂN (TÊN, EMAIL, ẢNH ĐẠI DIỆN)
   * Kiểm tra điều kiện bất biến (Invariant): Tên người dùng không được bỏ trống
   */
  public updateProfile(name: string, email?: string, avatar?: string): void {
    if (!name || name.trim() === "") {
      throw new ValidationError("Tên không được bỏ trống.");
    }
    // Cập nhật tên sau khi đã loại bỏ khoảng trắng thừa
    this.props.name = name.trim();
    // Cập nhật email nếu có truyền vào (chuyển chữ thường và xóa khoảng trắng)
    if (email !== undefined) {
      this.props.email = email.toLowerCase().trim();
    }
    // Cập nhật avatar nếu có truyền vào
    if (avatar !== undefined) {
      this.props.avatar = avatar;
    }
  }

  /**
   * CẬP NHẬT TRẠNG THÁI XÁC MINH UY TÍN (VERIFIED BADGE)
   */
  public updateVerification(isVerified: boolean): void {
    this.props.isVerified = isVerified;
  }

  /**
   * CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG (KHOÁ/MỞ KHOÁ TÀI KHOẢN)
   */
  public updateActiveStatus(isActive: boolean): void {
    this.props.isActive = isActive;
  }

  /**
   * CẬP NHẬT MẬT KHẨU MỚI (HASH)
   */
  public updatePassword(newHash: string): void {
    this.props.passwordHash = newHash;
  }

  /**
   * CẬP NHẬT DANH SÁCH HUY HIỆU
   */
  public updateBadges(badges: string[]): void {
    this.props.badges = badges;
  }

  /**
   * THÊM SẢN PHẨM VÀO DANH SÁCH YÊU THÍCH (YÊU THÍCH SẢN PHẨM)
   * Đảm bảo không trùng lặp ID sản phẩm trong danh sách
   */
  public addFavorite(productId: string): void {
    if (!this.props.favorites.includes(productId)) {
      this.props.favorites.push(productId);
    }
  }

  /**
   * XÓA SẢN PHẨM KHỎI DANH SÁCH YÊU THÍCH (BỎ YÊU THÍCH)
   */
  public removeFavorite(productId: string): void {
    this.props.favorites = this.props.favorites.filter((id) => id !== productId);
  }

  /**
   * THEO DÕI MỘT NGƯỜI BÁN KHÁC (FOLLOW)
   * Đảm bảo không trùng lặp người bán trong danh sách theo dõi
   */
  public follow(sellerId: string): void {
    if (!this.props.following.includes(sellerId)) {
      this.props.following.push(sellerId);
    }
  }

  /**
   * HỦY THEO DÕI MỘT NGƯỜI BÁN KHÁC (UNFOLLOW)
   */
  public unfollow(sellerId: string): void {
    this.props.following = this.props.following.filter((id) => id !== sellerId);
  }

  /**
   * CHUYỂN ĐỔI THÀNH ĐỐI TƯỢNG DATA PROPERTIES TRƠN (DTO/Props)
   * Phục vụ cho việc mapping lưu trữ xuống database hoặc chuyển đổi giữa các tầng kiến trúc
   */
  public toProps(): Required<UserProps> & { id: string } {
    return {
      id: this.id,
      name: this.props.name,
      email: this.props.email,
      passwordHash: this.props.passwordHash,
      role: this.props.role,
      isActive: this.props.isActive,
      isVerified: this.props.isVerified,
      isPremium: this.props.isPremium,
      avatar: this.props.avatar,
      badges: this.props.badges,
      favorites: this.props.favorites,
      following: this.props.following,
    };
  }

  // CÁC HÀM GETTER ĐỂ TRUY XUẤT CÁC THUỘC TÍNH KHÔNG CHO PHÉP SỬA TRỰC TIẾP TỪ BÊN NGOÀI
  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get passwordHash() { return this.props.passwordHash; }
  get role() { return this.props.role; }
  get isActive() { return this.props.isActive; }
  get isVerified() { return this.props.isVerified; }
  get isPremium() { return this.props.isPremium; }
  get avatar() { return this.props.avatar; }
  get badges() { return this.props.badges; }
  get favorites() { return this.props.favorites; }
  get following() { return this.props.following; }
}

