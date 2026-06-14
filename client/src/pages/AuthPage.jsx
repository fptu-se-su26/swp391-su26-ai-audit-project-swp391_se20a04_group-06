/**
 * AuthPage.jsx — Google-Only Auth & Quick Local Dev Login (Sửa đổi cho đăng nhập luôn)
 * Trang xác thực người dùng sử dụng duy nhất tài khoản Google OAuth 2.0 hoặc tài khoản giả lập local
 */

// Nhập các hook từ React: useState (quản lý state), useEffect (side effects), và useCallback (tối ưu hóa bộ nhớ hàm)
import { useState, useEffect, useCallback } from "react";
// Nhập hook useNavigate để điều hướng trang web trong React Router
import { useNavigate } from "react-router-dom";
// Nhập helper api dùng chung để thực hiện các yêu cầu HTTP Request tới backend
import { api } from "../services/api";
// Nhập các biểu tượng SparklesIcon và AlertCircleIcon từ thư mục icons
import { SparklesIcon, AlertCircleIcon } from "../components/icons";
// Nhập hook useAuth để đọc/ghi thông tin tài khoản đăng nhập hiện tại từ Context
import { useAuth } from "../context/AuthContext";

// Định nghĩa component GoogleLogo vẽ logo Google bằng mã SVG
const GoogleLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Vẽ chữ G màu xanh lam */}
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.148 17.64 11.84 17.64 9.2z"
      fill="#4285F4"
    />
    {/* Vẽ chân chữ G màu xanh lá */}
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      fill="#34A853"
    />
    {/* Vẽ sườn chữ G màu vàng */}
    <path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      fill="#FBBC05"
    />
    {/* Vẽ vòm chữ G màu đỏ */}
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

