---
name: haisanvn-ui
description: >
  Design system skill cho dự án HảiSản.vn — chợ hải sản trực tuyến Việt Nam.
  Bắt buộc đọc skill này trước khi viết BẤT KỲ component, page, hoặc style nào
  trong dự án này. Trigger khi người dùng yêu cầu tạo component mới, sửa UI,
  thêm trang, viết CSS, hoặc bất kỳ thứ gì liên quan đến giao diện HảiSản.vn.
  Luôn ưu tiên skill này thay vì frontend-design generic khi làm việc trong codebase này.
---

# HảiSản.vn UI Design System

Dự án này lấy cảm hứng từ **umai.fish** (chợ hải sản Nhật cao cấp), kết hợp
với phong cách **xanh đại dương – vàng hoàng kim – trắng tinh** đặc trưng.
Luôn đọc file này trước khi viết code UI.

---

## 1. Design Tokens — PHẢI dùng, không được hardcode màu

### Color Constants (`utils/theme.js`)

```js
import { C, S, R } from "../utils/theme";

// Màu chính
C.ocean   = "#0B4F6C"   // Xanh đại dương — primary brand
C.oceanL  = "#1A7FA0"   // Xanh nhạt hơn
C.oceanP  = "#E6F4F9"   // Xanh pastel — background nhẹ
C.oceanD  = "#07364B"   // Xanh đậm — hover state
C.coral   = "#E8643A"   // Cam san hô — CTA, accent
C.coralL  = "#FDE8E0"   // Cam pastel — badge background
C.coralD  = "#C94F27"   // Cam đậm
C.ok      = "#1E8449"   // Xanh lá — success
C.okL     = "#D5F5E3"   // Xanh lá pastel
C.warn    = "#D68910"   // Vàng cảnh báo
C.warnL   = "#FEF3C7"   // Vàng pastel
C.dark    = "#0F1B29"   // Màu chữ tiêu đề
C.text    = "#1C2B3A"   // Màu chữ thường
C.muted   = "#718096"   // Màu chữ phụ
C.border  = "#DDE3EC"   // Viền
C.borderL = "#EDF2F7"   // Viền nhạt
C.bg      = "#F4F7FB"   // Background trang
C.white   = "#FFFFFF"

// Shadows
S.sm  // 0 1px 3px ... — card nhỏ
S.md  // 0 4px 12px ... — panel
S.lg  // 0 10px 28px ... — modal, dropdown
S.xl  // 0 20px 40px ... — overlay

// Radius
R.sm = 6    // input, badge
R.md = 10   // card nhỏ
R.lg = 14   // card thường
R.xl = 20   // section lớn
R.xxl = 28  // hero section
```

### CSS Custom Properties (index.css)

Luôn dùng CSS vars thay vì giá trị hardcode trong inline style:

```css
var(--ocean)      /* #208f67 — body background gradient */
var(--ocean-l)
var(--ocean-p)
var(--coral)
var(--dark)
var(--text)
var(--muted)
var(--border)
var(--border-l)
var(--bg)
var(--white)
var(--font)       /* "Be Vietnam Pro", ... */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)
var(--radius-sm)  /* 6px */
var(--radius-md)  /* 10px */
var(--radius-lg)  /* 14px */
var(--radius-xl)  /* 20px */
var(--radius-2xl) /* 28px */
var(--transition) /* 0.22s cubic-bezier(0.4, 0, 0.2, 1) */
```

---

## 2. Quy tắc viết Style

### Ưu tiên theo thứ tự:

1. **CSS Modules** (`.module.css`) — dùng cho component phức tạp, tái sử dụng nhiều
2. **Inline style** với `C.*` constants — dùng cho style đơn giản, dynamic
3. **Global utility classes** (index.css) — dùng grid layout, skeleton, animation

### KHÔNG được:
- Hardcode màu hex trong code: ❌ `color: "#0B4F6C"` → ✅ `color: C.ocean`
- Dùng `alert()`, `confirm()`, `prompt()` — thay bằng toast/modal component
- Copy-paste style block quá 20 dòng — trích thành CSS Module
- Dùng `position: fixed` bừa bãi — check z-index hierarchy trước

