/**
 * VerifiedBadge.jsx
 *
 * Badge ✓ "Đã xác minh" — dùng khắp nơi:
 *   - ProductCard (bên cạnh tên người bán)
 *   - SellerProfilePage (dưới avatar)
 *   - ChatBox header
 *   - InboxTab (bên cạnh tên)
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg'  (default: 'sm')
 *   showLabel: boolean          (default: false — chỉ hiện icon)
 */

import React from "react";

const SIZES = {
  sm: { fontSize: 11, padding: "1px 6px", iconSize: 10 },
  md: { fontSize: 13, padding: "2px 8px", iconSize: 12 },
  lg: { fontSize: 15, padding: "4px 12px", iconSize: 14 },
};

export function VerifiedBadge({ size = "sm", showLabel = false, style = {} }) {
  const s = SIZES[size];
  return (
    <span
      title="Người bán đã được Admin xác minh"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
        color: "#fff",
        borderRadius: 20,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 700,
        verticalAlign: "middle",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <svg
        width={s.iconSize}
        height={s.iconSize}
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 3L4.5 8.5L2 6"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && "Đã xác minh"}
    </span>
  );
}

/**
 * ─── Hướng dẫn dùng VerifiedBadge trong ProductCard ───
 *
 * Tìm chỗ hiện tên seller trong ProductCard.jsx:
 *
 *   <span>{product.sellerName}</span>
 *
 * Đổi thành:
 *
 *   <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
 *     {product.sellerName}
 *     {product.sellerIsVerified && <VerifiedBadge />}
 *   </span>
 *
 * Lưu ý: backend cần thêm `u.IsVerified AS sellerIsVerified` vào query product.
 */

/**
 * ─── Hướng dẫn dùng trong SellerProfilePage ───
 *
 *   <h1>{seller.name}</h1>
 *   {seller.isVerified && <VerifiedBadge size="lg" showLabel />}
 *
 */
