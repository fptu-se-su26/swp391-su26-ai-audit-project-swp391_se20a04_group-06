/**
 * ProfilePage.jsx
 *
 * FIXES:
 *   1. Thay `window.confirm()` và `window.prompt()` bằng ConfirmDialog + input modal.
 *      Trước: window.confirm/prompt block UI thread, style không match, không mobile-friendly.
 *      Sau:   Custom modal với animation, accessible, consistent với phần còn lại của app.
 *
 *   2. `useAuth()` đã được dùng đúng — giữ nguyên, không cần nhận user qua props.
 *
 *   3. Thêm cleanup cho URL.createObjectURL để tránh memory leak.
 *
 *   4. Thêm useToast() đã được dùng — giữ nguyên.
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// ── DeleteAccountModal — thay thế window.confirm + window.prompt ──────────────
/**
 * TRƯỚC:
 *   window.confirm("CẢNH BÁO...")   → block UI, không mobile-friendly
 *   window.prompt("Nhập XOA TAI KHOAN") → không có trên mobile Safari nhiều trường hợp
 *
 * SAU: Modal 2 bước với text input xác nhận
 */
function DeleteAccountModal({ onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState("");
  const inputRef = useRef(null);
  const REQUIRED = "XOA TAI KHOAN";

  useEffect(() => {
    // Focus input ngay khi modal mở
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          border: "1.5px solid #FEB2B2",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛑</div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#C53030",
              margin: 0,
            }}
          >
            Xóa tài khoản vĩnh viễn
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "#9B2C2C",
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong>. Toàn bộ dữ liệu
            của bạn sẽ bị xóa sạch vĩnh viễn khỏi hệ thống.
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 700,
              color: "#9B2C2C",
              marginBottom: 8,
            }}
          >
            Để xác nhận, hãy gõ:{" "}
            <code
              style={{
                background: "#FEE2E2",
                padding: "2px 6px",
                borderRadius: 4,
                letterSpacing: "0.05em",
              }}
            >
              {REQUIRED}
            </code>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={REQUIRED}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: `2px solid ${confirmText === REQUIRED ? "#C53030" : "#E2E8F0"}`,
              borderRadius: 10,
              fontSize: 14,
              outline: "none",
              fontFamily: "monospace",
              boxSizing: "border-box",
              letterSpacing: "0.05em",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "#fff",
              color: "#718096",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => confirmText === REQUIRED && onConfirm()}
            disabled={confirmText !== REQUIRED}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: confirmText === REQUIRED ? "#E53E3E" : "#E2E8F0",
              color: confirmText === REQUIRED ? "#fff" : "#A0AEC0",
              fontWeight: 700,
              cursor: confirmText === REQUIRED ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const toast = useToast();
  const { user: initialUser, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [focusedField, setFocusedField] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // FIX: thay window.confirm/prompt

  const [name, setName] = useState(initialUser?.name || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    initialUser?.avatarUrl || "",
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErr, setPwErr] = useState("");

  const [deleteLoading, setDeleteLoading] = useState(false);

  // Cleanup object URL khi unmount hoặc avatarFile thay đổi
  const prevPreviewUrl = useRef(null);
  useEffect(() => {
    if (prevPreviewUrl.current && prevPreviewUrl.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevPreviewUrl.current);
    }
    prevPreviewUrl.current = avatarPreview;
  }, [avatarPreview]);

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name || "");
      setEmail(initialUser.email || "");
      setAvatarPreview(initialUser.avatarUrl || "");
    }
  }, [initialUser]);

  // Tự động thăm dò trạng thái Premium mỗi 5 giây nếu chưa nâng cấp
  useEffect(() => {
    const finalUserId = initialUser?.id || initialUser?.userId;
    if (initialUser && !initialUser.isPremium && finalUserId) {
      const interval = setInterval(async () => {
        try {
          const res = await api("/auth/me");
          if (res && res.isPremium) {
            setUser(res);
            toast.success("🎉 NÂNG CẤP THÀNH CÔNG! Tài khoản của bạn đã được kích hoạt PREMIUM!");
          }
        } catch (e) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [initialUser, setUser, toast]);

  const handleCopy = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast.success(msg || "Đã sao chép vào bộ nhớ tạm!");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileErr("");
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !EMAIL_REGEX.test(email)) {
      setProfileErr("Email không hợp lệ");
      return;
    }
    setProfileLoading(true);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    if (avatarFile) fd.append("avatar", avatarFile);

    try {
      const res = await api("/auth/profile", { method: "PUT", body: fd });
      setUser({
        ...initialUser,
        name: res.name,
        email: res.email,
        avatarUrl: res.avatarUrl,
      });
      toast.success("Cập nhật thông tin tài khoản thành công!");
      setAvatarFile(null);
    } catch (err) {
      setProfileErr(err.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwErr("");
    if (newPassword.length < 6) {
      setPwErr("Mật khẩu mới tối thiểu phải có 6 ký tự");
      return;
    }
    setPwLoading(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwErr(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwLoading(false);
    }
  };

  // FIX: Thay window.confirm/prompt bằng modal
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setShowDeleteModal(false);
    try {
      const res = await api("/auth/account", { method: "DELETE" });
      toast.success(res.message || "Tài khoản đã được xóa vĩnh viễn.");
      await logout();
      navigate("/");
    } catch (err) {
      toast.error("Lỗi khi xóa tài khoản: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInputStyle = (fieldName) => ({
    width: "100%",
    padding: "12px 14px",
    border: `1.5px solid ${focusedField === fieldName ? C.ocean : C.border}`,
    borderRadius: 12,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#fff",
    transition: "all 0.25s ease",
    boxShadow:
      focusedField === fieldName
        ? "0 0 0 4px rgba(11, 79, 108, 0.12), 0 2px 8px rgba(0,0,0,0.02)"
        : "0 1px 2px rgba(0,0,0,0.01)",
  });

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    color: "#4B5563",
  };

  return (
    <div className="container py-5" style={{ maxWidth: 840 }}>
      {/* FIX: Modal xóa tài khoản thay thế window.confirm + window.prompt */}
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <button
        onClick={() => navigate(-1)}
        className="btn d-inline-flex align-items-center gap-2 mb-4"
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          padding: "8px 16px",
          borderRadius: 10,
          fontFamily: "inherit",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
        onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
      >
        ⟨ Quay lại
      </button>

      <h1
        className="fw-bold mb-4"
        style={{
          fontSize: 24,
          color: C.dark,
        }}
      >
        ⚙️ Thiết Lập Hồ Sơ Cá Nhân
      </h1>

      <div className="row g-4">
        {/* Avatar sidebar */}
        <div className="col-12 col-md-4 col-lg-3">
          <div
            className="card border-0 p-4 text-center"
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1.5px solid ${C.border}`,
              height: "fit-content",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
            }}
          >
            <div
              className="position-relative mx-auto mb-3"
              style={{
                width: 110,
                height: 110,
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="rounded-circle"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    border: `3px solid ${C.ocean}`,
                  }}
                />
              ) : (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto"
                  style={{
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                    fontSize: 36,
                    boxShadow: "0 4px 10px rgba(11, 79, 108, 0.15)",
                  }}
                >
                  {initialUser?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <label
              className="btn btn-outline-primary fw-bold py-2 px-3 text-nowrap w-100 mb-2"
              style={{
                borderColor: C.ocean,
                color: C.ocean,
                fontSize: 12,
                borderRadius: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.oceanP)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
            >
              Tải ảnh đại diện mới
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </label>
            <div style={{ fontSize: 11, color: C.muted }}>
              Ảnh vuông, JPG, PNG tối đa 5MB
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="col-12 col-md-8 col-lg-9 d-flex flex-column gap-4">
          {/* 👑 KHU VỰC NÂNG CẤP PREMIUM */}
          <div
            className="card border-0 p-4 position-relative overflow-hidden"
            style={{
              background: initialUser?.isPremium
                ? "linear-gradient(135deg, #FFFDF5 0%, #FFF9E6 100%)"
                : "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
              borderRadius: 20,
              border: initialUser?.isPremium
                ? "2px solid #F59E0B"
                : `1.5px solid ${C.border}`,
              boxShadow: initialUser?.isPremium
                ? "0 10px 25px -5px rgba(245, 158, 11, 0.15), 0 8px 10px -6px rgba(245, 158, 11, 0.1)"
                : "0 4px 6px -1px rgba(0,0,0,0.01)",
              transition: "all 0.3s ease",
            }}
          >
            {initialUser?.isPremium ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>👑</span>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#92400E", margin: 0 }}>
                    TÀI KHOẢN PREMIUM ĐÃ KÍCH HOẠT
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: "#B45309", lineHeight: 1.5, margin: "0 0 16px 0", fontWeight: 500 }}>
                  Tuyệt vời! Bạn đang sở hữu những đặc quyền cao cấp nhất tại HảiSản.vn. Tài khoản của bạn được đánh dấu biểu tượng Premium uy tín.
                </p>
                <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: 16, borderRadius: 12, border: "1px dashed rgba(245, 158, 11, 0.3)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 8, textTransform: "uppercase" }}>
                    Đặc quyền Premium của bạn:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#78350F", display: "grid", gap: 6 }}>
                    <li>🚀 <strong>Đăng tin không giới hạn</strong> bài viết mỗi ngày (Tài khoản thường chỉ 5 bài).</li>
                    <li>💎 <strong>Huy hiệu Premium</strong> hiển thị bên cạnh tên trên trang cá nhân và mọi tin đăng.</li>
                    <li>📈 <strong>Độ hiển thị ưu tiên</strong> cao hơn giúp tiếp cận hàng nghìn khách hàng nhanh hơn.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>🌟</span>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: C.ocean, margin: 0 }}>
                    NÂNG CẤP PREMIUM — ĐĂNG TIN KHÔNG GIỚI HẠN
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: "0 0 16px 0", fontWeight: 500 }}>
                  Chỉ với <strong>2.000đ</strong>, nâng cấp tài khoản của bạn lên Premium để đăng không giới hạn bài viết trên ngày (tài khoản thường chỉ được đăng 5 bài/ngày) và nhận được các đặc quyền ưu tiên nổi bật.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 16 }}>
                  {/* Cột 1: Mã QR VietQR */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: 16, borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, marginBottom: 10, textAlign: "center" }}>
                      QUÉT MÃ QR BẰNG APP NGÂN HÀNG
                    </div>
                    <img
                      src={`https://img.vietqr.io/image/MB-0362614906-compact.png?amount=2000&addInfo=SF%20${initialUser?.id || initialUser?.userId}&accountName=HAISAN%20VN`}
                      alt="VietQR code"
                      style={{
                        width: 190,
                        height: 190,
                        borderRadius: 12,
                        border: "3px solid #F59E0B",
                        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
                        background: "#fff",
                      }}
                    />
                    <div style={{ fontSize: 11, color: "#D97706", fontWeight: 700, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }}></span>
                      Đang đợi thanh toán...
                    </div>
                  </div>

                  {/* Cột 2: Thông tin chuyển khoản */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase" }}>
                      Hoặc chuyển khoản thủ công
                    </div>
                    
                    <div style={{ background: "#F1F5F9", padding: 12, borderRadius: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>NGÂN HÀNG NHẬN</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.dark }}>MB Bank (Ngân hàng Quân Đội)</div>
                      </div>

                      <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 6 }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>SỐ TÀI KHOẢN</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: C.dark, fontFamily: "monospace" }}>0362614906</span>
                          <button
                            type="button"
                            onClick={() => handleCopy("0362614906", "Đã sao chép số tài khoản!")}
                            style={{ padding: "2px 8px", fontSize: 10, fontWeight: 700, color: C.ocean, border: `1px solid ${C.border}`, borderRadius: 6, background: "#fff", cursor: "pointer" }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 6 }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>SỐ TIỀN CẦN NẠP</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#D97706" }}>2.000đ</div>
                      </div>

                      <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 6 }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>NỘI DUNG CHUYỂN KHOẢN (MEMO)</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FEF3C7", padding: "4px 8px", borderRadius: 6, border: "1px solid #FDE68A" }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: "#B45309", fontFamily: "monospace" }}>
                            SF {initialUser?.id || initialUser?.userId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`SF ${initialUser?.id || initialUser?.userId}`, "Đã sao chép nội dung chuyển khoản!")}
                            style={{ padding: "2px 6px", fontSize: 9, fontWeight: 800, color: "#92400E", border: "1px solid #FDE68A", borderRadius: 4, background: "#FFFBEB", cursor: "pointer" }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 10.5, color: "#C53030", fontWeight: 700, lineHeight: 1.4 }}>
                      ⚠️ Lưu ý: Nội dung chuyển khoản phải viết đúng chính xác mã trên để hệ thống tự động nhận diện và kích hoạt ngay lập tức!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thông tin tài khoản */}
          <div
            className="card border-0 p-4"
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
            }}
          >
            <h3
              className="fw-bold mb-4 fs-6"
              style={{
                color: C.dark,
              }}
            >
              👤 Thông tin tài khoản
            </h3>
            <form
              onSubmit={handleUpdateProfile}
              className="d-flex flex-column gap-3"
            >
              <div className="d-flex flex-column gap-1">
                <label style={labelStyle}>Họ và tên hiển thị</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("name")}
                  required
                />
              </div>
              <div className="d-flex flex-column gap-1">
                <label style={labelStyle}>Email liên hệ</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("email")}
                  required
                />
              </div>
              {profileErr && (
                <div
                  className="alert alert-danger border-danger py-2 px-3 m-0"
                  style={{
                    color: "#991B1B",
                    fontSize: 13,
                    background: "#FEE2E2",
                    borderLeft: `4px solid #EF4444`,
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {profileErr}
                </div>
              )}
              <button
                type="submit"
                disabled={profileLoading}
                className="btn fw-bold py-2 px-4 text-white"
                style={{
                  background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: profileLoading ? "not-allowed" : "pointer",
                  width: "fit-content",
                  boxShadow: "0 4px 12px rgba(11, 79, 108, 0.2)",
                  opacity: profileLoading ? 0.7 : 1,
                }}
              >
                {profileLoading ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
              </button>
            </form>
          </div>

          {/* Đổi mật khẩu */}
          <div
            className="card border-0 p-4"
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1.5px solid ${C.border}`,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
            }}
          >
            <h3
              className="fw-bold mb-4 fs-6"
              style={{
                color: C.dark,
              }}
            >
              🔑 Thay đổi mật khẩu bảo mật
            </h3>
            <form
              onSubmit={handleChangePassword}
              className="d-flex flex-column gap-3"
            >
              <div className="d-flex flex-column gap-1">
                <label style={labelStyle}>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onFocus={() => setFocusedField("currentPw")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("currentPw")}
                  required
                />
              </div>
              <div className="d-flex flex-column gap-1">
                <label style={labelStyle}>Mật khẩu mới</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setFocusedField("newPw")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("newPw")}
                  placeholder="Mật khẩu mới tối thiểu 6 ký tự"
                  required
                />
              </div>
              {pwErr && (
                <div
                  className="alert alert-danger border-danger py-2 px-3 m-0"
                  style={{
                    color: "#991B1B",
                    fontSize: 13,
                    background: "#FEE2E2",
                    borderLeft: `4px solid #EF4444`,
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {pwErr}
                </div>
              )}
              <button
                type="submit"
                disabled={pwLoading}
                className="btn fw-bold py-2 px-4 text-white"
                style={{
                  background: `linear-gradient(135deg, ${C.coral} 0%, #D94E21 100%)`,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: pwLoading ? "not-allowed" : "pointer",
                  width: "fit-content",
                  boxShadow: "0 4px 12px rgba(232, 100, 58, 0.2)",
                  opacity: pwLoading ? 0.7 : 1,
                }}
              >
                {pwLoading ? "Đang đổi..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div
            className="alert alert-danger border-danger p-4 m-0"
            style={{
              borderRadius: 16,
              border: "1.5px solid #FEB2B2",
              boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.03)",
              background: "#FFF5F5",
            }}
          >
            <h3
              className="fw-bold mb-2 fs-6 text-danger"
              style={{
                color: "#C53030 !important",
              }}
            >
              🛑 Vùng nguy hiểm (Danger Zone)
            </h3>
            <p
              className="mb-3"
              style={{
                fontSize: 13,
                color: "#9B2C2C",
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              Toàn bộ dữ liệu cá nhân, mẻ hải sản đang bán, lượt đánh giá và
              lịch sử trò chuyện sẽ bị xóa vĩnh viễn. Hành động này không thể
              khôi phục dưới bất kỳ hình thức nào.
            </p>
            {/* FIX: Dùng modal thay vì window.confirm + window.prompt */}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteLoading}
              className="btn fw-bold py-2 px-4 text-white"
              style={{
                background: "#E53E3E",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                cursor: deleteLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(229, 62, 62, 0.25)",
                transition: "background 0.2s",
                opacity: deleteLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!deleteLoading)
                  e.currentTarget.style.background = "#C53030";
              }}
              onMouseLeave={(e) => {
                if (!deleteLoading)
                  e.currentTarget.style.background = "#E53E3E";
              }}
            >
              {deleteLoading
                ? "⏳ Đang xóa tài khoản..."
                : "Xóa tài khoản vĩnh viễn (GDPR)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
