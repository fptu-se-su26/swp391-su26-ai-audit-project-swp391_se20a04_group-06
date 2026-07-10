import { Award, Crown, ShieldCheck, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFishermen } from "../services/api";

export default function Leaderboard() {
  const [sellers, setSellers] = useState([]);
  useEffect(() => {
    apiFishermen.getAll({ hasActive: false, limit: 50 }).then((data) => {
      const ranked = [...(data?.data || [])].sort(
        (a, b) =>
          Number(b.avgRating || 0) - Number(a.avgRating || 0) ||
          Number(b.ratingCount || 0) - Number(a.ratingCount || 0) ||
          Number(b.activeProducts || 0) - Number(a.activeProducts || 0),
      );
      setSellers(ranked);
    }).catch(() => setSellers([]));
  }, []);

  return (
    <div className="page-container leaderboard-page">
      <header className="page-heading"><div><span className="eyebrow">TRUST & REPUTATION</span><h1><Trophy size={27} /> Bảng xếp hạng ngư dân</h1><p>Xếp hạng theo điểm đánh giá, số lượt review và hoạt động trên chợ.</p></div></header>
      <div className="leaderboard-list">
        {sellers.map((seller, index) => (
          <Link className="leaderboard-row" key={seller.id || seller._id} to={`/fisherman/${seller.id || seller._id}`}>
            <strong className={`leaderboard-rank rank-${index + 1}`}>{index < 3 ? <Crown size={19} /> : index + 1}</strong>
            <span className="leaderboard-avatar">{(seller.name || "ND").slice(0, 2).toUpperCase()}</span>
            <div><h2>{seller.name} {seller.isVerified && <ShieldCheck size={16} />}</h2><p>{seller.badges?.map((badge) => <span key={badge}><Award size={13} /> {badge}</span>)}</p></div>
            <span className="leaderboard-score"><Star size={17} /> {Number(seller.avgRating || 0).toFixed(1)}<small>{seller.ratingCount || 0} đánh giá</small></span>
          </Link>
        ))}
        {sellers.length === 0 && <div className="empty-state">Chưa có dữ liệu xếp hạng.</div>}
      </div>
    </div>
  );
}
