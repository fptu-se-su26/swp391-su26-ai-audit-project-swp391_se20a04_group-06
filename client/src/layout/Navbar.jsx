/**
 * Navbar.jsx (Đã dọn sạch lỗi Cascading Renders và lược bỏ ô tìm kiếm)
 */
// Nhập các hook useState, useRef, useEffect, useCallback từ thư viện React để quản lý state và DOM references
import { useState, useRef, useEffect, useCallback } from "react";
// Nhập hook useNavigate và useLocation từ react-router-dom để điều hướng trang và đọc thông tin đường dẫn URL hiện tại
import { useNavigate, useLocation } from "react-router-dom";
// Nhập hook useAuth từ AuthContext để lấy thông tin đăng nhập và hàm đăng xuất
import { useAuth } from "../context/AuthContext";
// Nhập component ChatPopover hiển thị khung chat nhanh thu nhỏ
import { ChatPopover } from "../components/ChatPopover";
// Nhập component NotificationBell hiển thị biểu tượng chuông thông báo và danh sách thông báo
import { NotificationBell } from "../components/NotificationBell";
// Nhập hook useNotifications để lấy danh sách thông báo thời gian thực
import { useNotifications } from "../hooks/useNotifications";
// Nhập các biểu tượng icon vector tự định nghĩa từ thư mục components/icons
import {
  MessageIcon,
  HomeIcon,
  BarChartIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  PlusIcon,
  ChevronDownIcon,
  SparklesIcon,
} from "../components/icons";
// Nhập file cấu hình CSS Module cho thanh định hướng Navbar
import styles from "./Navbar.module.css";

