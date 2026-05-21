import React, { useState } from 'react';
import { C } from '../utils/theme';
import { api, saveToken } from '../services/api';
export function AuthPage({ setUser, setPage }) {
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