### Z-index Hierarchy:
```
Navbar sticky:      z-index: 999
Chat overlay:       z-index: 9999
Modal/Dialog:       z-index: 99998
Confirm dialog:     z-index: 99999
Toast:              z-index: 99999
VideoCall:          z-index: 999999
```

---

## 3. Typography

Font chính: **"Be Vietnam Pro"** — import qua Google Fonts (đã có trong app)

```css
font-family: var(--font); /* "Be Vietnam Pro", -apple-system, ... */
```

Bảng kích thước:
```
Tiêu đề trang (h1):    22-28px, weight 800-900
Tiêu đề section (h2):  18-22px, weight 800
Tiêu đề card (h3):     15-17px, weight 700
Body text:              13-15px, weight 400-500
Label/caption:          11-13px, weight 600-700
Micro text (badge):     10-11px, weight 700, uppercase
```

---

## 4. Component Patterns Chuẩn

### Card Component
```jsx
<div style={{
  background: C.white,
  borderRadius: 16,
  border: `1px solid ${C.border}`,
  padding: "20px 24px",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
}}>
```

### Badge/Pill
```jsx
<span style={{
  background: C.oceanP,
  color: C.ocean,
  borderRadius: 20,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 700,
}}>Label</span>
```

### Primary Button (CTA)
```jsx
<button style={{
  background: `linear-gradient(135deg, ${C.coral} 0%, #D94E21 100%)`,
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "inherit",
  boxShadow: "0 4px 14px rgba(232, 100, 58, 0.3)",
  transition: "all 0.25s ease",
}}>
```

### Ocean Button (Secondary CTA)
```jsx
<button style={{
  background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
  color: "#fff",
  border: "none",
  padding: "11px 20px",
  borderRadius: 12,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer",
}}>
```

### Input Field
```jsx
<input style={{
  width: "100%",
  padding: "12px 14px",
  border: `1.5px solid ${focused ? C.ocean : C.border}`,
  borderRadius: 12,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
  boxShadow: focused ? "0 0 0 4px rgba(11, 79, 108, 0.12)" : "none",
}}>
```

### Section Divider với Accent
```jsx
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div style={{
    width: 4, height: 20,
    background: `linear-gradient(180deg, ${C.ocean}, ${C.oceanL})`,
    borderRadius: 4,
  }} />
  <h2 style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: 0 }}>
    Tiêu đề section
  </h2>
</div>
```

### Tab Bar
```jsx
<div style={{
  display: "flex",
  gap: 4,
  background: "#E2E8F0",
  borderRadius: 12,
  padding: 4,
  width: "fit-content",
}}>
  {tabs.map(([k, l]) => (
    <button key={k} onClick={() => setTab(k)} style={{
      padding: "10px 22px",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
      background: tab === k ? C.white : "transparent",
      color: tab === k ? C.ocean : C.muted,
      boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
      fontFamily: "inherit",
      transition: "all 0.2s",
    }}>{l}</button>
  ))}
</div>
```

### Empty State
```jsx
<div style={{
  textAlign: "center",
  padding: "60px 20px",
  color: C.muted,
  background: C.white,
  borderRadius: 16,
  border: `1px solid ${C.border}`,
}}>
  <div style={{ fontSize: 56, marginBottom: 12 }}>🐟</div>
  <div style={{ fontWeight: 700, color: C.dark, fontSize: 16 }}>Tiêu đề</div>
  <div style={{ fontSize: 13, marginTop: 6 }}>Mô tả phụ</div>
</div>
```

### Confirm Dialog (KHÔNG dùng window.confirm)
```jsx
// Dùng component ConfirmDialog tự viết với:
// - Backdrop overlay: rgba(0,0,0,0.4)
// - Card: borderRadius 16, padding 28px, maxWidth 360
// - 2 nút: Huỷ (outline) và Xác nhận (màu đỏ #DC2626)
// Tham khảo: DashboardPage.jsx → ConfirmDialog component
```

---

## 5. Layout Grids (Global Classes)

Dùng global CSS classes từ index.css — KHÔNG tự viết grid lại:

```jsx
// Grid sản phẩm responsive
<div className="product-grid">  {/* auto-fill minmax(220px, 1fr) */}

