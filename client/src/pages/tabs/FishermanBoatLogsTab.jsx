// Nhập hook useState từ thư viện React để quản lý các trạng thái nội bộ của component
import { useState } from "react";
// Nhập đối tượng chứa các cài đặt màu sắc thiết kế chung (theme)
import { C } from "../../utils/theme";
// Nhập hook useApiFetch để gọi API tự động và quản lý các trạng thái loading/error
import { useApiFetch } from "../../hooks/useApiFetch";
// Nhập module gọi API chung
import { api } from "../../services/api";
// Nhập hook useAuth để lấy thông tin tài khoản người dùng hiện tại
import { useAuth } from "../../context/AuthContext";
// Nhập hook useToast để hiển thị các thông báo nhanh lên màn hình
import { useToast } from "../../context/ToastContext";

// Component tab hiển thị danh sách nhật ký đi biển (Boat Logs) của ngư dân
export function FishermanBoatLogsTab({ sellerId }) {
  // Lấy thông tin người dùng hiện tại từ context xác thực
  const { user } = useAuth();
  // Lấy hàm thông báo từ context toast
  const toast = useToast();
  // Gọi API lấy tối đa 10 nhật ký đi biển mới nhất của ngư dân dựa theo sellerId
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/boat-logs?limit=10`,
    [sellerId],
  );
  // State lưu nhật ký đang được click mở xem chi tiết đầy đủ trong popup modal
  const [activeLog, setActiveLog] = useState(null);
  // State lưu trữ cục bộ trạng thái thả tim (liked) và số lượng tim của từng nhật ký để cập nhật UI ngay lập tức
  const [localLikes, setLocalLikes] = useState({});

  // Lấy danh sách nhật ký từ kết quả API trả về (hỗ trợ các cấu trúc dữ liệu khác nhau)
  const logs = data?.data ?? data?.boatLogs ?? [];

  // Hàm xử lý khi bấm thả tim/bỏ thích một nhật ký đi biển
  const handleLike = async (logId, e) => {
    // Ngăn chặn sự kiện nổi bọt (click lan ra thẻ bao ngoài gây mở modal xem chi tiết)
    e.stopPropagation();
    // Yêu cầu người dùng đăng nhập nếu chưa có phiên làm việc
    if (!user) {
      toast.warn("Vui lòng đăng nhập để thả tim");
      return;
    }
    try {
      // Gọi API POST gửi yêu cầu thích/bỏ thích nhật ký lên server
      const res = await api(`/boat-logs/${logId}/like`, { method: "POST" });
      // Cập nhật trạng thái và số lượng tim mới nhận được vào state localLikes
      setLocalLikes((prev) => ({
        ...prev,
        [logId]: { liked: res.liked, count: res.likeCount },
      }));
    } catch {
      /* Bỏ qua lỗi nếu có sự cố mạng xảy ra */
    }
  };

  // Hàm bổ trợ lấy thông tin lượt thích của một nhật ký (ưu tiên lấy từ state localLikes vừa tương tác, sau đó tới dữ liệu gốc)
  const getLikeInfo = (log) =>
    localLikes[log._id] ?? {
      // Kiểm tra xem ID người dùng hiện tại có nằm trong danh sách likes của nhật ký hay không
      liked: user ? (log.likes ?? []).includes(user.userId ?? user.id) : false,
      // Đếm số lượng người thích
      count: log.likes?.length ?? 0,
    };

  // Nếu dữ liệu đang tải, hiển thị 3 khung xương (skeleton loading) nhấp nháy giả lập danh sách
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer"
            style={{ height: 100, borderRadius: 12 }}
          />
        ))}
      </div>
    );
  }

  // Nếu danh sách nhật ký trống thì render màn hình báo trạng thái trống
  if (logs.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Biểu tượng chiếc thuyền buồm lớn */}
        <div style={{ fontSize: 48, marginBottom: 12 }}>⛵</div>
        {/* Dòng chữ thông báo */}
        <div style={{ fontWeight: 700, color: C.dark }}>
          Chưa có nhật ký cabin
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Khối chứa danh sách các thẻ nhật ký */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {logs.map((log) => {
          // Lấy thông tin lượt thích mới nhất của nhật ký hiện tại
          const likeInfo = getLikeInfo(log);
          return (
            <div
              key={log._id}
              // Click vào thẻ sẽ đặt activeLog để hiển thị popup xem đầy đủ nội dung
              onClick={() => setActiveLog(log)}
              style={{
                background: C.white,
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                padding: "16px 20px",
                cursor: "pointer",
                // Chuyển đổi mượt mà hiệu ứng bóng đổ khi hover chuột
                transition: "box-shadow 0.2s",
              }}
              // Hover chuột: hiện bóng đổ mờ xung quanh card tạo hiệu ứng nổi
              onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(0,0,0,0.07)")
              }
              // Rời chuột: xóa hiệu ứng bóng đổ
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Dòng thời gian viết nhật ký */}
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                ⛵ {new Date(log.createdAt).toLocaleString("vi-VN")}
              </div>
              {/* Đoạn văn ngắn trích dẫn nội dung nhật ký (giới hạn tối đa hiển thị 3 dòng, ẩn phần thừa bằng dấu ba chấm) */}
              <p
                style={{
                  fontSize: 13.5,
                  color: C.dark,
                  lineHeight: 1.6,
                  margin: "0 0 10px",
                  display: "-webkit-box",
                  WebkitLineClamp: 3, // Giới hạn 3 dòng
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {log.content}
              </p>
              {/* Danh sách ảnh đính kèm (nếu có), hiển thị tối đa 4 hình ảnh nhỏ xem trước */}
              {log.images?.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {log.images.slice(0, 4).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover", // Giữ ảnh cân đối trong khung vuông
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </div>
              )}
              {/* Nút bấm thả tim thích nhật ký */}
              <button
                onClick={(e) => handleLike(log._id, e)}
                style={{
                  // Thay đổi màu nền, màu viền và màu chữ dựa theo trạng thái liked
                  background: likeInfo.liked ? "#FFF1F2" : "none",
                  border: `1px solid ${likeInfo.liked ? "#FECACA" : C.border}`,
                  color: likeInfo.liked ? "#EF4444" : C.muted,
                  borderRadius: 8,
                  padding: "4px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "inherit",
                }}
              >
                {/* Đổi trái tim rỗng sang trái tim đỏ đặc khi thích */}
                {likeInfo.liked ? "❤️" : "🤍"} {likeInfo.count}
              </button>
            </div>
          );
        })}
      </div>

      {/* Popup modal hiển thị chi tiết đầy đủ nội dung nhật ký đi biển */}
      {activeLog && (
        <div
          style={{
            // Đặt fixed phủ toàn màn hình
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)", // Nền tối mờ 60%
            zIndex: 9999, // Nổi lên trên cùng
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          // Click vào vùng nền tối bên ngoài sẽ tự đóng popup modal
          onClick={() => setActiveLog(null)}
        >
          <div
            // Ngăn chặn đóng popup khi click vào phần thân hộp thoại nội dung
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.white,
              borderRadius: 20,
              padding: 28,
              maxWidth: 500, // Chiều rộng tối đa 500px
              width: "100%",
              maxHeight: "90vh", // Chiều cao tối đa bằng 90% chiều cao màn hình hiển thị
              overflowY: "auto", // Cho phép cuộn dọc nội dung nếu quá dài
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)", // Bóng đổ mờ rộng
              position: "relative",
            }}
          >
            {/* Nút đóng hình chữ X ở góc trên bên phải popup */}
            <button
              onClick={() => setActiveLog(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: C.muted,
              }}
            >
              ×
            </button>
            {/* Thời gian viết nhật ký */}
            <div
              style={{
                fontSize: 11,
                color: C.muted,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              ⛵ {new Date(activeLog.createdAt).toLocaleString("vi-VN")}
            </div>
            {/* Nội dung đầy đủ của nhật ký, hỗ trợ xuống dòng thô */}
            <p
              style={{
                fontSize: 14,
                color: C.dark,
                lineHeight: 1.7,
                whiteSpace: "pre-line", // Giữ nguyên các ký tự xuống dòng từ editor nhập
                marginBottom: 16,
              }}
            >
              {activeLog.content}
            </p>
            {/* Hiển thị toàn bộ các hình ảnh đính kèm kích thước lớn hơn */}
            {activeLog.images?.length > 0 && (
              <div
                style={{
                  display: "grid",
                  // Chia làm 1 cột nếu chỉ có 1 ảnh, chia 2 cột nếu từ 2 ảnh trở lên
                  gridTemplateColumns:
                    activeLog.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                  gap: 8,
                  borderRadius: 12,
                  overflow: "hidden", // Bo góc các hình ảnh bên trong
                }}
              >
                {activeLog.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      // Ảnh đơn giữ nguyên chiều cao tự động, nhiều ảnh cố định chiều cao 160px để cân đối
                      height: activeLog.images.length === 1 ? "auto" : 160,
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
