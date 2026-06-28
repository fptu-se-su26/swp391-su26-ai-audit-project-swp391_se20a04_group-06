import { useEffect, useState } from "react";
import { Award, FileText, ShieldAlert, Users } from "lucide-react";
import { Route, Routes } from "react-router-dom";
import { apiFishermen, apiProducts } from "../../services/api";

function AdminOverview({ listings, reports, users }) {
  const metrics = [
    { icon: Users, label: "Thành viên", value: users.length, tone: "blue" },
    { icon: Award, label: "Ngư dân Premium", value: users.filter((user) => user.isPremium).length, tone: "amber" },
    { icon: FileText, label: "Sản phẩm", value: listings.length, tone: "green" },
    { icon: ShieldAlert, label: "Báo cáo chờ xử lý", value: reports.length, tone: "rose" },
  ];

  return (
    <div className="admin-overview">
      <header className="page-heading page-heading--compact">
        <div><span className="eyebrow">ADMIN DASHBOARD</span><h1>Tổng quan hệ thống</h1><p>Giám sát người dùng và nội dung marketplace.</p></div>
      </header>
      <div className="dashboard-metrics admin-metrics">
        {metrics.map(({ icon: Icon, label, tone, value }) => (
          <article className={`dashboard-metric dashboard-metric--${tone}`} key={label}>
            <Icon size={21} /><span>{label}</span><strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="dashboard-panel">
        <header><div><h2>Ngư dân trên hệ thống</h2><p>Thông tin tổng hợp từ hồ sơ người bán.</p></div></header>
        <div className="responsive-table">
          <table>
            <thead><tr><th>Ngư dân</th><th>Mô tả</th><th>Đánh giá</th><th>Người theo dõi</th></tr></thead>
            <tbody>
              {users.map((seller) => (
                <tr key={seller.id || seller._id}>
                  <td>{seller.name}</td><td>{seller.bio || "Đang cập nhật"}</td>
                  <td>{Number(seller.ratingAvg || 0).toFixed(1)} ★</td><td>{seller.followersCount || 0}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td className="table-empty" colSpan="4">Chưa có hồ sơ ngư dân.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminUsers({ onUpdateUsers, users }) {
  const toggleField = (id, field) => {
    onUpdateUsers(
      users.map((user) =>
        (user.id || user._id) === id ? { ...user, [field]: !user[field] } : user,
      ),
    );
  };

  return (
    <div>
      <header className="page-heading page-heading--compact">
        <div><span className="eyebrow">USER MANAGEMENT</span><h1>Quản lý User</h1><p>Kiểm tra trạng thái tài khoản người dùng.</p></div>
      </header>
      <section className="dashboard-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Hội viên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {users.map((user) => {
                const id = user.id || user._id;
                return (
                  <tr key={id}>
                    <td>{user.name} {user.isVerified && <small className="table-badge">Verified</small>}</td>
                    <td>{user.email}</td><td>{user.role}</td><td>{user.isActive ? "Hoạt động" : "Bị khóa"}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button onClick={() => toggleField(id, "isVerified")} type="button">Xác minh</button>
                        <button onClick={() => toggleField(id, "isPremium")} type="button">Premium</button>
                        <button className="is-danger" onClick={() => toggleField(id, "isActive")} type="button">
                          {user.isActive ? "Khóa" : "Mở khóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminPlaceholder({ eyebrow, title, children }) {
  return (
    <div>
      <header className="page-heading page-heading--compact">
        <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{children}</p></div>
      </header>
      <section className="dashboard-panel"><p className="muted-copy">Chưa có dữ liệu khả dụng từ API hiện tại.</p></section>
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports] = useState([]);

  useEffect(() => {
    Promise.allSettled([apiProducts.getAll(), apiFishermen.getAll()]).then(
      ([productResult, fishermanResult]) => {
        if (productResult.status === "fulfilled") {
          const data = productResult.value;
          setListings(Array.isArray(data) ? data : data?.products || []);
        }
        if (fishermanResult.status === "fulfilled") {
          const data = fishermanResult.value;
          const fishermen = Array.isArray(data) ? data : data?.fishermen || [];
          setUsers(fishermen.map((seller) => ({
            ...seller,
            email: seller.email || `${seller.id || seller._id}@haisan.vn`,
            role: "Seller",
            isActive: seller.isActive !== false,
          })));
        }
      },
    );
  }, []);

  return (
    <div className="workspace-page">
      <Routes>
        <Route index element={<AdminOverview listings={listings} reports={reports} users={users} />} />
        <Route path="users" element={<AdminUsers onUpdateUsers={setUsers} users={users} />} />
        <Route path="listings" element={<AdminPlaceholder eyebrow="PRODUCT MODERATION" title="Duyệt sản phẩm">Kiểm duyệt mẻ hàng trước khi hiển thị trên chợ.</AdminPlaceholder>} />
        <Route path="reports" element={<AdminPlaceholder eyebrow="SAFETY REPORTS" title="Report">Xử lý báo cáo sản phẩm hoặc nội dung vi phạm.</AdminPlaceholder>} />
      </Routes>
    </div>
  );
}
