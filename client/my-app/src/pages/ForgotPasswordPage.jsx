/**
 * ForgotPasswordPage.jsx
 *
 * 3 bước:
 *   Step 1 — Nhập số điện thoại
 *   Step 2 — Nhập mã OTP (6 ô tách biệt) + đếm ngược + gửi lại
 *   Step 3 — Nhập mật khẩu mới + xác nhận
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

// ── Màu & style constants ─────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: "24px",
  },
  card: {
    background: "var(--white)",
    borderRadius: 20,
    border: "1px solid var(--border)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
  },
  logo: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: "var(--dark)",
    textAlign: "center",
    margin: 0,
  },
  sub: {
    fontSize: 13,
    color: "var(--muted)",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 1.6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: 6,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    fontSize: 15,
    color: "var(--dark)",
    background: "var(--bg)",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .2s",
  },
  btn: (disabled) => ({
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "none",
    background: disabled
      ? "var(--border)"
      : "linear-gradient(135deg, #E8643A 0%, #D94E21 100%)",
    color: disabled ? "var(--muted)" : "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    marginTop: 20,
    transition: "opacity .2s",
  }),
  backLink: {
    display: "block",
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
    color: "var(--muted)",
    textDecoration: "none",
  },
};

// ── Step indicator ────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Số điện thoại", "Xác minh OTP", "Mật khẩu mới"];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: done || active ? "#E8643A" : "var(--border)",
                marginBottom: 4,
                transition: "background .3s",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: active ? "#E8643A" : "var(--muted)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 6-ô OTP Input ─────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputRefs = useRef([]);
  const digits = (value + "      ").slice(0, 6).split("");

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...digits];
    arr[i] = ch;
    const next = arr.join("").trim();
    onChange(next);
    if (ch && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const arr = [...digits];
      if (!arr[i] && i > 0) {
        arr[i - 1] = " ";
        onChange(arr.join("").trimEnd());
        inputRefs.current[i - 1]?.focus();
      } else {
        arr[i] = " ";
        onChange(arr.join("").trimEnd());
      }
    }
  };

  // Paste handling (copy-paste 6 chữ số từ SMS)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        margin: "20px 0",
      }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          style={{
            width: 46,
            height: 54,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 700,
            borderRadius: 10,
            border: `2px solid ${d.trim() ? "#E8643A" : "var(--border)"}`,
            background: "var(--bg)",
            color: "var(--dark)",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color .15s",
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown timer ───────────────────────────────────────────
function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const reset = useCallback((s) => setRemaining(s ?? seconds), [seconds]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return { remaining, display: `${mm}:${ss}`, reset };
}

// ── Main Page ─────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const countdown = useCountdown(300); // 5 phút

  // ── Step 1: Gửi OTP ────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^0\d{9}$/.test(phone)) {
      toast.error("Số điện thoại phải là 10 số, bắt đầu bằng 0.");
      return;
    }
    setLoading(true);
    try {
      const res = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      countdown.reset(res.ttl ?? 300);
      setStep(1);
      toast.success("OTP đã gửi đến số điện thoại của bạn!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Xác minh OTP ───────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số.");
      return;
    }
    setLoading(true);
    try {
      const res = await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      });
      setResetToken(res.resetToken);
      setStep(2);
    } catch (err) {
      toast.error(err.message);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResend = async () => {
    if (countdown.remaining > 0) return;
    setLoading(true);
    try {
      const res = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      countdown.reset(res.ttl ?? 300);
      setOtp("");
      toast.success("Đã gửi lại OTP!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Đặt mật khẩu mới ──────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) {
      toast.error("Mật khẩu phải ít nhất 6 ký tự.");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword: newPass }),
      });
      toast.success("Đặt lại mật khẩu thành công!");
      setTimeout(() => navigate("/dang-nhap"), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>🐟</div>

        <StepBar step={step} />

        {/* ── Step 0: Nhập SĐT ───────────────────────────── */}
        {step === 0 && (
          <form onSubmit={handleSendOtp}>
            <h1 style={S.title}>Quên mật khẩu</h1>
            <p style={S.sub}>Nhập số điện thoại đăng ký để nhận mã OTP.</p>

            <label style={S.label}>Số điện thoại</label>
            <input
              style={S.input}
              type="tel"
              placeholder="0912 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              autoFocus
              maxLength={10}
            />

            <button type="submit" style={S.btn(loading || !phone)}>
              {loading ? "Đang gửi..." : "Gửi mã OTP →"}
            </button>
            <Link to="/dang-nhap" style={S.backLink}>
              ← Quay lại đăng nhập
            </Link>
          </form>
        )}

        {/* ── Step 1: Xác minh OTP ────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleVerifyOtp}>
            <h1 style={S.title}>Nhập mã OTP</h1>
            <p style={S.sub}>
              Mã 6 chữ số đã gửi đến
              <br />
              <strong style={{ color: "var(--dark)" }}>{phone}</strong>
            </p>

            <OtpInput value={otp} onChange={setOtp} disabled={loading} />

            {/* Đếm ngược + gửi lại */}
            <div
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              {countdown.remaining > 0 ? (
                <>
                  Mã hết hạn sau{" "}
                  <strong style={{ color: "#E8643A" }}>
                    {countdown.display}
                  </strong>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#E8643A",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            <button type="submit" style={S.btn(loading || otp.length < 6)}>
              {loading ? "Đang xác minh..." : "Xác minh →"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setOtp("");
              }}
              style={{
                ...S.backLink,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← Đổi số điện thoại
            </button>
          </form>
        )}

        {/* ── Step 2: Mật khẩu mới ────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <h1 style={S.title}>Mật khẩu mới</h1>
            <p style={S.sub}>Đặt mật khẩu mới cho tài khoản của bạn.</p>

            <label style={S.label}>Mật khẩu mới</label>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input
                style={{ ...S.input, paddingRight: 44 }}
                type={showPass ? "text" : "password"}
                placeholder="Ít nhất 6 ký tự"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontSize: 16,
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            <label style={S.label}>Xác nhận mật khẩu</label>
            <input
              style={{
                ...S.input,
                borderColor:
                  confirmPass && confirmPass !== newPass
                    ? "#DC2626"
                    : undefined,
              }}
              type={showPass ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
            {confirmPass && confirmPass !== newPass && (
              <p
                style={{
                  fontSize: 12,
                  color: "#DC2626",
                  marginTop: 4,
                  marginBottom: 0,
                }}
              >
                Mật khẩu không khớp
              </p>
            )}

            <button
              type="submit"
              style={S.btn(
                loading || newPass.length < 6 || newPass !== confirmPass,
              )}
            >
              {loading ? "Đang cập nhật..." : "Xác nhận đặt lại mật khẩu ✓"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
