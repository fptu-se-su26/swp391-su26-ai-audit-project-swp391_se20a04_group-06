"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// Import lớp cha AggregateRoot để xây dựng thực thể chính (Aggregate Root) quản lý vòng đời và các sự kiện nghiệp vụ
const AggregateRoot_1 = require("../../../../shared/domain/AggregateRoot");
// Import lỗi nghiệp vụ ValidationError để ném ra khi vi phạm các quy tắc bất biến (invariants)
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Import sự kiện Domain báo hiệu tài khoản người dùng được nâng cấp thành công lên Premium
const UserPremiumUpgradedEvent_1 = require("../events/UserPremiumUpgradedEvent");
/**
 * THỰC THỂ USER - AGGREGATE ROOT QUẢN LÝ TOÀN BỘ NGHIỆP VỤ LIÊN QUAN ĐẾN TÀI KHOẢN NGƯỜI DÙNG
 */
class User extends AggregateRoot_1.AggregateRoot {
    /**
     * KIỂM TRA TÀI KHOẢN CÓ ĐANG HOẠT ĐỘNG HAY KHÔNG
     * Nếu tài khoản đã bị khóa (isActive = false), lập tức chặn và ném ra lỗi nghiệp vụ
     */
    checkActive() {
        if (!this.props.isActive) {
            throw new DomainException_1.ValidationError("Tài khoản đã bị khoá. Vui lòng liên hệ admin.");
        }
    }
    /**
     * NÂNG CẤP TÀI KHOẢN LÊN PREMIUM
     * Thực hiện thay đổi trạng thái và phát đi sự kiện miền (Domain Event) để các phân hệ khác (như xác thực token Redis) lắng nghe và xử lý đồng bộ
     */
    upgradeToPremium() {
        // Nếu đã là thành viên Premium thì không làm gì cả
        if (this.props.isPremium)
            return;
        // Cập nhật trạng thái Premium thành true
        this.props.isPremium = true;
        // Gắn sự kiện miền UserPremiumUpgradedEvent vào danh sách sự kiện chờ phát tán
        this.addDomainEvent(new UserPremiumUpgradedEvent_1.UserPremiumUpgradedEvent(this.id));
    }
    /**
     * CẬP NHẬT THÔNG TIN HỒ SƠ CÁ NHÂN (TÊN, EMAIL, ẢNH ĐẠI DIỆN)
     * Kiểm tra điều kiện bất biến (Invariant): Tên người dùng không được bỏ trống
     */
    updateProfile(name, email, avatar) {
        if (!name || name.trim() === "") {
            throw new DomainException_1.ValidationError("Tên không được bỏ trống.");
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
    updateVerification(isVerified) {
        this.props.isVerified = isVerified;
    }
    /**
     * CẬP NHẬT TRẠNG THÁI HOẠT ĐỘNG (KHOÁ/MỞ KHOÁ TÀI KHOẢN)
     */
    updateActiveStatus(isActive) {
        this.props.isActive = isActive;
    }
    /**
     * CẬP NHẬT MẬT KHẨU MỚI (HASH)
     */
    updatePassword(newHash) {
        this.props.passwordHash = newHash;
    }
    /**
     * CẬP NHẬT DANH SÁCH HUY HIỆU
     */
    updateBadges(badges) {
        this.props.badges = badges;
    }
    /**
     * THÊM SẢN PHẨM VÀO DANH SÁCH YÊU THÍCH (YÊU THÍCH SẢN PHẨM)
     * Đảm bảo không trùng lặp ID sản phẩm trong danh sách
     */
    addFavorite(productId) {
        if (!this.props.favorites.includes(productId)) {
            this.props.favorites.push(productId);
        }
    }
    /**
     * XÓA SẢN PHẨM KHỎI DANH SÁCH YÊU THÍCH (BỎ YÊU THÍCH)
     */
    removeFavorite(productId) {
        this.props.favorites = this.props.favorites.filter((id) => id !== productId);
    }
    /**
     * THEO DÕI MỘT NGƯỜI BÁN KHÁC (FOLLOW)
     * Đảm bảo không trùng lặp người bán trong danh sách theo dõi
     */
    follow(sellerId) {
        if (!this.props.following.includes(sellerId)) {
            this.props.following.push(sellerId);
        }
    }
    /**
     * HỦY THEO DÕI MỘT NGƯỜI BÁN KHÁC (UNFOLLOW)
     */
    unfollow(sellerId) {
        this.props.following = this.props.following.filter((id) => id !== sellerId);
    }
    /**
     * CHUYỂN ĐỔI THÀNH ĐỐI TƯỢNG DATA PROPERTIES TRƠN (DTO/Props)
     * Phục vụ cho việc mapping lưu trữ xuống database hoặc chuyển đổi giữa các tầng kiến trúc
     */
    toProps() {
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
exports.User = User;
