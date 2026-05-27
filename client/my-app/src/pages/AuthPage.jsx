/**
 * AuthPage.jsx — Minimalist Editorial Version
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { SparklesIcon, AlertCircleIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const navigate = useNavigate();

  // 3. Lấy trực tiếp setUser từ Context thông qua hook useAuth
  const { setUser } = useAuth();

  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Helper tối ưu hóa giao diện Input thủ công
  const inputStyle = (field) => ({
    width: "100%",
    padding: "12px 16px",
    background: "var(--white)",
    border: `1.5px solid ${focusedField === field ? "var(--ocean)" : "var(--border)"}`,
    borderRadius: 8,
    fontSize: 14,
    color: "var(--dark)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow:
      focusedField === field ? "0 0 0 3px rgba(8, 29, 44, 0.08)" : "none",
  });

  // Luồng logic API nguyên bản 100%
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
      setUser(data.user);
      navigate(data.user.role === "Admin" ? "/admin" : "/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: 16,
          padding: "40px 32px",
          width: "100%",
          maxWidth: 400,
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* Logo Mark tối giản tinh tế */}
          <div
            style={{
              width: 56,
              height: 56,
              background: "var(--ocean-p)",
              color: "var(--ocean)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              border: "1px solid rgba(8, 29, 44, 0.08)",
            }}
          >
            <SparklesIcon size={24} />
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--dark)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            HảiSản.vn
          </h1>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 9,
              margin: "4px 0 0",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Tươi từ đại dương
          </p>

          {/* Bộ chuyển Tab dẹt phẳng phong cách hiện đại */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "var(--bg-2)",
              borderRadius: 8,
              padding: 3,
              marginTop: 24,
            }}
          >
            {[
              ["login", "Đăng nhập"],
              ["register", "Đăng ký"],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setMode(k);
                  setErr("");
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 12,
                  fontFamily: "inherit",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  background: mode === k ? "var(--white)" : "transparent",
                  color: mode === k ? "var(--ocean)" : "var(--muted)",
                  boxShadow: mode === k ? "var(--shadow-sm)" : "none",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Form Nhập Liệu ── */}
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {mode === "register" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
              >
                Họ và tên
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                placeholder="Nguyễn Văn A"
                style={inputStyle("name")}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
            >
              Số điện thoại
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              placeholder="0912345678"
              style={inputStyle("phone")}
              type="tel"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}
            >
              Mật khẩu
            </label>
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              style={inputStyle("password")}
              type="password"
            />
          </div>

          {/* Banner báo lỗi mảnh, trực quan */}
          {err && (
            <div
              style={{
                color: "#991b1b",
                fontSize: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderLeft: "3.5px solid #ef4444",
                padding: "10px 12px",
                borderRadius: 6,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                lineHeight: 1.4,
              }}
            >
              <AlertCircleIcon size={14} style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}

          {/* Nút bấm phẳng (Flat premium button) */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "var(--muted)" : "var(--ocean)",
              color: "var(--white)",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              marginTop: 6,
              transition: "background 0.2s, transform 0.1s active",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--ocean-l)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "var(--ocean)";
            }}
          >
            {loading
              ? "⏳ Đang xử lý..."
              : mode === "login"
                ? "Đăng nhập hệ thống"
                : "Xác nhận tạo tài khoản"}
          </button>
        </form>

        {/* Footer bảo mật tối giản */}
        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 11,
            fontWeight: 500,
          }}
        ></div>
      </div>
    </div>
  );
}
