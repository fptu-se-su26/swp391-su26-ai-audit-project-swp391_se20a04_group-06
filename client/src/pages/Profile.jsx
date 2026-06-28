import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1><User size={25} /> Hồ sơ</h1>
          <p>Thông tin tài khoản đang đăng nhập.</p>
        </div>
      </header>
      <section className="dashboard-panel profile-summary">
        <span>{(user?.name || "U").slice(0, 2).toUpperCase()}</span>
        <div><h2>{user?.name || "Chưa đăng nhập"}</h2><p>{user?.email || "Chưa có email"}</p></div>
      </section>
    </div>
  );
}
