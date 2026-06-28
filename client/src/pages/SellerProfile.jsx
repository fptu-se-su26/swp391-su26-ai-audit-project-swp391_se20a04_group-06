import { useEffect, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { useParams } from "react-router-dom";
import { apiFishermen } from "../services/api";

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    apiFishermen.getProfile(id).then(setSeller).catch(() => setSeller(null));
  }, [id]);

  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">SELLER PROFILE</span>
          <h1><UserRound size={25} /> Hồ sơ ngư dân</h1>
        </div>
      </header>
      <section className="dashboard-panel profile-summary">
        <span>{(seller?.name || "ND").slice(0, 2).toUpperCase()}</span>
        <div>
          <h2>{seller?.name || "Đang tải hồ sơ..."}</h2>
          <p>{seller?.bio || "Người bán chưa cập nhật giới thiệu."}</p>
          {seller?.isVerified && <small><ShieldCheck size={14} /> Đã xác minh</small>}
        </div>
      </section>
    </div>
  );
}
