// Import các hook React để quản lý state và side effects
import { useState, useEffect } from "react";
// Import bảng màu theme C từ thư mục tiện ích utils/theme
import { C } from "../utils/theme";
// Import helper api để gửi yêu cầu API
import { api } from "../services/api";
// Import hook useToast từ ToastContext để hiển thị thông báo dạng toast
import { useToast } from "../context/ToastContext";

// Khai báo giới hạn số lượng ký tự tối đa của một thông báo phát sóng
const MAX_CHARS = 200;

// Định nghĩa danh sách các đối tượng người nhận thông báo mục tiêu để quản trị viên chọn lựa
const TARGETS = [
  { value: "all", label: "Tất cả người dùng" }, // Gửi đến tất cả tài khoản
  { value: "Seller", label: "Chỉ người bán" }, // Chỉ gửi đến ngư dân / đại lý
  { value: "Buyer", label: "Chỉ người mua" }, // Chỉ gửi đến khách mua hàng
];

// Định nghĩa component phụ FieldLabel hiển thị tiêu đề nhãn cho các ô nhập liệu
function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11, // Cỡ chữ nhỏ 11px
        fontWeight: 700, // Chữ in đậm
        color: C.muted, // Màu chữ mờ xám
        marginBottom: 8, // Khoảng cách cách khối phía dưới 8px
        textTransform: "uppercase", // In hoa toàn bộ chữ cái
        letterSpacing: "0.06em", // Tăng khoảng cách giữa các chữ cái
      }}
    >
      {children}
    </div>
  );
}