// Wrapper trang
<div className="page-wrap">      {/* max-width: 960px */}
<div className="page-wrap-sm">   {/* max-width: 720px */}
<div className="page-wrap-lg">   {/* max-width: 1200px */}

// 2-cột form
<div className="form-grid-2">    {/* 1fr 1fr, collapse mobile */}

// Skeleton loading
<div className="skeleton-shimmer" style={{ height: 300, borderRadius: 12 }} />

// Fade animation
<div className="fade-up">
```

---

## 6. Responsive Breakpoints

```
--bp-xs: 380px    /* mobile nhỏ */
--bp-sm: 480px    /* mobile */
--bp-md: 640px    /* tablet nhỏ */
--bp-lg: 768px    /* tablet */
--bp-xl: 1024px   /* desktop nhỏ */
--bp-2xl: 1280px  /* desktop */
--bp-3xl: 1440px  /* desktop lớn */
```

Luôn đảm bảo:
- Mobile: single column, padding 12-16px
- Tablet: 2 columns
- Desktop: 3-4 columns
- Tất cả button/link: `min-height: 36px` trên mobile

---

## 7. Animation Chuẩn

```css
/* Đã định nghĩa trong index.css — dùng lại, đừng tự viết */
animation: fadeUp 0.35s ease both;       /* .fade-up */
animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;  /* dropdown */
animation: cardAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; /* card */
```

Hover lift effect chuẩn:
```jsx
onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
```

---

## 8. Toast Notification (KHÔNG dùng alert)

```jsx
import { useToast } from "../context/ToastContext";

const toast = useToast();
toast.success("Thành công!");
toast.error("Có lỗi xảy ra");
toast.warn("Cảnh báo");
toast.info("Thông tin");
```

---

## 9. Navigation

```jsx
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";
const navigate = useViewTransitionNavigate();
navigate("/san-pham"); // Có View Transition animation
```

---

## 10. Anti-Patterns Phổ Biến — TRÁNH

| ❌ Sai | ✅ Đúng |
|--------|---------|
| `color: "#0B4F6C"` hardcode | `color: C.ocean` |
| `window.confirm(...)` | Custom `ConfirmDialog` component |
| `window.alert(...)` | `toast.error(...)` |
| `useNavigate()` từ react-router | `useViewTransitionNavigate()` |
| Inline style quá dài (>15 props) | CSS Module |
| Tự viết grid layout | Global class `product-grid`, `page-wrap` |
| Font Arial/Inter | `font-family: var(--font)` |
| Purple gradient trên white | Ocean green (#0B4F6C) theme |
| Shadow hardcode | `S.md`, `S.lg`, hoặc CSS var |
| `border-radius: 8px` cứng | `R.md`, `R.lg`, hoặc CSS var |

---

## 11. File Structure Convention

```
components/       → Component tái sử dụng
  MyComponent.jsx
  MyComponent.module.css   ← CSS Module đi kèm
pages/            → Route-level page
  MyPage.jsx
  MyPage.module.css
utils/theme.js    → Design tokens (C, S, R)
context/          → React Context
hooks/            → Custom hooks
services/         → API calls
```

---

## 12. Đặc trưng thẩm mỹ HảiSản.vn

- **Màu nền body**: gradient xanh đại dương `#208f67 → #1a7a59`
- **Card content**: nền trắng `#fff` trên background teal
- **Accent màu vàng hoàng kim**: `#ECD223` — dùng cho CTA button quan trọng nhất
- **ProductCard**: dark background `#1a7060` với text màu trắng
- **Hover effect**: `translateY(-6px)` + `box-shadow` tăng
- **Typography card**: giá màu `#ECD223` trên dark background
- **Hình ảnh**: `object-fit: contain` trong gallery (không crop), `cover` trong card thumbnail
- **Umai.fish pattern**: alternating image-text rows trong detail page
- **Seasonal/schedule tables**: Japanese-inspired structured data display

Tham khảo:
- `ProductDetailPage.module.css` → pattern chi tiết sản phẩm
- `ProductCard.module.css` → pattern card sản phẩm
- `Navbar.module.css` → pattern navigation
- `pages/HomePage.jsx` → pattern trang chủ kiểu umai.fish
