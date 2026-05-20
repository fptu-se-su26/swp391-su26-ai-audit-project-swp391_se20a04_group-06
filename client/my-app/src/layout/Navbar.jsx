import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { saveToken, getToken, api } from "../services/api";
import { disconnectSocket, getSocket } from "../services/socket";
import { ChatPopover } from "../components/ChatPopover";
export function Navbar({
  page,
  setPage,
  user,
  setUser,
  unread,
  onOpenGlobalChat,
  setSelectedProduct,
}) {
  const [showChatPopover, setShowChatPopover] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [notifs, setNotifs] = useState([]);

  // Fetch notifications initially
  useEffect(() => {
    if (!user) {
      setNotifs([]);
      return;
    }
    api("/notifications")
      .then((data) => {
        const formatted = data.map((item) => ({
          id: item.id,
          type: item.type,
          preview: item.content,
          productId: item.productId,
          reviewId: item.reviewId || null,
          isRead: !!item.isRead,
          createdAt: item.createdAt,
        }));
        setNotifs(formatted);
      })
      .catch((err) => console.error("Error fetching notifications:", err));
  }, [user]);

  // Real-time socket listener
  useEffect(() => {
    if (!user) return;
    let active = true;
    getSocket(getToken())
      .then((socket) => {
        if (!active) return;
        const handleNotif = (data) => {
          if (data.type === "new_product" || data.type === "new_review") {
            const newNotif = {
              id: data.id || Date.now(),
              type: data.type,
              preview: data.preview || data.content,
              productId: data.productId,
              reviewId: data.reviewId || null,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            setNotifs((prev) => [newNotif, ...prev]);
          }
        };
        socket.on("notification", handleNotif);
        return () => socket.off("notification", handleNotif);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  const handleToggleNotif = () => {
    const nextVal = !showNotifPopover;
    setShowNotifPopover(nextVal);
    if (nextVal && user) {
      api("/notifications/read", { method: "PUT" })
        .then(() => {
          setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
        })
        .catch((err) => console.error("Lỗi khi đánh dấu đã đọc:", err));
    }
  };

  const handleNotifClick = (n) => {
    setShowNotifPopover(false);
    if (n.productId) {
      setSelectedProduct({
        id: n.productId,
        scrollToReviewId: n.reviewId || null,
      });
      setPage("detail");
    }
  };

  const logout = () => {
    saveToken(null);
    disconnectSocket();
    setUser(null);
    setPage("home");
  };
  return (
    <nav
      style={{
        background: C.ocean,
        color: "#fff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        height: 58,
        gap: 8,
        position: "sticky",
        top: 0,
        zIndex: 99,
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
      }}
    >
      <div
        onClick={() => setPage("home")}
        style={{
          fontWeight: 800,
          fontSize: 19,
          cursor: "pointer",
          marginRight: 24,
          whiteSpace: "nowrap",
        }}
      >
        🐟 HảiSản.vn
      </div>
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {[
          ["home", "🏠 Trang chủ"],
          ...(user ? [["dashboard", "📊 Dashboard"]] : []),
          ...(user?.role === "Admin" ? [["admin", "⚙️ Admin"]] : []),
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setPage(k)}
            style={{
              background: page === k ? "rgba(255,255,255,0.2)" : "transparent",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: page === k ? 700 : 400,
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {user && (
          <button
            onClick={() => setPage("post")}
            style={{
              background: C.coral,
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            ＋ Đăng bài
          </button>
        )}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Notification Bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={handleToggleNotif}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔔
              </button>
              {notifs.filter((n) => !n.isRead).length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#EF4444",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {notifs.filter((n) => !n.isRead).length}
                </div>
              )}
              {showNotifPopover && (
                <div
                  style={{
                    position: "absolute",
                    top: 46,
                    right: 0,
                    width: 320,
                    background: "#fff",
                    borderRadius: 14,
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                    border: `1px solid ${C.border}`,
                    animation: "fadeIn 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 18px",
                      background: C.ocean,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Thông báo của bạn</span>
                    {notifs.filter((n) => !n.isRead).length > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "rgba(255,255,255,0.2)",
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}
                      >
                        {notifs.filter((n) => !n.isRead).length} mới
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      maxHeight: 320,
                      overflowY: "auto",
                      background: "#fff",
                    }}
                  >
                    {notifs.length === 0 ? (
                      <div
                        style={{
                          padding: "32px 20px",
                          textAlign: "center",
                          color: C.muted,
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifs.map((n, i) => (
                        <div
                          key={n.id || i}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            padding: "14px 18px",
                            borderBottom: `1px solid ${C.border}`,
                            fontSize: 13,
                            color: C.dark,
                            background: n.isRead
                              ? "#fff"
                              : "rgba(11, 79, 108, 0.04)",
                            position: "relative",
                            transition: "all 0.2s ease",
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                            cursor: n.productId ? "pointer" : "default",
                          }}
                        >
                          <span style={{ fontSize: 16, marginTop: 1 }}>
                            {n.type === "new_review" ? "⭐" : "📢"}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                lineHeight: 1.5,
                                fontWeight: n.isRead ? 400 : 600,
                              }}
                            >
                              {n.preview || n.content}
                            </div>
                            {n.createdAt && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: C.muted,
                                  marginTop: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                🕒{" "}
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                - {new Date(n.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {!n.isRead && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: C.ocean,
                                flexShrink: 0,
                                marginTop: 6,
                              }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowChatPopover(!showChatPopover)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                💬
              </button>
              {unread > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#EF4444",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {unread}
                </div>
              )}
              {showChatPopover && (
                <ChatPopover
                  user={user}
                  onClose={() => setShowChatPopover(false)}
                  onOpenChat={(c) => {
                    setShowChatPopover(false);
                    onOpenGlobalChat(c);
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 13, opacity: 0.9 }}>
              👤 {user.name.split(" ").pop()}
            </span>
            <button
              onClick={logout}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "inherit",
              }}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPage("auth")}
            style={{
              background: "#fff",
              color: C.ocean,
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   PAGE: HOME
═══════════════════════════════════════════ */
function HomePage({ setPage, setSelectedProduct, user }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("fresh");
  const [gps, setGps] = useState({ status: "idle", lat: null, lng: null });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleGps = () => {
    setGps((g) => ({ ...g, status: "loading" }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          localStorage.setItem("seafood_lat", pos.coords.latitude);
          localStorage.setItem("seafood_lng", pos.coords.longitude);
          setGps({
            status: "ok",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => setGps({ status: "denied", lat: null, lng: null }),
      );
    } else setGps({ status: "denied", lat: null, lng: null });
  };

  useEffect(() => {
    const savedLat = localStorage.getItem("seafood_lat");
    const savedLng = localStorage.getItem("seafood_lng");
    if (savedLat && savedLng) {
      setGps({
        status: "ok",
        lat: parseFloat(savedLat),
        lng: parseFloat(savedLng),
      });
    } else {
      handleGps(); // Auto request on first visit
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      type: tab === "fresh" ? "Fresh" : "Dried",
      limit: "50",
    });
    if (search) params.set("search", search);
    if (tab === "fresh" && gps.lat) {
      params.set("lat", gps.lat);
      params.set("lng", gps.lng);
    }

    api(`/products?${params}`)
      .then((data) => {
        if (active) setProducts(data.data || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, search, gps.lat, gps.lng]);

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}
    >
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg,#0B4F6C 0%,#1A7FA0 100%)",
          borderRadius: 16,
          padding: "32px 36px",
          marginBottom: 24,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 40,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 120,
            opacity: 0.12,
            pointerEvents: "none",
          }}
        >
          🌊
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>
          Chợ Hải Sản Online 🐟
        </h1>
        <p
          style={{
            opacity: 0.85,
            margin: "0 0 20px",
            maxWidth: 480,
            fontSize: 14,
          }}
        >
          Mua bán hải sản tươi &amp; khô trực tiếp từ ngư dân. Tươi trong 20km —
          Khô giao toàn quốc.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleGps}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "10px 18px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            {gps.status === "ok"
              ? "✅ GPS đã bật"
              : gps.status === "loading"
                ? "📡 Đang lấy vị trí..."
                : "📍 Bật GPS xem hải sản tươi gần bạn"}
          </button>
          {!user && (
            <button
              onClick={() => setPage("auth")}
              style={{
                background: C.coral,
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              + Đăng bán ngay
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16,
          }}
        >
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm cá thu, tôm hùm, mực khô..."
          style={{
            width: "100%",
            padding: "12px 14px 12px 44px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
            background: C.white,
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 16,
        }}
      >
        {[
          ["fresh", `🌊 Hải sản tươi`],
          ["dried", "🔥 Hải sản khô"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              background:
                tab === k
                  ? k === "fresh"
                    ? "#FDE8E0"
                    : "#FEF5E4"
                  : "transparent",
              color:
                tab === k ? (k === "fresh" ? C.coral : "#8A5C00") : C.muted,
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "fresh" && (
        <div
          style={{
            background: C.oceanP,
            border: `1px solid ${C.oceanL}`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: C.ocean,
          }}
        >
          ℹ️ Chỉ hiển thị bài trong vòng <strong>20km</strong>. Bài tự động ẩn
          sau <strong>24 giờ</strong>.
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
          gap: 16,
        }}
      >
        {loading ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: 60,
              color: C.muted,
            }}
          >
            <div style={{ fontSize: 36 }}>⏳</div>
            <div style={{ marginTop: 12, fontSize: 15 }}>Đang tải...</div>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: 60,
              color: C.muted,
            }}
          >
            <div style={{ fontSize: 52 }}>🔍</div>
            <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>
              Không tìm thấy kết quả
            </div>
          </div>
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={(prod) => {
                setSelectedProduct(prod);
                setPage("detail");
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: PRODUCT DETAIL
═══════════════════════════════════════════ */
function ProductDetailPage({ product: initialProduct, setPage, user }) {
  const [product, setProduct] = useState(initialProduct);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(!initialProduct?.images);

  useEffect(() => {
    if (!initialProduct?.id) {
      setPage("home");
      return;
    }
    // Fetch đầy đủ chi tiết (có images + rating)
    api(`/products/${initialProduct.id}`)
      .then((data) =>
        setProduct({ ...data, description: data.description || data.desc }),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialProduct?.id]);

  if (!product) {
    setPage("home");
    return null;
  }

  const pct = Math.round((product.remainingWeight / product.totalWeight) * 100);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px 80px" }}>
      <button
        onClick={() => setPage("home")}
        style={{
          background: "none",
          border: "none",
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 16,
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        ← Quay lại
      </button>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: C.muted }}>
          ⏳ Đang tải...
        </div>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}
        >
          {/* LEFT */}
          <div>
            <ImageSlider product={product} />
            <div
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: 20,
                marginTop: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  marginBottom: 10,
                  color: C.dark,
                }}
              >
                📝 Mô tả sản phẩm
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: C.text,
                  lineHeight: 1.75,
                  margin: 0,
                }}
              >
                {product.description || "Chưa có mô tả."}
              </p>
              {product.origin && (
                <div style={{ marginTop: 10, fontSize: 13, color: C.muted }}>
                  🏷️ Xuất xứ:{" "}
                  <strong style={{ color: C.text }}>{product.origin}</strong>
                </div>
              )}
              {product.expiryDate && (
                <div style={{ marginTop: 4, fontSize: 13, color: C.muted }}>
                  📅 Hạn sử dụng:{" "}
                  <strong style={{ color: C.text }}>
                    {product.expiryDate}
                  </strong>
                </div>
              )}
            </div>
            {product.type === "Fresh" && product.lat && (
              <div style={{ marginTop: 16 }}>
                <MapMini lat={product.lat} lng={product.lng} />
              </div>
            )}
            {showChat && user && (
              <div style={{ marginTop: 16 }}>
                <ChatBox
                  product={product}
                  onClose={() => setShowChat(false)}
                  user={user}
                />
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div>
            <div
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background:
                      product.type === "Fresh" ? "#FDE8E0" : "#FEF5E4",
                    color: product.type === "Fresh" ? C.coral : C.warn,
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {product.type === "Fresh"
                    ? "🌊 Hải sản Tươi"
                    : "🔥 Hải sản Khô"}
                </span>
                {product.salesType === "Wholesale" && (
                  <span
                    style={{
                      background: C.oceanP,
                      color: C.ocean,
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    📦 Bán Buôn
                  </span>
                )}
              </div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: C.dark,
                  margin: "0 0 12px",
                }}
              >
                {product.name}
              </h1>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: C.coral,
                  marginBottom: 16,
                }}
              >
                {fmt(product.price)}
                <span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>
                  /kg
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 6,
                  }}
                >
                  <span>
                    Còn lại:{" "}
                    <strong style={{ color: C.text }}>
                      {product.remainingWeight}kg
                    </strong>
                  </span>
                  <span>Tổng: {product.totalWeight}kg</span>
                </div>
                <div
                  style={{ height: 8, background: C.border, borderRadius: 4 }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background:
                        pct > 50 ? C.ok : pct > 20 ? C.warn : "#EF4444",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {product.type === "Fresh" && product.catchTime && (
                <div
                  style={{
                    background: C.warnL,
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 12,
                    fontSize: 13,
                  }}
                >
                  ⏱ Bắt lúc:{" "}
                  <strong>
                    {new Date(product.catchTime).toLocaleString("vi")}
                  </strong>
                  <div style={{ marginTop: 4 }}>
                    <CountdownBadge catchTime={product.catchTime} />
                  </div>
                </div>
              )}

              <div
                style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: C.dark,
                    marginBottom: 8,
                  }}
                >
                  👤 Thông tin người bán
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {product.sellerName}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  📞 {product.sellerPhone}
                </div>
                {product.sellerRating > 0 && (
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    ⭐ {parseFloat(product.sellerRating).toFixed(1)} (
                    {product.ratingCount} đánh giá)
                  </div>
                )}
              </div>

              {user ? (
                user.id !== product.sellerId ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <button
                      onClick={() => setShowChat(!showChat)}
                      style={{
                        width: "100%",
                        padding: 13,
                        background: C.ocean,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 15,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      💬 {showChat ? "Đóng chat" : "Liên hệ người bán"}
                    </button>
                    <a
                      href={`tel:${product.sellerPhone}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        width: "100%",
                        padding: 13,
                        background: C.ok,
                        color: "#fff",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        textDecoration: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      📞 Gọi ngay: {product.sellerPhone}
                    </a>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        background: C.oceanP,
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                        color: C.ocean,
                        textAlign: "center",
                      }}
                    >
                      Đây là bài đăng của bạn
                    </div>
                    <button
                      onClick={() => setShowChat(!showChat)}
                      style={{
                        width: "100%",
                        padding: 13,
                        background: C.ocean,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 15,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      💬 {showChat ? "Đóng chat" : "Xem tin nhắn từ người mua"}
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={() => setPage("auth")}
                  style={{
                    width: "100%",
                    padding: 13,
                    background: C.coral,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  🔐 Đăng nhập để liên hệ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: AUTH
═══════════════════════════════════════════ */
function AuthPage({ setUser, setPage }) {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const inp = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!phone || !pw) return setErr("Vui lòng điền đầy đủ thông tin");
    if (!/^0\d{9}$/.test(phone))
      return setErr("Số điện thoại phải là 10 số, bắt đầu bằng 0");
    if (mode === "register" && !name.trim())
      return setErr("Vui lòng nhập họ tên");

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { phone, password: pw }
          : { phone, password: pw, name: name.trim() };
      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      saveToken(data.token);
      setUser(data.user);
      setPage(data.user.role === "Admin" ? "admin" : "home");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 58px)",
        background: "linear-gradient(135deg,#0B4F6C,#1A7FA0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🐟</div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.dark,
              margin: "8px 0 0",
            }}
          >
            HảiSản.vn
          </h1>
          <div
            style={{
              display: "flex",
              gap: 4,
              background: C.bg,
              borderRadius: 10,
              padding: 4,
              marginTop: 20,
            }}
          >
            {[
              ["login", "Đăng nhập"],
              ["register", "Đăng ký"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => {
                  setMode(k);
                  setErr("");
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                  background: mode === k ? C.ocean : "transparent",
                  color: mode === k ? "#fff" : C.muted,
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {mode === "register" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Họ và tên"
              style={inp}
            />
          )}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số điện thoại (VD: 0912345678)"
            style={inp}
            type="tel"
          />
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Mật khẩu"
            style={inp}
            type="password"
          />
          {err && (
            <div
              style={{
                color: C.coral,
                fontSize: 13,
                background: C.coralL,
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 13,
              background: loading ? C.muted : C.ocean,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            {loading
              ? "⏳ Đang xử lý..."
              : `→ ${mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}`}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: POST LISTING
═══════════════════════════════════════════ */
function PostListingPage({ user, setPage }) {
  const [type, setType] = useState("Fresh");
  const [salesType, setSalesType] = useState("Retail");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [desc, setDesc] = useState("");
  const [origin, setOrigin] = useState("");
  const [expiry, setExpiry] = useState("");
  const [catchTime, setCatchTime] = useState("");
  const [gps, setGps] = useState({ status: "idle", lat: null, lng: null });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const inp = {
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const getGps = () => {
    setGps((g) => ({ ...g, status: "loading" }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setGps({
            status: "ok",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => setGps({ status: "denied", lat: null, lng: null }),
      );
    } else setGps({ status: "denied", lat: null, lng: null });
  };

  const submit = async () => {
    setErr("");
    if (!name || !price || !weight)
      return setErr("Vui lòng điền đầy đủ tên, giá và khối lượng");
    if (type === "Fresh" && gps.status !== "ok")
      return setErr("Bắt buộc bật GPS để đăng hải sản tươi");

    setLoading(true);
    try {
      const body = {
        type,
        name,
        description: desc,
        price,
        salesType,
        totalWeight: weight,
        ...(catchTime ? { catchTime } : {}),
        ...(origin ? { origin } : {}),
        ...(expiry ? { expiryDate: expiry } : {}),
        ...(gps.status === "ok" ? { lat: gps.lat, lng: gps.lng } : {}),
      };
      const res = await api("/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const productId = res.productId;

      // Upload ảnh nếu có
      if (images.length > 0) {
        const fd = new FormData();
        images.forEach((f) => fd.append("images", f));
        await api(`/products/${productId}/images`, {
          method: "POST",
          body: fd,
        });
      }
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "60px auto",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: C.okL,
            border: `2px solid ${C.ok}`,
            borderRadius: 16,
            padding: "48px 32px",
          }}
        >
          <div style={{ fontSize: 72 }}>✅</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.ok,
              margin: "16px 0 8px",
            }}
          >
            Đăng bài thành công!
          </h2>
          <p style={{ color: C.muted }}>Bài đăng của bạn đã lên trang chủ.</p>
          <button
            onClick={() => setPage("home")}
            style={{
              marginTop: 20,
              background: C.ocean,
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 15,
              fontFamily: "inherit",
            }}
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 80px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setPage("home")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.ocean,
            fontSize: 22,
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>
          📝 Đăng bài bán hải sản
        </h1>
      </div>

      {/* Type */}
      <section
        style={{
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: 20,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 12,
            color: C.dark,
          }}
        >
          Loại hải sản *
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {[
            [
              "Fresh",
              "🌊 Hải sản TƯƠI",
              "Cần GPS · Hết hạn sau 24h · Chỉ 20km",
              C.coral,
              "#FDE8E0",
            ],
            [
              "Dried",
              "🔥 Hải sản KHÔ",
              "Không cần GPS · Giao toàn quốc",
              C.warn,
              "#FEF5E4",
            ],
          ].map(([k, l, sub, ac, bg]) => (
            <button
              key={k}
              onClick={() => setType(k)}
              style={{
                padding: "16px",
                border: `2px solid ${type === k ? ac : C.border}`,
                borderRadius: 10,
                cursor: "pointer",
                background: type === k ? bg : "transparent",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                {l}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {sub}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* GPS */}
      {type === "Fresh" && (
        <div
          style={{
            background: gps.status === "ok" ? C.okL : C.warnL,
            border: `1px solid ${gps.status === "ok" ? C.ok : C.warn}`,
            borderRadius: 10,
            padding: "13px 16px",
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: gps.status === "ok" ? C.ok : "#92400E",
            }}
          >
            {gps.status === "ok"
              ? `✅ GPS: ${gps.lat?.toFixed(4)}, ${gps.lng?.toFixed(4)}`
              : "⚠️ Bắt buộc bật GPS khi đăng hải sản tươi"}
          </span>
          {gps.status !== "ok" && (
            <button
              onClick={getGps}
              style={{
                background: C.warn,
                color: "#fff",
                border: "none",
                padding: "7px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              {gps.status === "loading" ? "Đang lấy..." : "📍 Bật GPS"}
            </button>
          )}
        </div>
      )}

      {/* Form */}
      <section
        style={{
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: 20,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 14,
            color: C.dark,
          }}
        >
          Thông tin sản phẩm
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên hải sản (VD: Cá Thu, Mực Ống Khô...)"
            style={inp}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Giá (VNĐ/kg)"
              style={inp}
              type="number"
            />
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Khối lượng (kg)"
              style={inp}
              type="number"
            />
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Mô tả (tươi, độ béo, nơi đánh bắt...)"
            rows={3}
            style={{ ...inp, resize: "vertical" }}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {[
              ["Retail", "🛒 Bán lẻ"],
              ["Wholesale", "📦 Bán buôn"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setSalesType(k)}
                style={{
                  padding: "10px",
                  border: `2px solid ${salesType === k ? C.ocean : C.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  background: salesType === k ? C.oceanP : "transparent",
                  fontWeight: 700,
                  fontSize: 13,
                  color: salesType === k ? C.ocean : C.muted,
                  fontFamily: "inherit",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          {type === "Fresh" && (
            <input
              value={catchTime}
              onChange={(e) => setCatchTime(e.target.value)}
              placeholder="Thời gian đánh bắt"
              style={inp}
              type="datetime-local"
            />
          )}
          {type === "Dried" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Xuất xứ (VD: Phú Quốc)"
                style={inp}
              />
              <input
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="Hạn sử dụng"
                style={inp}
                type="date"
              />
            </div>
          )}
        </div>
      </section>

      {/* Images */}
      <section
        style={{
          background: C.white,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: 20,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 12,
            color: C.dark,
          }}
        >
          📸 Ảnh sản phẩm (tối đa 5)
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
          style={{ fontSize: 13 }}
        />
        {images.length > 0 && (
          <div
            style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}
          >
            {images.map((f, i) => (
              <img
                key={i}
                src={URL.createObjectURL(f)}
                alt=""
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {err && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          background: loading ? C.muted : C.coral,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "inherit",
        }}
      >
        {loading ? "⏳ Đang đăng..." : "🚀 Đăng bài ngay"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: DASHBOARD
═══════════════════════════════════════════ */
function DashboardPage({ user, setPage, setSelectedProduct }) {
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [unread, setUnread] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    api("/products/my")
      .then((data) => setListings(data))
      .catch(() => {})
      .finally(() => setLoadingListings(false));
    api("/messages/unread-count")
      .then((data) => setUnread(data.count))
      .catch(() => {});
  }, []);

  const saveWeight = async (productId) => {
    if (!editVal) return;
    setEditLoading(true);
    try {
      await api(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ remainingWeight: parseFloat(editVal) }),
      });
      setListings((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, remainingWeight: parseFloat(editVal) }
            : p,
        ),
      );
      setEditId(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm("Xoá bài đăng này?")) return;
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== productId));
    } catch (e) {
      alert(e.message);
    }
  };

  const activeCount = listings.filter((p) => p.status === "Active").length;
  const totalRemaining = listings.reduce(
    (s, p) => s + (p.remainingWeight || 0),
    0,
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>
          📊 Dashboard — {user.name}
        </h1>
        <button
          onClick={() => setPage("post")}
          style={{
            background: C.coral,
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          ＋ Đăng bài mới
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          ["📦", activeCount, "Bài đang bán", C.ok],
          ["💬", unread, "Tin chưa đọc", C.coral],
          ["⚖️", `${totalRemaining}kg`, "Tổng hàng còn", C.ocean],
        ].map(([ico, val, lbl, col]) => (
          <div
            key={lbl}
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: 22 }}>{ico}</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: col,
                marginTop: 4,
              }}
            >
              {val}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 20,
        }}
      >
        {[
          ["listings", `📦 Bài đã đăng (${listings.length})`],
          ["chats", "💬 Tin nhắn"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.oceanP : "transparent",
              color: tab === k ? C.ocean : C.muted,
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loadingListings ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              ⏳ Đang tải...
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 48 }}>📦</div>
              <div style={{ marginTop: 12 }}>
                Chưa có bài đăng nào.{" "}
                <button
                  onClick={() => setPage("post")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.ocean,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Đăng ngay!
                </button>
              </div>
            </div>
          ) : (
            listings.map((p) => (
              <div
                key={p.id}
                style={{
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {p.coverImg ? (
                  <img
                    src={p.coverImg}
                    alt=""
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{ fontSize: 36, width: 52, textAlign: "center" }}
                  >
                    🐟
                  </span>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.muted,
                      marginTop: 3,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{fmt(p.price)}/kg</span>
                    <span>Còn: {p.remainingWeight}kg</span>
                    {p.type === "Fresh"
                      ? pill("#FDE8E0", "#C0401A", "🌊 Tươi")
                      : pill("#FEF5E4", "#8A5C00", "🔥 Khô")}
                    {p.status !== "Active" &&
                      pill("#FEE2E2", "#991B1B", p.status)}
                  </div>
                </div>
                {editId === p.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      style={{
                        width: 80,
                        padding: "6px 10px",
                        border: `1.5px solid ${C.ocean}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                      type="number"
                      placeholder="KL mới"
                    />
                    <button
                      onClick={() => saveWeight(p.id)}
                      disabled={editLoading}
                      style={{
                        background: C.ok,
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    >
                      ✓ Lưu
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      style={{
                        background: C.bg,
                        color: C.muted,
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditId(p.id);
                      setEditVal(p.remainingWeight);
                    }}
                    style={{
                      background: C.oceanP,
                      color: C.ocean,
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                  >
                    ✏️ Cập nhật KL
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setPage("detail");
                  }}
                  style={{
                    background: C.bg,
                    color: C.ocean,
                    border: `1px solid ${C.border}`,
                    padding: "7px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  Xem →
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  style={{
                    background: "#FEE2E2",
                    color: "#991B1B",
                    border: "none",
                    padding: "7px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "chats" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: 24,
            textAlign: "center",
            color: C.muted,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <div>
            Bấm vào sản phẩm → <strong>Liên hệ người bán</strong> để xem hội
            thoại cụ thể.
          </div>
          {unread > 0 && (
            <div style={{ marginTop: 8, color: C.coral, fontWeight: 700 }}>
              Bạn có {unread} tin nhắn chưa đọc!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE: ADMIN
═══════════════════════════════════════════ */
function AdminPage() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/admin/stats"),
      api("/admin/users"),
      api("/admin/listings"),
    ])
      .then(([s, u, l]) => {
        setStats(s);
        setUsers(u);
        setListings(l);
      })
      .catch((e) => alert("Admin error: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = async (id) => {
    try {
      const res = await api(`/admin/users/${id}/toggle`, { method: "PATCH" });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: res.isActive } : u)),
      );
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Xoá bài đăng này?")) return;
    try {
      await api(`/admin/listings/${id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 80, color: C.muted }}>
        ⏳ Đang tải dữ liệu admin...
      </div>
    );

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 20px 80px" }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: C.dark,
          marginBottom: 20,
        }}
      >
        ⚙️ Trang Quản Trị Admin
      </h1>

      {/* Stats cards */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            [stats.totalUsers, "👥", "Tổng người dùng", C.ocean],
            [
              stats.activeFresh + stats.activeDried,
              "📋",
              "Tổng bài đăng",
              C.ok,
            ],
            [stats.activeFresh, "🌊", "Hải sản tươi", C.coral],
            [stats.activeDried, "🔥", "Hải sản khô", C.warn],
          ].map(([val, ico, lbl, col]) => (
            <div
              key={lbl}
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "18px 20px",
              }}
            >
              <div style={{ fontSize: 22 }}>{ico}</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: col,
                  marginTop: 4,
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {lbl}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 20,
        }}
      >
        {[
          ["stats", "📊 Thống kê"],
          ["users", "👥 Người dùng"],
          ["listings", "📋 Bài đăng"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.ocean : "transparent",
              color: tab === k ? "#fff" : C.muted,
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: 24,
          }}
        >
          <div style={{ fontWeight: 700, color: C.dark, marginBottom: 16 }}>
            Phân bố bài đăng
          </div>
          {[
            [
              "Hải sản tươi",
              stats.activeFresh,
              stats.activeFresh + stats.activeDried,
              C.coral,
            ],
            [
              "Hải sản khô",
              stats.activeDried,
              stats.activeFresh + stats.activeDried,
              C.warn,
            ],
          ].map(([lbl, n, total, col]) => (
            <div key={lbl} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: C.text, fontWeight: 600 }}>{lbl}</span>
                <span style={{ color: C.muted }}>
                  {n} bài ({total > 0 ? Math.round((n / total) * 100) : 0}%)
                </span>
              </div>
              <div style={{ height: 10, background: C.bg, borderRadius: 5 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${total > 0 ? (n / total) * 100 : 0}%`,
                    background: col,
                    borderRadius: 5,
                    transition: "width 0.5s",
                  }}
                />
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 20,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 16,
              display: "flex",
              gap: 20,
            }}
          >
            <div>
              <span style={{ color: C.muted, fontSize: 13 }}>
                Tổng tin nhắn:{" "}
              </span>
              <strong>{stats.totalMessages}</strong>
            </div>
            <div>
              <span style={{ color: C.muted, fontSize: 13 }}>
                Bài hết hạn:{" "}
              </span>
              <strong style={{ color: C.coral }}>{stats.expiredTotal}</strong>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["#", "Tên", "SĐT", "Bài đăng", "Trạng thái", "Thao tác"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: C.muted,
                      fontSize: 13,
                    }}
                  >
                    #{u.id}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {u.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    {u.phone}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    {u.postCount}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.isActive
                      ? pill(C.okL, C.ok, "● Hoạt động")
                      : pill("#FEE2E2", "#991B1B", "● Bị khoá")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => toggleUser(u.id)}
                      style={{
                        background: u.isActive ? "#FEE2E2" : C.okL,
                        color: u.isActive ? "#991B1B" : C.ok,
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      {u.isActive ? "🔒 Khoá" : "🔓 Mở khoá"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "listings" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {[
                  "Sản phẩm",
                  "Loại",
                  "Người bán",
                  "Giá/kg",
                  "Còn lại",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {p.name}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.type === "Fresh"
                      ? pill("#FDE8E0", "#C0401A", "Tươi")
                      : pill("#FEF5E4", "#8A5C00", "Khô")}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    {p.sellerName}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.coral,
                    }}
                  >
                    {fmt(p.price)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    {p.remainingWeight}kg
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      style={{
                        background: "#FEE2E2",
                        color: "#991B1B",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      🗑️ Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [unread, setUnread] = useState(0);
  const [globalChat, setGlobalChat] = useState(null);

  // Load font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Khôi phục session từ localStorage khi load app
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api("/auth/me")
      .then((u) => setUser(u))
      .catch(() => saveToken(null)); // token hết hạn
  }, []);

  // Poll unread count khi đã đăng nhập
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const fetch = () =>
      api("/messages/unread-count")
        .then((d) => setUnread(d.count))
        .catch(() => {});
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleSetUser = (u) => {
    setUser(u);
    if (!u) {
      setUnread(0);
      setPage("home");
      disconnectSocket();
    }
  };

  const safePage = (p) => {
    if ((p === "post" || p === "dashboard") && !user) {
      setPage("auth");
      return;
    }
    if (p === "admin" && user?.role !== "Admin") {
      setPage("auth");
      return;
    }
    setPage(p);
  };

  return (
    <div
      style={{
        fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
        background: C.bg,
        minHeight: "100vh",
      }}
    >
      <Navbar
        page={page}
        setPage={safePage}
        user={user}
        setUser={handleSetUser}
        unread={unread}
        onOpenGlobalChat={setGlobalChat}
        setSelectedProduct={setProduct}
      />
      {page === "home" && (
        <HomePage
          setPage={safePage}
          setSelectedProduct={setProduct}
          user={user}
        />
      )}
      {page === "detail" && (
        <ProductDetailPage product={product} setPage={safePage} user={user} />
      )}
      {page === "auth" && (
        <AuthPage setUser={handleSetUser} setPage={setPage} />
      )}
      {page === "post" && <PostListingPage user={user} setPage={safePage} />}
      {page === "dashboard" && (
        <DashboardPage
          user={user}
          setPage={safePage}
          setSelectedProduct={setProduct}
        />
      )}
      {page === "admin" && <AdminPage />}
      {globalChat && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 320,
            zIndex: 9999,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          }}
        >
          <ChatBox
            product={{
              id: globalChat.productId,
              name: globalChat.productName,
              sellerId: globalChat.otherUserId,
              sellerName: globalChat.otherUserName,
            }}
            user={user}
            onClose={() => setGlobalChat(null)}
          />
        </div>
      )}
    </div>
  );
}
