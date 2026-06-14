// Import các hook React cần thiết để quản lý state, effect, tham chiếu ref và tối ưu callback
import { useState, useEffect, useRef, useCallback } from "react";
// Import bảng màu theme C từ thư mục tiện ích utils/theme
import { C } from "../utils/theme";

// Định nghĩa và export component NotificationBell để hiển thị biểu tượng quả chuông thông báo và danh sách thông báo thả xuống
export function NotificationBell({
  notifs, // Danh sách các thông báo nhận vào từ component cha
  unreadCount, // Số lượng thông báo chưa đọc
  onMarkAllRead, // Hàm callback đánh dấu đã đọc tất cả thông báo
  onNotifClick, // Hàm callback khi click vào từng thông báo cụ thể
}) {
  // Khởi tạo state open kiểm soát trạng thái ẩn/hiện hộp dropdown thông báo
  const [open, setOpen] = useState(false);
  // Khởi tạo ref bellRef để kiểm tra sự kiện click ngoài vùng quả chuông nhằm tự động đóng dropdown
  const bellRef = useRef(null);

  // Khai báo hàm handleToggle dùng useCallback để đổi trạng thái ẩn/hiện của dropdown, tránh re-create hàm vô ích
  const handleToggle = useCallback(() => {
    // Đảo ngược trạng thái open cũ
    setOpen((prev) => !prev);
  }, []);

  // Effect lắng nghe sự kiện click chuột bên ngoài và nhấn phím Escape để tự động đóng dropdown thông báo
  useEffect(() => {
    // Nếu dropdown đang đóng thì không làm gì cả
    if (!open) return;

    // Hàm kiểm tra xem vị trí click có nằm ngoài vùng quả chuông và dropdown hay không
    function handleClickOutside(event) {
      // Nếu có ref và phần tử click không nằm trong bellRef thì đóng dropdown
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    // Hàm kiểm tra phím bấm: nếu nhấn phím Escape thì đóng dropdown
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    // Đăng ký các sự kiện mousedown và keydown vào document
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    // Cleanup function gỡ bỏ các sự kiện khi component unmount hoặc khi dropdown đóng để tránh rò rỉ bộ nhớ
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]); // Chạy lại effect mỗi khi trạng thái open thay đổi

  return (
    // Thẻ div bao ngoài cùng gắn ref để kiểm tra click outside
    <div ref={bellRef} style={{ position: "relative" }}>
      {/* Nút quả chuông thông báo */}
      <button
        // Gắn sự kiện click để bật tắt dropdown
        onClick={handleToggle}
        // Thiết lập các thuộc tính style CSS inline cho nút bấm hình tròn, nền mờ
        style={{
          background: "rgba(255,255,255,0.15)", // Nền trắng mờ trong suốt 15%
          color: "#fff", // Màu icon chuông trắng
          border: "none", // Không viền
          borderRadius: "50%", // Bo tròn tuyệt đối
          width: 36, // Chiều rộng 36px
          height: 36, // Chiều cao 36px
          cursor: "pointer", // Đổi con trỏ pointer khi hover
          fontSize: 18, // Cỡ chữ quả chuông
          display: "flex", // Bố cục flex
          alignItems: "center", // Căn giữa dọc
          justifyContent: "center", // Căn giữa ngang
          transition: "all 0.2s ease", // Hoạt ảnh chuyển đổi mượt mà 0.2s
        }}
        // Khi di chuột qua nút bấm: tăng độ đục của nền trắng lên 25%
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
        }
        // Khi chuột rời đi: trả lại nền mờ mặc định 15%
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
        }
        // Thuộc tính accessibility cho biết số lượng tin nhắn chưa đọc
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}`}
        // Thuộc tính accessibility thể hiện trạng thái đóng/mở của dropdown
        aria-expanded={open}
        // Khai báo phần tử này kiểm soát một popup
        aria-haspopup="true"
      >
        🔔
      </button>

      {/* Nếu có thông báo chưa đọc, hiển thị huy hiệu chấm đỏ hiển thị số lượng */}
      {unreadCount > 0 && <Badge count={unreadCount} />}

      {/* Nếu dropdown đang mở, hiển thị component NotifDropdown */}
      {open && (
        <NotifDropdown
          notifs={notifs} // Truyền danh sách thông báo
          unreadCount={unreadCount} // Truyền số lượng chưa đọc
          onMarkAllRead={onMarkAllRead} // Truyền hàm đánh dấu đã đọc tất cả
          // Xử lý sự kiện khi click vào từng thông báo: đóng dropdown và gọi callback onNotifClick
          onNotifClick={(n) => {
            setOpen(false); // Đóng dropdown
            onNotifClick?.(n); // Gọi callback xử lý sự kiện xem chi tiết thông báo
          }}
        />
      )}
    </div>
  );
}

// Định nghĩa component Badge hiển thị số lượng tin nhắn chưa đọc màu đỏ
function Badge({ count }) {
  return (
    <div
      // Ẩn phần tử này khỏi bộ đọc màn hình vì thông tin đã có trên button aria-label
      aria-hidden="true"
      // Style cho chấm đỏ định vị tuyệt đối ở góc trên bên phải quả chuông
      style={{
        position: "absolute", // Định vị tuyệt đối
        top: -4, // Cách mép trên -4px
        right: -4, // Cách mép phải -4px
        background: "#EF4444", // Nền màu đỏ nổi bật
        color: "#fff", // Màu chữ trắng
        borderRadius: "50%", // Bo tròn tuyệt đối
        width: 20, // Chiều rộng 20px
        height: 20, // Chiều cao 20px
        display: "flex", // Bố cục flex
        alignItems: "center", // Căn giữa dọc
        justifyContent: "center", // Căn giữa ngang
        fontSize: 11, // Cỡ chữ nhỏ 11px
        fontWeight: 700, // Chữ in đậm
        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.45)", // Đổ bóng mờ màu đỏ rực rỡ
        pointerEvents: "none", // Ngăn chặn tương tác chuột tránh ảnh hưởng tới click quả chuông
      }}
    >
      {/* Nếu số lượng lớn hơn 99 thì hiển thị "99+", ngược lại hiển thị số lượng cụ thể */}
      {count > 99 ? "99+" : count}
    </div>
  );
}

// Định nghĩa component NotifDropdown hiển thị khung danh sách thông báo chi tiết thả xuống
function NotifDropdown({ notifs, unreadCount, onNotifClick, onMarkAllRead }) {
  return (
    <div
      // Gắn thuộc tính accessibility khai báo đây là một hộp thoại dialog
      role="dialog"
      aria-label="Thông báo"
      // Style inline cho khung dropdown thả xuống
      style={{
        position: "absolute", // Định vị tuyệt đối so với chuông
        top: 46, // Đẩy xuống dưới 46px
        right: 0, // Căn sát mép phải
        width: 330, // Chiều rộng cố định 330px
        background: "#fff", // Nền trắng sáng
        borderRadius: 16, // Bo tròn góc viền 16px
        boxShadow:
          "0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)", // Bóng đổ đa lớp sang trọng
        overflow: "hidden", // Ẩn nội dung tràn ngoài viền bo tròn
        border: `1px solid ${C.border}`, // Viền ngoài màu nhẹ mặc định
        zIndex: 1000, // Z-index lớn để nổi lên trên cùng
      }}
    >
      {/* Tiêu đề phần đầu dropdown */}
      <div
        style={{
          padding: "14px 18px", // Khoảng đệm lề header
          // Nền gradient xanh dương ocean tuyệt đẹp
          background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
          color: "#fff", // Chữ màu trắng
          fontWeight: 700, // Chữ in đậm
          fontSize: 14, // Cỡ chữ 14px
          display: "flex", // Bố cục flex ngang
          justifyContent: "space-between", // Đẩy tiêu đề sang trái, cụm đếm/nút sang phải
          alignItems: "center", // Căn giữa dọc
        }}
      >
        <span>Thông báo của bạn</span>

        {/* Khối các nút hành động bổ sung bên góc phải tiêu đề */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Chỉ hiển thị nút 'Đọc tất cả' nếu có ít nhất 1 thông báo chưa đọc */}
          {unreadCount > 0 && (
            <button
              // Xử lý click đánh dấu đọc toàn bộ thông báo
              onClick={(e) => {
                // Ngăn chặn sự kiện nổi bọt để tránh kích hoạt các sự kiện click outside làm đóng dropdown
                e.stopPropagation();
                // Gọi callback đánh dấu đã đọc tất cả
                onMarkAllRead?.();
              }}
              // Style inline cho nút 'Đọc tất cả' nhỏ gọn
              style={{
                background: "rgba(255, 255, 255, 0.18)", // Nền trắng trong suốt 18%
                border: "none", // Không viền
                borderRadius: 6, // Bo góc viền nhẹ 6px
                color: "#fff", // Chữ màu trắng
                fontSize: 11, // Cỡ chữ nhỏ 11px
                fontWeight: 700, // Chữ in đậm
                padding: "3px 8px", // Đệm lề nhỏ
                cursor: "pointer", // Con trỏ chuột pointer
                fontFamily: "inherit",
                transition: "background 0.2s", // Hiệu ứng hover mượt mà
              }}
              // Hover: tăng độ sáng nền lên 28%
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.28)")
              }
              // Rời chuột: khôi phục nền mờ mặc định 18%
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)")
              }
            >
              ✓ Đọc tất cả
            </button>
          )}

          {/* Hiển thị huy hiệu số lượng thông báo mới chưa đọc bên cạnh tiêu đề */}
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 10, // Cỡ chữ siêu nhỏ
                background: "rgba(255,255,255,0.2)", // Nền trắng mờ
                backdropFilter: "blur(4px)", // Hiệu ứng kính mờ (blur)
                WebkitBackdropFilter: "blur(4px)", // Hỗ trợ trình duyệt Safari
                padding: "3px 10px", // Đệm trong nhỏ
                borderRadius: 20, // Bo tròn hình viên thuốc
                fontWeight: 700,
              }}
            >
              {unreadCount} mới
            </span>
          )}
        </div>
      </div>

      {/* Vùng danh sách các dòng thông báo hỗ trợ scroll dọc */}
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {/* Nếu không có thông báo nào, hiển thị màn hình trống thân thiện */}
        {notifs.length === 0 ? (
          <div
            style={{
              padding: "40px 20px", // Đệm trong rộng rãi
              textAlign: "center", // Căn chữ giữa
              color: C.muted, // Màu xám mờ
              fontSize: 13, // Cỡ chữ 13px
            }}
          >
            {/* Biểu tượng chuông lớn */}
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            {/* Nhãn thông báo chính */}
            <div style={{ fontWeight: 600, color: C.dark }}>
              Không có thông báo nào
            </div>
            {/* Nhãn phụ mô tả */}
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Chúng tôi sẽ báo cho bạn khi có tin mới.
            </div>
          </div>
        ) : (
          // Duyệt qua danh sách và hiển thị các component dòng thông báo NotifItem
          notifs.map((n, i) => (
            <NotifItem
              key={n.id || i} // Khóa React duy nhất
              notif={n} // Đối tượng thông báo
              onClick={() => onNotifClick(n)} // Sự kiện khi click vào thông báo
            />
          ))
        )}
      </div>
    </div>
  );
}

// Định nghĩa component NotifItem hiển thị chi tiết một dòng thông báo cụ thể
function NotifItem({ notif: n, onClick }) {
  return (
    <div
      // Sự kiện click để đọc hoặc chuyển tiếp thông báo
      onClick={onClick}
      role="button" // Thuộc tính accessibility khai báo vai trò là một nút bấm
      tabIndex={0} // Cho phép focus bằng phím Tab để điều hướng bàn phím
      // Lắng nghe sự kiện bàn phím: nếu nhấn Enter thì cũng kích hoạt click để hỗ trợ người dùng dùng bàn phím
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      // Thiết lập style CSS inline cho dòng thông báo
      style={{
        padding: "14px 18px", // Đệm lề dòng thông báo rộng rãi dễ đọc
        borderBottom: `1px solid ${C.border}`, // Đường kẻ chia cách dưới đáy dòng
        fontSize: 13, // Cỡ chữ 13px
        color: C.dark, // Màu tối sẫm
        // Nét gạch đứng chỉ thị màu ở lề trái: nếu chưa đọc thì màu ocean xanh dương đậm, đã đọc thì trong suốt
        borderLeft: n.isRead ? "4px solid transparent" : `4px solid ${C.ocean}`,
        // Nền: nếu chưa đọc thì nền màu xanh ocean nhạt 4%, đã đọc thì nền trắng tinh
        background: n.isRead ? "#fff" : "rgba(11, 79, 108, 0.04)",
        display: "flex", // Bố cục flex
        gap: 12, // Khoảng cách giữa các phần tử là 12px
        alignItems: "flex-start", // Căn thẳng hàng theo mép trên cùng
        // Con trỏ chuột pointer nếu thông báo gắn liền với một sản phẩm cần xem chi tiết, ngược lại để mặc định
        cursor: n.productId ? "pointer" : "default",
        transition: "all 0.2s ease", // Hiệu ứng chuyển tiếp hover mượt mà 0.2s
      }}
      // Hover: đổi màu nền dòng thông báo sang xám nhạt dịu mắt
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
      // Rời chuột: khôi phục màu nền tương ứng trạng thái đã đọc hay chưa
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = n.isRead
          ? "#fff"
          : "rgba(11, 79, 108, 0.04)")
      }
    >
      {/* Vòng tròn nhỏ chứa biểu tượng phân loại thông báo */}
      <div
        style={{
          width: 34, // Chiều rộng 34px
          height: 34, // Chiều cao 34px
          borderRadius: "50%", // Bo tròn tuyệt đối
          // Nền: nếu là review mới thì nền vàng nhạt, còn lại là nền xanh nước biển nhạt
          background: n.type === "new_review" ? "#FEF3C7" : "#E6F4F9",
          display: "flex", // Bố cục flex
          alignItems: "center", // Căn giữa biểu tượng dọc
          justifyContent: "center", // Căn giữa biểu tượng ngang
          fontSize: 14, // Cỡ chữ emoji
          flexShrink: 0, // Không co bóp kích thước
          marginTop: 1, // Dịch chuyển nhẹ xuống dưới 1px để cân đối dòng văn bản
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)", // Đổ bóng mờ cực nhẹ
        }}
      >
        {/* Hiển thị hình sao ⭐ nếu là thông báo đánh giá mới, ngược lại hiển thị loa phát thanh 📢 */}
        {n.type === "new_review" ? "⭐" : "📢"}
      </div>

      {/* Khối chứa nội dung văn bản thông báo */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {/* Nội dung dòng xem trước thông báo */}
        <div
          style={{
            lineHeight: 1.45, // Chiều cao dòng vừa vặn dễ đọc văn bản dài
            fontWeight: n.isRead ? 400 : 700, // Đặt in đậm nếu chưa đọc thông báo, đã đọc thì nét thường
            color: n.isRead ? C.text : C.dark, // Đổi màu sắc đậm nhạt tương ứng trạng thái đọc
          }}
        >
          {n.preview || n.content}
        </div>
        {/* Thời gian thông báo được tạo */}
        {n.createdAt && (
          <div
            style={{
              fontSize: 11, // Cỡ chữ siêu nhỏ
              color: C.muted, // Màu chữ mờ xám
              marginTop: 6, // Khoảng cách nhỏ với đoạn văn phía trên
              display: "flex", // Flex ngang hiển thị thời gian
              alignItems: "center", // Căn giữa dọc
              gap: 4, // Khoảng cách giữa các ký tự
            }}
          >
            <span>🕒</span>
            <span>
              {/* Định dạng giờ giấc phút giây */}
              {new Date(n.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" - "}
              {/* Định dạng ngày tháng năm */}
              {new Date(n.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Chấm tròn nhỏ hiển thị ở lề phải nếu thông báo chưa được đọc */}
      {!n.isRead && (
        <span
          aria-hidden="true" // Ẩn khỏi bộ đọc màn hình
          style={{
            width: 8, // Chiều rộng 8px
            height: 8, // Chiều cao 8px
            borderRadius: "50%", // Bo tròn tuyệt đối
            background: C.ocean, // Đặt màu trùng màu chủ đạo xanh ocean
            flexShrink: 0, // Không co rút
            marginTop: 6, // Căn chỉnh lề trên
            boxShadow: "0 0 0 2px rgba(11, 79, 108, 0.2)", // Vành bóng mờ nhẹ xung quanh chấm tròn
          }}
        />
      )}
    </div>
  );
}
