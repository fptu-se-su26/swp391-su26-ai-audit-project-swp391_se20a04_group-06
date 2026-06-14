/**
 * ChatPopover.jsx — Modernized UI/UX Version
 *
 * Giữ nguyên 100% logic fetch conversations và truyền callback onOpenChat.
 */
// Import các React Hooks dùng để quản lý state và xử lý vòng đời component
import { useState, useEffect } from "react";
// Import các màu giao diện được thiết lập chung trong tệp utils/theme
import { C } from "../utils/theme";
// Import hàm axios cấu hình dùng để gửi yêu cầu API
import { api } from "../services/api";

// Định nghĩa và export component ChatPopover nhận prop callback onOpenChat khi click vào một cuộc trò chuyện
export function ChatPopover({ onOpenChat }) {
  // Tạo state lưu danh sách các cuộc trò chuyện hiện tại, mặc định ban đầu là mảng rỗng
  const [conversations, setConversations] = useState([]);
  // Tạo state lưu trạng thái đang tải dữ liệu để hiển thị thông báo chờ
  const [loading, setLoading] = useState(true);

  // Hook useEffect chạy sau khi component được kết xuất lần đầu tiên vào DOM
  useEffect(() => {
    // Gọi API để fetch danh sách các cuộc trò chuyện của người dùng hiện tại
    api("/messages/conversations")
      // Cập nhật danh sách cuộc trò chuyện lấy được vào state conversations
      .then((data) => setConversations(data))
      // Đánh chặn lỗi âm thầm nếu có sự cố xảy ra
      .catch(() => {})
      // Dù thành công hay thất bại thì đều tắt trạng thái đang tải
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      // Giao diện khung popover chứa các tin nhắn nhanh
      style={{
        position: "absolute", // Định vị tuyệt đối tương đối với nút bấm kích hoạt trên thanh menu
        top: 48, // Cách phía trên 48px để đẩy popover xuống dưới nút bấm
        right: 0, // Đặt popover thẳng hàng mép phải với thẻ cha
        width: 330, // Chiều rộng cố định của popover tin nhắn
        background: "#fff", // Đặt màu nền là màu trắng
        borderRadius: 16, // Bo góc khung popover mềm mại 16px
        boxShadow:
          "0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)", // Hiệu ứng đổ bóng nổi cao cấp
        border: `1px solid ${C.border}`, // Tạo viền mỏng quanh popover
        zIndex: 100, // Đảm bảo popover luôn hiển thị nổi trên các phần tử nền khác
        overflow: "hidden", // Ẩn bất kỳ nội dung nào vượt ngoài vùng bo tròn của khung
      }}
    >
      {/* Thanh tiêu đề Header phía trên popover */}
      <div
        style={{
          padding: "14px 18px", // Khoảng đệm lề rộng vừa phải
          background: "#F8FAFC", // Màu nền xám lam nhạt dễ chịu
          borderBottom: `1px solid ${C.border}`, // Viền gạch chân ngang chia cách tiêu đề
          fontWeight: 800, // Kích cỡ chữ in cực đậm làm nổi bật
          fontSize: 14, // Cỡ chữ tiêu đề 14px
          color: C.dark, // Đặt màu chữ tối sẫm
        }}
      >
        💬 Hộp thư tin nhắn
      </div>

      {/* Vùng danh sách các cuộc hội thoại cho phép thanh cuộn dọc khi danh sách dài */}
      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {/* Render có điều kiện dựa trên trạng thái loading của API */}
        {loading ? (
          <div
            style={{
              padding: 32, // Khoảng đệm rộng để căn giữa dòng văn bản
              textAlign: "center", // Căn chữ nằm chính giữa
              color: C.muted, // Màu chữ xám nhạt mờ
              fontSize: 13, // Cỡ chữ nhỏ 13px
            }}
          >
            Đang tải cuộc trò chuyện...
          </div>
        ) : conversations.length === 0 ? (
          // Nếu đã tải xong nhưng không tìm thấy cuộc hội thoại nào
          <div
            style={{
              padding: 32, // Khoảng đệm căn chỉnh
              textAlign: "center", // Căn giữa dòng chữ
              color: C.muted, // Màu chữ mờ xám
              fontSize: 13, // Cỡ chữ nhỏ 13px
            }}
          >
            Chưa có tin nhắn nào gần đây.
          </div>
        ) : (
          // Bản đồ duyệt qua danh sách các cuộc trò chuyện để tạo các phần tử UI tương ứng
          conversations.map((c) => (
            <div
              // Khởi tạo key duy nhất bằng cách kết hợp ID sản phẩm và ID người chat cùng
              key={`${c.productId}-${c.otherUserId}`}
              // Click vào dòng tin nhắn sẽ mở khung chat chi tiết của cuộc hội thoại đó
              onClick={() => onOpenChat(c)}
              style={{
                padding: "14px 18px", // Khoảng đệm tạo vùng bấm rộng rãi thoải mái
                borderBottom: `1px solid ${C.border}`, // Nét gạch phân tách giữa các hàng tin nhắn
                display: "flex", // Sử dụng bố cục flexbox hàng ngang
                gap: 12, // Khoảng cách giữa avatar và thông tin chữ là 12px
                cursor: "pointer", // Biến đổi con trỏ chuột sang hình bàn tay
                // Đổi nền màu xanh nhạt nhẹ nếu có tin nhắn chưa đọc, ngược lại nền trắng
                background: c.unread > 0 ? "rgba(11, 79, 108, 0.04)" : "#fff",
                // Đường viền mép trái làm chỉ thị màu sắc: Ocean xanh nếu có tin nhắn mới, trong suốt nếu đã đọc
                borderLeft:
                  c.unread > 0
                    ? `4px solid ${C.ocean}`
                    : `4px solid transparent`,
                transition: "all 0.2s ease", // Đặt hiệu ứng hoạt ảnh hover nhẹ nhàng
              }}
              // Khi di chuột qua, thay đổi màu nền dòng tin nhắn sang màu xám nhạt
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
              }}
              // Khi chuột rời đi, khôi phục màu nền theo trạng thái tin nhắn đã đọc hay chưa
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  c.unread > 0 ? "rgba(11, 79, 108, 0.04)" : "#fff";
              }}
            >
              {/* Vòng tròn Avatar chứa chữ cái đầu viết tắt tên đối phương */}
              <div
                style={{
                  width: 42, // Chiều rộng vòng tròn
                  height: 42, // Chiều cao vòng tròn
                  borderRadius: "50%", // Thiết lập bo tròn hoàn chỉnh
                  // Nền chuyển màu từ xanh dương đậm sang xanh dương nhạt đầy cuốn hút
                  background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                  color: "#fff", // Đặt màu chữ cái hiển thị là trắng
                  display: "flex", // Sử dụng flexbox để căn giữa chữ
                  alignItems: "center", // Căn chữ nằm chính giữa dọc
                  justifyContent: "center", // Căn chữ nằm chính giữa ngang
                  fontWeight: 700, // Đặt nét chữ dày đậm
                  fontSize: 14, // Cỡ chữ 14px
                  flexShrink: 0, // Ngăn chặn avatar bị co rút khi nội dung chữ bên cạnh dài
                  boxShadow: "0 2px 5px rgba(11, 79, 108, 0.15)", // Đổ bóng nhẹ cho avatar
                }}
              >
                {/* Lấy ký tự đầu tiên của đối tác trò chuyện và chuẩn hóa viết hoa */}
                {c.otherUserName.charAt(0).toUpperCase()}
              </div>

              {/* Vùng thông tin nội dung văn bản bên phải avatar */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                {/* Hàng ngang chứa tên đối tác và chấm đỏ chưa đọc */}
                <div
                  style={{
                    display: "flex", // Bố cục flex ngang
                    justifyContent: "space-between", // Căn tên sang bên trái, chấm đỏ sang bên phải cùng
                    alignItems: "center", // Căn chỉnh giữa theo chiều dọc
                    marginBottom: 3, // Khoảng cách nhỏ với dòng tin nhắn cuối
                  }}
                >
                  {/* Tên hiển thị của đối phương */}
                  <div
                    style={{
                      fontWeight: 700, // Đặt kiểu in đậm
                      fontSize: 14, // Cỡ chữ 14px
                      color: C.dark, // Màu chữ xám đen tối sẫm
                      whiteSpace: "nowrap", // Không tự động xuống dòng
                      overflow: "hidden", // Ẩn phần chữ tràn khung
                      textOverflow: "ellipsis", // Thêm dấu ... nếu tên quá dài vượt khung chứa
                    }}
                  >
                    {c.otherUserName}
                  </div>

                  {/* Chấm tròn báo hiệu có tin nhắn mới chưa đọc */}
                  {c.unread > 0 && (
                    <div
                      style={{
                        width: 8, // Chiều rộng chấm tròn
                        height: 8, // Chiều cao chấm tròn
                        borderRadius: "50%", // Bo tròn tuyệt đối
                        background: C.coral, // Sử dụng màu đỏ cam của san hô để tạo sự chú ý
                        flexShrink: 0, // Không cho phép co lại
                        boxShadow: "0 0 0 2px rgba(232, 100, 58, 0.3)", // Viền bóng phát sáng xung quanh chấm đỏ
                      }}
                    />
                  )}
                </div>

                {/* Dòng tóm tắt nội dung tin nhắn gửi sau cùng */}
                <div
                  style={{
                    fontSize: 12, // Cỡ chữ nhỏ 12px
                    // Nếu chưa đọc thì chữ tối sẫm hơn, nếu đã đọc thì chữ xám nhạt mờ
                    color: c.unread > 0 ? C.dark : C.muted,
                    whiteSpace: "nowrap", // Không cho phép xuống dòng
                    overflow: "hidden", // Ẩn chữ thừa
                    textOverflow: "ellipsis", // Thêm dấu ba chấm ở đuôi chữ
                    // Nếu chưa đọc thì làm đậm nội dung tin nhắn, ngược lại để bình thường
                    fontWeight: c.unread > 0 ? 700 : 400,
                  }}
                >
                  {c.lastMessage}
                </div>

                {/* Tag hiển thị tên sản phẩm hải sản đi kèm cuộc trò chuyện */}
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      display: "inline-block", // Đặt inline-block để padding và width hoạt động chính xác
                      fontSize: 10, // Kích thước chữ siêu nhỏ 10px
                      fontWeight: 600, // Đặt kiểu chữ bán đậm
                      background: "#F1F5F9", // Nền xám tro nhạt tinh tế
                      color: "#475569", // Màu chữ xám xanh dịu mắt
                      padding: "2px 8px", // Khoảng đệm dọc và ngang
                      borderRadius: 6, // Bo góc nhẹ 6px
                      maxWidth: "100%", // Chiều rộng tối đa bằng khung cha
                      overflow: "hidden", // Ẩn chữ nếu tên sản phẩm quá dài
                      textOverflow: "ellipsis", // Dùng dấu ba chấm khi bị tràn
                      whiteSpace: "nowrap", // Ngăn chặn dòng chữ sản phẩm bị ngắt dòng
                    }}
                  >
                    📦 {c.productName}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
