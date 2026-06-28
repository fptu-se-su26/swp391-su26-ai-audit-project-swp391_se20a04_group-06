import { CheckCircle, CreditCard, Crown } from "lucide-react";

export default function AdminPayments() {
  const metrics = [
    { icon: CreditCard, label: "Tổng giao dịch Premium", value: "0đ", tone: "green" },
    { icon: CheckCircle, label: "Giao dịch thành công", value: 0, tone: "blue" },
    { icon: Crown, label: "Premium đang hoạt động", value: 0, tone: "amber" },
  ];

  return (
    <div className="workspace-page">
      <header className="page-heading page-heading--compact">
        <div><span className="eyebrow">PREMIUM MANAGEMENT</span><h1>Premium</h1><p>Quản lý giao dịch nâng cấp tài khoản.</p></div>
      </header>
      <div className="dashboard-metrics admin-metrics">
        {metrics.map(({ icon: Icon, label, tone, value }) => (
          <article className={`dashboard-metric dashboard-metric--${tone}`} key={label}>
            <Icon size={21} /><span>{label}</span><strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="empty-state">Chưa có giao dịch Premium từ API hiện tại.</div>
    </div>
  );
}
