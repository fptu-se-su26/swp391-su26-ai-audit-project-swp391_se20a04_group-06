// Nhập các React Hooks cần thiết để quản lý state, vòng đời component và tham chiếu phần tử DOM
import { useState, useEffect, useRef } from "react";
// Nhập hook chuyển hướng trang (routing) từ thư viện react-router-dom
import { useNavigate } from "react-router-dom";
// Nhập mã màu sắc và hằng số giao diện chung từ file theme.js
import { C } from "../utils/theme";
// Nhập đối tượng gọi API (axios wrapper hoặc fetch wrapper) đã cấu hình sẵn của hệ thống
import { api } from "../services/api";
// Nhập hook lấy thông tin người dùng và phương thức quản lý phiên đăng nhập từ AuthContext
import { useAuth } from "../context/AuthContext";
// Nhập hook hiển thị thông báo nhanh (toast notification) cho người dùng
import { useToast } from "../context/ToastContext";
// Nhập component con hiển thị danh sách người theo dõi và đang theo dõi
import { FollowManagement } from "../components/FollowManagement";

// ── DeleteAccountModal ────────────────────────────────────────────────────────
// Component con hiển thị hộp thoại xác nhận khi người dùng yêu cầu xóa tài khoản vĩnh viễn (GDPR)
function DeleteAccountModal({ onConfirm, onCancel }) {
  // State lưu trữ chuỗi văn bản người dùng nhập vào để kiểm tra tính xác nhận
  const [confirmText, setConfirmText] = useState("");
  // Tham chiếu (Ref) đến thẻ input nhập chuỗi xác nhận để tự động lấy tiêu điểm (focus)
  const inputRef = useRef(null);
  // Hằng số yêu cầu người dùng phải gõ chính xác để kích hoạt nút xóa tài khoản
  const REQUIRED = "XOA TAI KHOAN";

  // Hiệu ứng useEffect tự động chạy một lần duy nhất sau khi modal được gắn vào DOM (mounted)
  useEffect(() => {
    // Chờ 50 mili giây để đảm bảo modal đã dựng xong rồi tự động focus con trỏ vào ô nhập liệu
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    // Lớp phủ tối mờ bao quanh toàn màn hình
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)", // Nền đen mờ 50%
        zIndex: 99999, // Đặt chỉ số lớp rất cao để đè lên mọi thành phần giao diện khác
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "fadeIn 0.15s ease", // Hiệu ứng mờ dần xuất hiện
      }}
      onClick={onCancel} // Click ra ngoài modal sẽ kích hoạt đóng modal (hủy bỏ)
    >
      {/* Khung chứa nội dung chính của Modal */}
      <div
        onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra ngoài làm đóng modal ngoài ý muốn
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          border: "1.5px solid #FEB2B2", // Viền màu đỏ nhạt cảnh báo nguy hiểm
        }}
      >
        {/* Phần đầu Modal chứa tiêu đề cảnh báo */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛑</div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#C53030", // Màu đỏ đậm
              margin: 0,
            }}
          >
            Xóa tài khoản vĩnh viễn
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "#9B2C2C",
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong>. Toàn bộ dữ liệu
            của bạn sẽ bị xóa sạch vĩnh viễn khỏi hệ thống.
          </p>
        </div>

        {/* Phần nhập liệu yêu cầu người dùng xác nhận */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: "#9B2C2C",
              marginBottom: 8,
            }}
          >
            Để xác nhận, hãy gõ:{" "}
            <code
              style={{
                background: "#FEE2E2",
                padding: "2px 6px",
                borderRadius: 4,
                letterSpacing: "0.05em",
              }}
            >
              {REQUIRED}
            </code>
          </label>
          <input
            ref={inputRef} // Gắn ref để lấy tiêu điểm
            type="text"
            value={confirmText}
            // Cập nhật giá trị nhập vào state
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={REQUIRED}
            style={{
              width: "100%",
              padding: "12px 14px",
              // Nếu gõ đúng cụm từ yêu cầu, viền sẽ chuyển sang màu đỏ cảnh báo, ngược lại viền xám nhạt
              border: `2px solid ${confirmText === REQUIRED ? "#C53030" : "#E2E8F0"}`,
              borderRadius: 10,
              fontSize: 14,
              outline: "none",
              fontFamily: "monospace",
              boxSizing: "border-box",
              letterSpacing: "0.05em",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        {/* Cặp nút hành động: Hủy hoặc Xóa vĩnh viễn */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel} // Nút đóng Modal
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "#fff",
              color: "#718096",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Hủy
          </button>
          <button
            // Chỉ thực hiện xóa khi người dùng nhập đúng cụm từ xác nhận
            onClick={() => confirmText === REQUIRED && onConfirm()}
            // Khóa nút xóa nếu cụm từ nhập chưa chính xác
            disabled={confirmText !== REQUIRED}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              // Đổi màu nền nút tương ứng theo trạng thái hợp lệ
              background: confirmText === REQUIRED ? "#E53E3E" : "#E2E8F0",
              color: confirmText === REQUIRED ? "#fff" : "#A0AEC0",
              fontWeight: 700,
              cursor: confirmText === REQUIRED ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProfilePage ──────────────────────────────────────────────────────────────
// Component chính hiển thị trang chỉnh sửa thông tin cá nhân và thiết lập của người dùng
export function ProfilePage() {
  // Lấy hàm thông báo toast từ Toast Context
  const toast = useToast();
  // Lấy thông tin user hiện tại và các phương thức cập nhật/đăng xuất từ Auth Context
  const { user: initialUser, setUser, logout } = useAuth();
  // Khởi tạo điều hướng trang của react-router-dom
  const navigate = useNavigate();

  // State lưu tên trường nhập liệu đang được trỏ chuột vào (dùng để tô sáng viền input)
  const [focusedField, setFocusedField] = useState(null);
  // State đóng mở Modal xác nhận xóa tài khoản vĩnh viễn
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // State quản lý họ tên người dùng, mặc định lấy từ Auth Context nếu có
  const [name, setName] = useState(initialUser?.name || "");
  // State quản lý email liên hệ, mặc định lấy từ Auth Context nếu có
  const [email, setEmail] = useState(initialUser?.email || "");
  // State lưu trữ tệp tin ảnh đại diện được chọn từ máy tính để tải lên backend
  const [avatarFile, setAvatarFile] = useState(null);
  // State lưu trữ đường dẫn xem trước ảnh đại diện (ảnh hiện tại hoặc ảnh tạm dạng blob)
  const [avatarPreview, setAvatarPreview] = useState(
    initialUser?.avatarUrl || "",
  );
  // Trạng thái đang tải trong lúc gửi yêu cầu cập nhật hồ sơ cá nhân
  const [profileLoading, setProfileLoading] = useState(false);
  // Lưu lỗi xảy ra (nếu có) khi cập nhật thông tin hồ sơ
  const [profileErr, setProfileErr] = useState("");

  // State quản lý ô nhập mật khẩu hiện tại khi thực hiện đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  // State quản lý ô nhập mật khẩu mới khi thực hiện đổi mật khẩu
  const [newPassword, setNewPassword] = useState("");
  // Trạng thái đang tải khi gửi yêu cầu đổi mật khẩu lên backend
  const [pwLoading, setPwLoading] = useState(false);
  // Lưu lỗi xảy ra (nếu có) khi tiến hành đổi mật khẩu
  const [pwErr, setPwErr] = useState("");

  // Trạng thái chờ xóa tài khoản khi đang gửi request DELETE
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tham chiếu (Ref) lưu URL ảnh xem trước tạm thời ở lượt render trước
  const prevPreviewUrl = useRef(null);

  // Hiệu ứng giải phóng bộ nhớ (Revoke URL Object) để ngăn ngừa rò rỉ bộ nhớ (memory leak) khi đổi ảnh xem trước
  useEffect(() => {
    // Nếu URL cũ tồn tại và là một chuỗi URL blob tạm thời
    if (prevPreviewUrl.current && prevPreviewUrl.current.startsWith("blob:")) {
      // Hủy bỏ URL blob để giải phóng tài nguyên trình duyệt đang giữ cho ảnh cũ
      URL.revokeObjectURL(prevPreviewUrl.current);
    }
    // Cập nhật tham chiếu sang URL xem trước mới nhất
    prevPreviewUrl.current = avatarPreview;
  }, [avatarPreview]);

  // Hiệu ứng định kỳ (Polling): kiểm tra xem tài khoản đã được nâng cấp Premium chưa
  useEffect(() => {
    // Lấy ID người dùng từ Auth Context
    const finalUserId = initialUser?.id || initialUser?.userId;
    // Chỉ chạy polling khi tài khoản đã đăng nhập và chưa phải là tài khoản Premium
    if (initialUser && !initialUser.isPremium && finalUserId) {
      // Thiết lập vòng lặp chạy định kỳ sau mỗi 3 giây (3000ms)
      const interval = setInterval(async () => {
        try {
          // Gọi API kiểm tra thông tin cá nhân hiện tại trên máy chủ backend
          const res = await api("/auth/me");
          // Nếu backend phản hồi là tài khoản đã chuyển sang Premium (thanh toán webhook Sepay thành công)
          if (res && res.isPremium) {
            // Cập nhật thông tin người dùng toàn cục trong Context
            setUser(res);
            // Hiển thị thông báo chúc mừng
            toast.success(
              "🎉 NÂNG CẤP THÀNH CÔNG! Tài khoản của bạn đã được kích hoạt PREMIUM!",
            );
          }
        } catch {
          /* Lỗi gọi API trong khi polling được bỏ qua âm thầm */
        }
      }, 3000);
      // Trả về hàm dọn dẹp (cleanup) để hủy bỏ vòng lặp khi component bị hủy (unmounted)
      return () => clearInterval(interval);
    }
  }, [initialUser, setUser, toast]);

  // Hàm tiện ích sao chép văn bản vào khay nhớ tạm (Clipboard) của hệ thống
  const handleCopy = (text, msg) => {
    // Sử dụng API Clipboard của trình duyệt để sao chép
    navigator.clipboard.writeText(text);
    // Hiển thị thông báo thành công cho người dùng
    toast.success(msg || "Đã sao chép vào bộ nhớ tạm!");
  };

  // Xử lý sự kiện khi người dùng chọn một tệp tin ảnh mới từ máy tính làm ảnh đại diện
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Lưu trữ đối tượng File ảnh vào state để gửi đi sau này
      setAvatarFile(file);
      // Tạo một URL tạm dạng blob cục bộ để hiển thị ảnh xem trước ngay lập tức trên UI
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Hàm xử lý khi người dùng gửi biểu mẫu cập nhật thông tin cá nhân (Form Submit)
  const handleUpdateProfile = async (e) => {
    e.preventDefault(); // Ngăn chặn hành vi tải lại trang mặc định của trình duyệt
    setProfileErr(""); // Đặt lại thông báo lỗi ban đầu thành rỗng

    // Định nghĩa định dạng kiểm tra Email hợp lệ bằng biểu thức chính quy (Regex)
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !EMAIL_REGEX.test(email)) {
      setProfileErr("Email không hợp lệ");
      return;
    }

    setProfileLoading(true); // Bật trạng thái đang xử lý cập nhật
    const fd = new FormData(); // Khởi tạo FormData để gửi dữ liệu dạng multipart bao gồm cả tệp tin
    fd.append("name", name); // Thêm tên mới vào FormData
    fd.append("email", email); // Thêm email mới vào FormData
    if (avatarFile) fd.append("avatar", avatarFile); // Nếu có chọn ảnh mới thì đính kèm tệp tin ảnh đại diện

    try {
      // Gọi API PUT cập nhật thông tin cá nhân lên Backend kèm theo body là FormData
      const res = await api("/auth/profile", { method: "PUT", body: fd });
      // Cập nhật dữ liệu người dùng mới vào Auth Context
      setUser({
        ...initialUser,
        name: res.name,
        email: res.email,
        avatarUrl: res.avatarUrl,
      });
      // Cập nhật lại các trường nhập liệu trên giao diện bằng dữ liệu thực tế do backend trả về
      setName(res.name || "");
      setEmail(res.email || "");
      if (res.avatarUrl) setAvatarPreview(res.avatarUrl);

      // Hiển thị thông báo thành công
      toast.success("Cập nhật thông tin tài khoản thành công!");
      setAvatarFile(null); // Đặt lại file ảnh được chọn về null sau khi lưu thành công
    } catch (err) {
      // Hiển thị lỗi nếu có lỗi trả về từ API cập nhật
      setProfileErr(err.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setProfileLoading(false); // Tắt trạng thái đang xử lý cập nhật
    }
  };

  // Hàm xử lý khi người dùng gửi biểu mẫu thay đổi mật khẩu tài khoản
  const handleChangePassword = async (e) => {
    e.preventDefault(); // Ngăn chặn trình duyệt tải lại trang
    setPwErr(""); // Xóa thông báo lỗi cũ

    // Ràng buộc bảo mật mật khẩu mới có độ dài tối thiểu là 6 ký tự
    if (newPassword.length < 6) {
      setPwErr("Mật khẩu mới tối thiểu phải có 6 ký tự");
      return;
    }

    setPwLoading(true); // Bật trạng thái đang tải đổi mật khẩu
    try {
      // Gửi yêu cầu POST chứa mật khẩu hiện tại và mật khẩu mới lên backend
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      // Hiển thị thông báo thành công
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword(""); // Đặt lại trống ô nhập mật khẩu hiện tại
      setNewPassword(""); // Đặt lại trống ô nhập mật khẩu mới
    } catch (err) {
      // Hiển thị lỗi nếu mật khẩu cũ không đúng hoặc có lỗi kết nối
      setPwErr(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwLoading(false); // Tắt trạng thái đang tải đổi mật khẩu
    }
  };

  // Hàm xử lý gọi API xóa tài khoản vĩnh viễn (GDPR) sau khi người dùng xác nhận ở Modal
  const handleDeleteAccount = async () => {
    setDeleteLoading(true); // Bật trạng thái chờ xóa tài khoản
    setShowDeleteModal(false); // Ẩn Modal xác nhận đi
    try {
      // Gửi yêu cầu DELETE hủy tài khoản lên backend
      const res = await api("/auth/account", { method: "DELETE" });
      // Thông báo tài khoản đã xóa thành công
      toast.success(res.message || "Tài khoản đã được xóa vĩnh viễn.");
      await logout(); // Gọi hàm đăng xuất để xóa cookie/token lưu ở client
      navigate("/"); // Chuyển hướng người dùng về trang chủ của hệ thống
    } catch (err) {
      // Hiển thị thông báo lỗi nếu gặp trục trặc khi gọi API xóa
      toast.error("Lỗi khi xóa tài khoản: " + err.message);
    } finally {
      setDeleteLoading(false); // Tắt trạng thái chờ xóa tài khoản
    }
  };

  // Hàm tiện ích trả về CSS tùy biến cho ô nhập liệu dựa trên việc ô đó có đang được chọn (focus) hay không
  const getInputStyle = (fieldName) => ({
    width: "100%",
    padding: "12px 14px",
    border: `1.5px solid ${focusedField === fieldName ? C.ocean : C.border}`,
    borderRadius: 12,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#fff",
    transition: "all 0.25s ease",
    // Nếu đang focus thì tạo hiệu ứng bóng viền mịn và dịu mắt
    boxShadow:
      focusedField === fieldName
        ? "0 0 0 4px rgba(11, 79, 108, 0.12), 0 2px 8px rgba(0,0,0,0.02)"
        : "0 1px 2px rgba(0,0,0,0.01)",
  });

  // Hằng số chứa style cố định cho các nhãn tiêu đề (label) trong form
  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    color: "#4B5563",
  };

  // Hằng số chứa style cố định cho khung viền của từng phân vùng (card) cài đặt
  const sectionCardStyle = {
    background: C.white,
    borderRadius: 16,
    border: `1.5px solid ${C.border}`,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
  };

  return (
    <div className="container py-5" style={{ maxWidth: 840 }}>
      {/* Hiển thị Modal xác nhận xóa tài khoản bằng kỹ thuật Short-circuit evaluation */}
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Nút quay lại trang trước đó */}
      <button
        onClick={() => navigate(-1)} // Sử dụng navigate(-1) để quay ngược lại lịch sử trình duyệt
        className="btn d-inline-flex align-items-center gap-2 mb-4"
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          padding: "8px 16px",
          borderRadius: 10,
          fontFamily: "inherit",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          transition: "all 0.2s ease",
        }}
        // Hiệu ứng đổi màu nền nhè nhẹ khi di chuột qua nút
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
      >
        ← Quay lại
      </button>

      <h1 className="fw-bold mb-4" style={{ fontSize: 24, color: C.dark }}>
        ⚙️ Thiết Lập Hồ Sơ Cá Nhân
      </h1>

      {/* Grid chia cột giao diện: Sidebar bên trái và các form cấu hình bên phải */}
      <div className="row g-4">
        {/* ── Sidebar hiển thị và thay đổi Avatar ── */}
        <div className="col-12 col-md-4 col-lg-3">
          <div
            className="card border-0 p-4 text-center"
            style={{ ...sectionCardStyle, height: "fit-content" }}
          >
            {/* Khung chứa ảnh đại diện hình tròn */}
            <div
              className="position-relative mx-auto mb-3"
              style={{ width: 110, height: 110 }}
            >
              {avatarPreview ? (
                // Nếu đã có ảnh hoặc ảnh xem trước thì hiển thị thẻ img
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="rounded-circle"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    border: `3px solid ${C.ocean}`,
                  }}
                />
              ) : (
                // Nếu chưa có ảnh thì hiển thị chữ cái đầu tiên của tên người dùng trên nền gradient đẹp mắt
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto"
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                    fontSize: 36,
                    boxShadow: "0 4px 10px rgba(11, 79, 108, 0.15)",
                  }}
                >
                  {initialUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Nút bấm kích hoạt hộp thoại chọn file ảnh ẩn */}
            <label
              className="btn btn-outline-primary fw-bold py-2 px-3 text-nowrap w-100 mb-2"
              style={{
                borderColor: C.ocean,
                color: C.ocean,
                fontSize: 12,
                borderRadius: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = C.oceanP)
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
            >
              Tải ảnh đại diện mới
              {/* Thẻ input chọn file ẩn, kích hoạt gián tiếp qua thẻ label bao quanh */}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </label>
            <div style={{ fontSize: 11, color: C.muted }}>
              Ảnh vuông, JPG, PNG tối đa 5MB
            </div>
          </div>
        </div>

        {/* ── Cột bên phải chứa các cài đặt chi tiết ── */}
        <div className="col-12 col-md-8 col-lg-9 d-flex flex-column gap-4">
          {/* Phân vùng thông tin Premium (Được bo viền vàng nếu là Premium và viền xám nếu là tài khoản thường) */}
          <div
            className="card border-0 p-4 position-relative overflow-hidden"
            style={{
              background: initialUser?.isPremium
                ? "linear-gradient(135deg, #FFFDF5 0%, #FFF9E6 100%)"
                : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
              borderRadius: 20,
              border: initialUser?.isPremium
                ? "2px solid #F59E0B"
                : `1.5px solid ${C.border}`,
              boxShadow: initialUser?.isPremium
                ? "0 10px 25px -5px rgba(245, 158, 11, 0.15)"
                : "0 4px 6px -1px rgba(0,0,0,0.01)",
              transition: "all 0.3s ease",
            }}
          >
            {initialUser?.isPremium ? (
              // ── GIAO DIỆN KHI TÀI KHOẢN ĐÃ LÀ PREMIUM ──
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 24 }}>👑</span>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#92400E",
                      margin: 0,
                    }}
                  >
                    TÀI KHOẢN PREMIUM ĐÃ KÍCH HOẠT
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#B45309",
                    lineHeight: 1.5,
                    margin: "0 0 16px 0",
                    fontWeight: 500,
                  }}
                >
                  Tuyệt vời! Bạn đang sở hữu những đặc quyền cao cấp nhất tại
                  Haisan.vn.
                </p>
                {/* Danh sách các quyền lợi đặc biệt của Premium */}
                <div
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    padding: 16,
                    borderRadius: 12,
                    border: "1px dashed rgba(245,158,11,0.3)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#92400E",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    Đặc quyền Premium của bạn:
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      fontSize: 13,
                      color: "#78350F",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <li>
                      🚀 <strong>Đăng tin không giới hạn</strong> bài viết mỗi
                      ngày.
                    </li>
                    <li>
                      💎 <strong>Huy hiệu Premium</strong> hiển thị bên cạnh
                      tên.
                    </li>
                    <li>
                      📈 <strong>Độ hiển thị ưu tiên</strong> cao hơn tiếp cận
                      khách hàng nhanh hơn.
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              // ── GIAO DIỆN KHI TÀI KHOẢN LÀ TÀI KHOẢN THƯỜNG (Yêu cầu nâng cấp) ──
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 24 }}>🌟</span>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: C.ocean,
                      margin: 0,
                    }}
                  >
                    NÂNG CẤP PREMIUM
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    lineHeight: 1.5,
                    margin: "0 0 16px 0",
                    fontWeight: 500,
                  }}
                >
                  Chỉ với <strong>2.000đ</strong>, nâng cấp lên Premium để đăng
                  không giới hạn bài viết mỗi ngày.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 20,
                    marginTop: 16,
                  }}
                >
                  {/* Cột hiển thị Mã QR VietQR tích hợp API tạo QR tự động để chuyển khoản nhanh */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#F8FAFC",
                      padding: 16,
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: C.muted,
                        marginBottom: 10,
                        textAlign: "center",
                      }}
                    >
                      QUÉT MÃ QR BẰNG APP NGÂN HÀNG
                    </div>
                    {/* Ảnh QR tự động tạo qua cổng VietQR, chứa sẵn tài khoản nhận, số tiền 2000đ và mã Memo định dạng "SF ID_USER" */}
                    <img
                      src={`https://img.vietqr.io/image/MB-0362614906-compact.png?amount=2000&addInfo=SF%20${initialUser?.id || initialUser?.userId}&accountName=HAISAN%20VN`}
                      alt="VietQR code"
                      style={{
                        width: 190,
                        height: 190,
                        borderRadius: 12,
                        border: "3px solid #F59E0B",
                        boxShadow: "0 4px 12px rgba(245,158,11,0.15)",
                        background: "#fff",
                      }}
                    />
                    {/* Biểu tượng trạng thái đang lắng nghe giao dịch trực tiếp từ Webhook Sepay */}
                    <div
                      style={{
                        fontSize: 11,
                        color: "#D97706",
                        fontWeight: 700,
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        className="spinner-border spinner-border-sm"
                        style={{ width: 12, height: 12 }}
                      ></span>
                      Đang đợi thanh toán...
                    </div>
                  </div>

                  {/* Cột hiển thị thông tin chuyển khoản thủ công bằng chữ để copy */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: C.muted,
                        textTransform: "uppercase",
                      }}
                    >
                      Hoặc chuyển khoản thủ công
                    </div>
                    <div
                      style={{
                        background: "#F1F5F9",
                        padding: 12,
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {/* Ngân hàng quân đội */}
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: C.muted,
                            fontWeight: 700,
                          }}
                        >
                          NGÂN HÀNG NHẬN
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: C.dark,
                          }}
                        >
                          MB Bank (Ngân hàng Quân Đội)
                        </div>
                      </div>
                      {/* Số tài khoản nhận kèm nút Copy nhanh */}
                      <div
                        style={{
                          borderTop: "1px solid #E2E8F0",
                          paddingTop: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: C.muted,
                            fontWeight: 700,
                          }}
                        >
                          SỐ TÀI KHOẢN
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: C.dark,
                              fontFamily: "monospace",
                            }}
                          >
                            0362614906
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                "0362614906",
                                "Đã sao chép số tài khoản!",
                              )
                            }
                            style={{
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              color: C.ocean,
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      {/* Số tiền nâng cấp cố định */}
                      <div
                        style={{
                          borderTop: "1px solid #E2E8F0",
                          paddingTop: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: C.muted,
                            fontWeight: 700,
                          }}
                        >
                          SỐ TIỀN CẦN NẠP
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: "#D97706",
                          }}
                        >
                          2.000đ
                        </div>
                      </div>
                      {/* Nội dung bắt buộc chuyển khoản (Memo) kèm nút Copy */}
                      <div
                        style={{
                          borderTop: "1px solid #E2E8F0",
                          paddingTop: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            color: C.muted,
                            fontWeight: 700,
                          }}
                        >
                          NỘI DUNG CHUYỂN KHOẢN (MEMO)
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#FEF3C7",
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid #FDE68A",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              color: "#B45309",
                              fontFamily: "monospace",
                            }}
                          >
                            SF {initialUser?.id || initialUser?.userId}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `SF ${initialUser?.id || initialUser?.userId}`,
                                "Đã sao chép nội dung chuyển khoản!",
                              )
                            }
                            style={{
                              padding: "2px 6px",
                              fontSize: 9,
                              fontWeight: 800,
                              color: "#92400E",
                              border: "1px solid #FDE68A",
                              borderRadius: 4,
                              background: "#FFFBEB",
                              cursor: "pointer",
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Cảnh báo nghiêm ngặt về cú pháp chuyển khoản */}
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "#C53030",
                        fontWeight: 700,
                        lineHeight: 1.4,
                      }}
                    >
                      ⚠️ Nội dung chuyển khoản phải viết đúng chính xác mã trên
                      để hệ thống tự động nhận diện.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Phân vùng cập nhật Thông tin tài khoản ── */}
          <div className="card border-0 p-4" style={sectionCardStyle}>
            <h3 className="fw-bold mb-4 fs-6" style={{ color: C.dark }}>
              👤 Thông tin tài khoản
            </h3>
            {/* Form sửa thông tin cá nhân */}
            <form
              onSubmit={handleUpdateProfile}
              className="d-flex flex-column gap-3"
            >
              {/* Trường nhập Họ tên */}
              <div className="d-flex flex-column gap-1">
                <label style={labelStyle}>Họ và tên hiển thị</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("name")}
                  required
                />
              </div>
              {/* Trường nhập Email */}
              <div className="d-flex flex-column gap-1">
                <label style={labelStyle}>Email liên hệ</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("email")}
                  required
                />
              </div>
              {/* Hiển thị lỗi nếu có trong quá trình gọi API cập nhật thông tin */}
              {profileErr && (
                <div
                  className="alert alert-danger border-danger py-2 px-3 m-0"
                  style={{
                    color: "#991B1B",
                    fontSize: 13,
                    background: "#FEE2E2",
                    borderLeft: "4px solid #EF4444",
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {profileErr}
                </div>
              )}
              {/* Nút submit cập nhật hồ sơ */}
              <button
                type="submit"
                disabled={profileLoading}
                className="btn fw-bold py-2 px-4 text-white"
                style={{
                  background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: profileLoading ? "not-allowed" : "pointer",
                  width: "fit-content",
                  boxShadow: "0 4px 12px rgba(11,79,108,0.2)",
                  opacity: profileLoading ? 0.7 : 1,
                }}
              >
                {profileLoading ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
              </button>
            </form>
          </div>

          {/* ── Phân vùng Quản lý theo dõi người dùng ── */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                padding: "0 2px",
              }}
            >
              <div>
                <h3
                  className="fw-bold m-0 fs-6"
                  style={{
                    color: C.dark,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  👥 Quản lý theo dõi
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "red" }}>
                  Ngư dân bạn đang theo dõi và người đang theo dõi bạn.
                </p>
              </div>
            </div>
            {/* Nhúng component quản lý follow và truyền thông tin user hiện tại làm props */}
            <FollowManagement user={initialUser} />
          </div>

          {/* ── Danger Zone (Khu vực nguy hiểm - Xóa tài khoản vĩnh viễn) ── */}
          <div
            className="alert alert-danger border-danger p-4 m-0"
            style={{
              borderRadius: 16,
              border: "1.5px solid #FEB2B2",
              background: "#FFF5F5",
              boxShadow: "0 4px 6px -1px rgba(220,38,38,0.03)",
            }}
          >
            <h3 className="fw-bold mb-2 fs-6 text-danger">
              🛑 Vùng nguy hiểm (Danger Zone)
            </h3>
            <p
              className="mb-3"
              style={{
                fontSize: 13,
                color: "#9B2C2C",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Toàn bộ dữ liệu cá nhân, mẻ hải sản đang bán, lượt đánh giá và
              lịch sử trò chuyện sẽ bị xóa vĩnh viễn. Hành động này không thể
              khôi phục dưới bất kỳ hình thức nào.
            </p>
            {/* Nút bấm mở Modal cảnh báo xóa tài khoản */}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)} // Đặt state hiển thị modal thành true
              disabled={deleteLoading}
              className="btn fw-bold py-2 px-4 text-white"
              style={{
                background: "#E53E3E",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                cursor: deleteLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(229,62,62,0.25)",
                transition: "background 0.2s",
                opacity: deleteLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!deleteLoading)
                  e.currentTarget.style.background = "#C53030";
              }}
              onMouseLeave={(e) => {
                if (!deleteLoading)
                  e.currentTarget.style.background = "#E53E3E";
              }}
            >
              {deleteLoading
                ? "⏳ Đang xóa tài khoản..."
                : "Xóa tài khoản vĩnh viễn (GDPR)"}
            </button>
          </div>
        </div>
        {/* kết thúc cột bên phải */}
      </div>
      {/* kết thúc hàng lưới */}
    </div>
  );
}
