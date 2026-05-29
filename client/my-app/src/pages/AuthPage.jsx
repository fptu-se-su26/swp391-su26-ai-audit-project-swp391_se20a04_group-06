/**
 * AuthPage.jsx — Minimalist Editorial Version
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { SparklesIcon, AlertCircleIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showMockGooglePopup, setShowMockGooglePopup] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is missing. Mock Google Sign-In button will be active.");
      return;
    }

    const initGoogleGis = () => {
      if (typeof window.google === "undefined") {
        setTimeout(initGoogleGis, 100);
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        const btnDiv = document.getElementById("google-signin-btn");
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "outline",
            size: "large",
            width: btnDiv.clientWidth || 336,
            text: "signin_with",
            shape: "rectangular",
          });
        }

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log("One Tap not displayed:", notification.getNotDisplayedReason());
          }
        });
      } catch (error) {
        console.error("Failed to initialize Google Identity Services:", error);
      }
    };

    initGoogleGis();
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setErr("");
    try {
      const data = await api("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken: response.credential }),
      });
      setUser(data.user);
      navigate(data.user.role === "Admin" ? "/admin" : "/");
    } catch (e) {
      setErr(e.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = () => {
    setShowMockGooglePopup(true);
  };

  const selectMockAccount = async (email, name) => {
    setShowMockGooglePopup(false);
    setLoading(true);
    setErr("");
    try {
      const data = await api("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          idToken: `mock_google_token_${email.toLowerCase().trim()}_${Date.now()}`
        }),
      });
      setUser(data.user);
      navigate(data.user.role === "Admin" ? "/admin" : "/");
    } catch (e) {
      setErr(e.message || "Giả lập đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleMockOtherAccount = async () => {
    const mockEmail = window.prompt("Nhập email Google muốn giả lập đăng nhập:", "nguyenvana@gmail.com");
    if (!mockEmail) return;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(mockEmail)) {
      alert("Email không hợp lệ!");
      return;
    }
    await selectMockAccount(mockEmail, `Mock User (${mockEmail.split("@")[0]})`);
  };

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

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !pw) return setErr("Vui lòng điền đầy đủ thông tin");
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email))
      return setErr("Email không hợp lệ");
    if (mode === "register" && !name.trim())
      return setErr("Vui lòng nhập họ tên");

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { email, password: pw }
          : { email, password: pw, name: name.trim() };
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
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4"
      style={{
        backgroundColor: "var(--bg)",
      }}
    >
      <div
        className="card border-0 p-4 p-sm-5 w-100"
        style={{
          background: "var(--white)",
          borderRadius: 16,
          maxWidth: 400,
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ── */}
        <div className="text-center mb-4">
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{
              width: 56,
              height: 56,
              background: "var(--ocean-p)",
              color: "var(--ocean)",
              borderRadius: 12,
              border: "1px solid rgba(8, 29, 44, 0.08)",
            }}
          >
            <SparklesIcon size={24} />
          </div>

          <h1
            className="fw-bold m-0"
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--dark)",
              letterSpacing: "-0.02em",
            }}
          >
            HảiSản.vn
          </h1>
          <p
            className="m-0 mt-1 fw-bold text-uppercase"
            style={{
              color: "var(--muted)",
              fontSize: 9,
              letterSpacing: "0.15em",
            }}
          >
            Tươi từ đại dương
          </p>

          <div
            className="d-flex gap-1 p-1 mt-4"
            style={{
              background: "var(--bg-2)",
              borderRadius: 8,
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
                className={`btn w-100 fw-bold border-0 py-2 ${mode === k ? "shadow-sm" : ""}`}
                style={{
                  flex: 1,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  background: mode === k ? "var(--white)" : "transparent",
                  color: mode === k ? "var(--ocean)" : "var(--muted)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={submit}
          className="d-flex flex-column gap-3"
        >
          {mode === "register" && (
            <div className="d-flex flex-column gap-1">
              <label
                className="fw-bold"
                style={{ fontSize: 11, color: "var(--muted)" }}
              >
                Họ và tên
              </label>
              <input
                className="form-control border-0"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                placeholder="Nguyễn Văn A"
                style={inputStyle("name")}
              />
            </div>
          )}

          <div className="d-flex flex-column gap-1">
            <label
              className="fw-bold"
              style={{ fontSize: 11, color: "var(--muted)" }}
            >
              Địa chỉ Email
            </label>
            <input
              className="form-control border-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              placeholder="nguyenvana@gmail.com"
              style={inputStyle("email")}
              type="email"
            />
          </div>

          <div className="d-flex flex-column gap-1">
            <div className="d-flex justify-content-between align-items-center">
              <label
                className="fw-bold"
                style={{ fontSize: 11, color: "var(--muted)" }}
              >
                Mật khẩu
              </label>
              {mode === "login" && (
                <Link
                  to="/quen-mat-khau"
                  className="text-decoration-none fw-semibold"
                  style={{
                    fontSize: 11,
                    color: "var(--ocean)",
                  }}
                >
                  Quên mật khẩu?
                </Link>
              )}
            </div>
            <input
              className="form-control border-0"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              style={inputStyle("password")}
              type="password"
            />
          </div>

          {err && (
            <div
              className="alert alert-danger border-danger d-flex align-items-center gap-2 py-2 px-3 m-0"
              style={{
                color: "#991b1b",
                fontSize: 12,
                background: "#fef2f2",
                borderLeft: "3.5px solid #ef4444",
                borderRadius: 6,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              <AlertCircleIcon size={14} className="flex-shrink-0" />
              <span>{err}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn w-100 fw-bold py-2 mt-2"
            style={{
              background: loading ? "var(--muted)" : "var(--ocean)",
              color: "var(--white)",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontFamily: "inherit",
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

          {/* Divider */}
          <div className="d-flex align-items-center gap-2 my-2">
            <div className="flex-grow-1" style={{ height: 1, background: "var(--border)" }} />
            <span className="fw-semibold" style={{ fontSize: 12, color: "var(--muted)" }}>Hoặc</span>
            <div className="flex-grow-1" style={{ height: 1, background: "var(--border)" }} />
          </div>

          {/* Google Sign In Container */}
          <div id="google-signin-btn" className="w-100 d-flex justify-content-center mb-1" />

          {/* Mock Google Login Button */}
          <button
            type="button"
            onClick={handleMockGoogleLogin}
            disabled={loading}
            className="btn w-100 fw-bold py-2 d-flex align-items-center justify-content-center gap-2"
            style={{
              background: "#fff",
              color: "#4B5563",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#F9FAFB";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#fff";
            }}
          >
            <span>💬 Mock Google Login (Test nhanh)</span>
          </button>
        </form>

        <div className="mt-4 text-center" style={{ color: "var(--muted)", fontSize: 11 }}></div>
      </div>

      {/* ── HIGH FIDELITY MOCK GOOGLE ACCOUNT CHOOSER POPUP ── */}
      {showMockGooglePopup && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            background: "rgba(0, 0, 0, 0.65)",
            zIndex: 99999,
            fontFamily: "'Segoe UI', Roboto, sans-serif",
          }}
          onClick={() => setShowMockGooglePopup(false)}
        >
          <div
            className="card border-0 w-100"
            style={{
              background: "#1E1E1E",
              color: "#E3E3E3",
              borderRadius: 8,
              maxWidth: 440,
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
              boxSizing: "border-box",
              overflow: "hidden",
              border: "1px solid #333333",
              textAlign: "left",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edge Window titlebar mockup */}
            <div
              className="d-flex align-items-center justify-content-between px-3 py-2"
              style={{
                background: "#2D2D2D",
                fontSize: 12,
                color: "#CCCCCC",
                borderBottom: "1px solid #333333",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bolder" style={{ color: "#4285F4" }}>G</span>
                <span>Đăng nhập - Tài khoản Google - Personal - Microsoft Edge</span>
              </div>
              <button
                onClick={() => setShowMockGooglePopup(false)}
                className="btn border-0 p-0 text-secondary bg-transparent"
                style={{
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            {/* Google Identity Header */}
            <div className="p-4 p-sm-5 pt-4 pb-3">
              <div className="d-flex align-items-center gap-2 fw-semibold mb-3 text-white" style={{ fontSize: 14 }}>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bolder bg-white text-primary"
                  style={{
                    width: 24,
                    height: 24,
                    fontSize: 14,
                  }}
                >
                  G
                </div>
                <span>Đăng nhập bằng Google</span>
              </div>

              <h2
                className="fw-normal mb-1 text-white"
                style={{
                  fontSize: 24,
                }}
              >
                Chọn tài khoản
              </h2>
              <p className="mb-4" style={{ fontSize: 14, color: "#9AA0A6" }}>
                Tiếp tục tới <span style={{ color: "#8AB4F8", fontWeight: 600 }}>HảiSản.vn</span>
              </p>

              {/* Accounts List */}
              <div
                className="d-flex flex-column border-top border-bottom py-1"
                style={{
                  borderColor: "#3C4043 !important",
                  margin: "0 -2.5rem", // offset the card padding on the list to make active background full-width
                }}
              >
                {[
                  {
                    name: "but daudau",
                    email: "daudaubut@gmail.com",
                    initial: "b",
                    color: "#1A73E8",
                  },
                  {
                    name: "Dau Dinh But (K18 HL)",
                    email: "butddhe186165@fpt.edu.vn",
                    initial: "D",
                    color: "#5F6368",
                    logout: true,
                  },
                  {
                    name: "viet but",
                    email: "daudinhbutql2003@gmail.com",
                    initial: "v",
                    color: "#188038",
                  },
                  {
                    name: "but daudaudaau",
                    email: "daudaudaubut@gmail.com",
                    initial: "b",
                    color: "#8430DE",
                  },
                ].map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectMockAccount(acc.email, acc.name)}
                    className="d-flex align-items-center gap-3 px-5 py-2 cursor-pointer"
                    style={{
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#2D2E30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Circle Avatar */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-semibold text-uppercase text-white"
                      style={{
                        width: 32,
                        height: 32,
                        background: acc.color,
                        fontSize: 14,
                      }}
                    >
                      {acc.initial}
                    </div>

                    <div className="flex-grow-1">
                      <div className="fw-semibold text-light" style={{ fontSize: 13 }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#9AA0A6" }}>
                        {acc.email}
                      </div>
                    </div>

                    {acc.logout && (
                      <span className="fw-normal" style={{ fontSize: 10, color: "#9AA0A6" }}>
                        Đã đăng xuất
                      </span>
                    )}
                  </div>
                ))}

                {/* Use another account */}
                <div
                  onClick={handleMockOtherAccount}
                  className="d-flex align-items-center gap-3 px-5 py-2 cursor-pointer"
                  style={{
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#2D2E30";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-secondary border border-secondary"
                    style={{
                      width: 32,
                      height: 32,
                      background: "transparent",
                      fontSize: 16,
                    }}
                  >
                    👤
                  </div>
                  <span className="fw-normal text-light" style={{ fontSize: 13 }}>
                    Sử dụng một tài khoản khác
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div
                className="mt-3 text-secondary"
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                Trước khi sử dụng HảiSản.vn, bạn có thể xem{" "}
                <span style={{ color: "#8AB4F8", cursor: "pointer" }}>Chính sách quyền riêng tư</span>{" "}
                và <span style={{ color: "#8AB4F8", cursor: "pointer" }}>Điều khoản dịch vụ</span>{" "}
                của ứng dụng này.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
