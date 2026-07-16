// Import thực thể Domain User cần thực hiện kiểm thử đơn vị
import { User } from "../../../../../../../backend/src/modules/iam/domain/entities/User";
// Import lớp sự kiện miền UserPremiumUpgradedEvent để kiểm tra tính đúng đắn khi phát sự kiện
import { UserPremiumUpgradedEvent } from "../../../../../../../backend/src/modules/iam/domain/events/UserPremiumUpgradedEvent";

// Định nghĩa nhóm các ca kiểm thử cho thực thể Aggregate Root User của phân hệ IAM
describe("IAM Module - User Aggregate Root", () => {
  // Ca kiểm thử số 1: Đảm bảo việc kiểm tra trạng thái hoạt động của tài khoản hoạt động đúng đắn
  it("nên kiểm tra trạng thái hoạt động chính xác", () => {
    // Khởi tạo một đối tượng User đang hoạt động (isActive: true)
    const userActive = new User({
      // Gán tên người dùng
      name: "Ngư dân A",
      // Gán email người dùng
      email: "fishermanA@gmail.com",
      // Gán mật khẩu đã hash
      passwordHash: "hash123",
      // Thiết lập vai trò là User bình thường
      role: "User",
      // Thiết lập tài khoản đang hoạt động
      isActive: true,
      // Thiết lập chưa xác minh ngư dân
      isVerified: false,
      // Thiết lập chưa nâng cấp Premium
      isPremium: false,
      // Thiết lập ảnh đại diện bằng null
      avatar: null,
      // Khởi tạo mảng danh hiệu trống
      badges: [],
      // Khởi tạo mảng sản phẩm yêu thích trống
      favorites: [],
      // Khởi tạo mảng người theo dõi trống
      following: [],
    });

    // Khởi tạo một đối tượng User đã bị khóa (isActive: false)
    const userInactive = new User({
      // Gán tên người dùng
      name: "Ngư dân B",
      // Gán email người dùng
      email: "fishermanB@gmail.com",
      // Gán mật khẩu đã hash
      passwordHash: "hash123",
      // Thiết lập vai trò là User bình thường
      role: "User",
      // Thiết lập tài khoản bị khóa
      isActive: false,
      // Thiết lập chưa xác minh ngư dân
      isVerified: false,
      // Thiết lập chưa nâng cấp Premium
      isPremium: false,
      // Thiết lập ảnh đại diện bằng null
      avatar: null,
      // Khởi tạo mảng danh hiệu trống
      badges: [],
      // Khởi tạo mảng sản phẩm yêu thích trống
      favorites: [],
      // Khởi tạo mảng người theo dõi trống
      following: [],
    });

    // Kỳ vọng khi gọi hàm checkActive trên tài khoản active sẽ không ném lỗi nào
    expect(() => userActive.checkActive()).not.toThrow();
    // Kỳ vọng khi gọi hàm checkActive trên tài khoản inactive sẽ ném ra lỗi có chứa thông điệp khóa tài khoản
    expect(() => userInactive.checkActive()).toThrow("Tài khoản đã bị khoá");
  });

  // Ca kiểm thử số 2: Đảm bảo khi nâng cấp Premium thì cờ trạng thái bật lên và phát sự kiện tương ứng
  it("nên nâng cấp Premium và kích hoạt sự kiện UserPremiumUpgradedEvent", () => {
    // Khởi tạo một thực thể User chưa nâng cấp Premium
    const user = new User({
      // Gán tên người dùng
      name: "Ngư dân A",
      // Gán email
      email: "fishermanA@gmail.com",
      // Gán mật khẩu hash
      passwordHash: "hash123",
      // Vai trò User
      role: "User",
      // Đang hoạt động
      isActive: true,
      // Chưa xác minh
      isVerified: false,
      // Chưa Premium
      isPremium: false,
      // Không có avatar
      avatar: null,
      // Danh sách huy hiệu trống
      badges: [],
      // Danh sách yêu thích trống
      favorites: [],
      // Danh sách đang theo dõi trống
      following: [],
    });

    // Kiểm tra cờ Premium lúc đầu phải là false
    expect(user.isPremium).toBe(false);
    // Kiểm tra mảng lưu trữ sự kiện miền lúc đầu phải rỗng (0 phần tử)
    expect(user.domainEvents.length).toBe(0);

    // Thực thi phương thức nâng cấp tài khoản lên Premium
    user.upgradeToPremium();

    // Kỳ vọng cờ Premium lúc này phải được cập nhật thành true
    expect(user.isPremium).toBe(true);
    // Kỳ vọng mảng sự kiện miền lúc này phải chứa đúng 1 sự kiện chờ phát
    expect(user.domainEvents.length).toBe(1);
    // Kỳ vọng sự kiện đầu tiên được phát đi là thực thể của lớp UserPremiumUpgradedEvent
    expect(user.domainEvents[0]).toBeInstanceOf(UserPremiumUpgradedEvent);
    // Kỳ vọng ID liên kết trong sự kiện phải trùng khớp với mã ID của thực thể User
    expect(user.domainEvents[0].getAggregateId()).toBe(user.id);
  });

  // Ca kiểm thử số 3: Đảm bảo phương thức cập nhật hồ sơ hoạt động đúng và tự chặn tên trống
  it("nên cập nhật hồ sơ cá nhân và kiểm tra ràng buộc trống", () => {
    // Khởi tạo thực thể User để chuẩn bị test cập nhật hồ sơ
    const user = new User({
      // Gán tên
      name: "Ngư dân A",
      // Gán email
      email: "fishermanA@gmail.com",
      // Gán mật khẩu hash
      passwordHash: "hash123",
      // Vai trò User
      role: "User",
      // Trạng thái hoạt động
      isActive: true,
      // Chưa xác minh
      isVerified: false,
      // Chưa Premium
      isPremium: false,
      // Không có avatar
      avatar: null,
      // Mảng danh hiệu trống
      badges: [],
      // Mảng sản phẩm yêu thích trống
      favorites: [],
      // Mảng người đang theo dõi trống
      following: [],
    });

    // Kỳ vọng khi truyền tên chứa toàn khoảng trắng "   " sẽ ném lỗi thông báo tên không được bỏ trống
    expect(() => user.updateProfile("   ")).toThrow("Tên không được bỏ trống");

    // Thực thi phương thức cập nhật thông tin hồ sơ hợp lệ mới
    user.updateProfile("Tên Mới", "newemail@gmail.com", "http://avatar.url");
    // Kiểm tra tên hiển thị mới cập nhật của người dùng
    expect(user.name).toBe("Tên Mới");
    // Kiểm tra email mới cập nhật của người dùng
    expect(user.email).toBe("newemail@gmail.com");
    // Kiểm tra ảnh đại diện mới cập nhật của người dùng
    expect(user.avatar).toBe("http://avatar.url");
  });
});
