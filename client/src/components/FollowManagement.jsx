// Nhập các hook useState, useEffect, và useCallback từ React để quản lý state và tối ưu hóa hàm
import { useState, useEffect, useCallback } from "react";
// Nhập module gọi API chung được định nghĩa sẵn
import { api } from "../services/api";
// Nhập đối tượng chứa mã màu và cấu hình thiết kế (theme) của ứng dụng
import { C } from "../utils/theme";
// Nhập hook hiển thị thông báo toast từ ToastContext
import { useToast } from "../context/ToastContext";
// Nhập hook tùy biến điều hướng trang có hiệu ứng chuyển cảnh View Transition
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

// Định nghĩa component FollowManagement nhận vào prop 'user' đại diện cho người dùng hiện tại
export function FollowManagement({ user }) {
  // Lấy hàm hiển thị thông báo từ ToastContext
  const toast = useToast();
  // Khởi tạo hàm điều hướng trang sử dụng View Transition
  const vtNavigate = useViewTransitionNavigate();

  // State lưu tab hiện tại đang hoạt động, mặc định là "following" (đang theo dõi) hoặc "followers" (người theo dõi)
  const [activeTab, setActiveTab] = useState("following"); 
  // State lưu danh sách những người dùng mà tài khoản hiện tại đang theo dõi
  const [following, setFollowing] = useState([]);
  // State lưu danh sách những người dùng đang theo dõi tài khoản hiện tại
  const [followers, setFollowers] = useState([]);
  // State quản lý trạng thái tải (loading) của danh sách đang theo dõi, mặc định là true (đang tải)
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  // State quản lý trạng thái tải (loading) của danh sách người theo dõi, mặc định là true (đang tải)
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  // State lưu ID của người dùng đang được chuẩn bị để xác nhận bỏ theo dõi (unfollow)
  const [unfollowingId, setUnfollowingId] = useState(null); 
  // State quản lý trạng thái đang gửi yêu cầu lên server (submitting) để tránh bấm nhiều lần
  const [submitting, setSubmitting] = useState(false);
  // State lưu từ khóa tìm kiếm dùng để lọc danh sách hiển thị
  const [search, setSearch] = useState("");

  // Định nghĩa hàm fetch danh sách những người dùng đang theo dõi (following) dùng useCallback để tránh tạo lại hàm không cần thiết
  const fetchFollowing = useCallback(() => {
    // Gọi API lấy danh sách đang theo dõi của người dùng hiện tại
    api("/follows/following")
      .then((res) => {
        // Kiểm tra nếu kết quả trả về là một mảng thì gán trực tiếp, ngược lại lấy từ thuộc tính data, nếu không có nữa thì gán mảng rỗng
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        // Cập nhật state danh sách đang theo dõi
        setFollowing(list);
      })
      // Nếu có lỗi xảy ra thì reset danh sách đang theo dõi về mảng rỗng
      .catch(() => setFollowing([]))
      // Sau khi hoàn thành (dù thành công hay lỗi), tắt trạng thái đang tải
      .finally(() => setLoadingFollowing(false));
  }, []); // Dependency array rỗng vì hàm không phụ thuộc vào biến state nào khác ngoài api

  // Định nghĩa hàm fetch danh sách những người đang theo dõi mình (followers) dùng useCallback để tránh tạo lại hàm
  const fetchFollowers = useCallback(() => {
    // Gọi API lấy danh sách người theo dõi
    api("/follows/followers")
      .then((res) => {
        // Kiểm tra nếu kết quả trả về là một mảng thì gán trực tiếp, ngược lại lấy từ thuộc tính data, nếu không có nữa thì gán mảng rỗng
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        // Cập nhật state danh sách người theo dõi
        setFollowers(list);
      })
      // Nếu có lỗi xảy ra thì reset danh sách người theo dõi về mảng rỗng
      .catch(() => setFollowers([]))
      // Tắt trạng thái đang tải khi hoàn thành
      .finally(() => setLoadingFollowers(false));
  }, []); // Dependency array rỗng

  // useEffect để tự động gọi API lấy dữ liệu khi component được mount hoặc khi user, fetchFollowing, hoặc fetchFollowers thay đổi
  useEffect(() => {
    // Nếu chưa có thông tin người dùng (chưa đăng nhập hoặc đang tải user) thì không làm gì cả
    if (!user) return;
    // Gọi hàm fetch danh sách đang theo dõi
    fetchFollowing();
    // Gọi hàm fetch danh sách người theo dõi
    fetchFollowers();
  }, [user, fetchFollowing, fetchFollowers]); // Chạy lại khi một trong các dependencies thay đổi

  // Hàm xử lý việc bỏ theo dõi một người dùng
  const handleUnfollow = () => {
    // Nếu không có ID người dùng cần bỏ theo dõi thì thoát ra
    if (!unfollowingId) return;
    // Đặt trạng thái submitting là true để vô hiệu hóa nút bấm và hiển thị trạng thái đang xử lý
    setSubmitting(true);
    // Gọi API DELETE để xóa quan hệ theo dõi
    api(`/follows/${unfollowingId}`, { method: "DELETE" })
      .then(() => {
        // Hiển thị thông báo thành công khi bỏ theo dõi
        toast.success("Đã bỏ theo dõi.");
        // Reset state ID đang bỏ theo dõi về null để đóng popup confirm
        setUnfollowingId(null);

        // Bật lại trạng thái loading của danh sách đang theo dõi
        setLoadingFollowing(true);
        // Tải lại danh sách đang theo dõi mới nhất từ server
        fetchFollowing();
      })
      // Hiển thị thông báo lỗi nếu có lỗi xảy ra trong quá trình bỏ theo dõi
      .catch((err) => toast.error(err.message))
      // Đặt lại trạng thái submitting thành false sau khi hoàn thành yêu cầu
      .finally(() => setSubmitting(false));
  };

  // Hàm lọc danh sách người dùng dựa theo từ khóa tìm kiếm (search)
  const filtered = (list) => {
    // Nếu từ khóa tìm kiếm trống (chỉ chứa khoảng trắng hoặc không có gì) thì trả về nguyên danh sách ban đầu
    if (!search.trim()) return list;
    // Chuyển từ khóa tìm kiếm về dạng chữ thường để so sánh không phân biệt hoa thường
    const q = search.toLowerCase();
    // Lọc danh sách: chỉ giữ lại những người có tên (Name), tên đầy đủ (FullName) hoặc địa điểm (Location) khớp với từ khóa tìm kiếm
    return list.filter(
      (u) =>
        u.Name?.toLowerCase().includes(q) ||
        u.FullName?.toLowerCase().includes(q) ||
        u.Location?.toLowerCase().includes(q),
    );
  };

  // Xác định xem có đang tải dữ liệu không tùy thuộc vào tab nào đang hiển thị
  const isLoading =
    activeTab === "following" ? loadingFollowing : loadingFollowers;
  // Lấy danh sách người dùng đã được lọc theo từ khóa tìm kiếm tương ứng với tab đang chọn
  const list = filtered(activeTab === "following" ? following : followers);
  // Lấy tổng số lượng người dùng trong danh sách gốc (chưa qua bộ lọc tìm kiếm) tương ứng với tab đang chọn
  const total = activeTab === "following" ? following.length : followers.length;

  // Giao diện chính của component FollowManagement
  return (
    <div
      style={{
        // Sử dụng màu nền trắng từ file theme
        background: C.white,
        // Bo góc khung bao ngoài
        borderRadius: 12,
        // Định dạng viền của khung bao ngoài
        border: `1px solid ${C.border}`,
        // Đảm bảo các thành phần bên trong không tràn ra ngoài góc bo tròn
        overflow: "hidden",
      }}
    >
      {/* ─── Khối Tabs chuyển đổi danh sách ─── */}
      <div
        style={{
          // Hiển thị dạng flex để các tab nằm ngang
          display: "flex",
          // Viền dưới của thanh tab
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {/* Duyệt qua mảng định nghĩa 2 tab "following" và "followers" để kết xuất các nút bấm */}
        {[
          {
            k: "following",
            label: "Đang theo dõi",
            emoji: "📌",
            count: following.length,
          },
          {
            k: "followers",
            label: "Người theo dõi",
            emoji: "👥",
            count: followers.length,
          },
        ].map(({ k, label, emoji, count }) => (
          <button
            // Sử dụng thuộc tính key duy nhất cho mỗi tab
            key={k}
            // Khi click vào tab thì cập nhật activeTab và reset từ khóa tìm kiếm về rỗng
            onClick={() => {
              setActiveTab(k);
              setSearch("");
            }}
            style={{
              // Chia đều chiều rộng cho các tab
              flex: 1,
              // Định khoảng cách đệm trên dưới và hai bên trong nút
              padding: "14px 8px",
              // Bỏ viền mặc định của nút
              border: "none",
              // Bỏ màu nền mặc định của nút
              background: "none",
              // Hiển thị con trỏ chuột dạng bàn tay khi hover
              cursor: "pointer",
              // Định kích thước font chữ
              fontSize: 14,
              // Đặt độ đậm chữ dựa trên trạng thái tab đang hoạt động
              fontWeight: activeTab === k ? 700 : 500,
              // Đặt màu sắc chữ dựa trên trạng thái hoạt động (màu đại dương hoặc màu chữ mờ)
              color: activeTab === k ? C.ocean : C.muted,
              // Tạo hiệu ứng gạch chân nếu tab đang được chọn
              borderBottom:
                activeTab === k
                  ? `2px solid ${C.ocean}`
                  : "2px solid transparent",
              // Thiết lập hiệu ứng chuyển đổi mượt mà
              transition: "all 0.2s",
              // Sử dụng flexbox để căn chỉnh icon và chữ nằm giữa
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Khoảng cách giữa emoji và nhãn văn bản
              gap: 6,
            }}
          >
            {/* Nhãn hiển thị của tab kèm emoji */}
            <span>
              {emoji} {label}
            </span>
            {/* Nhãn phụ hiển thị số lượng phần tử trong danh sách */}
            <span
              style={{
                // Nền màu xanh đại dương nếu được chọn, ngược lại dùng màu xám nhạt
                background: activeTab === k ? C.ocean : "#E5E7EB",
                // Chữ màu trắng nếu được chọn, ngược lại dùng màu chữ mờ
                color: activeTab === k ? "#fff" : C.muted,
                // Bo tròn hoàn toàn tạo hình tròn/oval cho nhãn số lượng
                borderRadius: 99,
                // Kích thước chữ nhỏ cho nhãn số
                fontSize: 11,
                // Đặt độ đậm cho chữ số
                fontWeight: 700,
                // Khoảng cách đệm xung quanh số
                padding: "1px 7px",
                // Chiều rộng tối thiểu để nhãn không bị méo khi số tăng lên
                minWidth: 22,
                // Căn giữa văn bản số
                textAlign: "center",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Khối Tìm kiếm ─── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ position: "relative" }}>
          {/* Biểu tượng kính lúp tìm kiếm đặt tuyệt đối bên trong ô nhập liệu */}
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              // Căn giữa biểu tượng theo chiều dọc
              transform: "translateY(-50%)",
              fontSize: 14,
              color: C.muted,
              // Cho phép click xuyên qua biểu tượng vào ô input phía dưới
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          {/* Ô nhập từ khóa tìm kiếm */}
          <input
            type="text"
            // Liên kết giá trị ô nhập với state search
            value={search}
            // Cập nhật state search khi người dùng gõ phím
            onChange={(e) => setSearch(e.target.value)}
            // Hiển thị gợi ý tùy thuộc vào tab đang chọn
            placeholder={
              activeTab === "following"
                ? "Tìm ngư dân bạn theo dõi..."
                : "Tìm người theo dõi bạn..."
            }
            style={{
              width: "100%",
              // Padding bên trái rộng hơn để tránh bị chèn lên biểu tượng kính lúp
              padding: "8px 10px 8px 32px",
              // Bo góc nhẹ cho ô nhập liệu
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              fontSize: 13,
              // Đảm bảo border và padding nằm trong tổng kích thước width 100%
              boxSizing: "border-box",
              // Bỏ viền xanh mặc định của trình duyệt khi focus
              outline: "none",
              // Màu nền xám nhẹ của ô nhập liệu
              background: "#F9FAFB",
            }}
          />
          {/* Nút xóa từ khóa tìm kiếm nhanh (chỉ hiển thị khi có nội dung trong ô search) */}
          {search && (
            <button
              // Khi click sẽ reset giá trị search về rỗng
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                // Căn giữa nút xóa theo chiều dọc
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: C.muted,
                padding: 2,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Danh sách người dùng ─── */}
      <div style={{ padding: 16 }}>
        {/* Nếu đang trong trạng thái loading thì render Component khung xương giả (Skeleton) */}
        {isLoading ? (
          <SkeletonList />
        ) : /* Nếu danh sách trống thì hiển thị trạng thái trống (EmptyState) */
        list.length === 0 ? (
          <EmptyState
            activeTab={activeTab}
            hasSearch={!!search}
            onClearSearch={() => setSearch("")}
          />
        ) : (
          /* Nếu có dữ liệu thì duyệt qua mảng và hiển thị các thẻ thông tin (PersonCard) */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((person) => (
              <PersonCard
                // Sử dụng ID làm key cho mỗi phần tử, hỗ trợ tốt cho việc quản lý của React Virtual DOM
                key={person.UserID ?? person.userId}
                person={person}
                // Xác định card này có thuộc tab đang theo dõi hay không
                isFollowing={activeTab === "following"}
                // Sự kiện khi bấm bỏ theo dõi: gán ID người này vào state unfollowingId để kích hoạt dialog confirm
                onUnfollow={() =>
                  setUnfollowingId(person.UserID ?? person.userId)
                }
                // Sự kiện khi bấm điều hướng đến trang cá nhân của ngư dân/người dùng đó
                onNavigate={() =>
                  vtNavigate(`/nguoi-ban/${person.UserID ?? person.userId}`)
                }
                // Truyền đối tượng cấu hình màu sắc CSS theme
                C={C}
              />
            ))}
            {/* Hiển thị số lượng kết quả lọc được trên tổng số lượng nếu đang có từ khóa tìm kiếm */}
            {search && list.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 4,
                }}
              >
                {list.length} / {total} kết quả
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Dialog xác nhận hủy theo dõi (Unfollow confirm) ─── */}
      {unfollowingId && (
        <div
          style={{
            // Đặt vị trí fixed phủ toàn màn hình
            position: "fixed",
            inset: 0,
            // Nền tối mờ 50%
            background: "rgba(0,0,0,0.5)",
            // Căn giữa hộp thoại xác nhận ra giữa màn hình
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Đảm bảo dialog nổi lên trên mọi thành phần khác
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 340,
              textAlign: "center",
            }}
          >
            {/* Icon biểu cảm cái chuông hoặc thông báo */}
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            {/* Tiêu đề hộp thoại */}
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Bỏ theo dõi?</h3>
            {/* Nội dung nhắc nhở người dùng về hậu quả bỏ theo dõi */}
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              Bạn sẽ không nhận thông báo khi ngư dân này đăng sản phẩm mới.
            </p>
            {/* Các nút hành động: Giữ lại và Bỏ theo dõi */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {/* Nút Giữ lại: Click sẽ đóng dialog xác nhận */}
              <button
                onClick={() => setUnfollowingId(null)}
                disabled={submitting}
                style={cancelBtnStyle}
              >
                Giữ lại
              </button>
              {/* Nút Bỏ theo dõi: Click sẽ chạy hàm xử lý gọi API hủy quan hệ follow */}
              <button
                onClick={handleUnfollow}
                disabled={submitting}
                style={dangerBtnStyle(submitting)}
              >
                {/* Thay đổi text dựa trên trạng thái gửi yêu cầu API */}
                {submitting ? "Đang xử lý..." : "Bỏ theo dõi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Component hiển thị thẻ thông tin từng người dùng (PersonCard) ─── */
function PersonCard({ person, isFollowing, onUnfollow, onNavigate, C }) {
  // Lấy ra tên hiển thị, ưu tiên FullName sau đó tới Name, cuối cùng mặc định là "Người dùng"
  const name = person.FullName || person.Name || "Người dùng";
  // Lấy ra ảnh đại diện (avatar), hỗ trợ cả hai kiểu camelCase và PascalCase do cấu trúc API trả về khác nhau
  const avatar = person.AvatarURL || person.avatarUrl;
  // Lấy ra điểm đánh giá người bán
  const rating = person.SellerRating ?? person.sellerRating;
  // Lấy ra số lượng sản phẩm của người dùng
  const productCount = person.ProductCount ?? person.productCount;
  // Lấy ra địa điểm/địa chỉ
  const location = person.Location || person.location;
  // Xác định người này có phải là ngư dân (người bán) hay không
  const isSeller = person.IsSeller ?? person.isSeller;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: "#FAFAFA",
        // Chuyển đổi mượt mà bóng đổ khi hover chuột
        transition: "box-shadow 0.15s",
      }}
      // Hiệu ứng hover: thêm bóng đổ xung quanh card
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")
      }
      // Khi chuột di chuyển ra ngoài: xóa hiệu ứng bóng đổ
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
    >
      {/* Khối Avatar đại diện */}
      <div onClick={onNavigate} style={{ cursor: "pointer", flexShrink: 0 }}>
        {/* Nếu có link avatar thì render thẻ img */}
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              // Đảm bảo hình ảnh không bị méo, giữ tỷ lệ và cắt vừa vặn hình tròn
              objectFit: "cover",
            }}
          />
        ) : (
          /* Nếu không có avatar, hiển thị vòng tròn gradient với chữ cái đầu tiên của tên viết hoa */
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              // Hiệu ứng dải màu chéo từ xanh đại dương sang đỏ san hô
              background: `linear-gradient(135deg, ${C.ocean}, ${C.coral})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Khối Thông tin người dùng */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Dòng tên người dùng */}
        <div
          onClick={onNavigate}
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: C.dark,
            cursor: "pointer",
            // Ẩn văn bản thừa bằng dấu ba chấm nếu tên quá dài
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          {name}
          {/* Nhãn "Ngư dân" nếu là người bán */}
          {isSeller && (
            <span
              style={{
                fontSize: 10,
                // Nền xanh da trời nhạt và chữ xanh dương đậm
                background: "#DBEAFE",
                color: "#1D4ED8",
                borderRadius: 4,
                padding: "1px 5px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              🎣 Ngư dân
            </span>
          )}
        </div>

        {/* Dòng siêu dữ liệu phụ (địa điểm, đánh giá, số sản phẩm) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2px 10px",
            marginTop: 2,
          }}
        >
          {/* Nếu có địa chỉ thì hiển thị icon ghim bản đồ kèm địa chỉ */}
          {location && <span style={metaStyle}>📍 {location}</span>}
          {/* Nếu có đánh giá sao thì hiển thị icon ngôi sao kèm điểm làm tròn đến 1 chữ số thập phân */}
          {rating != null && (
            <span style={metaStyle}>⭐ {Number(rating).toFixed(1)}</span>
          )}
          {/* Nếu có số lượng sản phẩm thì hiển thị icon hộp các-tông kèm số lượng sản phẩm */}
          {productCount != null && (
            <span style={metaStyle}>📦 {productCount} sản phẩm</span>
          )}
        </div>
      </div>

      {/* Khối Nút hành động ở bên phải card */}
      {isFollowing ? (
        /* Nút Bỏ theo dõi dành cho các card trong tab "following" */
        <button
          onClick={onUnfollow}
          style={{
            flexShrink: 0,
            padding: "6px 12px",
            borderRadius: 7,
            border: `1px solid #E5E7EB`,
            background: "#fff",
            color: "#374151",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.15s, border-color 0.15s, color 0.15s",
          }}
          // Khi hover chuột: Đổi nền đỏ nhạt, viền đỏ mờ và chữ màu đỏ nguy hiểm để báo hiệu chức năng hủy
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FFF1F2";
            e.currentTarget.style.borderColor = "#FECACA";
            e.currentTarget.style.color = "#EF4444";
          }}
          // Khi chuột rời đi: Khôi phục lại trạng thái ban đầu của nút bấm
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#E5E7EB";
            e.currentTarget.style.color = "#374151";
          }}
        >
          Bỏ theo dõi
        </button>
      ) : (
        /* Nút Xem trang dành cho các card trong tab "followers" */
        <button
          onClick={onNavigate}
          style={{
            flexShrink: 0,
            padding: "6px 12px",
            borderRadius: 7,
            border: "none",
            // Nền màu xanh nhạt và chữ màu xanh lam
            background: "#EFF6FF",
            color: "#3B82F6",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Xem trang
        </button>
      )}
    </div>
  );
}

