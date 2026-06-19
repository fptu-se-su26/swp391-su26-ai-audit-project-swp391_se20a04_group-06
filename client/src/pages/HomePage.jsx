// Nhập các React Hooks cần thiết để quản lý state, vòng đời và tối ưu hiệu suất (useMemo)
import { useState, useEffect, useMemo } from "react";
// Nhập đối tượng gọi API (fetch wrapper) đã cấu hình sẵn
import { api } from "../services/api";
// Nhập hook tùy chỉnh thiết lập thẻ meta SEO động cho trang web
import { useSEO } from "../hooks/useSEO";
// Nhập hook tùy chỉnh để chuyển hướng trang có hiệu ứng mượt mà (View Transition API)
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
// Nhập hook lấy thông tin người dùng đăng nhập hiện tại từ Auth Context
import { useAuth } from "../context/AuthContext";
// Nhập lớp CSS module riêng của trang chủ để tạo kiểu giao diện khép kín
import styles from "./HomePage.module.css";
// Nhập hook lấy thông tin đường dẫn URL hiện tại từ thư viện react-router-dom
import { useLocation } from "react-router-dom";
// Nhập component con hiển thị mạng lưới lưới các ngư dân liên kết dạng Grid
import { FishermanGrid } from "../components/FishermanGrid";

