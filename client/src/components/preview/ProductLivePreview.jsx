import { Image, Tag, Scale, MapPin, Ruler } from "lucide-react";
import { useEffect, useState } from "react";
import { getCategoryLabel, getProductSizeLabel } from "../../utils/labelMaps";

export default function ProductLivePreview({ product }) {
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    const firstImg = product?.images?.[0];
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
  }, [product?.images]);

  const formatPrice = (val) => {
    if (!val || isNaN(val)) return "Giá sẽ hiển thị ở đây";
    const formatted = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
    return `${formatted} / kg`;
  };

  return (
    <div className="product-live-preview" style={{ padding: "12px", border: "1px dashed rgba(34, 243, 255, 0.2)", borderRadius: "14px", background: "rgba(15, 23, 42, 0.4)", marginBottom: "16px" }}>
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        
        {/* Product Image */}
        <div style={{ width: "90px", height: "90px", borderRadius: "10px", background: "#0b131f", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          {imageSrc ? (
            <img alt="Sản phẩm" src={imageSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Image size={24} style={{ color: "#475569" }} />
          )}
        </div>

        {/* Product Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.7rem", color: "#67e8f9", background: "rgba(34, 243, 255, 0.08)", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
              {product?.type === "Fresh" ? "Tươi" : "Đồ khô"}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
              {getCategoryLabel(product?.category)}
            </span>
          </div>

          <h5 style={{ margin: "0 0 6px 0", color: "#f8fafc", fontSize: "0.9rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {product?.name?.trim() || <span style={{ color: "#475569" }}>Tên hải sản</span>}
          </h5>

          <p style={{ margin: "0 0 6px 0", color: "#22f3ff", fontSize: "0.85rem", fontWeight: "700" }}>
            {formatPrice(product?.price)}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "0.75rem", color: "#94a3b8" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Scale size={12} />
              <span>{product?.totalWeight || 0} kg</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Ruler size={12} />
              <span>Size: {getProductSizeLabel(product?.productSize)}</span>
            </span>
          </div>
        </div>

      </div>

      {product?.description?.trim() && (
        <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "0.75rem", lineHeight: "1.4", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
          {product.description}
        </p>
      )}
    </div>
  );
}
