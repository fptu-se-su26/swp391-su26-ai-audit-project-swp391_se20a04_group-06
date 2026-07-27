import { useEffect, useState } from "react";
import { adService } from "../services/adService";

const SHOPEE_DEMO_URL = "https://shopee.vn/(-1-xanh-1-%C4%90%E1%BB%8E)-COMBO-N%C6%AF%E1%BB%9AC-CH%E1%BA%A4M-H%E1%BA%A2I-S%E1%BA%A2N-XANH-%C4%90%E1%BB%8E-TH%E1%BB%8A-B%C3%94NG-(-chai-330ml-i.628058054.40900363017?extraParams=%7B%22display_model_id%22%3A139367593797%2C%22model_selection_logic%22%3A3%7D";

export default function AdBanner({ targetRole = "buyer", className = "" }) {
  const [ads, setAds] = useState([]);
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  useEffect(() => {
    adService.getTargetedAds(targetRole).then((data) => {
      setAds(data || []);
    });
  }, [targetRole]);

  // 5-second auto rotation loop
  useEffect(() => {
    if (!ads || ads.length < 2) return;

    const timer = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [ads]);

  if (!ads || ads.length === 0) return null;

  return (
    <aside className={`sponsor-sidebar-widget ${className}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 className="sponsor-widget-heading" style={{ margin: 0 }}>Được tài trợ</h3>
        <small className="muted-copy" style={{ fontSize: "0.75rem", color: "#64748b" }}>Tự động đổi sau 5s</small>
      </div>

      <div className="sponsor-ad-list">
        {ads.map((ad, idx) => (
          <a
            key={ad.id || `${ad.title}-${idx}`}
            href={ad.ctaUrl || SHOPEE_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`sponsor-ad-item ${idx === activeAdIndex ? "is-active" : ""}`}
            style={{
              display: idx === activeAdIndex ? "flex" : "none",
              transition: "opacity 0.5s ease-in-out"
            }}
          >
            {ad.imageUrl && (
              <div className="sponsor-ad-thumb-wrap">
                <img src={ad.imageUrl} alt={ad.title} loading="lazy" />
              </div>
            )}
            <div className="sponsor-ad-content">
              <h4 className="sponsor-ad-title">{ad.title}</h4>
              <span className="sponsor-ad-domain">{ad.sponsorName || "haisan.vn · Shopee Demo"}</span>
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}
