# BACKGROUND_ROLE_THEME_REPORT.md
## H?iS?n.vn — Role-Based Background Theme

---

## T?ng quan

Ðã thêm background riêng bi?t cho 3 lo?i user: Ngu?i mua (Buyer), Ngu dân (Seller), Admin.
H? tr? c? Dark Theme và Light Theme. Không dùng ?nh n?ng, không animation m?nh.

---

## Files dã thay d?i / t?o m?i

| File | Thay d?i |
|------|----------|
| client/src/styles/role-backgrounds.css | [NEW] File CSS m?i ch?a toàn b? role backgrounds |
| client/src/main.jsx | Import role-backgrounds.css |
| client/src/App.jsx | Inject shell-buyer / shell-seller / shell-admin class |
| client/src/pages/seller/SellerDashboard.jsx | Thêm class seller-dashboard |
| client/src/pages/admin/AdminDashboard.jsx | Thêm class admin-dashboard |
| client/src/styles/theme.css | Thêm role-based light theme overrides |

---

## Co ch? ho?t d?ng

App.jsx d?c user role qua getUserRole() và inject class vào app-shell:
- shell-buyer  ? Ngu?i mua + khách
- shell-seller ? Ngu dân
- shell-admin  ? Qu?n tr? viên

CSS dùng gradient thu?n + SVG data-uri nh? cho decoration.
Pseudo ::before { position: fixed; z-index: 0; pointer-events: none }
Content n?m ? z-index: 1 tr? lên.

---

## Chi ti?t t?ng role

### Buyer (shell-buyer)
Dark: Navy xanh #060f1c, cyan glow nh?, wave SVG 2 l?p opacity 0.04
Light: Teal nh?t #eaf6fb, wave opacity nh? hon

### Seller (shell-seller)
Dark: Deep navy #04101e, cyan+blue glow, dot grid 80x80 + wave line-art
Light: Slate-teal #e8f5fa, accent bar cyan 2px ? top workspace

### Admin (shell-admin)
Dark: Navy #050b18, indigo+purple glow, dot grid 40x40 + diagonal system lines
Light: Indigo nh?t #f0f1fe, accent bar indigo 2px, sidebar màu indigo

---

## Build verification

npm run build: 308 modules, built in ~212ms - PASS
CSS bundle: 187.94 kB (gzip: 37.60 kB)
Không có l?i, không có warning.