// Component Navbar nhận props: unread (số tin nhắn chưa đọc) và onOpenGlobalChat (callback mở khung chat toàn màn hình)
export function Navbar({ unread, onOpenGlobalChat }) {
  // Lấy ra user hiện tại và hàm logout từ AuthContext
  const { user, logout } = useAuth();
  // Khởi tạo hàm điều hướng trang
  const navigate = useNavigate();
  // Lấy thông tin location hiện tại của ứng dụng
  const location = useLocation();
  // Ref trỏ tới phần tử bọc menu dropdown thông tin cá nhân dùng để đóng menu khi click ra ngoài
  const dropdownRef = useRef(null);
  // Ref trỏ tới phần tử sentinel (lính gác) để theo dõi trạng thái cuộn trang của người dùng
  const sentinelRef = useRef(null);

  // State kiểm soát việc hiển thị popover hội thoại chat nhanh
  const [showChatPopover, setShowChatPopover] = useState(false);
  // State kiểm soát việc đóng/mở menu rút gọn dạng hamburger trên thiết bị di động
  const [menuOpen, setMenuOpen] = useState(false);
  // State kiểm soát việc đóng/mở menu dropdown thông tin cá nhân người dùng
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  // State đánh dấu xem người dùng đã cuộn trang xuống chưa (dùng để đổi màu nền Navbar)
  const [scrolled, setScrolled] = useState(false);

  // Tự động đóng các Menu / Dropdown ngay khi phát hiện người dùng chuyển hướng sang trang khác
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (menuOpen) setMenuOpen(false);
    if (showChatPopover) setShowChatPopover(false);
    if (showProfileDropdown) setShowProfileDropdown(false);
  }

  // Sử dụng hook useNotifications để đồng bộ và quản lý thông báo của người dùng
  const { notifs, unreadCount, markAllRead, markSingleRead } =
    useNotifications(user);

  // useEffect lắng nghe sự kiện click chuột ra bên ngoài vùng dropdown để tự động đóng dropdown đó
  useEffect(() => {
    const handler = (e) => {
      // Nếu dropdown đang mở và vị trí click chuột nằm ngoài vùng bao của dropdownRef
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false); // Thực hiện đóng menu dropdown cá nhân
      }
    };
    // Gắn sự kiện click mousedown toàn cục
    document.addEventListener("mousedown", handler);
    // Cleanup: gỡ bỏ sự kiện click khi component unmount
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // useEffect sử dụng IntersectionObserver theo dõi phần tử lính gác (sentinel) ở đỉnh trang
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // Khởi tạo trình giám sát: khi phần tử lính gác trượt ra ngoài màn hình (isIntersecting = false), đánh dấu đã cuộn trang
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    // Bắt đầu theo dõi phần tử sentinel
    observer.observe(sentinel);
    // Cleanup: hủy đăng ký giám sát khi component hủy
    return () => observer.disconnect();
  }, []);

  // Hàm xử lý khi click vào một thông báo cụ thể
  const handleNotifClick = useCallback(
    (n) => {
      // Nếu thông báo chưa đọc, đánh dấu đã đọc
      if (!n.isRead) markSingleRead(n.id);
      // Nếu thông báo đính kèm sản phẩm cụ thể, tự động điều hướng sang chi tiết sản phẩm đó
      if (n.productId) navigate(`/san-pham/${n.productId}`);
    },
    [navigate, markSingleRead],
  );

  // Hàm xử lý đăng xuất tài khoản người dùng
  const handleLogout = useCallback(async () => {
    await logout(); // Gọi API và xóa session đăng nhập
    navigate("/"); // Chuyển hướng về trang chủ
    setMenuOpen(false); // Đóng menu mobile
    setShowProfileDropdown(false); // Đóng dropdown profile
  }, [logout, navigate]);

  // Hàm kiểm tra xem đường dẫn liên kết của một menu có đang trùng với trang hiện tại không (dùng để active tab)
  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname],
  );

  // Hàm điều hướng trang nhanh kèm tự động đóng menu mobile
  const navTo = useCallback(
    (path) => {
      navigate(path);
      setMenuOpen(false);
    },
    [navigate],
  );

  return (
    <>
      {/* Khối lính gác sentinel đặt trên cùng Navbar để nhận biết thao tác cuộn trang */}
      <div
        ref={sentinelRef}
        style={{
          position: "absolute",
          top: 0,
          height: 1,
          width: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Thanh Navbar chính, thay đổi class CSS dựa theo trạng thái cuộn trang scrolled */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        {/* ─── Khối hiển thị Logo ─── */}
        <button
          className={styles.logo}
          onClick={() => navTo("/")}
          aria-label="Trang chủ"
        >
          {/* Biểu tượng lấp lánh Sparkles của logo */}
          <span className={styles.logoMark}>
            <SparklesIcon size={18} />
          </span>
          <span>
            {/* Tên thương hiệu chính */}
            <span className={styles.logoName}>
              Hai<span className={styles.logoAccent}>San</span>.vn
            </span>
            {/* Khẩu hiệu nhỏ của logo */}
            <span className={styles.logoTagline}>Tươi từ ngư dân</span>
          </span>
        </button>

        {/* ─── Khối liên kết điều hướng trên màn hình máy tính (Nav Links) ─── */}
        <div className={styles.navLinks}>
          {/* Nút trang chủ */}
          <button
            className={`${styles.navBtn} ${isActive("/") ? styles.active : ""}`}
            onClick={() => navTo("/")}
          >
            <HomeIcon size={14} />
            Trang chủ
          </button>

          {/* Nút danh sách sản phẩm */}
          <button
            className={`${styles.navBtn} ${isActive("/san-pham") ? styles.active : ""}`}
            onClick={() => navTo("/san-pham")}
          >
            🐟 Sản phẩm
          </button>
          {/* Nút danh sách công thức nấu ăn */}
          <button
            className={`${styles.navBtn} ${isActive("/cong-thuc") ? styles.active : ""}`}
            onClick={() => navTo("/cong-thuc")}
          >
            🍳 Bí quyết
          </button>
          {/* Nút trang cộng đồng */}
          <button
            className={`${styles.navBtn} ${isActive("/cong-dong") ? styles.active : ""}`}
            onClick={() => navTo("/cong-dong")}
          >
            💬 Cộng đồng
          </button>
          {/* Nút danh sách ngư dân */}
          <button
            className={`${styles.navBtn} ${isActive("/ngu-dan") ? styles.active : ""}`}
            onClick={() => navTo("/ngu-dan")}
          >
            🚢 Ngư dân
          </button>
          {/* Các nút nâng cao hiển thị nếu người dùng đã đăng nhập */}
          {user && (
            <>
              {/* Nút quản lý bán hàng dashboard */}
              <button
                className={`${styles.navBtn} ${isActive("/dashboard") ? styles.active : ""}`}
                onClick={() => navTo("/dashboard")}
              >
                <BarChartIcon size={14} />
                Quản lý
              </button>
              {/* Nút dành riêng cho quản trị viên hệ thống */}
              {user.role === "Admin" && (
                <button
                  className={`${styles.navBtn} ${isActive("/admin") ? styles.active : ""}`}
                  onClick={() => navTo("/admin")}
                >
                  <SettingsIcon size={14} />
                  Admin
                </button>
              )}
            </>
          )}
        </div>

        {/* ─── Khối các nút hành động (Actions) bên phải Navbar ─── */}
        <div className={styles.actions}>
          {/* Hiển thị nếu người dùng đã đăng nhập */}
          {user ? (
            <>
              {/* Nút mở Popover chat nhanh kèm theo nhãn số tin nhắn chưa đọc */}
              <div style={{ position: "relative" }}>
                <button
                  className={styles.iconBtn}
                  onClick={() => setShowChatPopover((v) => !v)}
                  aria-label={`Tin nhắn${unread > 0 ? ` (${unread} chưa đọc)` : ""}`}
                >
                  <MessageIcon size={16} />
                  {/* Nếu có tin nhắn chưa đọc thì hiển thị badge đỏ */}
                  {unread > 0 && (
                    <span className={styles.badge}>
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                {/* Kết xuất ChatPopover khi state showChatPopover là true */}
                {showChatPopover && (
                  <ChatPopover
                    user={user}
                    onClose={() => setShowChatPopover(false)}
                    // Sự kiện khi click chọn mở một hội thoại cụ thể
                    onOpenChat={(chat) => {
                      onOpenGlobalChat?.(chat); // Chuyển cuộc chat ra màn hình lớn
                      setShowChatPopover(false); // Đóng popover nhỏ lại
                    }}
                  />
                )}
              </div>

              {/* Component hiển thị chuông thông báo kết hợp số lượng unreadCount */}
              <NotificationBell
                notifs={notifs}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
                onNotifClick={handleNotifClick}
              />

              {/* Nút đăng bán mẻ lưới mới */}
              <button
                className={styles.postBtn}
                onClick={() => navTo("/dang-bai")}
              >
                <PlusIcon size={14} />
                Đăng bán
              </button>

              {/* Khối Dropdown Menu thông tin tài khoản cá nhân */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  className={styles.profileBtn}
                  onClick={() => setShowProfileDropdown((v) => !v)}
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="true"
                >
                  {/* Hiển thị ảnh avatar nếu có, ngược lại dùng chữ cái đầu tiên của tên */}
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {(user.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  {/* Chỉ lấy từ cuối cùng trong chuỗi tên đầy đủ để hiển thị rút gọn */}
                  <span>{user.name?.split(" ").pop()}</span>
                  {/* Icon mũi tên chỉ hướng xuống */}
                  <ChevronDownIcon size={11} />
                </button>

                {/* Dropdown chi tiết tài khoản khi click */}
                {showProfileDropdown && (
                  <div className={styles.dropdown} role="menu">
                    <div className={styles.dropdownHeader}>
                      {/* Tên và Email hiển thị trong đầu dropdown */}
                      <div className={styles.dropdownName}>{user.name}</div>
                      <div className={styles.dropdownSub}>{user.email}</div>
                    </div>
                    {/* Mục liên kết tới trang cài đặt hồ sơ profile */}
                    <button
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => {
                        navTo("/profile");
                        setShowProfileDropdown(false);
                      }}
                    >
                      <SettingsIcon size={13} />
                      Cài đặt tài khoản
                    </button>
                    {/* Mục liên kết tới trang quản lý bán hàng dashboard */}
                    <button
                      className={styles.dropdownItem}
                      role="menuitem"
                      onClick={() => {
                        navTo("/dashboard");
                        setShowProfileDropdown(false);
                      }}
                    >
                      <BarChartIcon size={13} />
                      Quản lý bán hàng
                    </button>
                    <hr className={styles.dropdownDivider} />
                    {/* Mục đăng xuất */}
                    <button
                      className={`${styles.dropdownItem} ${styles.danger}`}
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOutIcon size={13} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Hiển thị các nút Đăng nhập / Đăng bán mặc định đối với khách chưa đăng nhập */
            <>
              {/* Nút đăng bán (sẽ tự chuyển hướng sang đăng nhập nếu chưa có session) */}
              <button
                className={styles.postBtn}
                onClick={() => navTo("/dang-bai")}
              >
                <PlusIcon size={14} />
                Đăng bán
              </button>
              {/* Nút đi tới trang Đăng nhập */}
              <button
                className={styles.loginBtn}
                onClick={() => navTo("/dang-nhap")}
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>

        {/* ─── Nút bấm đóng mở Menu rút gọn cho thiết bị di động (Hamburger) ─── */}
        <div className={styles.mobileActions}>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={menuOpen}
          >
            {/* Hiển thị icon chữ X nếu menu đang mở, ngược lại hiện icon 3 dấu gạch */}
            {menuOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          </button>
        </div>
      </nav>

      {/* ─── Khối giao diện Menu rút gọn cho thiết bị di động hiển thị khi click nút hamburger ─── */}
      {menuOpen && (
        <div
          className={styles.mobileMenu}
          role="navigation"
          aria-label="Menu di động"
        >
          {/* Đường dẫn trang chủ di động */}
          <button className={styles.mobileMenuItem} onClick={() => navTo("/")}>
            <HomeIcon size={14} />
            Trang chủ
          </button>

          {/* Đường dẫn sản phẩm di động */}
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/san-pham")}
          >
            🐟 Sản phẩm bản địa
          </button>
          {/* Đường dẫn công thức nấu nướng di động */}
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/cong-thuc")}
          >
            🍳 Bí quyết nấu nướng
          </button>
          {/* Đường dẫn cộng đồng thảo luận di động */}
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/cong-dong")}
          >
            💬 Cộng đồng thảo luận
          </button>
          {/* Đường dẫn ngư dân di động */}
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/ngu-dan")}
          >
            🚢 Ngư dân bản địa
          </button>
          {/* Đường dẫn quản lý bán hàng (chỉ hiện khi đã đăng nhập) */}
          {user && (
            <button
              className={styles.mobileMenuItem}
              onClick={() => navTo("/dashboard")}
            >
              <BarChartIcon size={14} />
              Quản lý bán hàng
            </button>
          )}

          {/* Đường dẫn đăng bài bán di động */}
          <button
            className={styles.mobileMenuItem}
            onClick={() => navTo("/dang-bai")}
          >
            <PlusIcon size={14} />
            Đăng bán ngay
          </button>
          {/* Nút đăng xuất/đăng nhập tương ứng trạng thái tài khoản */}
          {user ? (
            <button
              className={`${styles.mobileMenuItem} ${styles.danger}`}
              onClick={handleLogout}
            >
              <LogOutIcon size={14} />
              Đăng xuất
            </button>
          ) : (
            <button
              className={styles.mobileMenuItem}
              onClick={() => navTo("/dang-nhap")}
            >
              Đăng nhập
            </button>
          )}
        </div>
      )}
    </>
  );
}
