import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Fish, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import InteractiveUnderwaterBackground from "../components/effects/InteractiveUnderwaterBackground";
import { useAuth } from "../context/AuthContext";
import { apiAuth } from "../services/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState("buyer");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedRoleRef = useRef(selectedRole);

  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  const handleGoogleResponse = useCallback(
    async (googleResponse, roleOverride) => {
      const idToken = googleResponse?.credential;
      if (!idToken) {
        setErrorMessage("Không nhận được ID Token từ Google.");
        return;
      }

      setLoading(true);
      setErrorMessage("");
      try {
        const result = await apiAuth.googleLogin({
          idToken,
          selectedRole: roleOverride || selectedRoleRef.current,
        });
        if (!result?.user) throw new Error("Phản hồi đăng nhập không hợp lệ.");

        login(result.user);
        const role = result.user.sessionRole || result.user.role;
        if (["Admin", "admin"].includes(result.user.role)) navigate("/admin");
        else if (["Seller", "seller"].includes(role)) navigate("/seller");
        else navigate("/");
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    },
    [login, navigate],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setErrorMessage("Google Login chưa được cấu hình. Hãy thiết lập VITE_GOOGLE_CLIENT_ID.");
      return undefined;
    }

    let retries = 0;
    let timer;
    const initialize = () => {
      /* global google */
      if (typeof google !== "undefined" && google.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        const container = document.getElementById("google-signin-btn");
        if (container) {
          container.replaceChildren();
          const availableWidth = Math.floor(
            container.parentElement?.getBoundingClientRect().width || 320,
          );
          google.accounts.id.renderButton(container, {
            theme: "filled_blue",
            size: "large",
            width: Math.max(200, Math.min(320, availableWidth)),
            text: "signin_with",
            shape: "rectangular",
          });
        }
      } else if (retries < 20) {
        retries += 1;
        timer = window.setTimeout(initialize, 300);
      } else {
        setErrorMessage("Không thể tải Google Identity. Vui lòng thử lại.");
      }
    };
    initialize();
    return () => window.clearTimeout(timer);
  }, [handleGoogleResponse]);

  return (
    <main className="auth-page auth-page--underwater">
      <InteractiveUnderwaterBackground />
      <section className="auth-card">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Quay về trang chủ</Link>
        <div className="auth-card__heading">
          <span className="auth-card__logo"><Fish size={31} /></span>
          <h1>Đăng nhập HaiSan.vn</h1>
          <p>Kết nối trực tiếp ngư dân và người mua.</p>
        </div>

        {location.state?.message && <div className="auth-card__notice">{location.state.message}</div>}
        {errorMessage && (
          <div className="auth-card__error"><AlertCircle size={17} /><span>{errorMessage}</span></div>
        )}

        <fieldset className="role-selector">
          <legend>Bạn tham gia với vai trò</legend>
          <button
            className={selectedRole === "buyer" ? "is-active" : ""}
            onClick={() => setSelectedRole("buyer")}
            type="button"
          >
            Người mua
          </button>
          <button
            className={selectedRole === "seller" ? "is-active" : ""}
            onClick={() => setSelectedRole("seller")}
            type="button"
          >
            Ngư dân bán hàng
          </button>
        </fieldset>

        <div className="google-login-slot">
          {loading ? <span><Loader2 className="spin" size={20} /> Đang xử lý...</span> : <div id="google-signin-btn" />}
        </div>
        <p className="auth-card__terms">
          Khi đăng nhập, bạn đồng ý với điều khoản sử dụng của HaiSan.vn.
        </p>
      </section>
    </main>
  );
}
