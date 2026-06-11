import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useSEO } from "../hooks/useSEO";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
import { useAuth } from "../context/AuthContext";
import styles from "./HomePage.module.css";
import { useLocation } from "react-router-dom";
import { FishermanGrid } from "../components/FishermanGrid";

export function HomePage() {
  const { user } = useAuth();
  const vtNavigate = useViewTransitionNavigate();
  const location = useLocation();
  const search = new URLSearchParams(location.search).get("search") || "";

  const [animatingFish, setAnimatingFish] = useState(null);
  const [boatLogs, setBoatLogs] = useState([]);
  const [activeLog, setActiveLog] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [logLikes, setLogLikes] = useState({});

  // Redirect to /san-pham if a search query is present in the Home URL
  useEffect(() => {
    if (search) {
      vtNavigate(`/san-pham?search=${encodeURIComponent(search)}`, { replace: true });
    }
  }, [search, vtNavigate]);

  useEffect(() => {
    api("/boat-logs?limit=20")
      .then((res) => {
        setBoatLogs(res.boatLogs || []);
        const likesMap = {};
        (res.boatLogs || []).forEach(log => {
          const currentUserId = user?.userId || user?.id;
          likesMap[log._id] = {
            liked: currentUserId ? log.likes.includes(currentUserId) : false,
            count: log.likes.length
          };
        });
        setLogLikes(likesMap);
      })
      .catch(() => { });

    api("/users/fishermen/leaderboard")
      .then((data) => setLeaderboard(data))
      .catch(() => { });
  }, [user]);

  const handleLikeLog = async (logId) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thả tim nhật ký cabin.");
      return;
    }
    try {
      const res = await api(`/boat-logs/${logId}/like`, { method: "POST" });
      setLogLikes(prev => ({
        ...prev,
        [logId]: {
          liked: res.liked,
          count: res.likeCount
        }
      }));
    } catch { }
  };

  const handleFishClick = (fishId) => {
    setAnimatingFish(fishId);
    setTimeout(() => {
      setAnimatingFish(null);
    }, 1000);
  };

  useSEO({
    title: "Hải sản tươi từ ngư dân | HảiSản.vn",
    description: "HảiSản.vn kết nối người mua với ngư dân bản địa, đưa hải sản tươi ngon trực tiếp từ biển tới bữa ăn gia đình.",
  });

  const handleFishermanFilter = (searchVal) => {
    if (searchVal) {
      vtNavigate(`/san-pham?search=${encodeURIComponent(searchVal)}`);
    } else {
      vtNavigate("/san-pham");
    }
  };

  return (
    <div className="index">
      <div id="container" style={{ width: "100%", maxWidth: "100%" }}>
        <div id="contents">
          {/* ─── UMAI.FISH THREE FISHES BANNER ─── */}
          <div className="A_waku" style={{ marginBottom: "40px" }}>
            <div className="A01 wow fadeIn animated" style={{ visibility: "visible", animationName: "fadeIn" }}>
              <p className="img01 wow rotateIn animated" style={{ visibility: "visible", animationDelay: "0s", animationName: "rotateIn" }}>
                <img src="/0001.png" alt="HảiSản.vn" width="836" height="827" />
              </p>
              <span className={`img02 ${styles.heroVietnameseText}`}>
                <span>Hải sản tươi ngon</span>
                <span>từ ngư dân</span>
                <span>đến tận gia đình</span>
              </span>
              <div className="img03">
                <button
                  className={styles.heroSignupButton}
                  onClick={() => vtNavigate("/dang-nhap")}
                >
                  <span>24 giờ tiếp nhận / miễn phí</span>
                  <strong>Đăng ký thành viên</strong>
                </button>
                <span className={styles.heroSignupNote}>
                  Đăng ký thành viên nhận ngay cẩm nang chế biến hải sản tươi ngon miễn phí!
                </span>
              </div>

              <p className="img04">
                <img
                  src="/03.png"
                  alt="Cá tươi 1"
                  onClick={() => handleFishClick("03")}
                  className={animatingFish === "03" ? "rubberBand animated" : ""}
                  style={{ cursor: "pointer" }}
                />
              </p>

              <p className="img05">
                <img
                  src="/04.png"
                  alt="Cá tươi 2"
                  onClick={() => handleFishClick("04")}
                  className={animatingFish === "04" ? "rubberBand animated" : ""}
                  style={{ cursor: "pointer" }}
                />
              </p>

              <p className="img06">
                <img
                  src="/05.png"
                  alt="Cá tươi 3"
                  onClick={() => handleFishClick("05")}
                  className={animatingFish === "05" ? "rubberBand animated" : ""}
                  style={{ cursor: "pointer" }}
                />
              </p>
            </div>
          </div>

          {/* ─── STORIES BAR (NHẬT KÝ CABIN) ─── */}
          {boatLogs.length > 0 && (
            <div style={{
              background: "var(--white)",
              borderRadius: "var(--radius-xl)",
              padding: "20px 24px",
              border: "1px solid var(--border-l)",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "30px"
            }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                ⛵ Nhật ký cabin - Tin tức boong tàu trực tiếp
              </h3>
              <div style={{
                display: "flex",
                gap: "18px",
                overflowX: "auto",
                paddingBottom: "8px",
                scrollbarWidth: "thin"
              }}>
                {boatLogs.map((log) => (
                  <div
                    key={log._id}
                    onClick={() => setActiveLog(log)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      width: "82px",
                      textAlign: "center"
                    }}
                  >
                    <div style={{
                      position: "relative",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      padding: "3px",
                      background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                      marginBottom: "6px"
                    }}>
                      <div style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "#fff",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {log.userAvatar ? (
                          <img src={log.userAvatar} alt={log.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--ocean)" }}>
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {log.images && log.images.length > 0 && (
                        <div style={{
                          position: "absolute",
                          bottom: "0",
                          right: "0",
                          background: "#e74c3c",
                          color: "#fff",
                          fontSize: "9px",
                          fontWeight: "700",
                          borderRadius: "99px",
                          padding: "2px 5px",
                          border: "1.5px solid #fff"
                        }}>
                          📷
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "var(--dark)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%"
                    }}>
                      {log.userName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── REDESIGNED FISHERMEN NETWORK & LEADERBOARD ─── */}
          <div style={{
            background: "var(--white)",
            borderRadius: "var(--radius-xl)",
            padding: "36px",
            border: "1px solid var(--border-l)",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px"
          }} className="fade-up">
            <div className={styles.networkGrid}>
              {/* Left Column: Network Map & Fishermen */}
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: "900", color: "var(--dark)", marginBottom: "8px" }}>
                    Bản Đồ Mạng Lưới Ngư Dân Liên Kết
                  </h2>
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                    HảiSản.vn hợp tác trực tiếp với các hộ ngư thuyền đánh bắt tại các vùng vịnh lớn. Click vào đại diện của từng ngư thuyền dưới đây để xem các mẻ lưới tươi rói họ đang chào bán hôm nay.
                  </p>
                </div>

                {/* Fisherman Grid dynamically fetched */}
                <FishermanGrid
                  limit={17}
                  onViewAll={() => vtNavigate("/ngu-dan")}
                />

                <div>
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
                      transition: "var(--transition)"
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

              {/* Right Column: Leaderboard */}
              <div style={{
                borderLeft: "1px solid var(--border-l)",
                paddingLeft: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
              }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#c94f27", marginBottom: "4px", marginTop: 0 }}>
                    🏆 Lão Ngư Xuất Sắc
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: "12px", margin: 0 }}>
                    Vinh danh các tàu cá uy tín bám biển và nhận đánh giá tích cực trong tháng.
                  </p>
                </div>

                {leaderboard.length === 0 ? (
                  <div style={{ padding: "20px 0", color: "var(--muted)", fontSize: "13px", textAlign: "center" }}>
                    Chưa có bảng xếp hạng tháng này.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {leaderboard.slice(0, 5).map((fisher, idx) => {
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
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
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--ocean)"}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-l)"}
                        >
                          <div style={{ fontSize: "18px", fontWeight: "800", width: "20px", textAlign: "center" }}>
                            {medal}
                          </div>

                          <div style={{ position: "relative", width: "36px", height: "36px", flexShrink: 0 }}>
                            {fisher.avatar ? (
                              <img src={fisher.avatar} alt={fisher.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <div style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                background: "var(--ocean-p)",
                                color: "var(--ocean-d)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "700",
                                fontSize: "12px"
                              }}>
                                {fisher.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {fisher.isVerified && (
                              <span style={{
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
                                justifyContent: "center"
                              }}>✓</span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: "12px", color: "var(--dark)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {fisher.name}
                            </strong>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", marginTop: "2px", alignItems: "center" }}>
                              {fisher.avgRating > 0 && (
                                <span style={{ fontSize: "10px", color: "#F59E0B", fontWeight: "700", marginRight: "4px" }}>
                                  ★ {fisher.avgRating}
                                </span>
                              )}
                              {fisher.badges && fisher.badges.slice(0, 1).map((b, bIdx) => (
                                <span key={bIdx} style={{ fontSize: "8px", background: "var(--ocean-p)", color: "var(--ocean-d)", padding: "0px 4px", borderRadius: "4px", fontWeight: "700" }}>
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


          {/* ─── CUSTOMER REVIEWS ─── */}
          <div className="B_waku">
            <div className="B02">

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px", borderBottom: "4px solid #fff", paddingBottom: "10px" }}>
                <span style={{ fontSize: "24px" }}>💬</span>
                <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#0d4f6c", margin: 0 }}>
                  Ý Kiến Phản Hồi Từ Khách Hàng
                </h2>
              </div>

              <ul className="ul01">
                {[
                  {
                    img: "/oishii2_man.png",
                    date: "28/05/2026",
                    title: "Khách hàng tại Hà Nội, Quảng Ninh",
                    text: "— Mình đã mua Cá Thu Tươi Đồ Sơn từ ngư dân Bình. Cá rất béo, ngọt thịt, làm sạch sẽ và hút chân không chu đáo. Gia đình rất thích và ăn hết veo..."
                  },
                  {
                    img: "/oishii6_woman.png",
                    date: "21/05/2026",
                    title: "Khách hàng tại Hải Phòng, Hải Dương",
                    text: "— Tôm hùm bông giao tận nơi vẫn còn bơi khỏe trong túi oxy. Thịt tôm dai ngọt bùi, chế biến tiệc gia đình rất sang và tươi ngon..."
                  },
                  {
                    img: "/oishii2_man.png",
                    date: "14/05/2026",
                    title: "Khách hàng tại TP. Hồ Chí Minh",
                    text: "— Cua gạch son Cà Mau trói dây siêu mỏng, gạch đầy ắp, chắc nịch. Đặt mua từ hôm trước hôm sau đã nhận được hàng đóng thùng xốp chuyên nghiệp..."
                  },
                  {
                    img: "/oishii6_woman.png",
                    date: "07/05/2026",
                    title: "Khách hàng tại Đà Nẵng, Nha Trang",
                    text: "— Cá cơm khô rim tỏi ớt ăn giòn ngon rất đưa cơm. Sản phẩm của ngư dân làm sạch sẽ, đóng gói tiện dụng và an tâm tuyệt đối..."
                  }
                ].map((review, i) => (
                  <li key={i}>
                    <p className="li_img01"><img width="148" height="148" src={review.img} alt="User Avatar" /></p>
                    <p className="li_text01">{review.date}</p>
                    <p className="li_text02"><span style={{ fontWeight: "bold" }}>{review.title}</span></p>
                    <p className="li_text03">{review.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─── SHIPMENT SCHEDULE ─── */}
          <div className="C_waku">

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#c94f27", margin: 0, display: "inline-block", borderBottom: "4px solid #ecd223", paddingBottom: "8px" }}>
                Lịch Khởi Hành & Đánh Bắt Của Ngư Dân
              </h2>
            </div>

            <div className="syukka_yotei">
              <table className="tb01">
                <thead>
                  <tr>
                    <th>Tàu Đánh / Ngư Dân Bản Địa</th>
                    <th>06/03</th>
                    <th>04</th>
                    <th>05</th>
                    <th>06</th>
                    <th>07</th>
                    <th>08</th>
                    <th>09</th>
                    <th>10</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Ngư thuyền bút (Nghệ an)", schedule: ["maru", "maru", "maru", "batu", "maru", "maru", "maru", "maru"] },
                    { name: "HTX Thủy sản tô cường (Côn Đảo)", schedule: ["batu", "batu", "hatena", "maru", "hatena", "maru", "maru", "maru"] },
                    { name: "Công ty Thủy sản thành thuận (Phú Quốc)", schedule: ["batu", "maru", "maru", "maru", "batu", "maru", "maru", "maru"] },
                    { name: "Hộ thủy sản minh đức (Nha Trang)", schedule: ["maru", "maru", "maru", "maru", "batu", "maru", "maru", "maru"] },
                    { name: "Hộ thủy sản nguyễn bá chu (Phan Thiết)", schedule: ["maru", "maru", "maru", "batu", "maru", "maru", "maru", "maru"] },
                    { name: "Ngư thuyền Horyomaru (Miyazaki)", schedule: ["maru", "maru", "maru", "maru", "batu", "maru", "maru", "maru"] },
                    { name: "Ngư thuyền Fudomaru (Quảng Ninh)", schedule: ["batu", "batu", "maru", "maru", "batu", "maru", "maru", "maru"] },
                    { name: "Đầm hào Abe & Tàu Hiryumaru (Hạ Long)", schedule: ["maru", "maru", "batu", "maru", "batu", "maru", "maru", "maru"] }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td><span style={{ fontWeight: "bold", color: "#0b4f6c" }}>{row.name}</span></td>
                      {row.schedule.map((status, j) => (
                        <td key={j} className="td2" style={{ textAlign: "center" }}>
                          <img src={`/t-${status}.png`} width="15px" alt={status} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── FAQs ─── */}
          <div className="F_waku">

            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#0b4f6c", margin: 0, display: "inline-block", borderBottom: "4px solid #0b4f6c", paddingBottom: "6px" }}>
                Hỏi Đáp Thường Gặp (FAQs)
              </h2>
            </div>

            <div className="top_koe1">
              <div className="top_koe2">
                {[
                  {
                    q: "Cách thức đặt hàng hải sản trực tuyến như thế nào?",
                    a: "Bạn có thể duyệt qua trang Sản phẩm hoặc nhấp vào sản phẩm cụ thể để xem chi tiết, liên hệ trực tiếp với ngư dân qua cổng chat để thỏa thuận và tiến hành đặt hàng."
                  },
                  {
                    q: "Tôi có thể chỉ định ngày giờ nhận hàng cụ thể không?",
                    a: "Có, đối với các mặt hàng hỗ trợ chọn ngày, bạn có thể chỉ định thời gian nhận tại ô ghi chú khi đặt hàng hoặc thương lượng trực tiếp qua cổng tin nhắn."
                  },
                  {
                    q: "Có những phương thức thanh toán nào khả dụng?",
                    a: "Chúng tôi hỗ trợ thanh toán đa dạng bao gồm thẻ tín dụng (Visa, Mastercard), thanh toán COD khi nhận hàng từ đơn vị vận chuyển hoặc chuyển khoản ngân hàng trực tiếp."
                  },
                  {
                    q: "Tôi có thể hủy hoặc thay đổi thông tin đơn hàng không?",
                    a: "Trước khi ngư dân tiến hành chuẩn bị đóng gói, bạn có thể hủy đơn hàng qua tài khoản mua hàng hoặc liên hệ trực tiếp qua cổng chat để điều chỉnh thông tin địa chỉ, số điện thoại nhận."
                  },
                  {
                    q: "Hải sản có thể ăn sống (làm sashimi) được không?",
                    a: "Hầu hết hải sản tươi sống được đánh bắt và vận chuyển nhanh ngay trong ngày nên đảm bảo độ tươi tuyệt đối để làm món sashimi. Hãy chú ý xem hướng dẫn chi tiết đi kèm sản phẩm."
                  }
                ].map((faq, i) => (
                  <div key={i} style={{ marginBottom: "25px" }}>
                    <h3 style={{ fontSize: "18px", color: "#c94f27", fontWeight: "bold" }}>Q: {faq.q}</h3>
                    <p style={{ fontSize: "14px", color: "#333", paddingLeft: "10px", borderLeft: "2px solid #ccc", marginTop: "5px" }}>A: {faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Styled CSS Banner */}
            <div style={{
              background: "#208f67",
              color: "#fff",
              padding: "15px 20px",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "14px",
              textAlign: "center",
              margin: "30px auto 10px auto",
              maxWidth: "837px",
              boxShadow: "0 4px 12px rgba(32,143,103,0.15)",
            }}>
              🛡️ CAM KẾT: GIÁ HIỂN THỊ TRÊN HẢISẢN.VN LÀ GIÁ TRỌN GÓI ĐÃ BAO GỒM THUẾ VAT & MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC!
            </div>
          </div>

          {/* ─── MEMBER REGISTRATION / CTA ─── */}
          <div className="G2_waku">
            <div className="G02" style={{ textAlign: "center" }}>

              <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#c94f27", margin: "20px 0" }}>
                Đăng Ký Tài Khoản Thành Viên Miễn Phí
              </h2>

              <ul className="ul01" style={{ display: "flex", justifyContent: "center", gap: "20px", listStyle: "none", padding: 0, margin: "30px 0", flexWrap: "wrap" }}>
                <li style={{ width: "280px", background: "#fff", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                  <div style={{
                    display: "inline-block",
                    background: "#c94f27",
                    color: "#fff",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    fontSize: "18px",
                    fontWeight: "bold",
                    lineHeight: "36px",
                    textAlign: "center",
                    marginBottom: "15px"
                  }}>1</div>
                  <p className="li_text" style={{ fontSize: "14px", color: "#333", lineHeight: "1.5" }}>
                    Nhận cẩm nang hướng dẫn chế biến hải sản tươi ngon miễn phí từ ngư dân ngay sau khi đăng ký!
                  </p>
                </li>
                <li style={{ width: "280px", background: "#fff", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                  <div style={{
                    display: "inline-block",
                    background: "#c94f27",
                    color: "#fff",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    fontSize: "18px",
                    fontWeight: "bold",
                    lineHeight: "36px",
                    textAlign: "center",
                    marginBottom: "15px"
                  }}>2</div>
                  <p className="li_text" style={{ fontSize: "14px", color: "#333", lineHeight: "1.5" }}>
                    Nhận thông tin cập nhật các chuyến tàu cập cảng, các mặt hàng hải sản độc lạ theo mùa.
                  </p>
                </li>
                <li style={{ width: "280px", background: "#fff", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                  <div style={{
                    display: "inline-block",
                    background: "#c94f27",
                    color: "#fff",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    fontSize: "18px",
                    fontWeight: "bold",
                    lineHeight: "36px",
                    textAlign: "center",
                    marginBottom: "15px"
                  }}>3</div>
                  <p className="li_text" style={{ fontSize: "14px", color: "#333", lineHeight: "1.5" }}>
                    Lưu thông tin mua hàng, liên hệ trò chuyện nhanh chóng với ngư dân qua cổng tin nhắn.
                  </p>
                </li>
              </ul>

              {!user ? (
                <div style={{ padding: "20px" }}>
                  <p className="text01" style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                    Chưa có tài khoản? Đăng ký ngay để bắt đầu mua sắm hải sản tươi ngon từ ngư dân bản địa!
                  </p>
                  <button
                    onClick={() => vtNavigate("/dang-nhap")}
                    style={{
                      marginTop: "20px",
                      padding: "12px 40px",
                      borderRadius: "30px",
                      background: "#c94f27",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "bold",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(201,79,39,0.3)"
                    }}
                  >
                    ĐĂNG KÝ / ĐĂNG NHẬP NGAY
                  </button>
                </div>
              ) : (
                <div style={{ padding: "20px" }}>
                  <p className="text01" style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}>
                    Chào mừng bạn trở lại, {user.name}! Bạn có hải sản tươi ngon muốn giới thiệu tới mọi người?
                  </p>
                  <button
                    onClick={() => vtNavigate("/dang-bai")}
                    style={{
                      marginTop: "20px",
                      padding: "12px 40px",
                      borderRadius: "30px",
                      background: "#0b4f6c",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "bold",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(11,79,108,0.3)"
                    }}
                  >
                    Đăng bán sản phẩm ngay
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "30px", flexWrap: "wrap" }}>
                <button
                  onClick={() => vtNavigate("/profile")}
                  style={{ padding: "10px 24px", borderRadius: "20px", background: "#0b4f6c", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}
                >
                  👤 Trang cá nhân (My Page)
                </button>
                <button
                  onClick={() => vtNavigate("/quen-mat-khau")}
                  style={{ padding: "10px 24px", borderRadius: "20px", background: "#666", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}
                >
                  🔑 Cấp lại mật khẩu mới
                </button>
              </div>
            </div>

            {/* Modern HTML Text Link Grid */}
            <div className="G01" style={{ paddingBottom: "40px", maxWidth: "900px", margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px", padding: "0 20px" }}>
                {[
                  { label: "👑 Chế độ thành viên liên kết", url: "/" },
                  { label: "💬 Ý kiến phản hồi khách hàng", url: "/" },
                  { label: "🐟 Tất cả sản phẩm", url: "/san-pham" },
                  { label: "🤝 Đăng ký mở gian hàng ngư dân", url: "/dang-nhap" },
                  { label: "🏢 Về công ty chủ quản", url: "/" },
                  { label: "📰 Báo chí và truyền thông", url: "/" },
                  { label: "🍽️ Địa chỉ nhà hàng hợp tác", url: "/" },
                  { label: "💼 Dành cho khách hàng doanh nghiệp", url: "/" }
                ].map((link, i) => (
                  <button
                    key={i}
                    onClick={() => vtNavigate(link.url)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1.5px solid #ecd223",
                      background: "#fff",
                      color: "#333",
                      fontWeight: "bold",
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlignment: "left",
                      transition: "all 0.2s",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#fffbeb"; e.currentTarget.style.borderColor = "#c94f27"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#ecd223"; }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── H_waku - Thank You ─── */}
          <div className="H_waku">
            <div className="H01" style={{ textAlign: "center" }}>

              <div style={{
                background: "#fff",
                border: "3px solid #208f67",
                borderRadius: "20px",
                padding: "30px",
                maxWidth: "600px",
                margin: "0 auto 30px auto",
                boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                textAlign: "center"
              }}>
                <h3 style={{ fontSize: "32px", fontWeight: "900", color: "#208f67", margin: "0 0 10px 0" }}>
                  THANK YOU!
                </h3>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#333", margin: 0 }}>
                  Chân thành cảm ơn sự tin dùng của Quý khách hàng và các đối tác nhà hàng toàn quốc!
                </p>
              </div>

              HảiSản.vn được sự tin dùng của hơn <span className="color2">1,000</span> nhà hàng và đầu bếp chuyên nghiệp!<br />
              Tổng lượt giao dịch thành công đã vượt mốc <span className="color2">50,000</span> đơn hàng!<br />
              <span className="color3" style={{ fontSize: "36px", fontWeight: "bold" }}>Xin chân thành cảm ơn!</span>
            </div>
          </div>

          {/* ─── I_waku - Greeting ─── */}
          <div className="I_waku" style={{ padding: "60px 0" }}>
            <div className="top_message" style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px" }}>
              <h2>Lời ngỏ từ HảiSản.vn — Kết nối ngư dân và gia đình Việt</h2>
              <p style={{ fontSize: "15px", lineHeight: "1.8", color: "#333" }}>
                Chào bạn, chúng tôi là đội ngũ sáng lập HảiSản.vn. Chúng tôi xây dựng nền tảng này với sứ mệnh mang những mẻ lưới tươi ngon nhất từ boong tàu của ngư dân trực tiếp tới bàn ăn của mọi gia đình.<br /><br />
                Bằng cách kết nối trực tiếp, chúng tôi giúp giảm thiểu các khâu trung gian, đem lại thu nhập xứng đáng hơn cho ngư dân và mang đến nguồn thực phẩm tươi ngon, an toàn với giá hợp lý nhất cho người tiêu dùng.<br /><br />
                Mỗi sản phẩm bạn mua trên HảiSản.vn không chỉ là món ăn ngon cho gia đình, mà còn là sự ủng hộ và trân quý gửi tới những người bám biển quê hương. Chúc bạn có những trải nghiệm ẩm thực tuyệt vời!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ─── BOAT LOG (STORIES) MODAL ─── */}
      {activeLog && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.2s ease"
        }} onClick={() => setActiveLog(null)}>
          <div style={{
            background: "var(--white)",
            borderRadius: "20px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
            position: "relative",
            maxHeight: "90vh",
            overflowY: "auto"
          }} onClick={(e) => e.stopPropagation()}>
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
                lineHeight: 1
              }}
            >
              &times;
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--bg-2)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {activeLog.userAvatar ? (
                  <img src={activeLog.userAvatar} alt={activeLog.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--ocean)" }}>
                    {activeLog.userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <strong style={{ fontSize: "15px", color: "var(--dark)", display: "block" }}>
                  {activeLog.userName}
                </strong>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  ⛵ Nhật ký đăng ngày {new Date(activeLog.createdAt).toLocaleDateString("vi-VN")} lúc {new Date(activeLog.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Content text */}
            <p style={{
              fontSize: "14px",
              color: "var(--text-2)",
              lineHeight: "1.6",
              whiteSpace: "pre-line",
              marginBottom: "16px"
            }}>
              {activeLog.content}
            </p>

            {/* Images Grid */}
            {activeLog.images && activeLog.images.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: activeLog.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                gap: "8px",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "20px"
              }}>
                {activeLog.images.map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt="Cabin Log Pic"
                    style={{ width: "100%", height: activeLog.images.length === 1 ? "auto" : "180px", objectFit: "cover" }}
                  />
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--border-l)",
              paddingTop: "14px"
            }}>
              <button
                onClick={() => handleLikeLog(activeLog._id)}
                style={{
                  background: "none",
                  border: "none",
                  color: logLikes[activeLog._id]?.liked ? "var(--coral)" : "var(--text-2)",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                ❤️ {logLikes[activeLog._id]?.liked ? "Đã thả tim" : "Thả tim"} ({logLikes[activeLog._id]?.count || 0})
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
                  cursor: "pointer"
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
