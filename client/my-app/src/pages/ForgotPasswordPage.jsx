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
  const steps = ["Địa chỉ Email", "Xác minh OTP", "Mật khẩu mới"];
  return (
    <div className="d-flex gap-2 mb-4">
      {steps.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} className="flex-fill text-center">
            <div
              className="mb-1"
              style={{
                height: 4,
                borderRadius: 2,
                background: done || active ? "#E8643A" : "var(--border)",
                transition: "background .3s",
              }}
            />
            <span
              className={`d-block fw-bold ${active ? "" : "text-muted"}`}
              style={{
                fontSize: 11,
                color: active ? "#E8643A" : "var(--muted)",
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
    <div className="d-flex gap-2 justify-content-center my-4">
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
          className="form-control border-2 text-center fw-bold p-0"
          style={{
            width: 42,
            height: 50,
            fontSize: 22,
            borderRadius: 10,
            borderColor: d.trim() ? "#E8643A" : "var(--border)",
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
  const [email, setEmail] = useState("");
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
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
      toast.error("Email không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      const res = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      countdown.reset(res.ttl ?? 300);
      setStep(1);
      toast.success("OTP đã gửi đến hòm thư email của bạn!");
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
        body: JSON.stringify({ email, otp }),
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
        body: JSON.stringify({ email }),
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
    <div
      className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4"
      style={{
        background: "var(--bg)",
      }}
    >
      <div
        className="card border-0 p-4 p-sm-5 w-100"
        style={{
          background: "var(--white)",
          borderRadius: 20,
          border: "1.5px solid var(--border)",
          maxWidth: 440,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div className="text-center mb-3 fs-3">🐟</div>

        <StepBar step={step} />

        {/* ── Step 0: Nhập Email ───────────────────────────── */}
        {step === 0 && (
          <form onSubmit={handleSendOtp} className="d-flex flex-column gap-3">
            <div className="text-center">
              <h1 className="fw-bold m-0" style={{ fontSize: 20, color: "var(--dark)" }}>Quên mật khẩu</h1>
              <p className="text-muted m-0 mt-2" style={{ fontSize: 13, lineHeight: 1.6 }}>Nhập địa chỉ email đăng ký để nhận mã OTP.</p>
            </div>

            <div className="d-flex flex-column gap-1">
              <label
                className="fw-bold"
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Địa chỉ Email
              </label>
              <input
                className="form-control border-0"
                style={{
                  ...S.input,
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                }}
                type="email"
                placeholder="nguyenvana@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn w-100 fw-bold py-2 mt-2"
              style={{
                borderRadius: 12,
                background: (loading || !email)
                  ? "var(--border)"
                  : "linear-gradient(135deg, #E8643A 0%, #D94E21 100%)",
                color: (loading || !email) ? "var(--muted)" : "#fff",
                fontSize: 15,
                transition: "opacity .2s",
              }}
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP →"}
            </button>
            
            <Link
              to="/dang-nhap"
              className="text-decoration-none text-center text-muted fw-semibold mt-2"
              style={{ fontSize: 13 }}
            >
              ← Quay lại đăng nhập
            </Link>
          </form>
        )}

        {/* ── Step 1: Xác minh OTP ────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="d-flex flex-column gap-3">
            <div className="text-center">
              <h1 className="fw-bold m-0" style={{ fontSize: 20, color: "var(--dark)" }}>Nhập mã OTP</h1>
              <p className="text-muted m-0 mt-2" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Mã 6 chữ số đã gửi đến
                <br />
                <strong style={{ color: "var(--dark)" }}>{email}</strong>
              </p>
            </div>

            <OtpInput value={otp} onChange={setOtp} disabled={loading} />

            {/* Đếm ngược + gửi lại */}
            <div className="text-center text-muted" style={{ fontSize: 13 }}>
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
                  className="btn btn-link p-0 text-decoration-none"
                  style={{
                    color: "#E8643A",
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="btn w-100 fw-bold py-2 mt-2"
              style={{
                borderRadius: 12,
                background: (loading || otp.length < 6)
                  ? "var(--border)"
                  : "linear-gradient(135deg, #E8643A 0%, #D94E21 100%)",
                color: (loading || otp.length < 6) ? "var(--muted)" : "#fff",
                fontSize: 15,
                transition: "opacity .2s",
              }}
            >
              {loading ? "Đang xác minh..." : "Xác minh →"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(0);
                setOtp("");
              }}
              className="btn btn-link p-0 text-decoration-none text-center text-muted fw-semibold mt-2"
              style={{
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              ← Đổi địa chỉ email
            </button>
          </form>
        )}

        {/* ── Step 2: Mật khẩu mới ────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="d-flex flex-column gap-3">
            <div className="text-center">
              <h1 className="fw-bold m-0" style={{ fontSize: 20, color: "var(--dark)" }}>Mật khẩu mới</h1>
              <p className="text-muted m-0 mt-2" style={{ fontSize: 13, lineHeight: 1.6 }}>Đặt mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            <div className="d-flex flex-column gap-1">
              <label
                className="fw-bold"
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Mật khẩu mới
              </label>
              <div className="position-relative">
                <input
                  className="form-control border-0"
                  style={{
                    ...S.input,
                    background: "var(--bg)",
                    border: "1.5px solid var(--border)",
                    paddingRight: 44,
                  }}
                  type={showPass ? "text" : "password"}
                  placeholder="Ít nhất 6 ký tự"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="btn border-0 p-0 position-absolute"
                  style={{
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    fontSize: 16,
                  }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="d-flex flex-column gap-1">
              <label
                className="fw-bold"
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Xác nhận mật khẩu
              </label>
              <input
                className="form-control border-0"
                style={{
                  ...S.input,
                  background: "var(--bg)",
                  border: `1.5px solid ${confirmPass && confirmPass !== newPass ? "#DC2626" : "var(--border)"}`,
                }}
                type={showPass ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
              {confirmPass && confirmPass !== newPass && (
                <p className="text-danger m-0 mt-1" style={{ fontSize: 12 }}>
                  Mật khẩu không khớp
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || newPass.length < 6 || newPass !== confirmPass}
              className="btn w-100 fw-bold py-2 mt-2"
              style={{
                borderRadius: 12,
                background: (loading || newPass.length < 6 || newPass !== confirmPass)
                  ? "var(--border)"
                  : "linear-gradient(135deg, #E8643A 0%, #D94E21 100%)",
                color: (loading || newPass.length < 6 || newPass !== confirmPass) ? "var(--muted)" : "#fff",
                fontSize: 15,
                transition: "opacity .2s",
              }}
            >
              {loading ? "Đang cập nhật..." : "Xác nhận đặt lại mật khẩu ✓"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
