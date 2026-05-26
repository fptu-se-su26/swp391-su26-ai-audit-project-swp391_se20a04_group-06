/**
 * AuthPage.jsx — 3D Ocean Theme
 *
 * Giữ nguyên 100% logic điều phối Login/Register, validate số điện thoại,
 * lưu token và điều hướng phân quyền admin/user.
 * Toàn bộ CSS được viết lại với chủ đề 3D đại dương + animation CSS thuần.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api, saveToken } from "../services/api";

// ─── CSS Keyframes (inject vào <head> một lần duy nhất) ──────────────────────
const KEYFRAMES = `
  @keyframes bubbleRise {
    0%   { transform: translateY(0)       translateX(0px)   scale(1);    opacity: 0.55; }
    30%  { transform: translateY(-30vh)   translateX(10px)  scale(0.88); opacity: 0.45; }
    65%  { transform: translateY(-65vh)   translateX(-8px)  scale(0.65); opacity: 0.25; }
    100% { transform: translateY(-110vh)  translateX(4px)   scale(0.3);  opacity: 0; }
  }
  @keyframes cardFloat {
    0%,100% { transform: perspective(1200px) rotateX(1.5deg) rotateY(-0.5deg) translateY(0px); }
    33%      { transform: perspective(1200px) rotateX(-0.5deg) rotateY(1.2deg) translateY(-7px); }
    66%      { transform: perspective(1200px) rotateX(1deg) rotateY(-1.5deg)   translateY(-11px); }
  }
  @keyframes cardGlow {
    0%,100% { box-shadow: 0 0 40px rgba(46,196,241,0.12), 0 40px 90px rgba(0,0,0,0.75); }
    50%      { box-shadow: 0 0 75px rgba(46,196,241,0.24), 0 40px 90px rgba(0,0,0,0.75); }
  }
  @keyframes fishRight {
    0%   { left: -110px;               opacity: 0; }
    7%   { opacity: 0.85; }
    93%  { opacity: 0.85; }
    100% { left: calc(100vw + 110px);  opacity: 0; }
  }
  @keyframes fishLeft {
    0%   { right: -110px;              opacity: 0; }
    7%   { opacity: 0.85; }
    93%  { opacity: 0.85; }
    100% { right: calc(100vw + 110px); opacity: 0; }
  }
  @keyframes seaweedSway {
    0%,100% { transform: rotate(-10deg); transform-origin: bottom center; }
    50%      { transform: rotate(10deg);  transform-origin: bottom center; }
  }
  @keyframes waveScroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-640px); }
  }
  @keyframes btnShimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes glowBlob {
    0%,100% { transform: translate(-50%,-50%) scale(1);    opacity: 0.18; }
    50%      { transform: translate(-50%,-50%) scale(1.14); opacity: 0.28; }
  }
  @keyframes logoFloat {
    0%,100% { transform: translateY(0)   rotate(-5deg); }
    50%      { transform: translateY(-7px) rotate(5deg); }
  }
  @keyframes logoGlow {
    0%,100% { filter: drop-shadow(0 0 8px  rgba(46,196,241,0.5)); }
    50%      { filter: drop-shadow(0 0 22px rgba(46,196,241,0.95)); }
  }
  @keyframes topShimmer {
    0%   { opacity: 0.3; }
    50%  { opacity: 0.85; }
    100% { opacity: 0.3; }
  }
  /* Placeholder & input colour-scheme */
  .ocean-input::placeholder { color: rgba(232,244,248,0.32); }
  .ocean-input { color-scheme: dark; }