// Định nghĩa và export component AdminBroadcastTab phục vụ các chức năng phát sóng tin nhắn hệ thống của quản trị viên
export function AdminBroadcastTab() {
  // Khởi tạo helper thông báo toast
  const toast = useToast();
  // Khởi tạo state content lưu trữ nội dung thông báo đang soạn thảo
  const [content, setContent] = useState("");
  // Khởi tạo state target lưu trữ đối tượng nhận thông báo (mặc định là 'all')
  const [target, setTarget] = useState("all");
  // Khởi tạo state sending kiểm soát nút bấm khi đang trong tiến trình gửi tin nhắn lên máy chủ
  const [sending, setSending] = useState(false);
  // Khởi tạo state history lưu trữ lịch sử các thông báo hệ thống đã phát sóng trước đó
  const [history, setHistory] = useState([]);
  // Khởi tạo state histLoading kiểm soát trạng thái tải danh sách lịch sử từ API
  const [histLoading, setHistLoading] = useState(true);

  // Hook useEffect tự động fetch lịch sử phát sóng thông báo khi component được render lần đầu
  useEffect(() => {
    // Gọi API lấy danh sách lịch sử phát sóng thông báo admin
    api("/admin/notifications/broadcasts")
      // Nếu thành công thì lưu dữ liệu vào state history
      .then(setHistory)
      // Nếu lỗi thì im lặng bỏ qua
      .catch(() => {})
      // Cuối cùng tắt trạng thái tải lịch sử
      .finally(() => setHistLoading(false));
  }, []);

  // Hàm xử lý gửi thông báo phát sóng lên server
  const handleSend = async () => {
    // Nếu nội dung thông báo rỗng hoặc đang trong quá trình gửi thì dừng xử lý
    if (!content.trim() || sending) return;
    // Đặt trạng thái đang gửi là true để khóa nút bấm
    setSending(true);
    try {
      // Gửi yêu cầu POST lên API gửi thông báo hệ thống hàng loạt
      const res = await api("/admin/notifications/broadcast", {
        method: "POST", // Phương thức POST
        body: JSON.stringify({ content: content.trim(), targetRole: target }), // Truyền nội dung và role đối tượng nhận
      });
      // Hiển thị thông báo thành công cho biết số lượng người dùng đã được gửi tin
      toast.success(`✅ Đã gửi thông báo đến người dùng.`);
      // Làm sạch ô soạn thảo văn bản
      setContent("");
      // Thêm thông báo mới vừa tạo vào đầu danh sách lịch sử trên giao diện
      setHistory((prev) => [res.broadcast, ...prev]);
    } catch (e) {
      // Hiển thị thông báo lỗi nếu có sự cố xảy ra
      toast.error(e.message);
    } finally {
      // Cuối cùng mở khóa nút bấm gửi
      setSending(false);
    }
  };

  // Tính toán số lượng ký tự còn lại có thể gõ trong giới hạn cho phép
  const remaining = MAX_CHARS - content.length;

  return (
    // Bố cục lưới hàng ngang của Bootstrap
    <div className="row g-4">
      {/* ── Khối soạn thảo thông báo (Compose) bên trái ── */}
      <div className="col-12 col-lg-6">
        <div
          style={{
            background: C.white, // Nền trắng sáng
            borderRadius: 9, // Bo góc viền 16px
            border: `1px solid ${C.border}`, // Viền ngoài màu nhẹ mặc định
            padding: 20, // Đệm lề trong 24px rộng rãi
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)", // Bóng đổ cực mịn
          }}
        >
          {/* Tiêu đề mục soạn thảo */}
          <div
            style={{
              fontWeight: 700, // Chữ in đậm
              fontSize: 15, // Cỡ chữ 15px
              color: C.dark, // Màu tối sẫm
              marginBottom: 10, // Khoảng cách cách khối phía dưới 20px
            }}
          >
            📣 Thông báo hệ thống
          </div>

          {/* Chọn đối tượng nhận tin */}
          <div
            style={{
              display: "flex", // Bố cục flex
              gap: 7, // Khoảng cách giữa các nút là 8px
              flexWrap: "wrap", // Cho phép tự xuống dòng nếu màn hình hẹp
              marginBottom: 12, // Khoảng cách cách ô text bên dưới 20px
            }}
          >
            {/* Duyệt qua từng đối tượng mục tiêu trong mảng TARGETS */}
            {TARGETS.map((t) => (
              <button
                key={t.value} // Khóa React duy nhất
                onClick={() => setTarget(t.value)} // Click chọn đối tượng nhận
                // Cấu hình style: nút được chọn hiển thị nền xanh dương chữ trắng, ngược lại nền trắng chữ xám đen
                style={{
                  padding: "6px 14px", // Đệm trong nút bấm
                  borderRadius: 14, // Bo tròn viền dạng hình viên thuốc
                  border: `1.5px solid ${target === t.value ? C.ocean : C.border}`, // Đổi màu viền nếu được chọn
                  background: target === t.value ? C.ocean : C.white,
                  color: target === t.value ? "#fff" : C.text,
                  fontSize: 11, // Cỡ chữ nhỏ 12px
                  fontWeight: 500, // Chữ in đậm
                  cursor: "pointer", // Con trỏ chuột pointer
                  fontFamily: "inherit",
                  transition: "all 0.1s ease", // Hiệu ứng chuyển tiếp mượt mà
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Ô nhập nội dung văn bản và bộ đếm số lượng ký tự */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            {/* Ô textarea nhập liệu thông báo */}
            <textarea
              value={content} // Liên kết với state content
              // Bắt sự kiện thay đổi: cắt bốt văn bản nếu vượt quá độ dài tối đa MAX_CHARS
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Nhập nội dung thông báo gửi đến người dùng..."
              rows={4} // Mặc định hiển thị 4 dòng
              // Style cho textarea: nếu ký tự còn lại dưới 20 hiển thị viền cam cảnh báo, ngược lại viền xám mặc định
              style={{
                width: "100%", // Chiều rộng lấp đầy 100%
                padding: "12px 14px", // Đệm lề trong
                paddingBottom: 28, // Đệm đáy sâu hơn để tránh đè lên nhãn số ký tự
                borderRadius: 12, // Bo tròn viền 12px
                border: `1.5px solid ${remaining < 20 ? "#f59e0b" : C.border}`,
                fontSize: 13, // Cỡ chữ 13px
                fontFamily: "inherit",
                resize: "vertical", // Chỉ cho phép kéo giãn chiều cao
                outline: "none", // Loại bỏ viền mặc định của trình duyệt khi focus
                color: C.dark, // Màu chữ tối sẫm
                boxSizing: "border-box", // Tính toán kích thước bao gồm cả padding
                transition: "border-color 0.15s", // Hiệu ứng đổi màu viền mượt mà
              }}
            />
            {/* Số ký tự đã gõ / Tổng số ký tự giới hạn ở góc dưới bên phải */}
            <span
              style={{
                position: "absolute", // Định vị tuyệt đối ở góc dưới phải
                bottom: 8,
                right: 12,
                fontSize: 11, // Cỡ chữ siêu nhỏ 11px
                fontWeight: 600, // Chữ bán đậm
                // Màu chữ: đỏ nếu dưới 20 ký tự còn lại, ngược lại xám mờ
                color: remaining < 20 ? "#ef4444" : C.muted,
                pointerEvents: "none", // Không cản trở tương tác chuột vào ô input bên dưới
              }}
            >
              {remaining} / {MAX_CHARS}
            </span>
          </div>

          {/* Khung xem trước (Live preview) hiển thị trực tiếp khi quản trị viên đang soạn văn bản */}
          

          {/* Nút bấm Gửi thông báo phát sóng hệ thống */}
          <button
            onClick={handleSend} // Click thực hiện gửi
            disabled={!content.trim() || sending} // Vô hiệu hóa nút nếu tin trống hoặc đang gửi
            // Cấu hình style thay đổi màu xám nếu bị disabled, màu ocean nếu sẵn sàng bấm
            style={{
              width: "100%", // Chiều rộng 100%
              padding: "10px 0", // Đệm dọc nút bấm
              borderRadius: 12, // Bo góc viền nút 12px
              border: "none",
              background: !content.trim() || sending ? "#94a3b8" : C.ocean,
              color: "#fff", // Màu chữ trắng
              fontWeight: 600, // Chữ in đậm
              fontSize: 13, // Cỡ chữ 14px
              // Con trỏ chuột: cấm bấm nếu disabled, bàn tay nếu bình thường
              cursor: !content.trim() || sending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "background 0.1s", // Hiệu ứng đổi màu nền mượt mà
            }}
          >
            {/* Thay đổi văn bản hiển thị tương ứng trạng thái gửi */}
            {sending ? "⏳ Đang gửi..." : "Gửi thông báo"}
          </button>
        </div>
      </div>

      {/* ── Khối Lịch sử thông báo đã gửi (History) bên phải ── */}
      <div className="col-12 col-lg-6">
        <div
          style={{
            background: C.white, // Nền trắng sáng
            borderRadius: 14, // Bo tròn viền 16px
            border: `1px solid ${C.border}`, // Viền ngoài màu nhẹ mặc định
            padding: 20, // Đệm lề trong 24px
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
          }}
        >
          {/* Tiêu đề lịch sử */}
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: C.dark,
              marginBottom: 10,
            }}
          >
            🕒 Lịch sử đã thông báo
          </div>

          {/* Nếu đang trong quá trình tải lịch sử */}
          {histLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: C.muted,
                fontSize: 13,
              }}
            >
              Đang tải...
            </div>
          ) : history.length === 0 ? (
            // Nếu không có lịch sử cuộc gọi nào
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13, color: C.muted }}>
                Chưa có thông báo nào được gửi.
              </div>
            </div>
          ) : (
            // Hiển thị danh sách thông báo đã phát sóng trước đó
            <div
              style={{
                display: "flex", // Bố cục flex dọc
                flexDirection: "column",
                gap: 5, // Khoảng cách giữa các dòng thông báo là 10px
                maxHeight: 230, // Chiều cao tối đa khu vực scroll là 420px
                overflowY: "auto", // Bật thanh cuộn dọc tự động
              }}
            >
              {/* Duyệt qua từng bản ghi lịch sử */}
              {history.map((h, i) => (
                <div
                  key={h.id || i} // Khóa React duy nhất
                  style={{
                    padding: "7px 10px", // Đệm lề dòng thông báo
                    borderRadius: 10, // Bo góc viền nhẹ 10px
                    border: `1px solid ${C.border}`, // Viền mảnh xám
                    background: "#fafbfc", // Nền xám xanh cực nhạt
                  }}
                >
                  <div
                    style={{
                      display: "flex", // Bố cục flex ngang
                      justifyContent: "space-between", // Đẩy nội dung bên trái, tag đếm bên phải
                      alignItems: "flex-start", // Căn thẳng mép trên
                      gap: 8, // Khoảng cách ngang
                    }}
                  >
                    {/* Nội dung tin nhắn */}
                    <div
                      style={{
                        fontSize: 12, // Cỡ chữ 13px
                        fontWeight: 500, // Chữ bán đậm
                        color: C.dark, // Màu tối sẫm
                        flex: 1, // Chiếm tối đa không gian còn lại
                        lineHeight: 1.45, // Tăng khoảng cách giữa các dòng để dễ đọc hơn
                      }}
                    >
                      {h.content}
                    </div>
                    {/* Số lượng người đã nhận được tin nhắn hệ thống */}
                    <span
                      style={{
                        background: "#E6F4F9", // Nền màu xanh dương nhạt dịu mắt
                        color: C.ocean, // Chữ màu ocean xanh sẫm
                        fontSize: 10, // Cỡ chữ siêu nhỏ
                        fontWeight: 700, // Chữ in đậm
                        padding: "2px 8px", // Đệm nhỏ
                        borderRadius: 8, // Bo góc dẹt
                        whiteSpace: "nowrap", // Không cho chữ xuống dòng
                        flexShrink: 0, // Không co rút
                      }}
                    >
                      {h.sentCount} người
                    </span>
                  </div>
                  {/* Hàng ngang phụ hiển thị đối tượng nhận và thời gian tạo */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 4,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {/* Nhãn vai trò đối tượng nhận tin */}
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: C.muted,
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      {TARGETS.find((t) => t.value === h.targetRole)?.label ??
                        "👥 Tất cả"}
                    </span>
                    {/* Ngày giờ phát tin nhắn hệ thống định dạng nội địa */}
                    <span style={{ fontSize: 11, color: C.muted }}>
                      🕒 {new Date(h.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
