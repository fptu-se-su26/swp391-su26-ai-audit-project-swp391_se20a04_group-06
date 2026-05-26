/**
 * ProfilePage.jsx — Modernized Account Settings Page
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";

export function ProfilePage({ user, setUser }) {
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);

  // States thông tin cá nhân
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  // States đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setAvatarPreview(user.avatarUrl || "");
    }
  }, [user]);

  // Xử lý xem trước ảnh khi chọn từ máy
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Cập nhật tên, SĐT và tải Avatar lên Cloudinary
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileErr("");
    if (phone && !/^0\d{9}$/.test(phone)) {
      setProfileErr("Số điện thoại phải là 10 chữ số và bắt đầu bằng 0");
      return;
    }
    setProfileLoading(true);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("phone", phone);
    if (avatarFile) {
      fd.append("avatar", avatarFile); // Gửi file ảnh lên server xử lý Cloudinary
    }

    try {
      const res = await api("/auth/profile", {
        method: "PUT",
        body: fd, // FormData tự động set content-type là multipart/form-data
      });
      // Đồng bộ hóa trạng thái User trên toàn App
      setUser({
        ...user,
        name: res.name,
        phone: res.phone,
        avatarUrl: res.avatarUrl,
      });
      alert("Cập nhật thông tin tài khoản thành công!");
      setAvatarFile(null);
    } catch (err) {
      setProfileErr(err.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setProfileLoading(false);
    }
  };

  // Đổi mật khẩu bảo mật
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
      alert("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwErr(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwLoading(false);
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

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          color: C.ocean,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 24,
          padding: "8px 16px",
          borderRadius: 10,
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F1F5F9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = C.white;
        }}
      >
        ⟨ Quay lại
      </button>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: C.dark,
          marginBottom: 28,
        }}
      >
        ⚙️ Thiết Lập Hồ Sơ Cá Nhân
      </h1>

      {/* Grid chia 2 cột: Trái là Ảnh đại diện, Phải là Form chi tiết */}
      <div
        className="profile-grid"
        style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32 }}
      >
        {/* CỘT TRÁI: THAY ĐỔI AVATAR */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            padding: "24px 20px",
            textAlign: "center",
            height: "fit-content",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 110,
              height: 110,
              margin: "0 auto 16px",
            }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${C.ocean}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 36,
                  boxShadow: "0 4px 10px rgba(11, 79, 108, 0.15)",
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <label
            style={{
              display: "inline-block",
              background: C.white,
              color: C.ocean,
              border: `1px solid ${C.ocean}`,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
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
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
            Ảnh vuông, JPG, PNG tối đa 5MB
          </div>
        </div>

        {/* CỘT PHẢI: FORM CHỈNH SỬA CHI TIẾT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* PHÂN KHU 1: THÔNG TIN HỒ SƠ */}
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: 28,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                fontSize: 15,
                fontWeight: 800,
                color: C.dark,
              }}
            >
              👤 Thông tin tài khoản
            </h3>
            <form
              onSubmit={handleUpdateProfile}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label style={labelStyle}>Họ và tên hiển thị</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("name")}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Số điện thoại liên hệ</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("phone")}
                  required
                />
              </div>

              {profileErr && (
                <div
                  style={{
                    color: "#991B1B",
                    fontSize: 13,
                    background: "#FEE2E2",
                    borderLeft: `4px solid #EF4444`,
                    padding: "10px 14px",
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
                style={{
                  background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "fit-content",
                  boxShadow: "0 4px 12px rgba(11, 79, 108, 0.2)",
                }}
              >
                {profileLoading ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
              </button>
            </form>
          </div>

          {/* PHÂN KHU 2: ĐỔI MẬT KHẨU */}
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: 28,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                fontSize: 15,
                fontWeight: 800,
                color: C.dark,
              }}
            >
              🔑 Thay đổi mật khẩu bảo mật
            </h3>
            <form
              onSubmit={handleChangePassword}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label style={labelStyle}>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onFocus={() => setFocusedField("currentPw")}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle("currentPw")}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Mật khẩu mới</label>
                <input
                  type="password"
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
                  style={{
                    color: "#991B1B",
                    fontSize: 13,
                    background: "#FEE2E2",
                    borderLeft: `4px solid #EF4444`,
                    padding: "10px 14px",
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
                style={{
                  background: `linear-gradient(135deg, ${C.coral} 0%, #D94E21 100%)`,
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "fit-content",
                  boxShadow: "0 4px 12px rgba(232, 100, 58, 0.2)",
                }}
              >
                {pwLoading ? "Đang đổi..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Style responsive cho màn hình di động */}
      <style>{`
        @media (max-width: 640px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 6,
  color: "#4B5563",
};
