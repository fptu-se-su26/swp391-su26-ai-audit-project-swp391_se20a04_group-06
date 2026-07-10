import {
  Anchor,
  Bot,
  Clock3,
  Edit3,
  Lock,
  MapPin,
  PackageOpen,
  Scale,
  ShieldCheck,
  Ship,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductGrid from "../components/ProductGrid";
import SellerLocationMap from "../components/SellerLocationMap";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";

import {
  apiFavorites,
  apiLandingBatches,
} from "../services/api";
import {
  formatLandingDateTime,
  getLandingBatchImage,
  getLandingBatchStatus,
  landingBatchCategoryLabels,
} from "../utils/landingBatch";

export default function LandingBatchDetail() {
  const { confirm, alert } = useConfirm();
  const { id } = useParams();
  const { user } = useAuth();
  const [batch, setBatch] = useState(null);

  const [favorites, setFavorites] = useState(new Set());
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.allSettled([
      apiLandingBatches.getById(id),
      user ? apiFavorites.getIds() : Promise.resolve([]),
    ]).then(([batchResult, favoriteResult]) => {
      if (batchResult.status === "fulfilled") setBatch(batchResult.value);
      else setNotice(batchResult.reason?.message || "Lỗi tải dữ liệu");
      if (favoriteResult.status === "fulfilled") {
        setFavorites(new Set((favoriteResult.value || []).map(String)));
      }
      setLoading(false);
    });
  }, [id, user]);

  const filteredProducts = useMemo(() => {
    if (!batch?.products) return [];
    const products = batch.products.filter(
      (product) => category === "All" || product.category === category,
    );
    if (sort === "price-low") {
      return [...products].sort((a, b) => Number(a.price) - Number(b.price));
    }
    if (sort === "price-high") {
      return [...products].sort((a, b) => Number(b.price) - Number(a.price));
    }
    return products;
  }, [batch, category, sort]);

  const toggleFavorite = async (productId) => {
    try {
      const result = await apiFavorites.toggle(productId);
      setFavorites((current) => {
        const next = new Set(current);
        if (result.favorited) next.add(String(productId));
        else next.delete(String(productId));
        return next;
      });
    } catch (error) {
      await alert({
        title: "Lỗi",
        message: error.message,
        variant: "danger"
      });
    }
  };

  const closeBatch = async () => {
    const ok = await confirm({
      title: "Đóng vựa cá?",
      message: "Bạn có chắc muốn đóng vựa cá này? Dữ liệu và sản phẩm vẫn được giữ lại.",
      confirmText: "Đóng vựa cá",
      variant: "warning"
    });
    if (!ok) return;
    try {
      await apiLandingBatches.update(id, { status: "Closed" });
      setBatch((current) => ({ ...current, status: "Closed" }));
      setNotice("Đã đóng vựa cá.");
    } catch (error) {
      setNotice(error.message);
    }
  };


  const askAi = () => {
    if (!batch.products?.length) {
      setNotice("Chưa có đủ dữ liệu để AI gợi ý món ăn.");
      return;
    }
    const productNames = batch.products
      .map((product) => product.name)
      .filter(Boolean)
      .slice(0, 12)
      .join(", ");
    window.dispatchEvent(
      new CustomEvent("haisan:assistant-question", {
        detail: {
          question: `Gợi ý món ăn và cách bảo quản phù hợp từ các hải sản thật trong vựa "${batch.title}": ${productNames}.`,
        },
      }),
    );
  };

  if (loading) return <div className="page-state">Đang tải vựa cá...</div>;
  if (!batch) return <div className="page-state">{notice || "Không tìm thấy vựa cá."}</div>;

  const image = getLandingBatchImage(batch);
  const status = getLandingBatchStatus(batch.status);
  const userId = String(user?.id || user?._id || "");
  const isOwner = userId && userId === String(batch.sellerId);
  const isAdmin = ["Admin", "admin"].includes(user?.role);
  const canManage = isOwner || isAdmin;
  const timeline = [
    batch.catchTime && { label: "Đánh bắt", value: batch.catchTime },
    batch.landingTime && { label: "Cập bến", value: batch.landingTime },
    batch.createdAt && { label: "Đăng bán", value: batch.createdAt },
  ].filter(Boolean);

  return (
    <div className="page-container landing-batch-detail">
      {notice && <p className="inline-notice">{notice}</p>}

      <section className="landing-batch-hero">
        <div className="landing-batch-hero__media">
          {image ? <img alt={batch.title} src={image} /> : <Ship size={58} />}
        </div>
        <div className="landing-batch-hero__content">
          <div className="landing-batch-hero__badges">
            <span className={`batch-status batch-status--${status.key}`}>{status.label}</span>
            {batch.freshnessLabel && (
              <span className="batch-status batch-status--new">
                {batch.freshnessLabel}
              </span>
            )}
          </div>
          <span className="eyebrow">PHIÊN CẬP BẾN</span>
          <h1>{batch.title}</h1>
          {batch.description && <p>{batch.description}</p>}
          <Link className="landing-batch-seller" to={`/fisherman/${batch.sellerId}`}>
            <span>{(batch.sellerName || "ND").slice(0, 2).toUpperCase()}</span>
            <strong>{batch.sellerName || "Ngư dân"} {batch.sellerIsVerified && <ShieldCheck size={15} />}</strong>
          </Link>
          <div className="landing-batch-hero__actions">
            <button className="button button--primary" onClick={askAi} type="button">
              <Bot size={17} /> AI gợi ý món ăn từ vựa này
            </button>
            {canManage && (
              <>
                <Link className="button button--secondary" to={`/seller/landing-batches/${id}/edit`}>
                  <Edit3 size={16} /> Sửa vựa
                </Link>
                {batch.status === "Active" && (
                  <button className="button button--ghost" onClick={closeBatch} type="button">
                    <Lock size={16} /> Đóng vựa
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="landing-batch-summary">
        <article><Ship /><span>Tên tàu</span><strong>{batch.boatName || "Chưa cập nhật"}</strong></article>
        <article><MapPin /><span>Khu vực đánh bắt</span><strong>{batch.catchArea || "Chưa cập nhật"}</strong></article>
        <article><Clock3 /><span>Thời gian cập bến</span><strong>{formatLandingDateTime(batch.landingTime)}</strong></article>
        <article><Anchor /><span>Nguồn gốc</span><strong>{batch.origin || "Chưa cập nhật"}</strong></article>
        <article><PackageOpen /><span>Số loại hải sản</span><strong>{Number(batch.productCount || 0)}</strong></article>
        <article><Scale /><span>Khối lượng còn lại</span><strong>{Number(batch.remainingWeight || 0)} / {Number(batch.totalWeight || 0)} kg</strong></article>
      </section>

      {timeline.length > 0 && (
        <section className="home-section landing-batch-timeline-section">
          <header className="section-heading"><div><span className="eyebrow">JOURNEY</span><h2>Timeline chuyến biển</h2></div></header>
          <ol className="landing-batch-timeline">
            {timeline.map((item) => (
              <li key={item.label}><span /><strong>{item.label}</strong><time>{formatLandingDateTime(item.value)}</time></li>
            ))}
          </ol>
        </section>
      )}

      {Number.isFinite(Number(batch.lat)) && Number.isFinite(Number(batch.lng)) && (
        <section className="home-section">
          <header className="section-heading"><div><span className="eyebrow">LOCATION</span><h2>Vị trí bán</h2></div></header>
          <SellerLocationMap lat={batch.lat} lng={batch.lng} sellerName={batch.sellerName} />
        </section>
      )}

      <section className="home-section">
        <header className="section-heading landing-batch-products-heading">
          <div><span className="eyebrow">SEAFOOD IN THIS BATCH</span><h2>Hải sản trong vựa</h2></div>
          {batch.products?.length > 0 && (
            <div className="landing-batch-product-filters">
              <select aria-label="Lọc theo danh mục" onChange={(event) => setCategory(event.target.value)} value={category}>
                <option value="All">Tất cả</option>
                {(batch.categories || []).map((item) => (
                  <option key={item} value={item}>{landingBatchCategoryLabels[item] || item}</option>
                ))}
              </select>
              <select aria-label="Sắp xếp sản phẩm" onChange={(event) => setSort(event.target.value)} value={sort}>
                <option value="default">Mặc định</option>
                <option value="price-low">Giá tăng dần</option>
                <option value="price-high">Giá giảm dần</option>
              </select>
            </div>
          )}
        </header>
        {filteredProducts.length > 0 ? (
          <ProductGrid
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            products={filteredProducts}
          />
        ) : (
          <div className="empty-state">Không tìm thấy sản phẩm trong vựa này</div>
        )}
      </section>

      {batch.boatLog && (
        <section className="home-section landing-batch-boat-log">
          <header className="section-heading"><div><span className="eyebrow">CABIN LOG</span><h2>Nhật ký đi biển liên quan</h2></div></header>
          <article>
            {batch.boatLog.images?.[0] && <img alt="" src={batch.boatLog.images[0]} />}
            <div>
              <p>{batch.boatLog.content}</p>
              <time>{formatLandingDateTime(batch.boatLog.createdAt)}</time>
              {canManage && <Link to="/seller/boat-log">Xem nhật ký đi biển</Link>}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