// Định nghĩa và xuất ra component chính AuthPage quản trị luồng đăng nhập
export function AuthPage() {
  // Khởi tạo hàm điều hướng trang chuyển vùng URL
  const navigate = useNavigate();
  // Lấy hàm setUser từ Context để cập nhật trạng thái người dùng sau khi đăng nhập thành công
  const { setUser } = useAuth();

  // State quản lý thông điệp báo lỗi khi đăng nhập, mặc định ban đầu là chuỗi rỗng
  const [err, setErr] = useState("");
  // State quản lý trạng thái hiển thị loading khi đang gọi API xác thực, mặc định là false
  const [loading, setLoading] = useState(false);
  // State điều khiển ẩn/hiện popup giả lập tài khoản Google trên giao diện dev, mặc định là false
  const [showMockGooglePopup, setShowMockGooglePopup] = useState(false);

  // Nhận diện xem trình duyệt đang chạy tại localhost (môi trường phát triển cục bộ) hay không
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Lấy mã khóa Google Client ID từ biến cấu hình môi trường Vite
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  // Nếu thiếu Google Client ID thì tự động bật chế độ Mock giả lập để tiện phát triển không cần internet/config
  const [hasMockMode, setHasMockMode] = useState(!clientId);

  // Định nghĩa callback xử lý kết quả token trả về từ phía Google Identity Services
  const handleGoogleCredentialResponse = useCallback(
    async (response) => {
      // Bật trạng thái loading xử lý thông tin
      setLoading(true);
      // Reset lỗi cũ về rỗng
      setErr("");
      try {
        // Gửi mã credential (ID Token) nhận từ Google lên Backend để xác thực
        const data = await api("/auth/google", {
          method: "POST", // Sử dụng phương thức POST
          body: JSON.stringify({ idToken: response.credential }), // Gửi kèm token trong request body dạng JSON
        });
        // Lưu thực thể thông tin User nhận về vào Context
        setUser(data.user);
        // Điều hướng: Nếu là quản trị viên chuyển vào trang /admin, ngược lại chuyển ra trang chủ /
        navigate(data.user.role === "Admin" ? "/admin" : "/");
      } catch (e) {
        // Lưu thông điệp báo lỗi nếu quá trình xác thực ở backend thất bại
        setErr(e.message || "Đăng nhập Google thất bại");
      } finally {
        // Tắt trạng thái loading khi hoàn tất xử lý
        setLoading(false);
      }
    },
    [navigate, setUser], // Các phụ thuộc của hook useCallback
  );

  // useEffect dùng để cấu hình tự động nút bấm đăng nhập chính thức của Google Identity Services (GIS)
  useEffect(() => {
    // Nếu thiếu Google Client ID thì không khởi tạo thư viện chính thức, chạy qua fallback mock
    if (!clientId) {
      console.warn(
        "VITE_GOOGLE_CLIENT_ID is missing. Mock Google Sign-In will be active.",
      );
      return;
    }

    // Định nghĩa hàm đệ quy an toàn khởi tạo thư viện GIS khi trình duyệt load xong file script Google
    const initGoogleGis = () => {
      // Nếu đối tượng google chưa được gắn vào window (file script chưa tải xong)
      if (typeof window.google === "undefined") {
        // Đợi 100ms rồi tự gọi lại chính nó
        setTimeout(initGoogleGis, 100);
        return;
      }
      try {
        // Khởi tạo Client OAuth 2.0 bằng Client ID và truyền callback nhận dữ liệu
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false, // Không tự động đăng nhập không hỏi
        });
        
        // Tìm thẻ div chứa nút bấm Google Sign-In trên giao diện
        const btnDiv = document.getElementById("google-signin-btn");
        if (btnDiv) {
          // Ra lệnh render nút bấm chuẩn thương hiệu Google vào thẻ div tương ứng
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "outline", // Kiểu viền mỏng
            size: "large", // Kích thước lớn
            width: btnDiv.clientWidth || 336, // Chiều rộng bằng khung chứa
            text: "signin_with", // Hiển thị chữ "Sign in with..."
            shape: "rectangular", // Hình chữ nhật phẳng
          });
        }
        
        // Gọi gợi ý đăng nhập One Tap của Google ở góc màn hình
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log(
              "One Tap not displayed:",
              notification.getNotDisplayedReason(),
            );
          }
        });
      } catch (error) {
        console.error("Failed to initialize Google Identity Services:", error);
        // Fallback sang chế độ mock nếu khởi tạo bị lỗi
        setHasMockMode(true);
      }
    };

    // Gọi khởi chạy tiến trình GIS
    initGoogleGis();
  }, [clientId, handleGoogleCredentialResponse]);

  // Hàm gọi API đăng nhập giả lập thông minh phục vụ môi trường local (tự động đăng ký nếu email chưa tồn tại trong DB)
  const selectMockAccount = useCallback(
    async (email) => {
      // Ẩn popup chọn tài khoản mock
      setShowMockGooglePopup(false);
      // Bật trạng thái chờ
      setLoading(true);
      // Reset thông điệp lỗi
      setErr("");
      try {
        // Gửi request tới API backend /auth/google, truyền kèm mã mock token cấu trúc đặc biệt chứa email
        const data = await api("/auth/google", {
          method: "POST",
          body: JSON.stringify({
            idToken: `mock_google_token_${email.toLowerCase().trim()}_${Date.now()}`,
          }),
        });
        // Lưu thông tin người dùng mock vào Context sau khi nhận xác nhận từ Backend
        setUser(data.user);
        // Điều hướng người dùng dựa vào quyền hạn nhận được
        navigate(data.user.role === "Admin" ? "/admin" : "/");
      } catch (e) {
        // Gắn lỗi
        setErr(
          e.message ||
            "Giả lập đăng nhập thất bại. Vui lòng kiểm tra file .env ở backend.",
        );
      } finally {
        // Tắt loading
        setLoading(false);
      }
    },
    [navigate, setUser],
  );

  // Hàm cho phép nhà phát triển tự nhập một địa chỉ email Google bất kỳ để giả lập đăng nhập
  const handleMockOtherAccount = async () => {
    // Hiển thị hộp thoại prompt của trình duyệt để người dùng tự nhập email giả lập
    const mockEmail = window.prompt(
      "Nhập email Google muốn giả lập đăng nhập:",
      "nguyenvana@gmail.com",
    );
    // Nếu bấm hủy hoặc để trống thì thoát hàm
    if (!mockEmail) return;
    
    // Sử dụng Regular Expression kiểm tra định dạng cấu trúc của email nhập vào
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(mockEmail)) {
      // Đặt thông báo lỗi nếu không khớp định dạng
      setErr("Địa chỉ email giả lập không đúng định dạng!");
      return;
    }
    
    // Thực thi gọi hàm đăng nhập giả lập với email vừa nhập
    await selectMockAccount(mockEmail);
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4"
      style={{ backgroundColor: "var(--bg)" }} // Thiết lập màu nền chung từ biến CSS hệ thống
    >
      <div
        className="card border-0 p-4 p-sm-5 w-100"
        style={{
          background: "var(--white)",
          borderRadius: 16,
          maxWidth: 400, // Chiều rộng thẻ tối đa 400px
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          boxSizing: "border-box",
        }}
      >
        {/* ── Tiêu đề thương hiệu (Header) ── */}
        <div className="text-center mb-4">
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{
              width: 56,
              height: 56,
              background: "var(--ocean-p)",
              color: "var(--ocean)",
              borderRadius: 12,
              border: "1px solid rgba(8, 29, 44, 0.08)",
            }}
          >
            {/* Hiển thị biểu tượng lấp lánh Sparkles */}
            <SparklesIcon size={24} />
          </div>

          <h1
            className="fw-bold m-0"
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--dark)",
              letterSpacing: "-0.02em",
            }}
          >
            Haisan.vn
          </h1>
          <p
            className="m-0 mt-1 fw-bold text-uppercase"
            style={{
              color: "var(--muted)",
              fontSize: 9,
              letterSpacing: "0.15em",
            }}
          >
            Tươi từ đại dương
          </p>
        </div>

        {/* ── Khung cảnh báo lỗi (Error Alert) ── */}
        {err && (
          <div
            className="alert alert-danger border-danger d-flex align-items-center gap-2 py-2 px-3 mb-3"
            style={{
              color: "#991b1b",
              fontSize: 12,
              background: "#fef2f2",
              borderLeft: "3.5px solid #ef4444",
              borderRadius: 6,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {/* Biểu tượng dấu chấm than báo lỗi */}
            <AlertCircleIcon size={14} className="flex-shrink-0" />
            <span>{err}</span>
          </div>
        )}

        {/* ── BẢNG ĐIỀU KHIỂN ĐĂNG NHẬP NHANH DEV MODE (Chỉ hiển thị khi chạy ở localhost) ── */}
        {isLocal && (
          <div
            style={{
              background: "#F8FAFC",
              border: "1.5px dashed #0EA5E9",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0369A1",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>🛠️ Dev Mode: Đăng nhập nhanh</span>
              <span
                style={{
                  fontSize: 9,
                  background: "#E0F2FE",
                  color: "#0369A1",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                Local Only
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Nút đăng nhập giả lập quyền Admin */}
              <button
                type="button"
                onClick={() => selectMockAccount("admin@haisan.vn")}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#7C3AED",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                👑 Đăng nhập Admin (admin@haisan.vn)
              </button>

              {/* Nút đăng nhập giả lập vai trò Ngư dân / Người bán */}
              <button
                type="button"
                onClick={() => selectMockAccount("binh@haisan.vn")}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--ocean)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                🎣 Đăng nhập Ngư dân / Người bán (binh@haisan.vn)
              </button>

              {/* Nút đăng nhập giả lập vai trò Khách mua hàng */}
              <button
                type="button"
                onClick={() => selectMockAccount("lan@haisan.vn")}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--coral)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                🛒 Đăng nhập Người mua (lan@haisan.vn)
              </button>
            </div>

            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              💡 Hệ thống sẽ tự động tạo mới tài khoản nếu chưa tồn tại trong DB.
            </div>
          </div>
        )}

        {/* ── Nút Đăng nhập Google (OAuth Google chính thức / giả lập) ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Hoặc sử dụng OAuth Google
          </div>

          {/* Nếu hệ thống được cấu hình bắt buộc chạy mock (không có client ID) */}
          {hasMockMode ? (
            <button
              onClick={() => setShowMockGooglePopup(true)} // Mở popup chọn tài khoản Google giả lập
              disabled={loading}
              className="btn w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
              style={{
                background: "var(--white)",
                color: "var(--dark)",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                padding: "11px 16px",
                fontSize: 14,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "box-shadow 0.2s, border-color 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow =
                    "0 2px 10px rgba(0,0,0,0.13)";
                  e.currentTarget.style.borderColor = "#aaa";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {loading ? (
                "⏳ Đang xử lý..."
              ) : (
                <>
                  {/* Vẽ logo Google và hiển thị chữ giả lập */}
                  <GoogleLogo />
                  Đăng nhập bằng Google (Giả lập)
                </>
              )}
            </button>
          ) : (
            // Nếu có Google Client ID đầy đủ: Render khung chứa nút bấm GIS chính thức
            <div className="w-100">
              <div
                id="google-signin-btn"
                className="w-100 d-flex justify-content-center"
              />
              {/* Cho phép dev click mở popup chọn tài khoản mock để test nhanh ngay cả khi có client ID */}
              {isLocal && (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setShowMockGooglePopup(true)}
                    disabled={loading}
                    className="btn border-0 bg-transparent text-decoration-underline text-muted"
                    style={{ fontSize: 12, cursor: "pointer" }}
                  >
                    [Dev] Sử dụng bảng Google Popup giả lập
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Ghi chú dưới chân trang ── */}
        <p
          className="text-center mt-4 mb-0"
          style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.7 }}
        >
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <span style={{ color: "var(--ocean)", cursor: "pointer" }}>
            Điều khoản dịch vụ
          </span>{" "}
          và{" "}
          <span style={{ color: "var(--ocean)", cursor: "pointer" }}>
            Chính sách quyền riêng tư
          </span>{" "}
          của Haisan.vn.
        </p>
      </div>

      {/* ── POPUP GIẢ LẬP GIAO DIỆN CHỌN TÀI KHOẢN GOOGLE (HIGH FIDELITY MOCK POPUP) ── */}
      {showMockGooglePopup && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            background: "rgba(0, 0, 0, 0.65)", // Nền tối làm mờ phía sau
            zIndex: 99999, // Đảm bảo nổi lên trên cùng
            fontFamily: "'Segoe UI', Roboto, sans-serif",
          }}
          onClick={() => setShowMockGooglePopup(false)} // Click ra ngoài tự động đóng popup
        >
          <div
            className="card border-0 w-100"
            style={{
              background: "#1E1E1E", // Màu tối giao diện Dark Mode
              color: "#E3E3E3",
              borderRadius: 8,
              maxWidth: 440,
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
              boxSizing: "border-box",
              overflow: "hidden",
              border: "1px solid #333333",
              textAlign: "left",
            }}
            onClick={(e) => e.stopPropagation()} // Chặn sự kiện nổi bọt tránh tự đóng khi click bên trong
          >
            {/* Giả lập thanh tiêu đề cửa sổ trình duyệt Edge */}
            <div
              className="d-flex align-items-center justify-content-between px-3 py-2"
              style={{
                background: "#2D2D2D",
                fontSize: 12,
                color: "#CCCCCC",
                borderBottom: "1px solid #333333",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bolder" style={{ color: "#4285F4" }}>
                  G
                </span>
                <span>
                  Đăng nhập - Tài khoản Google - Personal - Microsoft Edge
                </span>
              </div>
              <button
                onClick={() => setShowMockGooglePopup(false)}
                className="btn border-0 p-0 text-secondary bg-transparent"
                style={{ fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            {/* Khung nội dung chọn tài khoản của Google Identity */}
            <div className="p-4 p-sm-5 pt-4 pb-3">
              <div
                className="d-flex align-items-center gap-2 fw-semibold mb-3 text-white"
                style={{ fontSize: 14 }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bolder bg-white text-primary"
                  style={{ width: 24, height: 24, fontSize: 14 }}
                >
                  G
                </div>
                <span>Đăng nhập bằng Google</span>
              </div>

              <h2
                className="fw-normal mb-1 text-white"
                style={{ fontSize: 24 }}
              >
                Chọn tài khoản
              </h2>
              <p className="mb-4" style={{ fontSize: 14, color: "#9AA0A6" }}>
                Tiếp tục tới{" "}
                <span style={{ color: "#8AB4F8", fontWeight: 600 }}>
                  Haisan.vn
                </span>
              </p>

              {/* Danh sách các tài khoản Google mẫu để chọn lựa nhanh */}
              <div
                className="d-flex flex-column border-top border-bottom py-1"
                style={{
                  borderColor: "#3C4043 !important",
                  margin: "0 -2.5rem",
                }}
              >
                {[
                  {
                    name: "but daudau",
                    email: "daudaubut@gmail.com",
                    initial: "b",
                    color: "#1A73E8",
                  },
                  {
                    name: "Nguyễn Văn Bình",
                    email: "binh@haisan.vn",
                    initial: "B",
                    color: "#188038",
                  },
                  {
                    name: "Trần Thị Lan",
                    email: "lan@haisan.vn",
                    initial: "L",
                    color: "#8430DE",
                  },
                ].map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectMockAccount(acc.email)}
                    className="d-flex align-items-center gap-3 px-5 py-2"
                    style={{
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#2D2E30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Ảnh đại diện giả lập bằng kí tự đầu tiên của tên */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-semibold text-uppercase text-white"
                      style={{
                        width: 32,
                        height: 32,
                        background: acc.color,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {acc.initial}
                    </div>
                    <div className="flex-grow-1">
                      <div
                        className="fw-semibold text-light"
                        style={{ fontSize: 13 }}
                      >
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#9AA0A6" }}>
                        {acc.email}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mục cho phép nhập một tài khoản email giả lập khác tùy ý */}
                <div
                  onClick={handleMockOtherAccount}
                  className="d-flex align-items-center gap-3 px-5 py-2"
                  style={{ cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#2D2E30";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-secondary border border-secondary"
                    style={{
                      width: 32,
                      height: 32,
                      background: "transparent",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    👤
                  </div>
                  <span
                    className="fw-normal text-light"
                    style={{ fontSize: 13 }}
                  >
                    Sử dụng một tài khoản khác
                  </span>
                </div>
              </div>

              {/* Điều khoản bảo mật Google bên dưới cùng của popup */}
              <div
                className="mt-3 text-secondary"
                style={{ fontSize: 11, lineHeight: 1.5 }}
              >
                Trước khi sử dụng Haisan.vn, bạn có thể xem{" "}
                <span style={{ color: "#8AB4F8", cursor: "pointer" }}>
                  Chính sách quyền riêng tư
                </span>{" "}
                và{" "}
                <span style={{ color: "#8AB4F8", cursor: "pointer" }}>
                  Điều khoản dịch vụ
                </span>{" "}
                của ứng dụng này.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
