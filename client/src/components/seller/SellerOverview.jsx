import { Eye, Fish, MessageSquare, Star, UserRound, UsersRound } from "lucide-react";
import { formatCurrency, getProductId } from "../../utils/product";

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <article className={`dashboard-metric dashboard-metric--${tone}`}>
      <Icon size={21} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function SellerOverview({ conversations = [], products = [], user, statistics = false }) {
  const activeProducts = products.filter((product) => product.status === "Active");
  const productViews = products.reduce((total, product) => total + Number(product.viewCount || 0), 0);
  const newMessages = conversations.reduce(
    (total, conversation) => total + Number(conversation.unread || 0),
    0,
  );
  const featuredProducts = [...products]
    .sort((left, right) => Number(right.viewCount || 0) - Number(left.viewCount || 0))
    .slice(0, statistics ? 8 : 4);

  return (
    <div className="seller-overview">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">{statistics ? "SELLER ANALYTICS" : "SELLER DASHBOARD"}</span>
          <h1>{statistics ? "Thống kê hoạt động" : "Tổng quan người bán"}</h1>
          <p>Dữ liệu tập trung vào lượt quan tâm và kết nối trực tiếp với người mua.</p>
        </div>
      </header>

      <div className="dashboard-metrics">
        <MetricCard icon={Fish} label="Sản phẩm đang bán" tone="teal" value={activeProducts.length} />
        <MetricCard icon={Eye} label="Lượt xem sản phẩm" tone="blue" value={productViews} />
        <MetricCard icon={MessageSquare} label="Tin nhắn mới" tone="violet" value={newMessages} />
        <MetricCard icon={UsersRound} label="Người theo dõi" tone="amber" value={user?.followersCount || 0} />
        <MetricCard icon={UserRound} label="Lượt xem hồ sơ" tone="rose" value={user?.profileViewCount || 0} />
        <MetricCard icon={Star} label="Sản phẩm nổi bật" tone="green" value={featuredProducts.length} />
      </div>

      <section className="dashboard-panel">
        <header>
          <div>
            <h2>Sản phẩm nổi bật</h2>
            <p>Xếp theo lượt xem hiện có.</p>
          </div>
        </header>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
              </tr>
            </thead>
            <tbody>
              {featuredProducts.map((product) => (
                <tr key={getProductId(product)}>
                  <td>{product.name}</td>
                  <td>{formatCurrency(product.price)} / kg</td>
                  <td>
                    <span className={`status-chip ${product.status === "Active" ? "status-chip--active" : "status-chip--inactive"}`}>
                      {product.status === "Active" ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td>{Number(product.viewCount || 0)}</td>
                </tr>
              ))}
              {featuredProducts.length === 0 && (
                <tr><td className="table-empty" colSpan="4">Chưa có sản phẩm để thống kê.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