`;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const OCEAN_BRIGHT = "#2EC4F1";
const CARD_BG = "rgba(8, 28, 55, 0.88)";
const CARD_BORDER = "rgba(46, 196, 241, 0.22)";
const INPUT_BG = "rgba(255,255,255,0.06)";
const INPUT_BORDER = "rgba(46, 196, 241, 0.22)";
const INPUT_FOCUS = "#2EC4F1";
const TEXT_MAIN = "#E8F4F8";
const TEXT_MUTED = "rgba(232,244,248,0.50)";

// ─── Bubble Config: [size(px), left(%), animDelay(s), animDur(s)] ─────────────
const BUBBLES = [
  [8, 7, 0, 8],
  [4, 14, 1.5, 11],
  [12, 22, 3, 9],
  [6, 34, 0.5, 7],
  [9, 47, 2, 12],
  [5, 56, 4, 10],
  [14, 64, 1, 8],
  [7, 73, 2.5, 9],
  [4, 81, 0, 13],
  [10, 89, 3.5, 7],
  [6, 94, 1.5, 11],
  [3, 41, 5, 9],
];

// ─── Fish Config: [emoji, top(%), delay(s), dur(s), dir, fontSize(px)] ────────
const FISH = [
  ["🐟", 18, 0, 18, "right", 28],
  ["🐠", 48, 7, 24, "left", 32],
  ["🐡", 73, 14, 20, "right", 26],
  ["🦑", 33, 3, 30, "left", 36],
  ["🐟", 60, 10, 16, "right", 22],
];

// ─── Seaweed positions ────────────────────────────────────────────────────────
const SEAWEED = [
  { left: "7%", h: 70, w: 14, delay: 0 },
  { left: "18%", h: 50, w: 10, delay: 0.4 },
  { left: "76%", h: 80, w: 16, delay: 0.8 },
  { left: "87%", h: 55, w: 12, delay: 0.3 },
  { left: "94%", h: 65, w: 14, delay: 1.1 },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function AuthPage({ setUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Inject CSS keyframes vào <head>
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-auth-ocean", "1");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Helper style cho từng input
  const inputStyle = (field) => ({
    width: "100%",
    padding: "13px 16px",
    background: INPUT_BG,
    border: `1.5px solid ${focusedField === field ? INPUT_FOCUS : INPUT_BORDER}`,
    borderRadius: 10,
    fontSize: 14,
    color: TEXT_MAIN,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.3s, box-shadow 0.3s",
    boxShadow:
      focusedField === field
        ? "0 0 0 3px rgba(46,196,241,0.18), 0 0 22px rgba(46,196,241,0.13)"
        : "none",
  });

  // ── Submit (giữ nguyên 100% logic gốc) ──────────────────────────────────────
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
      navigate(data.user.role === "Admin" ? "/admin" : "/");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════════════════════════════
          OCEAN BACKGROUND SCENE (position: fixed)
         ══════════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse at 30% 18%, #0E3D5C 0%, #0A2540 42%, #030A14 100%)",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* Bioluminescent glow blobs */}
        {[
          {
            top: "22%",
            left: "16%",
            w: 420,
            h: 360,
            color: "rgba(46,196,241,0.09)",
          },
          {
            top: "62%",
            left: "72%",
            w: 520,
            h: 420,
            color: "rgba(15,100,140,0.13)",
          },
          {
            top: "82%",
            left: "32%",
            w: 620,
            h: 310,
            color: "rgba(46,196,241,0.07)",
          },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: b.top,
              left: b.left,
              width: b.w,
              height: b.h,
              background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
              animation: `glowBlob ${6 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.6}s`,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Bubbles */}
        {BUBBLES.map(([size, left, delay, dur], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: -size,
              left: `${left}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              border: "1.5px solid rgba(46,196,241,0.45)",
              background: "rgba(46,196,241,0.06)",
              animation: `bubbleRise ${dur}s ease-in infinite`,
              animationDelay: `${delay}s`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Swimming fish */}
        {FISH.map(([emoji, top, delay, dur, dir, size], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${top}%`,
              fontSize: size,
              lineHeight: 1,
              animation: `${dir === "right" ? "fishRight" : "fishLeft"} ${dur}s linear infinite`,
              animationDelay: `${delay}s`,
              filter: "drop-shadow(0 0 6px rgba(46,196,241,0.4))",
              ...(dir === "left" ? { transform: "scaleX(-1)" } : {}),
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {emoji}
          </div>
        ))}

        {/* Seaweed */}
        {SEAWEED.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 54,
              left: s.left,
              width: s.w,
              height: s.h,
              background: "linear-gradient(to top, #0A4A2A, #22A055)",
              borderRadius: "40% 60% 60% 40% / 60% 40% 60% 40%",
              animation: `seaweedSway ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
              transformOrigin: "bottom center",
              opacity: 0.72,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Wave layer 1 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "200%",
            height: 90,
            animation: "waveScroll 8s linear infinite",
            opacity: 0.65,
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 1280 90"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%" }}
          >
            <path
              d="M0,45 C80,10 160,80 240,45 C320,10 400,80 480,45
                 C560,10 640,80 720,45 C800,10 880,80 960,45
                 C1040,10 1120,80 1200,45 C1240,28 1260,36 1280,45
                 L1280,90 L0,90 Z"
              fill="rgba(14,61,92,0.82)"
            />
          </svg>
        </div>

        {/* Wave layer 2 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "200%",
            height: 60,
            animation: "waveScroll 12s linear infinite reverse",
            opacity: 0.38,
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 1280 60"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%" }}
          >
            <path
              d="M0,30 C80,5 160,55 240,30 C320,5 400,55 480,30
                 C560,5 640,55 720,30 C800,5 880,55 960,30
                 C1040,5 1120,55 1200,30 L1280,30 L1280,60 L0,60 Z"
              fill="rgba(46,196,241,0.16)"
            />
          </svg>
        </div>

        {/* Sandy floor */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            background: "linear-gradient(to top, #2A1A06, #3E2A10)",
            opacity: 0.65,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════
          FOREGROUND: AUTH CARD
         ══════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          perspective: "1200px",
        }}
      >
        <div
          style={{
            background: CARD_BG,
            backdropFilter: "blur(26px)",
            WebkitBackdropFilter: "blur(26px)",
            borderRadius: 24,
            padding: "44px 36px",
            width: "100%",
            maxWidth: 400,
            border: `1px solid ${CARD_BORDER}`,
            animation:
              "cardFloat 7s ease-in-out infinite, cardGlow 4.5s ease-in-out infinite",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Shimmer top edge */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              width: "80%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(46,196,241,0.55), transparent)",
              animation: "topShimmer 3s ease-in-out infinite",
            }}
          />

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            {/* Logo */}
            <div
              style={{
                width: 80,
                height: 80,
                background: "rgba(46,196,241,0.1)",
                border: "1.5px solid rgba(46,196,241,0.32)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 42,
                margin: "0 auto 14px",
                animation:
                  "logoFloat 4s ease-in-out infinite, logoGlow 3s ease-in-out infinite",
              }}
            >
              🐟
            </div>

            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: TEXT_MAIN,
                margin: 0,
                letterSpacing: "-0.5px",
                textShadow: "0 0 22px rgba(46,196,241,0.42)",
              }}
            >
              HảiSản.vn
            </h1>
            <p
              style={{
                color: TEXT_MUTED,
                fontSize: 11,
                margin: "5px 0 0",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
              }}
            >
              Tươi từ đại dương
            </p>

            {/* Tab switcher */}
            <div
              style={{
                display: "flex",
                gap: 3,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(46,196,241,0.16)",
                borderRadius: 14,
                padding: 4,
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
                    padding: "10px",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    fontFamily: "inherit",
                    transition: "all 0.25s ease",
                    background:
                      mode === k
                        ? "linear-gradient(135deg, rgba(46,196,241,0.24), rgba(26,140,181,0.18))"
                        : "transparent",
                    color: mode === k ? OCEAN_BRIGHT : TEXT_MUTED,
                    boxShadow:
                      mode === k
                        ? "0 2px 12px rgba(46,196,241,0.15), inset 0 0 0 1px rgba(46,196,241,0.24)"
                        : "none",
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
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {mode === "register" && (
              <input
                className="ocean-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                placeholder="Họ và tên người dùng"
                style={inputStyle("name")}
              />
            )}
            <input
              className="ocean-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              placeholder="Số điện thoại (VD: 0912345678)"
              style={inputStyle("phone")}
              type="tel"
            />
            <input
              className="ocean-input"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              placeholder="Mật khẩu bảo mật"
              style={inputStyle("password")}
              type="password"
            />

            {/* Error banner */}
            {err && (
              <div
                style={{
                  color: "#FCA5A5",
                  fontSize: 13,
                  background: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.28)",
                  borderLeft: "4px solid #EF4444",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  lineHeight: 1.45,
                }}
              >
                ⚠️ {err}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 14,
                background: loading
                  ? "rgba(46,196,241,0.18)"
                  : "linear-gradient(135deg, #1A8CB5 0%, #2EC4F1 50%, #1A8CB5 100%)",
                backgroundSize: "200% auto",
                color: loading ? TEXT_MUTED : "#fff",
                border: "none",
                borderRadius: 12,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                marginTop: 6,
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                animation: loading ? "none" : "btnShimmer 3s linear infinite",
                boxShadow: loading
                  ? "none"
                  : "0 4px 22px rgba(46,196,241,0.32), 0 1px 0 rgba(255,255,255,0.1) inset",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(46,196,241,0.44), 0 1px 0 rgba(255,255,255,0.1) inset";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow =
                    "0 4px 22px rgba(46,196,241,0.32), 0 1px 0 rgba(255,255,255,0.1) inset";
                }
              }}
            >
              {loading
                ? "⏳ Đang xử lý tài khoản..."
                : mode === "login"
                  ? "→ Đăng nhập vào hệ thống"
                  : "→ Xác nhận tạo tài khoản"}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: 22,
              textAlign: "center",
              color: TEXT_MUTED,
              fontSize: 11,
              letterSpacing: "0.5px",
            }}
          >
            🔒 Bảo mật SSL · Dữ liệu được mã hóa
          </div>
        </div>
      </div>
    </>
  );
}
