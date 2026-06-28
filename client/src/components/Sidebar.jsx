import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ links = [] }) {
  const location = useLocation();

  return (
    <aside className="workspace-sidebar">
      <nav aria-label="Điều hướng khu vực làm việc">
        {links.map((link) => {
          const Icon = link.icon;
          const active = link.exact
            ? location.pathname === link.path
            : location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);

          return (
            <Link className={active ? "is-active" : ""} key={link.path} to={link.path}>
              {Icon && <Icon size={18} />}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
