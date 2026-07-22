import { Link } from "react-router-dom";
import { HelpCircle, Award, ShieldCheck, Globe } from "lucide-react";

export default function SupportLayout({ children, activePath }) {
  const menuItems = [
    {
      path: "/purchase-guide",
      label: "Hướng dẫn mua hàng",
      icon: <HelpCircle size={16} />
    },
    {
      path: "/quality-guarantee",
      label: "Đảm bảo chất lượng",
      icon: <Award size={16} />
    },
    {
      path: "/safety-policy",
      label: "Quy chuẩn vệ sinh",
      icon: <ShieldCheck size={16} />
    },
    {
      path: "/terms",
      label: "Quy chế hoạt động",
      icon: <Globe size={16} />
    }
  ];

  return (
    <div className="page-container support-page">
      {/* Breadcrumbs */}
      <div style={{ fontSize: "0.85rem", color: "var(--market-muted)", marginBottom: "16px", display: "flex", gap: "6px", alignItems: "center" }}>
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Trang chủ</Link>
        <span>/</span>
        <span style={{ color: "var(--market-primary)", fontWeight: 500 }}>Hỗ trợ & Quy định</span>
      </div>

      <div className="support-layout">
        {/* Sidebar */}
        <aside className="support-sidebar">
          <div className="support-sidebar-title">Hỗ trợ & Quy định</div>
          <ul className="support-menu">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`support-menu-link ${activePath === item.path ? "is-active" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Content Panel */}
        <div className="support-content-card">
          {children}
        </div>
      </div>
    </div>
  );
}