export function HomePage() {
  const { user } = useAuth();
  const vtNavigate = useViewTransitionNavigate();
  const location = useLocation();
  // Lấy giá trị tham số tìm kiếm "search" từ thanh địa chỉ URL nếu có
  const search = new URLSearchParams(location.search).get("search") || "";

  // State lưu ID của chú cá đang được bấm (để kích hoạt lớp CSS tạo hiệu ứng hoạt hình rung lắc)
  const [animatingFish, setAnimatingFish] = useState(null);
  // Danh sách các bài nhật ký cabin (stories) của các ngư dân
  const [boatLogs, setBoatLogs] = useState([]);
  // Bài nhật ký cabin cụ thể đang được admin/người dùng click chọn để mở Modal xem chi tiết
  const [activeLog, setActiveLog] = useState(null);
  // Bảng xếp hạng các ngư dân tiêu biểu được vinh danh trong tháng
  const [leaderboard, setLeaderboard] = useState([]);

  // ✅ KHẮC PHỤC LỖI 1: Tối ưu hiệu năng lượt thích (likes) bằng useMemo (Derived State)
  // Tính toán trực tiếp bản đồ lượt thích từ danh sách boatLogs hiện tại, tránh dùng useEffect+setState gây render lặp (cascading renders).
  const logLikes = useMemo(() => {
    const map = {};
    const currentUserId = user?.userId || user?.id; // Lấy ID người dùng đăng nhập
    boatLogs.forEach((log) => {
      map[log._id] = {
        // Kiểm tra xem người dùng hiện tại đã nhấn thích bài này chưa
        liked: currentUserId ? log.likes.includes(currentUserId) : false,
        // Số lượng lượt thích
        count: log.likes.length,
      };
    });
    return map;
  }, [user, boatLogs]); // Recompute bất cứ khi nào danh sách boatLogs hoặc user thay đổi

  // Nếu người dùng nhập từ khóa tìm kiếm ở Trang chủ, chuyển hướng ngay sang trang Sản phẩm (/san-pham?search=...)
  useEffect(() => {
    if (search) {
      vtNavigate(`/san-pham?search=${encodeURIComponent(search)}`, {
        replace: true, // Thay thế lịch sử duyệt để người dùng không bị kẹt khi nhấn quay lại
      });
    }
  }, [search, vtNavigate]);

  // ✅ KHẮC PHỤC LỖI 1: Tải dữ liệu ban đầu một lần duy nhất khi component được mount (để mảng dependency là rỗng [])
  // Tránh việc gọi API lặp lại 2 lần do sự thay đổi từ trạng thái user null sang object.
  useEffect(() => {
    (async () => {
      try {
        // Tải tối đa 20 bài nhật ký cabin mới nhất của ngư dân
        const res = await api("/boat-logs?limit=20");
        setBoatLogs(res.boatLogs || []);
      } catch {
        /* Bỏ qua lỗi âm thầm */
      }

      try {
        // Tải danh sách ngư dân tiêu biểu để vinh danh
        const data = await api("/users/fishermen/leaderboard");
        setLeaderboard(data);
      } catch {
        /* Bỏ qua lỗi âm thầm */
      }
    })();
  }, []); // ← Chỉ chạy đúng 1 lần duy nhất khi gắn component vào DOM

  // Tạo hiệu ứng hoạt họa vui mắt khi người dùng click vào các chú cá trên banner chính
  const handleFishClick = (fishId) => {
    setAnimatingFish(fishId); // Kích hoạt tên lớp hoạt họa
    // Hủy bỏ trạng thái hoạt họa sau 1 giây (1000ms) để có thể nhấn lại ở lần sau
    setTimeout(() => {
      setAnimatingFish(null);
    }, 1000);
  };

  // Thiết lập các thẻ SEO tiêu chuẩn cho trang chủ
  useSEO({
    title: "Hải sản tươi từ ngư dân | Haisan.vn",
    description:
      "Haisan.vn kết nối người mua với ngư dân bản địa, đưa hải sản tươi ngon trực tiếp từ biển tới bữa ăn gia đình.",
  });

  // ✅ KHẮC PHỤC LỖI 1: Cập nhật lượt thích nhanh chóng (Optimistic Update)
  // Thay đổi trực tiếp mảng likes trong state boatLogs, giúp useMemo tự động cập nhật lại logLikes ngay lập tức mà không cần gọi tải lại danh sách từ server
  const handleLikeLog = async (logId) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thả tim nhật ký cabin.");
      return;
    }
    try {
      // Gửi yêu cầu POST thích bài viết lên backend
      const res = await api(`/boat-logs/${logId}/like`, { method: "POST" });
      const currentUserId = user?.userId || user?.id;
      setBoatLogs((prev) =>
        prev.map((log) => {
          if (log._id !== logId) return log;
          // Nếu backend trả về là đã thích thì thêm ID người dùng vào mảng, ngược lại lọc bỏ đi (unliked)
          const newLikes = res.liked
            ? [...log.likes, currentUserId]
            : log.likes.filter((id) => id !== currentUserId);
          return { ...log, likes: newLikes };
        }),
      );
    } catch {
      /* Bỏ qua lỗi gọi API */
    }
  };

  return (
    <div className="index">
      <div id="container" style={{ width: "100%", maxWidth: "100%" }}>
        <div id="contents">
          {/* ─── BANNER TRANG CHỦ HÌNH 3 CHÚ CÁ BƠI LỘI (PHONG CÁCH UMAI.FISH) ─── */}
          <div className="A_waku" style={{ marginBottom: "40px" }}>
            <div
              className="A01 wow fadeIn animated"
              style={{ visibility: "visible", animationName: "fadeIn" }}
            >
              {/* Hình ảnh đại diện banner trung tâm */}
              <p
                className="img01 wow rotateIn animated"
                style={{
                  visibility: "visible",
                  animationDelay: "0s",
                  animationName: "rotateIn",
                }}
              >
                <img src="/0001.png" alt="Haisan.vn" width="836" height="827" />
              </p>

              {/* Khối nút kêu gọi Đăng ký thành viên */}
              <div className="img03">
                <button
                  className={styles.heroSignupButton}
                  onClick={() => vtNavigate("/dang-nhap")}
                >
                  <span>Cá tươi mỗi ngày</span>
                  <strong>Đăng ký thành viên</strong>
                </button>
                <span className={styles.heroSignupNote}>
                  Đăng ký thành viên để có thể sử dụng nhiều tính năng hơn!
                </span>
              </div>

              {/* Cá tươi 1: Bấm vào sẽ rung lắc */}
              <p className="img04">
                <img
                  src="/03.png"
                  alt="Cá tươi 1"
                  onClick={() => handleFishClick("03")}
                  className={
                    animatingFish === "03" ? "rubberBand animated" : ""
                  }
                  style={{ cursor: "pointer" }}
                />
              </p>

              {/* Cá tươi 2: Bấm vào sẽ rung lắc */}
              <p className="img05">
                <img
                  src="/04.png"
                  alt="Cá tươi 2"
                  onClick={() => handleFishClick("04")}
                  className={
                    animatingFish === "04" ? "rubberBand animated" : ""
                  }
                  style={{ cursor: "pointer" }}
                />
              </p>

              {/* Cá tươi 3: Bấm vào sẽ rung lắc */}
              <p className="img06">
                <img
                  src="/05.png"
                  alt="Cá tươi 3"
                  onClick={() => handleFishClick("05")}
                  className={
                    animatingFish === "05" ? "rubberBand animated" : ""
                  }
                  style={{ cursor: "pointer" }}
                />
              </p>
            </div>
          </div>

          {/* ─── THANH TRÒ CHƠI / TIN TỨC STORIES (NHẬT KÝ CABIN) ─── */}
          {boatLogs.length > 0 && (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "var(--radius-xl)",
                padding: "20px 24px",
                border: "1px solid var(--border-l)",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "30px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ⛵ Nhật ký cabin - Tin tức boong tàu trực tiếp
              </h3>
              {/* Vùng cuộn ngang hiển thị các Avatar tròn đại diện giống tin nhắn Stories Instagram */}
              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  overflowX: "auto",
                  paddingBottom: "8px",
                  scrollbarWidth: "thin",
                }}
              >
                {boatLogs.map((log) => (
                  <div
                    key={log._id}
                    onClick={() => setActiveLog(log)} // Bấm chọn để mở hộp thoại Modal xem chi tiết
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      width: "82px",
                      textAlign: "center",
                    }}
                  >
                    {/* Viền tròn Gradient rực rỡ xung quanh Avatar */}
                    <div
                      style={{
                        position: "relative",
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        padding: "3px",
                        background:
                          "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                        marginBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: "#fff",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {log.userAvatar ? (
                          <img
                            src={log.userAvatar}
                            alt={log.userName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              fontSize: "20px",
                              fontWeight: "700",
                              color: "var(--ocean)",
                            }}
                          >
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Huy hiệu máy ảnh nhỏ góc dưới nếu bài nhật ký có hình ảnh đính kèm */}
                      {log.images && log.images.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "0",
                            right: "0",
                            background: "#e74c3c",
                            color: "#fff",
                            fontSize: "9px",
                            fontWeight: "700",
                            borderRadius: "99px",
                            padding: "2px 5px",
                            border: "1.5px solid #fff",
                          }}
                        >
                          📷
                        </div>
                      )}
                    </div>
                    {/* Tên ngư dân viết nhật ký */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--dark)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}
                    >
                      {log.userName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── PHÂN VÙNG BẢN ĐỒ MẠNG LƯỚI LIÊN KẾT NGƯ DÂN & BẢNG XẾP HẠNG ─── */}
          <div
            style={{
              background: "var(--white)",
              borderRadius: "var(--radius-xl)",
              padding: "36px",
              border: "1px solid var(--border-l)",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "40px",
            }}
            className="fade-up"
          >
            <div className={styles.networkGrid}>
              {/* Cột Trái: Giới thiệu mạng lưới bản đồ và Grid các ngư dân */}
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: "900",
                      color: "var(--dark)",
                      marginBottom: "8px",
                    }}
                  >
                    Bản Đồ Mạng Lưới Ngư Dân Liên Kết
                  </h2>
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                    Haisan.vn hợp tác trực tiếp với các hộ ngư thuyền đánh bắt
                    tại các vùng vịnh lớn. Click vào đại diện của từng ngư
                    thuyền dưới đây để xem các mẻ lưới tươi rói họ đang chào bán
                    hôm nay.
                  </p>
                </div>

                {/* Nhúng component hiển thị danh sách các ngư dân tiêu biểu */}
                <FishermanGrid
                  limit={17}
                  onViewAll={() => vtNavigate("/ngu-dan")}
                />

                <div style={{ marginTop: "20px" }}>
                  <button
                    onClick={() => vtNavigate("/ngu-dan")}
                    style={{
                      background: "none",
                      border: "1.5px solid var(--ocean)",
                      color: "var(--ocean-d)",
                      padding: "8px 20px",
                      borderRadius: "99px",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "var(--transition)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--ocean-p)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    ⚓ Xem Tất Cả Gian Hàng Ngư Dân
                  </button>
                </div>
              </div>

              {/* Cột Phải: Bảng xếp hạng Ngư dân tiêu biểu của tháng (Leaderboard) */}
              <div
                style={{
                  borderLeft: "1px solid var(--border-l)",
                  paddingLeft: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "900",
                      color: "#c94f27",
                      marginBottom: "4px",
                      marginTop: 0,
                    }}
                  >
                    🏆 Lão Ngư Xuất Sắc
                  </h3>
                  <p
                    style={{
                      color: "var(--muted)",
                      fontSize: "12px",
                      margin: 0,
                    }}
                  >
                    Vinh danh các tàu cá uy tín bám biển và nhận đánh giá tích
                    cực trong tháng.
                  </p>
                </div>

                {/* Kiểm duyệt danh sách bảng xếp hạng */}
                {leaderboard.length === 0 ? (
                  <div
                    style={{
                      padding: "20px 0",
                      color: "var(--muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    Chưa có bảng xếp hạng tháng này.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {/* Chỉ lấy top 5 lão ngư dẫn đầu bảng xếp hạng */}
                    {leaderboard.slice(0, 5).map((fisher, idx) => {
                      // Tạo biểu tượng cúp tương ứng với thứ hạng 1, 2, 3
                      const medal =
                        idx === 0
                          ? "🥇"
                          : idx === 1
                            ? "🥈"
                            : idx === 2
                              ? "🥉"
                              : `${idx + 1}.`;
                      return (
                        <div
                          key={fisher.id}
                          onClick={() => vtNavigate(`/nguoi-ban/${fisher.id}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            background: "var(--bg)",
                            border: "1px solid var(--border-l)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor = "var(--ocean)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor =
                              "var(--border-l)")
                          }
                        >
                          {/* Số thứ tự hoặc cúp vàng */}
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "800",
                              width: "20px",
                              textAlign: "center",
                            }}
                          >
                            {medal}
                          </div>

                          {/* Ảnh đại diện ngư thuyền */}
                          <div
                            style={{
                              position: "relative",
                              width: "36px",
                              height: "36px",
                              flexShrink: 0,
                            }}
                          >
                            {fisher.avatar ? (
                              <img
                                src={fisher.avatar}
                                alt={fisher.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: "50%",
                                  background: "var(--ocean-p)",
                                  color: "var(--ocean-d)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "700",
                                  fontSize: "12px",
                                }}
                              >
                                {fisher.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {/* Dấu tích xanh xác minh nhỏ góc dưới Avatar */}
                            {fisher.isVerified && (
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: "-2px",
                                  right: "-2px",
                                  background: "#0b4f6c",
                                  color: "#fff",
                                  borderRadius: "50%",
                                  width: "12px",
                                  height: "12px",
                                  fontSize: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Tên ngư dân và số sao đánh giá */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong
                              style={{
                                fontSize: "12px",
                                color: "var(--dark)",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fisher.name}
                            </strong>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "2px",
                                marginTop: "2px",
                                alignItems: "center",
                              }}
                            >
                              {/* Điểm sao đánh giá */}
                              {fisher.avgRating > 0 && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#F59E0B",
                                    fontWeight: "700",
                                    marginRight: "4px",
                                  }}
                                >
                                  ★ {fisher.avgRating}
                                </span>
                              )}
                              {/* Huy hiệu đặc quyền đi kèm (nếu có) */}
                              {fisher.badges &&
                                fisher.badges.slice(0, 1).map((b, bIdx) => (
                                  <span
                                    key={bIdx}
                                    style={{
                                      fontSize: "8px",
                                      background: "var(--ocean-p)",
                                      color: "var(--ocean-d)",
                                      padding: "0px 4px",
                                      borderRadius: "4px",
                                      fontWeight: "700",
                                    }}
                                  >
                                    {b}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── PHẦN CẢM ƠN (THANK YOU) VÀ SỐ LIỆU ĐÃ ĐẠT ĐƯỢC ─── */}
          <div className="H_waku">
            <div className="H01" style={{ textAlign: "center" }}>
              <div
                style={{
                  background: "#fff",
                  border: "3px solid #208f67",
                  borderRadius: "20px",
                  padding: "30px",
                  maxWidth: "600px",
                  margin: "0 auto 30px auto",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                  textAlign: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                    color: "#208f67",
                    margin: "0 0 10px 0",
                  }}
                >
                  THANK YOU!
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#333",
                    margin: 0,
                  }}
                >
                  Chân thành cảm ơn sự tin dùng của Quý khách hàng và các đối
                  tác nhà hàng toàn quốc!
                </p>
              </div>
              Haisan.vn được sự tin dùng của hơn{" "}
              <span className="color2">1,000</span> nhà hàng và đầu bếp chuyên
              nghiệp!
              <br />
              Tổng lượt giao dịch thành công đã vượt mốc{" "}
              <span className="color2">50,000</span> đơn hàng!
              <br />
              <span
                className="color3"
                style={{ fontSize: "36px", fontWeight: "bold" }}
              >
                Xin chân thành cảm ơn!
              </span>
            </div>
          </div>

          {/* ─── LỜI NGỎ TỪ BAN SÁNG LẬP ─── */}
          <div className="I_waku" style={{ padding: "60px 0" }}>
            <div
              className="top_message"
              style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}
            >
              <h2>Lời ngỏ từ Haisan.vn — Kết nối ngư dân và gia đình Việt</h2>
              <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#333" }}>
                Chào bạn, chúng tôi là đội ngũ sáng lập Haisan.vn. Chúng tôi xây
                dựng nền tảng này với sứ mệnh mang những mẻ lưới tươi ngon nhất
                từ boong tàu của ngư dân trực tiếp tới bàn ăn của mọi gia đình.
                <br />
                <br />
                Bằng cách kết nối trực tiếp, chúng tôi giúp giảm thiểu các khâu
                trung gian, đem lại thu nhập xứng đáng hơn cho ngư dân và mang
                đến nguồn thực phẩm tươi ngon, an toàn với giá hợp lý nhất cho
                người tiêu dùng.
                <br />
                <br />
                Mỗi sản phẩm bạn mua trên Haisan.vn không chỉ là món ăn ngon cho
                gia đình, mà còn là sự ủng hộ và trân quý gửi tới những người
                bám biển quê hương. Chúc bạn có những trải nghiệm ẩm thực tuyệt
                vời!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL HỘP THOẠI XEM CHI TIẾT NHẬT KÝ CABIN (STORIES DETAILED MODAL) ─── */}
      {activeLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)", // Nền tối đè đằng sau
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setActiveLog(null)} // Click ngoài modal để đóng
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click đóng lan truyền
          >
            {/* Nút đóng (x) góc phải trên */}
            <button
              onClick={() => setActiveLog(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "var(--muted)",
                lineHeight: 1,
              }}
            >
              &times;
            </button>

            {/* Header thông tin ngư dân */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              {/* Avatar tròn */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--bg-2)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeLog.userAvatar ? (
                  <img
                    src={activeLog.userAvatar}
                    alt={activeLog.userName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "var(--ocean)",
                    }}
                  >
                    {activeLog.userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <strong
                  style={{
                    fontSize: "15px",
                    color: "var(--dark)",
                    display: "block",
                  }}
                >
                  {activeLog.userName}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  ⛵ Nhật ký đăng ngày{" "}
                  {new Date(activeLog.createdAt).toLocaleDateString("vi-VN")}{" "}
                  lúc{" "}
                  {new Date(activeLog.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Nội dung chữ nhật ký */}
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-2)",
                lineHeight: "1.6",
                whiteSpace: "pre-line",
                marginBottom: "16px",
              }}
            >
              {activeLog.content}
            </p>

            {/* Lưới hình ảnh đính kèm (nếu có) */}
            {activeLog.images && activeLog.images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  // Nếu chỉ có 1 ảnh thì giãn full, nếu có từ 2 ảnh trở lên thì chia đôi cột
                  gridTemplateColumns:
                    activeLog.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                  gap: "8px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  marginBottom: "20px",
                }}
              >
                {activeLog.images.map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt="Cabin Log Pic"
                    style={{
                      width: "100%",
                      height: activeLog.images.length === 1 ? "auto" : "180px",
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Thanh hành động chân Modal (Thả tim và nút đóng) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border-l)",
                paddingTop: "14px",
              }}
            >
              <button
                onClick={() => handleLikeLog(activeLog._id)} // Bấm thả tim bài viết
                style={{
                  background: "none",
                  border: "none",
                  // Đổi màu hồng đỏ nếu người dùng đã thả tim trước đó
                  color: logLikes[activeLog._id]?.liked
                    ? "var(--coral)"
                    : "var(--text-2)",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ❤️ {logLikes[activeLog._id]?.liked ? "Đã thả tim" : "Thả tim"} (
                {logLikes[activeLog._id]?.count || 0})
              </button>

              <button
                onClick={() => setActiveLog(null)}
                style={{
                  background: "var(--ocean)",
                  color: "#fff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "99px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
