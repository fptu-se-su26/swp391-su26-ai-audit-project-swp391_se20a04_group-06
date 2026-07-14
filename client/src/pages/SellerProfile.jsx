import {
  Anchor,
  Award,
  Crown,
  Heart,
  PackageOpen,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReviewSection from "../components/ReviewSection";
import LandingBatchCard from "../components/LandingBatchCard";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";

import { apiFishermen, apiLandingBatches } from "../services/api";
import { formatCurrency, formatDate, getProductId, getProductImage } from "../utils/product";

export default function SellerProfile() {
  const { alert } = useConfirm();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [boatLogs, setBoatLogs] = useState([]);
  const [landingBatches, setLandingBatches] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFishermen.getProfile(id),
      apiFishermen.getProducts(id, { limit: 12 }),
      apiFishermen.getBoatLogs(id, { limit: 6 }),
      apiLandingBatches.getAll({ sellerId: id, limit: 5 }),
      user ? apiFishermen.checkFollow(id) : Promise.resolve(null),
    ]).then(([profileResult, productResult, logResult, batchResult, followResult]) => {
      if (profileResult.status === "fulfilled") setProfile(profileResult.value);
      if (productResult.status === "fulfilled") setProducts(productResult.value?.data || []);
      if (logResult.status === "fulfilled") setBoatLogs(logResult.value?.data || []);
      if (batchResult.status === "fulfilled") {
        setLandingBatches(batchResult.value?.data || []);
      }
      if (followResult.status === "fulfilled") {
        setFollowing(Boolean(followResult.value?.following || followResult.value?.isFollowing));
      }
      setLoading(false);
    });
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) {
      navigate("/login", { state: { message: "Bạn cần đăng nhập để theo dõi ngư dân." } });
      return;
    }
    try {
      const result = await apiFishermen.toggleFollow(id);
      setFollowing(Boolean(result.following ?? result.isFollowing));
      setProfile((current) => current && ({
        ...current,
        stats: {
          ...current.stats,
          followersCount:
            Number(current.stats?.followersCount || 0) + (result.following ? 1 : -1),
        },
      }));
    } catch (error) {
      await alert({
        title: "Lỗi theo dõi",
        message: error.message,
        variant: "danger"
      });
    }
  };


  if (loading) return <div className="page-state">Đang tải hồ sơ ngư dân...</div>;
  if (!profile?.user) return <div className="page-state">Không tìm thấy hồ sơ ngư dân.</div>;
  const seller = profile.user;
  const stats = profile.stats || {};

  return (
    <div className="page-container seller-public-page">
      <section className="seller-public-hero">
        <span className="seller-public-avatar">
          {seller.avatar ? <img alt={seller.name} src={seller.avatar} /> : (seller.name || "ND").slice(0, 2).toUpperCase()}
        </span>
        <div>
          <span className="eyebrow">PUBLIC FISHERMAN PROFILE</span>
          <h1>{seller.name} {seller.isVerified && <ShieldCheck size={22} />}</h1>
          <p>
            {seller.isPremium && <span><Crown size={15} /> Premium</span>}
            <span>Thành viên từ {formatDate(seller.memberSince)}</span>
          </p>
          <div className="tag-list">{seller.badges?.map((badge) => <span key={badge}><Award size={13} /> {badge}</span>)}</div>
        </div>
        <button className={`button ${following ? "button--secondary" : "button--primary"}`} onClick={toggleFollow} type="button">
          <Heart size={17} /> {following ? "Đang theo dõi" : "Theo dõi"}
        </button>
      </section>

      <div className="seller-public-stats">
        <article><PackageOpen /><strong>{stats.activeProducts || 0}</strong><span>Sản phẩm</span></article>
        <article><Star /><strong>{Number(stats.avgRating || 0).toFixed(1)}</strong><span>{stats.ratingCount || 0} đánh giá</span></article>
        <article><Heart /><strong>{stats.followersCount || 0}</strong><span>Người theo dõi</span></article>
        <article><Anchor /><strong>{stats.totalBoatLogs || 0}</strong><span>Nhật ký biển</span></article>
      </div>

      <section className="home-section">
        <header className="section-heading"><div><span className="eyebrow">SẢN PHẨM ĐANG BÁN</span><h2>Sản phẩm đang bán</h2></div></header>
        <div className="profile-product-grid">
          {products.map((product) => (
            <Link key={getProductId(product)} to={`/product/${getProductId(product)}`}>
              <img alt={product.name} loading="lazy" src={getProductImage(product)} />
              <div><strong>{product.name}</strong><span>{formatCurrency(product.price)} / kg</span></div>
            </Link>
          ))}
          {products.length === 0 && <div className="empty-state">Chưa có sản phẩm đang bán.</div>}
        </div>
      </section>

      {landingBatches.length > 0 && (
        <section className="home-section">
          <header className="section-heading"><div><span className="eyebrow">VỰA CÁ MỚI</span><h2>Vựa cá gần đây</h2></div></header>
          <div className="landing-batch-grid landing-batch-grid--profile">
            {landingBatches.map((batch) => (
              <LandingBatchCard batch={batch} key={batch.id || batch._id} />
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <header className="section-heading"><div><span className="eyebrow">NHẬT KÝ BIỂN</span><h2>Nhật ký đi biển</h2></div></header>
        <div className="profile-log-grid">
          {boatLogs.map((log) => (
            <article key={log.id || log._id}>
              {log.images?.[0] && <img alt="" loading="lazy" src={log.images[0]} />}
              <p>{log.content}</p><small>{formatDate(log.createdAt)}</small>
            </article>
          ))}
          {boatLogs.length === 0 && <div className="empty-state"><UserRound /> Chưa có nhật ký biển.</div>}
        </div>
      </section>

      <ReviewSection sellerId={id} />
    </div>
  );
}
