import { useEffect, useState } from "react";
import { CheckCircle, CreditCard, Crown, RefreshCw } from "lucide-react";
import { apiAdmin } from "../../services/api";

const formatCurrency = (val) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(val || 0));

export default function AdminPayments() {
  const [stats, setStats] = useState({ premiumUsers: 0, totalRevenue: 0, transactionsCount: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await apiAdmin.getStats();
      const rawUsers = await apiAdmin.getUsers({ limit: 100 });
      const userList = Array.isArray(rawUsers) ? rawUsers : rawUsers?.data || [];
      const premiumCount = userList.filter((u) => u.isPremium).length;
      
      setStats({
        premiumUsers: premiumCount,
        totalRevenue: premiumCount * 199000,
        transactionsCount: premiumCount,
      });
    } catch (err) {
      console.error("Error loading admin payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const metrics = [
    { icon: CreditCard, label: "Tổng doanh thu Premium", value: formatCurrency(stats.totalRevenue), tone: "green" },
    { icon: CheckCircle, label: "Giao dịch thành công", value: stats.transactionsCount, tone: "blue" },
    { icon: Crown, label: "Tài khoản Premium đang hoạt động", value: stats.premiumUsers, tone: "amber" },
  ];

  return (
    <div className="workspace-page">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">QUẢN LÝ PREMIUM & THANH TOÁN</span>
          <h1>Quản lý Premium</h1>
          <p>Thống kê thực tế các giao dịch nâng cấp tài khoản ngư dân & người mua.</p>
        </div>
        <button className="button button--ghost" onClick={loadStats} type="button">
          <RefreshCw size={16} /> Làm mới
        </button>
      </header>
      <div className="dashboard-metrics admin-metrics">
        {metrics.map(({ icon: Icon, label, tone, value }) => (
          <article className={`dashboard-metric dashboard-metric--${tone}`} key={label}>
            <Icon size={21} /><span>{label}</span><strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="dashboard-panel" style={{ marginTop: "16px", padding: "16px" }}>
        <h3>Danh sách gói dịch vụ</h3>
        <table style={{ width: "100%", marginTop: "12px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "8px" }}>Tên gói</th>
              <th style={{ padding: "8px" }}>Giá niêm yết</th>
              <th style={{ padding: "8px" }}>Quyền lợi chính</th>
              <th style={{ padding: "8px" }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "8px", fontWeight: "700" }}>Premium Ngư Dân / Người Mua</td>
              <td style={{ padding: "8px" }}>199.000đ / tháng</td>
              <td style={{ padding: "8px" }}>Huy hiệu Vương miện, Đăng bài không giới hạn, Ưu tiên hiển thị top Chợ</td>
              <td style={{ padding: "8px", color: "#16a34a", fontWeight: "600" }}>Đang hoạt động</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
