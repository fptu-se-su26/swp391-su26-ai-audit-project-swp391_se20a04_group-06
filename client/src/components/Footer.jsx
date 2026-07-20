import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { apiOnline } = useAuth();
  return (
    <footer className="site-footer">
      <span>HaiSan.vn</span>
      <span>{apiOnline ? "Đã kết nối API" : "Chưa kết nối API"}</span>
      <span>© {new Date().getFullYear()} Kết nối trực tiếp người mua và ngư dân</span>
    </footer>
  );
}
