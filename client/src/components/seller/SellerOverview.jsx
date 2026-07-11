import {
  Bell,
  BookOpen,
  Eye,
  FileText,
  MessageSquare,
  PackagePlus,
  Plus,
  Scale,
  Ship,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, getMarketplaceStatus, getProductId } from "../../utils/product";
import { formatLandingDateTime, getLandingBatchId } from "../../utils/landingBatch";

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <article className={`dashboard-metric dashboard-metric--${tone}`}>
      <Icon size={21} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function SellerOverview({
  boatLogs = [],
  conversations = [],
  notifications = [],
  products = [],
  landingBatches = [],
  user,
  statistics = false,
}) {
  const productViews = products.reduce((total, product) => total + Number(product.viewCount || 0), 0);
  const newMessages = conversations.reduce(
    (total, conversation) => total + Number(conversation.unread || 0),
    0,
  );
  const featuredProducts = [...products]
    .sort((left, right) => Number(right.viewCount || 0) - Number(left.viewCount || 0))
    .slice(0, statistics ? 8 : 4);
  const activeBatches = landingBatches.filter((batch) => batch.status === "Active");
  const totalBatchProducts = activeBatches.reduce(
    (total, batch) => total + Number(batch.productCount || 0),
    0,
  );
  const totalRemainingWeight = activeBatches.reduce(
    (total, batch) => total + Number(batch.remainingWeight || 0),
    0,
  );
  const latestBatch = landingBatches[0];

  return (
    <div className="seller-overview">
      <header className="page-heading page-heading--compact">
        <div>
          <h1>{statistics ? "Thống kê hoạt động" : "Tổng quan người bán"}</h1>
          <p>Dữ liệu tập trung vào lượt quan tâm và kết nối trực tiếp với người mua.</p>
        </div>
      </header>

      <div className="dashboard-metrics" data-tour="seller-metrics">
        <MetricCard icon={Eye} label="Lượt xem" tone="blue" value={productViews} />
        <MetricCard icon={MessageSquare} label="Tin nhắn" tone="violet" value={newMessages} />
        <MetricCard icon={FileText} label="Bài đăng" tone="teal" value={products.length} />
        <MetricCard icon={Ship} label="Vựa đang mở" tone="blue" value={activeBatches.length} />
        <MetricCard icon={BookOpen} label="Boat Log" tone="green" value={boatLogs.length} />
        <MetricCard icon={UsersRound} label="Follower" tone="amber" value={user?.followersCount || 0} />
        <MetricCard icon={Bell} label="Thông báo" tone="rose" value={notifications.length} />
      </div>

      <section className="dashboard-panel seller-batch-overview" data-tour="seller-batch-overview">
        <header>
          <div>
            <h2>Vựa cá của tôi</h2>
            <p>Tổng hợp các phiên cập bến từ dữ liệu thật.</p>
          </div>
          <Link className="button button--primary" data-tour="seller-create-batch" to="/seller/landing-batches/new">
            <Plus size={16} /> Tạo vựa cá
          </Link>
        </header>
        {landingBatches.length > 0 ? (
          <>
            <div className="seller-batch-overview__metrics">
              <span><Ship size={17} /><strong>{activeBatches.length}</strong> vựa đang mở</span>
              <span><PackagePlus size={17} /><strong>{totalBatchProducts}</strong> sản phẩm đang bán</span>
              <span><Scale size={17} /><strong>{totalRemainingWeight}</strong> kg còn lại</span>
            </div>
            {latestBatch && (
              <Link className="seller-batch-overview__latest" to={`/landing-batches/${getLandingBatchId(latestBatch)}`}>
                <span>Vựa mới nhất</span>
                <strong>{latestBatch.title}</strong>
                <small>{formatLandingDateTime(latestBatch.landingTime || latestBatch.createdAt)}</small>
              </Link>
            )}
            <div className="seller-batch-overview__actions">
              <Link className="button button--secondary" to="/seller/landing-batches">Quản lý vựa cá</Link>
              <Link className="button button--ghost" to="/seller/landing-batches">Quản lý sản phẩm trong vựa</Link>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Ship size={30} />
            <strong>Bạn chưa tạo phiên cập bến nào</strong>
            <Link className="button button--primary" to="/seller/landing-batches/new">
              Tạo vựa cá đầu tiên
            </Link>
          </div>
        )}
      </section>

      <section className="dashboard-panel" data-tour="seller-featured-products">
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
              {featuredProducts.map((product) => {
                const marketplaceStatus = getMarketplaceStatus(product);
                return (
                  <tr key={getProductId(product)}>
                    <td>{product.name}</td>
                    <td>{formatCurrency(product.price)} / kg</td>
                    <td>
                      <span className={`status-chip status-chip--${marketplaceStatus.key}`}>
                        {marketplaceStatus.label}
                      </span>
                    </td>
                    <td>{Number(product.viewCount || 0)}</td>
                  </tr>
                );
              })}
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
