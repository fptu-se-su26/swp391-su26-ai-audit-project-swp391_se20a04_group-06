/**
 * InboxTab.jsx — Modernized UI/UX Version (Sửa lỗi Cascading Renders)
 */

// Import hook useState, useEffect từ thư viện React
import { useState, useEffect } from "react";
// Import đối tượng chứa mã màu giao diện từ utils/theme
import { C } from "../utils/theme";
// Import helper api để gửi các yêu cầu HTTP fetch dữ liệu
import { api } from "../services/api";
// Import component ChatBox hiển thị khung tin nhắn chi tiết
import { ChatBox } from "./ChatBox";

// Định nghĩa và export component InboxTab để hiển thị hộp thư tin nhắn chính
export function InboxTab({ user }) {
  // Khởi tạo state conversations lưu danh sách các cuộc hội thoại chat
  const [conversations, setConversations] = useState([]);
  // Khởi tạo state loading quản lý trạng thái đang tải dữ liệu hội thoại từ API
  const [loading, setLoading] = useState(true);
  // Khởi tạo state activeChat lưu thông tin cuộc hội thoại đang được mở chi tiết (mặc định là null)
  const [activeChat, setActiveChat] = useState(null); // { productId, productName, otherUserId, otherUserName }

  // Định nghĩa hàm loadConversations để tải danh sách các cuộc hội thoại từ Backend
  const loadConversations = () => {
    // Gọi API lấy dữ liệu conversations
    api("/messages/conversations")
      // Nếu thành công, lưu kết quả trả về vào state conversations
      .then((data) => setConversations(data))
      // Nếu có lỗi, im lặng bỏ qua
      .catch(() => {})
      // Dù thành công hay thất bại đều đặt state loading về false để ẩn nhãn tải dữ liệu
      .finally(() => setLoading(false));
  };

  // Hook useEffect tự động chạy một lần duy nhất khi component được nạp vào DOM
  useEffect(() => {
    // Gọi hàm loadConversations để tải dữ liệu ban đầu
    loadConversations();
  }, []); // Mảng dependencies rỗng giúp effect chỉ thực thi một lần

  // Định nghĩa hàm openChat để xử lý sự kiện khi người dùng click mở một cuộc trò chuyện
  const openChat = (conv) => {
    // Cập nhật thông tin cuộc trò chuyện đang hoạt động vào state activeChat
    setActiveChat(conv);
    // Cập nhật cục bộ số tin nhắn chưa đọc của cuộc hội thoại này về 0 ngay lập tức trên UI
    setConversations((prev) =>
      prev.map((c) =>
        c.productId === conv.productId && c.otherUserId === conv.otherUserId
          ? { ...c, unread: 0 }
          : c,
      ),
    );
    // Phát đi một sự kiện CustomEvent 'sync-unread' để báo cho Navbar hoặc NotificationBell cập nhật lại số tin nhắn chưa đọc toàn cục
    window.dispatchEvent(new CustomEvent("sync-unread"));
  };

  // Tính tổng số lượng tin nhắn chưa đọc của tất cả các cuộc trò chuyện
  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div
      // Gán class CSS hỗ trợ responsive
      className="inbox-tab-grid"
      // Style inline thiết lập grid layout: 2 cột nếu đang mở chat, 1 cột nếu chưa chọn chat
      style={{
        display: "grid",
        gridTemplateColumns: activeChat ? "1fr 1fr" : "1fr",
        gap: 24, // Khoảng cách giữa các cột/hàng là 24px
      }}
    >
      {/* ─── DANH SÁCH CÁC CUỘC HỘI THOẠI (CỘT TRÁI) ─── */}
      <div>
        {/* Phần header tiêu đề hộp thư và nút làm mới */}
        <div
          style={{
            display: "flex", // Bố cục flex ngang
            justifyContent: "space-between", // Đẩy tiêu đề sang trái, nút bấm sang phải
            alignItems: "center", // Căn giữa theo chiều dọc
            marginBottom: 16, // Khoảng cách cách danh sách bên dưới 16px
          }}
        >
          {/* Tiêu đề chính */}
          <h2
            style={{
              fontSize: 16, // Cỡ chữ 16px
              fontWeight: 800, // Chữ in đậm
              color: C.dark, // Màu tối sẫm
              margin: 0, // Bỏ margin mặc định
              display: "flex", // Bố cục flex
              alignItems: "center", // Căn giữa dọc chữ và badge
              gap: 6, // Khoảng cách cách nhau 6px
            }}
          >
            Hộp thư tin nhắn
            {/* Hiển thị số lượng chưa đọc nếu tổng lớn hơn 0 */}
            {totalUnread > 0 && (
              <span
                style={{
                  background: C.coral, // Nền màu cam san hô
                  color: "#fff", // Chữ màu trắng
                  borderRadius: 20, // Bo tròn dạng hình viên thuốc
                  padding: "2px 10px", // Khoảng đệm trong
                  fontSize: 11, // Cỡ chữ 11px
                  fontWeight: 700, // Chữ in đậm
                  boxShadow: "0 2px 8px rgba(232, 100, 58, 0.45)", // Đổ bóng nhẹ màu đỏ cam rực rỡ
                }}
              >
                {totalUnread} chưa đọc
              </span>
            )}
          </h2>
          {/* Nút bấm làm mới thủ công danh sách cuộc trò chuyện */}
          <button
            onClick={() => {
              setLoading(true); // Đặt trạng thái đang tải về true trước khi gọi API
              loadConversations(); // Gọi hàm kéo dữ liệu mới từ Backend
            }}
            style={{
              background: C.white, // Nền màu trắng
              border: `1px solid ${C.border}`, // Đường viền xám mỏng
              borderRadius: 8, // Bo góc viền 8px
              padding: "6px 12px", // Đệm trong nút
              cursor: "pointer", // Con trỏ chuột pointer
              fontSize: 12, // Cỡ chữ 12px
              fontWeight: 700, // Nét chữ đậm
              color: C.muted, // Màu chữ mờ xám
              fontFamily: "inherit", // Kế thừa phông chữ
              boxShadow: "0 2px 4px rgba(0,0,0,0.01)", // Đổ bóng mờ siêu nhỏ
              transition: "all 0.2s", // Hiệu ứng đổi màu nền mượt mà
            }}
            // Hover: thay đổi màu nền sang xám nhẹ
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
            // Rời chuột: trả về nền trắng mặc định
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            🔄 Làm mới hộp thư
          </button>
        </div>

        {/* Kiểm tra trạng thái đang tải dữ liệu */}
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: C.muted,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Đang tải dữ liệu hội thoại...
          </div>
        ) : conversations.length === 0 ? (
          // Nếu không có cuộc hội thoại nào, hiển thị màn hình trống thân thiện
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: C.muted,
              fontSize: 14,
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              boxShadow: "0 4px 10px rgba(0,0,0,0.01)",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 10 }}>💬</div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: C.dark }}>
              Chưa có cuộc trò chuyện nào
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Khi có bất kỳ ai hỏi mua hoặc hỏi về sản phẩm của bạn, hộp chat sẽ
              xuất hiện tại đây.
            </div>
          </div>
        ) : (
          // Khung bao bọc danh sách các dòng hội thoại
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden", // Ẩn nội dung tràn góc bo tròn
              border: `1px solid ${C.border}`,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.02)",
              background: C.white,
            }}
          >
            {/* Duyệt qua từng cuộc trò chuyện và render hàng giao diện */}
            {conversations.map((conv, i) => {
              // Kiểm tra xem dòng hội thoại này có đang được chọn mở hay không
              const isActive =
                activeChat?.productId === conv.productId &&
                activeChat?.otherUserId === conv.otherUserId;

              return (
                <div
                  // Khóa duy nhất kết hợp giữa productId và otherUserId
                  key={`${conv.productId}-${conv.otherUserId}`}
                  // Click để chọn mở cuộc hội thoại chat này
                  onClick={() => openChat(conv)}
                  // Style cho mỗi dòng cuộc trò chuyện
                  style={{
                    display: "flex", // Bố cục flex
                    gap: 12, // Khoảng cách giữa các phần tử con là 12px
                    padding: "16px", // Đệm lề trong hàng 16px rộng rãi
                    cursor: "pointer", // Con trỏ chuột pointer khi hover
                    // Màu nền: nếu đang được chọn thì nền xanh ocean nhạt 5%, chưa đọc thì màu xanh 3%, ngược lại màu trắng
                    background: isActive
                      ? "rgba(11, 79, 108, 0.05)"
                      : conv.unread > 0
                        ? "rgba(11, 79, 108, 0.03)"
                        : C.white,
                    // Đường viền dưới đáy hàng: vẽ đường mờ ngăn cách, trừ dòng cuối cùng trong mảng
                    borderBottom:
                      i < conversations.length - 1
                        ? `1px solid #F1F5F9`
                        : "none",
                    transition: "all 0.2s ease", // Hiệu ứng chuyển tiếp mượt mà
                    // Chỉ thị viền trái: màu xanh ocean nếu đang chọn, màu cam san hô nếu chưa đọc, ngược lại trong suốt
                    borderLeft: isActive
                      ? `4px solid ${C.ocean}`
                      : conv.unread > 0
                        ? `4px solid ${C.coral}`
                        : "4px solid transparent",
                  }}
                  // Hover di chuột: đổi nền xám nếu không phải dòng đang active
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#F1F5F9";
                  }}
                  // Rời chuột: khôi phục màu nền tương ứng trạng thái
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isActive
                      ? "rgba(11, 79, 108, 0.05)"
                      : conv.unread > 0
                        ? "rgba(11, 79, 108, 0.03)"
                        : C.white;
                  }}
                >
                  {/* Avatar Tròn Gradient */}
                  <div
                    style={{
                      width: 44, // Chiều rộng
                      height: 44, // Chiều cao
                      borderRadius: "50%", // Bo tròn tuyệt đối
                      background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`, // Nền chuyển sắc xanh dương ocean
                      color: "#fff", // Chữ cái màu trắng
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800, // Chữ in đậm
                      fontSize: 15, // Cỡ chữ 15px
                      flexShrink: 0, // Không co bóp
                      boxShadow: "0 2px 6px rgba(11, 79, 108, 0.15)", // Đổ bóng nhẹ
                    }}
                  >
                    {conv.otherUserName.charAt(0).toUpperCase()}
                  </div>

                  {/* Phần hiển thị chi tiết tên, nội dung tin nhắn và tên sản phẩm */}
                  <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                    {/* Dòng 1: Tên đối tác trò chuyện và thời gian tin nhắn cuối cùng */}
                    <div
                      style={{
                        display: "flex", // Bố cục flex
                        justifyContent: "space-between", // Căn 2 đầu
                        alignItems: "center", // Căn giữa dọc
                        marginBottom: 4,
                      }}
                    >
                      {/* Tên đối tác và tích xanh nếu đã xác minh */}
                      <div
                        style={{
                          fontWeight: conv.unread > 0 ? 800 : 700, // In đậm hơn nếu chưa đọc
                          fontSize: 14, // Cỡ chữ 14px
                          color: C.dark, // Màu xám tối sẫm
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {conv.otherUserName}
                        {/* Tích xanh lá cây hiển thị nếu đối tác đã được Admin xác minh */}
                        {conv.otherUserIsVerified && (
                          <span title="Đã xác minh" style={{ fontSize: 12 }}>
                            ✅
                          </span>
                        )}
                      </div>
                      {/* Nhãn thời gian tin nhắn cuối cùng */}
                      <div
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          fontWeight: 500,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {formatTime(conv.lastSentAt)}
                      </div>
                    </div>

                    {/* Dòng 2: Nội dung đoạn tin nhắn cuối cùng được gửi */}
                    <div
                      style={{
                        fontSize: 13, // Cỡ chữ 13px
                        // Nếu chưa đọc thì chữ màu tối hơn, đã đọc thì màu xám mờ
                        color: conv.unread > 0 ? C.dark : C.muted,
                        // Nếu chưa đọc thì in đậm chữ
                        fontWeight: conv.unread > 0 ? 700 : 400,
                        whiteSpace: "nowrap", // Không cho xuống dòng
                        overflow: "hidden", // Ẩn văn bản thừa
                        textOverflow: "ellipsis", // Thêm dấu ba chấm
                        marginBottom: 6,
                      }}
                    >
                      {conv.lastMessage}
                    </div>

                    {/* Dòng 3: Thẻ tag sản phẩm liên quan và chấm đỏ báo số tin chưa đọc */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {/* Thẻ hiển thị tên hải sản mua bán */}
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 10,
                          fontWeight: 600,
                          background: "#E2E8F0", // Nền xám tro nhạt
                          color: "#475569", // Màu chữ xám xanh dịu
                          padding: "2px 8px", // Đệm trong nhỏ
                          borderRadius: 6, // Bo góc viền nhẹ 6px
                          maxWidth: "75%", // Chiều rộng chiếm tối đa 75%
                          overflow: "hidden", // Ẩn văn bản thừa
                          textOverflow: "ellipsis", // Thêm dấu ba chấm
                          whiteSpace: "nowrap", // Không xuống dòng
                        }}
                      >
                        📦 {conv.productName}
                      </span>

                      {/* Huy hiệu màu cam đỏ hiển thị số lượng tin nhắn chưa đọc của cuộc trò chuyện này */}
                      {conv.unread > 0 && (
                        <div
                          style={{
                            background: C.coral, // Nền màu cam san hô
                            color: "#fff", // Chữ màu trắng
                            borderRadius: 10, // Bo góc viên thuốc
                            padding: "1px 8px", // Đệm trong nhỏ
                            fontSize: 10, // Cỡ chữ 10px
                            fontWeight: 700, // Chữ in đậm
                            flexShrink: 0, // Không co rút
                            boxShadow: "0 2px 6px rgba(232, 100, 58, 0.3)", // Bóng đổ mờ nhẹ
                          }}
                        >
                          {conv.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── KHUNG CHAT INLINE KHI ĐÃ CHỌN HỘI THOẠI (CỘT PHẢI) ─── */}
      {activeChat && (
        <div style={{ position: "sticky", top: 80, alignSelf: "flex-start" }}>
          {/* Nhãn hiển thị tên đối tác đang chat */}
          <div
            style={{
              marginBottom: 10,
              fontSize: 13,
              color: C.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Đang chat với:{" "}
            <strong style={{ color: C.dark }}>
              {activeChat.otherUserName}
            </strong>
          </div>
          {/* Khởi tạo component ChatBox chi tiết cho sản phẩm và người dùng đã chọn */}
          <ChatBox
            key={`${activeChat.productId}-${activeChat.otherUserId}`} // Dùng key động để reset ChatBox và tải tin nhắn mới khi chuyển cuộc trò chuyện
            product={{
              id: activeChat.productId,
              name: activeChat.productName,
              sellerId: activeChat.otherUserId,
              sellerName: activeChat.otherUserName,
              productSellerId: activeChat.productSellerId,
              otherUserId: activeChat.otherUserId,
            }}
            user={user}
            onClose={() => setActiveChat(null)} // Click đóng khung chat
            fullHeight // Sử dụng kích thước chiều cao đầy đủ
          />
        </div>
      )}

      {/* Đoạn mã CSS hỗ trợ responsive co giãn cột trên các thiết bị di động */}
      <style>{`
        @media (max-width: 768px) {
          .inbox-tab-grid {
            grid-template-columns: 1fr !important; /* Màn hình nhỏ thì chuyển thành 1 cột */
          }
        }
      `}</style>
    </div>
  );
}

// Định nghĩa hàm formatTime tiện ích để định dạng thời gian tin nhắn cuối cùng tương đối
function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000); // Đổi ra số phút chênh lệch
  const diffH = Math.floor(diffMs / 3600000); // Đổi ra số giờ chênh lệch
  const diffD = Math.floor(diffMs / 86400000); // Đổi ra số ngày chênh lệch

  if (diffMin < 1) return "vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  if (diffH < 24) return `${diffH} giờ`;
  if (diffD < 7) return `${diffD} ngày`;
  // Nếu quá 7 ngày thì hiển thị dạng ngày tháng năm DD/MM
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
