import { Crown } from "lucide-react";

export default function Premium() {
  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">PREMIUM MEMBERSHIP</span>
          <h1><Crown size={26} /> Premium</h1>
          <p>Nâng cấp tài khoản để nhận quyền lợi nổi bật dành cho thành viên Premium.</p>
        </div>
      </header>
      <section className="dashboard-panel">
        <h2>Nâng cấp Premium</h2>
        <p className="muted-copy">Thanh toán trên hệ thống chỉ được sử dụng cho gói Premium, không dùng để mua sản phẩm.</p>
      </section>
    </div>
  );
}
