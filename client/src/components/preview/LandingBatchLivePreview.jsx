import { Ship, CalendarDays, MapPin, Anchor, Package } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import ProductLivePreview from "./ProductLivePreview";

export default function LandingBatchLivePreview({ batch, products }) {
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    const firstImg = batch?.images?.[0];
    if (firstImg) {
      if (firstImg instanceof File) {
        const url = URL.createObjectURL(firstImg);
        setImageSrc(url);
        return () => URL.revokeObjectURL(url);
      } else if (typeof firstImg === "string") {
        setImageSrc(firstImg);
      }
    } else {
      setImageSrc("");
    }
    return undefined;
  }, [batch?.images]);

  const totalKg = useMemo(() => {
    return products
      .filter((p) => p.name.trim())
      .reduce((sum, p) => sum + (Number(p.totalWeight) || 0), 0);
  }, [products]);

  const validProducts = useMemo(() => {
    return products.filter((p) => p.name.trim());
  }, [products]);

  return (
    <div className="landing-batch-live-preview">
      {/* Batch Image */}
      <div className="recipe-detail__media" style={{ height: "160px", marginBottom: "16px" }}>
        {imageSrc ? (
          <img
            alt={batch.title || "Xem trước vựa cá"}
            src={imageSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }}
          />
        ) : (
          <div className="recipe-detail__placeholder" style={{ padding: "20px" }}>
            <Anchor size={36} />
            <span style={{ fontSize: "0.8rem", marginTop: "6px" }}>Ảnh vựa cá sẽ hiển thị ở đây</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 style={{ margin: "0 0 8px 0", color: "#f8fafc", fontSize: "1.2rem", fontWeight: "700" }}>
        {batch.title?.trim() || <span style={{ color: "#475569" }}>Tên vựa cá</span>}
      </h3>

      {/* Description */}
      {batch.description?.trim() && (
        <p style={{ margin: "0 0 16px 0", color: "#94a3b8", fontSize: "0.8rem", lineHeight: "1.4" }}>
          {batch.description}
        </p>
      )}

      {/* Metadata Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", background: "rgba(34, 243, 255, 0.04)", border: "1px solid rgba(34, 243, 255, 0.1)", borderRadius: "10px", marginBottom: "16px", fontSize: "0.75rem", color: "#cbd5e1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Ship size={14} style={{ color: "#22f3ff" }} />
          <span>Tàu: {batch.boatName?.trim() || <span style={{ color: "#475569" }}>Chưa nhập</span>}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={14} style={{ color: "#22f3ff" }} />
          <span>Nguồn: {batch.origin?.trim() || <span style={{ color: "#475569" }}>Chưa nhập</span>}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={14} style={{ color: "#22f3ff" }} />
          <span>Vùng: {batch.catchArea?.trim() || <span style={{ color: "#475569" }}>Chưa nhập</span>}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CalendarDays size={14} style={{ color: "#22f3ff" }} />
          <span>Cập bến: {batch.landingTime ? new Date(batch.landingTime).toLocaleDateString("vi-VN") : <span style={{ color: "#475569" }}>Chưa chọn</span>}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "10px", marginBottom: "16px" }}>
        <span>Tổng số loại: <strong style={{ color: "#fff" }}>{validProducts.length}</strong></span>
        <span>Tổng sản lượng: <strong style={{ color: "#22f3ff" }}>{totalKg} kg</strong></span>
      </div>

      {/* Products List Section */}
      <div>
        <h4 style={{ margin: "0 0 10px 0", color: "#cbd5e1", fontSize: "0.85rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Package size={14} style={{ color: "#22f3ff" }} />
          <span>Hải sản trong chuyến hàng</span>
        </h4>
        {validProducts.length > 0 ? (
          <div>
            {validProducts.map((prod) => (
              <ProductLivePreview key={prod.rowId} product={prod} />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: "#475569", fontSize: "0.8rem", textAlign: "center", padding: "16px 0" }}>
            Các loại hải sản sẽ hiển thị tại đây
          </p>
        )}
      </div>
    </div>
  );
}