/* ─── Component hiển thị hiệu ứng Khung xương (Skeleton Loading) khi dữ liệu đang tải ─── */
function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Tạo một mảng gồm 4 phần tử rỗng đại diện cho 4 dòng skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #F3F4F6",
            background: "#FAFAFA",
          }}
        >
          {/* Vòng tròn giả lập avatar */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#E5E7EB",
              // Gắn hiệu ứng nhấp nháy chuyển động vô tận định nghĩa ở dưới tag style
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          {/* Các dòng chữ giả lập tên và meta thông tin */}
          <div style={{ flex: 1 }}>
            {/* Dòng giả lập tên */}
            <div
              style={{
                height: 14,
                width: "55%",
                borderRadius: 6,
                background: "#E5E7EB",
                marginBottom: 8,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            {/* Dòng giả lập địa điểm/mô tả ngắn */}
            <div
              style={{
                height: 11,
                width: "35%",
                borderRadius: 6,
                background: "#F3F4F6",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
          {/* Nút bấm giả lập góc bên phải card */}
          <div
            style={{
              width: 80,
              height: 30,
              borderRadius: 7,
              background: "#F3F4F6",
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
        </div>
      ))}
      {/* Định nghĩa CSS keyframes cho hiệu ứng nhấp nháy nhè nhẹ của các khung xương */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

/* ─── Component hiển thị trạng thái Trống (EmptyState) khi không có người dùng nào ─── */
function EmptyState({ activeTab, hasSearch, onClearSearch }) {
  // Trường hợp không tìm thấy kết quả sau khi nhập bộ lọc ô tìm kiếm
  if (hasSearch) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 4,
          }}
        >
          Không tìm thấy kết quả
        </div>
        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12 }}>
          Thử tìm với từ khóa khác
        </div>
        {/* Nút hành động để reset giá trị ô search và hiển thị lại toàn bộ danh sách ban đầu */}
        <button
          onClick={onClearSearch}
          style={{
            padding: "6px 16px",
            borderRadius: 7,
            border: "1px solid #E5E7EB",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
            color: "#374151",
          }}
        >
          Xóa tìm kiếm
        </button>
      </div>
    );
  }

  // Cấu hình giao diện trống mặc định cho tab tương ứng
  const config =
    activeTab === "following"
      ? {
          emoji: "📌",
          title: "Chưa theo dõi ai",
          body: "Khám phá và theo dõi các ngư dân để nhận thông báo sản phẩm mới.",
        }
      : {
          emoji: "👥",
          title: "Chưa có người theo dõi",
          body: "Khi có người theo dõi bạn, họ sẽ xuất hiện ở đây.",
        };

  return (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      {/* Biểu tượng đại diện cho tab trống */}
      <div style={{ fontSize: 40, marginBottom: 10 }}>{config.emoji}</div>
      {/* Tiêu đề trạng thái trống */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {config.title}
      </div>
      {/* Đoạn mô tả hướng dẫn/thông tin phụ */}
      <div
        style={{
          fontSize: 13,
          color: "#9CA3AF",
          lineHeight: 1.5,
          maxWidth: 260,
          margin: "0 auto",
        }}
      >
        {config.body}
      </div>
    </div>
  );
}

/* ─── Phong cách CSS dùng chung dạng Object cho nút Hủy (Giữ lại) trong Dialog confirm ─── */
const cancelBtnStyle = {
  padding: "8px 20px",
  borderRadius: 7,
  border: "1px solid #E5E7EB",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  color: "#374151",
};

/* ─── Hàm trả về phong cách CSS dùng chung dạng Object cho nút Đỏ (Hủy theo dõi) dựa trên trạng thái bị disabled ─── */
const dangerBtnStyle = (disabled) => ({
  padding: "8px 20px",
  borderRadius: 7,
  border: "none",
  // Đổi con trỏ chuột thành hình biển báo cấm khi bị disabled để ngăn nhấp thêm lần nữa
  cursor: disabled ? "not-allowed" : "pointer",
  background: "#EF4444",
  color: "#fff",
  fontWeight: 600,
  fontSize: 13,
  // Giảm độ mờ của nút khi đang thực thi gọi API
  opacity: disabled ? 0.7 : 1,
});

/* ─── Phong cách CSS dùng chung dạng Object cho các thẻ thông tin phụ (meta data) của card người dùng ─── */
const metaStyle = {
  fontSize: 12,
  color: "#6B7280",
};
