import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Globe, Award, ShieldCheck, HelpCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Cột 1: Thương hiệu */}
        <div className="footer-section footer-brand">
          <Link to="/" className="footer-brand__logo">
            <img src="/logo-icon.png" alt="Logo HaiSan.vn" />
            <span>HaiSan.vn</span>
          </Link>
          <p className="footer-brand__tagline">
            Hệ thống kết nối trực tiếp Người mua & Ngư dân. Mang hải sản sạch từ khoang thuyền lên bàn ăn Việt, nguồn gốc minh bạch.
          </p>
        </div>

        {/* Cột 2: Khám phá */}
        <div className="footer-section">
          <h3>Khám phá</h3>
          <ul className="footer-links">
            <li><Link to="/marketplace">Chợ hải sản</Link></li>
            <li><Link to="/landing-batches">Vựa cá cập bến</Link></li>
            <li><Link to="/recipes">Góc ẩm thực biển</Link></li>
            <li><Link to="/boat-log">Nhật ký đi biển</Link></li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ & Chính sách */}
        <div className="footer-section">
          <h3>Hỗ trợ & Quy định</h3>
          <ul className="footer-links">
            <li><Link to="/purchase-guide"><HelpCircle size={14} style={{ marginRight: "6px" }} /> Hướng dẫn mua hàng</Link></li>
            <li><Link to="/quality-guarantee"><Award size={14} style={{ marginRight: "6px" }} /> Đảm bảo chất lượng</Link></li>
            <li><Link to="/safety-policy"><ShieldCheck size={14} style={{ marginRight: "6px" }} /> Quy chuẩn vệ sinh</Link></li>
            <li><Link to="/terms"><Globe size={14} style={{ marginRight: "6px" }} /> Quy chế hoạt động</Link></li>
          </ul>
        </div>

        {/* Cột 4: Liên hệ */}
        <div className="footer-section">
          <h3>Thông tin liên hệ</h3>
          <ul className="footer-contact">
            <li>
              <MapPin size={18} />
              <span>Văn phòng: Ngũ Hành Sơn, Đà Nẵng, Việt Nam</span>
            </li>
            <li>
              <Phone size={18} />
              <span>Hotline (24/7): <a href="tel:0362614906" style={{ color: "inherit", textDecoration: "none" }}>0362614906</a></span>
            </li>
            <li>
              <Mail size={18} />
              <span>Email: <a href="mailto:daudaubut@gmail.com" style={{ color: "inherit", textDecoration: "none" }}>daudaubut@gmail.com</a></span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
