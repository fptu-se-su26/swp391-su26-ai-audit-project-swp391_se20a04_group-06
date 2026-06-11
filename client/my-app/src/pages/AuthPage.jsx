/**
 * AuthPage.jsx — Google-Only Auth
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { SparklesIcon, AlertCircleIcon } from "../components/icons";
import { useAuth } from "../context/AuthContext";

const GoogleLogo = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.148 17.64 11.84 17.64 9.2z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

export function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMockGooglePopup, setShowMockGooglePopup] = useState(false);
  const [hasMockMode, setHasMockMode] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    if (!clientId) {
      console.warn(
        "VITE_GOOGLE_CLIENT_ID is missing. Mock Google Sign-In will be active.",
      );
      setHasMockMode(true);
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
            console.log(
              "One Tap not displayed:",
              notification.getNotDisplayedReason(),
            );
          }
        });
      } catch (error) {
        console.error("Failed to initialize Google Identity Services:", error);
        setHasMockMode(true);
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

  const selectMockAccount = async (email, name) => {
    setShowMockGooglePopup(false);
    setLoading(true);
    setErr("");
    try {
      const data = await api("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          idToken: `mock_google_token_${email.toLowerCase().trim()}_${Date.now()}`,
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
    const mockEmail = window.prompt(
      "Nhập email Google muốn giả lập đăng nhập:",
      "nguyenvana@gmail.com",
    );
    if (!mockEmail) return;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(mockEmail)) {
      alert("Email không hợp lệ!");
      return;
    }
    await selectMockAccount(
      mockEmail,
      `Mock User (${mockEmail.split("@")[0]})`,
    );
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4"
      style={{ backgroundColor: "var(--bg)" }}
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
        <div className="text-center mb-5">
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

          <p
            className="mt-3 mb-0"
            style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}
          >
            Đăng nhập hoặc tạo tài khoản <br /> chỉ với một bước duy nhất
          </p>
        </div>

        {/* ── Error ── */}
        {err && (
          <div
            className="alert alert-danger border-danger d-flex align-items-center gap-2 py-2 px-3 mb-3"
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

        {/* ── Google Button ── */}
        {hasMockMode ? (
          <button
            onClick={() => setShowMockGooglePopup(true)}
            disabled={loading}
            className="btn w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            style={{
              background: "var(--white)",
              color: "var(--dark)",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              padding: "11px 16px",
              fontSize: 14,
              fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "box-shadow 0.2s, border-color 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.13)";
                e.currentTarget.style.borderColor = "#aaa";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            {loading ? (
              "⏳ Đang xử lý..."
            ) : (
              <>
                <GoogleLogo />
                Đăng nhập bằng Google
              </>
            )}
          </button>
        ) : (
          <div className="w-100">
            <div
              id="google-signin-btn"
              className="w-100 d-flex justify-content-center"
            />
            {(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setShowMockGooglePopup(true)}
                  disabled={loading}
                  className="btn border-0 bg-transparent text-decoration-underline text-muted"
                  style={{ fontSize: 12, cursor: "pointer" }}
                >
                  [Dev Mode] Sử dụng tài khoản giả lập
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Footer Note ── */}
        <p
          className="text-center mt-4 mb-0"
          style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.7 }}
        >
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <span style={{ color: "var(--ocean)", cursor: "pointer" }}>
            Điều khoản dịch vụ
          </span>{" "}
          và{" "}
          <span style={{ color: "var(--ocean)", cursor: "pointer" }}>
            Chính sách quyền riêng tư
          </span>{" "}
          của HảiSản.vn.
        </p>
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
                <span className="fw-bolder" style={{ color: "#4285F4" }}>
                  G
                </span>
                <span>
                  Đăng nhập - Tài khoản Google - Personal - Microsoft Edge
                </span>
              </div>
              <button
                onClick={() => setShowMockGooglePopup(false)}
                className="btn border-0 p-0 text-secondary bg-transparent"
                style={{ fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            {/* Google Identity Header */}
            <div className="p-4 p-sm-5 pt-4 pb-3">
              <div
                className="d-flex align-items-center gap-2 fw-semibold mb-3 text-white"
                style={{ fontSize: 14 }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bolder bg-white text-primary"
                  style={{ width: 24, height: 24, fontSize: 14 }}
                >
                  G
                </div>
                <span>Đăng nhập bằng Google</span>
              </div>

              <h2
                className="fw-normal mb-1 text-white"
                style={{ fontSize: 24 }}
              >
                Chọn tài khoản
              </h2>
              <p className="mb-4" style={{ fontSize: 14, color: "#9AA0A6" }}>
                Tiếp tục tới{" "}
                <span style={{ color: "#8AB4F8", fontWeight: 600 }}>
                  HảiSản.vn
                </span>
              </p>

              {/* Accounts List */}
              <div
                className="d-flex flex-column border-top border-bottom py-1"
                style={{
                  borderColor: "#3C4043 !important",
                  margin: "0 -2.5rem",
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
                    className="d-flex align-items-center gap-3 px-5 py-2"
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
                      className="rounded-circle d-flex align-items-center justify-content-center fw-semibold text-uppercase text-white"
                      style={{
                        width: 32,
                        height: 32,
                        background: acc.color,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {acc.initial}
                    </div>
                    <div className="flex-grow-1">
                      <div
                        className="fw-semibold text-light"
                        style={{ fontSize: 13 }}
                      >
                        {acc.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#9AA0A6" }}>
                        {acc.email}
                      </div>
                    </div>
                    {acc.logout && (
                      <span
                        className="fw-normal"
                        style={{ fontSize: 10, color: "#9AA0A6" }}
                      >
                        Đã đăng xuất
                      </span>
                    )}
                  </div>
                ))}

                {/* Use another account */}
                <div
                  onClick={handleMockOtherAccount}
                  className="d-flex align-items-center gap-3 px-5 py-2"
                  style={{ cursor: "pointer", transition: "background 0.15s" }}
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
                      flexShrink: 0,
                    }}
                  >
                    👤
                  </div>
                  <span
                    className="fw-normal text-light"
                    style={{ fontSize: 13 }}
                  >
                    Sử dụng một tài khoản khác
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div
                className="mt-3 text-secondary"
                style={{ fontSize: 11, lineHeight: 1.5 }}
              >
                Trước khi sử dụng HảiSản.vn, bạn có thể xem{" "}
                <span style={{ color: "#8AB4F8", cursor: "pointer" }}>
                  Chính sách quyền riêng tư
                </span>{" "}
                và{" "}
                <span style={{ color: "#8AB4F8", cursor: "pointer" }}>
                  Điều khoản dịch vụ
                </span>{" "}
                của ứng dụng này.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
