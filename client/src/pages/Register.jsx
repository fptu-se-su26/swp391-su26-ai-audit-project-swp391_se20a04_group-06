import { ArrowLeft, ArrowRight, Fish } from "lucide-react";
import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO";

export default function Register() {
  useSEO("Đăng ký tài khoản", "Đăng ký tài khoản mới trên HảiSản.vn.");
  return (
    <main className="auth-page">
      <section className="auth-card auth-card--center">
        <span className="auth-card__logo"><Fish size={30} /></span>
        <h1>Đăng ký tài khoản</h1>
        <p>
          HaiSan.vn sử dụng Google Identity. Bạn không cần tạo hoặc ghi nhớ một mật khẩu riêng.
        </p>
        <div className="auth-card__notice">
          Chọn vai trò Người mua hoặc Ngư dân ở bước tiếp theo, sau đó đăng nhập bằng Google.
          Tài khoản sẽ được tạo tự động.
        </div>
        <Link className="button button--primary auth-card__primary-action" to="/login">
          Tiếp tục <ArrowRight size={17} />
        </Link>
        <Link className="back-link auth-card__back" to="/">
          <ArrowLeft size={15} /> Quay lại trang chủ
        </Link>
      </section>
    </main>
  );
}
