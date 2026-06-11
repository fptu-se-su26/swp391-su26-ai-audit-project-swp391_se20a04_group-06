import React, { useState, useEffect } from "react";
import { useSEO } from "../hooks/useSEO";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

export function SubscriptionPage() {
  useSEO({
    title: "Chợ Định Kỳ - Đăng Ký Hải Sản Hàng Tuần | HảiSản.vn",
    description: "Nhận hộp hải sản tươi ngon nhất từ các tàu cá được giao định kỳ trực tiếp đến nhà bạn.",
  });

  const { user } = useAuth();
  const { addToast } = useToast();

  const [mySubs, setMySubs] = useState([]);
  const [loadingMySubs, setLoadingMySubs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedPackage, setSelectedPackage] = useState("Small");
  const [frequency, setFrequency] = useState("Monthly");
  const [preferredDay, setPreferredDay] = useState("Saturday");
  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const packages = [
    {
      id: "Small",
      name: "Hộp Hải Sản Nhỏ",
      price: "500.000",
      target: "1 - 2 người",
      desc: "Lựa chọn tuyệt vời cho các bữa ăn hàng ngày. Gồm các loại cá nhỏ, mực lá và nghêu sò theo mùa.",
      color: "var(--ocean-l)",
    },
    {
      id: "Medium",
      name: "Hộp Hải Sản Vừa",
      price: "900.000",
      target: "3 - 4 người",
      desc: "Gói gia đình tiêu chuẩn. Gồm cá biển fillet cao cấp, mực ống lớn, tôm sú sống và ghẹ xanh biển ngon.",
      color: "var(--ocean)",
      popular: true,
    },
    {
      id: "Large",
      name: "Hộp Thượng Hạng",
      price: "1.500.000",
      target: "5 - 6 người",
      desc: "Trải nghiệm ẩm thực biển xa xỉ tại gia. Đa dạng hải sản đặc sản hiếm: Tôm hùm baby, mực khổng lồ, cá bớp cắt khúc dày.",
      color: "var(--dark)",
    },
  ];

  const fetchMySubscriptions = async () => {
    if (!user) return;
    setLoadingMySubs(true);
    try {
      const data = await api("/subscriptions/my");
      setMySubs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMySubs(false);
    }
  };

  useEffect(() => {
    fetchMySubscriptions();
    if (user) {
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast("Vui lòng đăng nhập để đăng ký gói hải sản định kỳ", "warn");
      return;
    }
    if (!shippingAddress.trim() || !phone.trim()) {
      addToast("Vui lòng nhập địa chỉ và số điện thoại giao hàng", "warn");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api("/subscriptions", {
        method: "POST",
        body: {
          packageType: selectedPackage,
          frequency,
          preferredDay,
          shippingAddress,
          phone,
          note,
        },
      });
      addToast(res.message || "Đăng ký thành công!", "success");
      fetchMySubscriptions();
      setNote("");
      // Reset form scroll to subscriptions list
      const listEl = document.getElementById("my-subscriptions-section");
      if (listEl) {
        listEl.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      addToast(err.message || "Có lỗi xảy ra khi đăng ký", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (subId, newStatus) => {
    try {
      const res = await api(`/subscriptions/${subId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      addToast(res.message || "Cập nhật thành công!", "success");
      fetchMySubscriptions();
    } catch (err) {
      addToast(err.message || "Có lỗi xảy ra", "error");
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case "Pending": return { label: "Chờ xác nhận", color: "var(--warn)", bg: "var(--warn-l)" };
      case "Active": return { label: "Đang hoạt động", color: "var(--ok)", bg: "var(--ok-l)" };
      case "Paused": return { label: "Đang tạm dừng", color: "var(--muted)", bg: "#ebf0f7" };
      case "Cancelled": return { label: "Đã hủy", color: "#e74c3c", bg: "#fceae9" };
      default: return { label: status, color: "#333", bg: "#eee" };
    }
  };

  const translateFrequency = (freq) => {
    switch (freq) {
      case "Weekly": return "Hàng tuần";
      case "BiWeekly": return "Cách tuần (2 tuần/lần)";
      case "Monthly": return "Hàng tháng";
      default: return freq;
    }
  };

  return (
    <div className="page-wrap-lg fade-up">
      {/* Intro Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ fontSize: "2.4rem", fontWeight: "900", color: "var(--dark)", marginBottom: "16px" }}>
          Chợ Định Kỳ - Hộp Hải Sản Omakase
        </h1>
        <p style={{ maxWidth: "700px", margin: "0 auto", color: "var(--muted)", fontSize: "16px", lineHeight: "1.6" }}>
          Đăng ký nhận hộp hải sản tươi sạch tự nhiên từ tàu cá giao định kỳ đến tận nhà. Ngư dân tuyển chọn loại ngon nhất theo mùa mẻ lưới hôm đó, sơ chế sạch sẽ bọc đá lạnh sâu sẵn sàng chế biến.
        </p>
      </div>

      {/* Package Pricing Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        marginBottom: "56px"
      }}>
        {packages.map((pkg) => (
          <div key={pkg.id} style={{
            background: "var(--white)",
            borderRadius: "var(--radius-xl)",
            border: selectedPackage === pkg.id 
              ? `2px solid ${pkg.color}` 
              : "2px solid transparent",
            boxShadow: selectedPackage === pkg.id ? "var(--shadow-xl)" : "var(--shadow-md)",
            padding: "36px 28px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.3s ease",
            cursor: "pointer",
            transform: selectedPackage === pkg.id ? "translateY(-4px)" : "translateY(0)"
          }}
          onClick={() => setSelectedPackage(pkg.id)}>
            {pkg.popular && (
              <span style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "var(--coral)",
                color: "var(--white)",
                padding: "4px 12px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: "700"
              }}>ĐƯỢC ƯA CHUỘNG NHẤT</span>
            )}
            
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--dark)", marginBottom: "8px" }}>
                {pkg.name}
              </h3>
              <span style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "20px" }}>
                Thích hợp cho {pkg.target}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: "20px" }}>
                <span style={{ fontSize: "32px", fontWeight: "900", color: pkg.color }}>{pkg.price}</span>
                <span style={{ fontSize: "14px", color: "var(--muted)", marginLeft: "4px" }}>đ / giao hàng</span>
              </div>
              <p style={{ color: "var(--text-2)", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                {pkg.desc}
              </p>
            </div>

            <button style={{
              width: "100%",
              padding: "12px",
              borderRadius: "99px",
              border: `1.5px solid ${pkg.color}`,
              background: selectedPackage === pkg.id ? pkg.color : "transparent",
              color: selectedPackage === pkg.id ? "var(--white)" : pkg.color,
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              transition: "var(--transition)"
            }}>
              {selectedPackage === pkg.id ? "Đã Chọn Gói Này" : "Chọn Gói Này"}
            </button>
          </div>
        ))}
      </div>

      {/* Main Container: Form on left, User's subs on right */}
      <div style={{
        display: "grid",
        gridTemplateColumns: user ? "1.2fr 1fr" : "1fr",
        gap: "40px",
        alignItems: "start",
        marginBottom: "80px"
      }}>
        {/* Registration Form */}
        <div style={{
          background: "var(--white)",
          borderRadius: "var(--radius-xl)",
          padding: "36px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)"
        }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--dark)", marginBottom: "24px" }}>
            Thông Tin Đăng Ký Hải Sản Định Kỳ
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>
                Gói hải sản đã chọn
              </label>
              <select 
                value={selectedPackage} 
                onChange={(e) => setSelectedPackage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  fontSize: "14px",
                  background: "var(--bg)",
                  outline: "none"
                }}
              >
                <option value="Small">Hộp Nhỏ - 500.000đ / lần</option>
                <option value="Medium">Hộp Vừa - 900.000đ / lần</option>
                <option value="Large">Hộp Thượng Hạng - 1.500.000đ / lần</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>
                  Tần suất giao hàng
                </label>
                <select 
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "14px",
                    background: "var(--bg)",
                    outline: "none"
                  }}
                >
                  <option value="Weekly">Hàng tuần</option>
                  <option value="BiWeekly">Cách tuần (2 tuần/lần)</option>
                  <option value="Monthly">Hàng tháng</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>
                  Ngày giao mong muốn
                </label>
                <select 
                  value={preferredDay} 
                  onChange={(e) => setPreferredDay(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "14px",
                    background: "var(--bg)",
                    outline: "none"
                  }}
                >
                  <option value="Monday">Thứ Hai</option>
                  <option value="Wednesday">Thứ Tư</option>
                  <option value="Friday">Thứ Sáu</option>
                  <option value="Saturday">Thứ Bảy</option>
                  <option value="Sunday">Chủ Nhật</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>
                Số điện thoại liên hệ
              </label>
              <input 
                type="text" 
                placeholder="Nhập số điện thoại nhận hàng"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  fontSize: "14px",
                  background: "var(--bg)",
                  outline: "none"
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>
                Địa chỉ giao hàng (nội thành)
              </label>
              <input 
                type="text" 
                placeholder="Nhập địa chỉ nhà riêng hoặc văn phòng"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  fontSize: "14px",
                  background: "var(--bg)",
                  outline: "none"
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>
                Ghi chú thêm (dị ứng cá/hải sản cụ thể, giờ giao...)
              </label>
              <textarea 
                rows="3"
                placeholder="Ví dụ: Không lấy cá nục, giao vào buổi sáng trước 11h..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  fontSize: "14px",
                  background: "var(--bg)",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{
                background: "var(--coral)",
                color: "var(--white)",
                border: "none",
                borderRadius: "99px",
                padding: "14px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(232, 100, 58, 0.35)",
                marginTop: "10px",
                transition: "var(--transition)"
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {submitting ? "Đang gửi đăng ký..." : "Gửi Đăng Ký Định Kỳ"}
            </button>
          </form>
        </div>

        {/* User's Current Subscriptions */}
        {user && (
          <div id="my-subscriptions-section" style={{
            background: "var(--white)",
            borderRadius: "var(--radius-xl)",
            padding: "36px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)"
          }}>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--dark)", marginBottom: "24px" }}>
              Gói Đăng Ký Của Tôi
            </h2>

            {loadingMySubs ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                Đang tải danh sách đăng ký...
              </div>
            ) : mySubs.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--muted)",
                background: "var(--bg)",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--border)"
              }}>
                <span style={{ fontSize: "40px", display: "block", marginBottom: "16px" }}>📦</span>
                Bạn chưa đăng ký gói hải sản định kỳ nào. Chọn gói phía trên và đăng ký ngay!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {mySubs.map((sub) => {
                  const statusInfo = translateStatus(sub.status);
                  return (
                    <div key={sub._id} style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      padding: "20px",
                      position: "relative"
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px"
                      }}>
                        <div>
                          <strong style={{ fontSize: "16px", color: "var(--dark)", display: "block" }}>
                            {sub.packageType === "Small" ? "Hộp Hải Sản Nhỏ" : sub.packageType === "Medium" ? "Hộp Hải Sản Vừa" : "Hộp Thượng Hạng"}
                          </strong>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            Đăng ký ngày: {new Date(sub.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: statusInfo.color,
                          background: statusInfo.bg,
                          padding: "4px 10px",
                          borderRadius: "99px"
                        }}>{statusInfo.label}</span>
                      </div>

                      <div style={{
                        fontSize: "13px",
                        color: "var(--text-2)",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginBottom: "16px"
                      }}>
                        <div>
                          <strong>Tần suất:</strong> {translateFrequency(sub.frequency)}
                        </div>
                        <div>
                          <strong>Ngày giao:</strong> Thứ {sub.preferredDay === "Monday" ? "Hai" : sub.preferredDay === "Wednesday" ? "Tư" : sub.preferredDay === "Friday" ? "Sáu" : sub.preferredDay === "Saturday" ? "Bảy" : "Chủ Nhật"}
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <strong>Địa chỉ:</strong> {sub.shippingAddress}
                        </div>
                        {sub.nextDeliveryDate && (
                          <div style={{ gridColumn: "span 2", color: "var(--ok)", fontWeight: "600" }}>
                            📅 Giao tiếp theo: {new Date(sub.nextDeliveryDate).toLocaleDateString("vi-VN")}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: "10px", borderTop: "1px solid var(--border-l)", paddingTop: "12px" }}>
                        {sub.status === "Active" && (
                          <button 
                            onClick={() => handleUpdateStatus(sub._id, "Paused")}
                            style={{
                              background: "none",
                              border: "1px solid var(--muted)",
                              color: "var(--muted)",
                              borderRadius: "99px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "var(--transition)"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#eee"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                          >
                            Tạm Dừng
                          </button>
                        )}
                        {sub.status === "Paused" && (
                          <button 
                            onClick={() => handleUpdateStatus(sub._id, "Active")}
                            style={{
                              background: "none",
                              border: "1px solid var(--ok)",
                              color: "var(--ok)",
                              borderRadius: "99px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "var(--transition)"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ok-l)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                          >
                            Kích Hoạt Lại
                          </button>
                        )}
                        {sub.status !== "Cancelled" && (
                          <button 
                            onClick={() => {
                              if (window.confirm("Bạn có chắc chắn muốn hủy gói đăng ký định kỳ này không?")) {
                                handleUpdateStatus(sub._id, "Cancelled");
                              }
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #e74c3c",
                              color: "#e74c3c",
                              borderRadius: "99px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontWeight: "600",
                              marginLeft: "auto",
                              cursor: "pointer",
                              transition: "var(--transition)"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fceae9"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                          >
                            Hủy Gói
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
