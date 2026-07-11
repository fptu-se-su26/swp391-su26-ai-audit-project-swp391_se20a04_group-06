# VIETNAMESE_UI_AUDIT.md
## Báo cáo Vi?t hóa Giao di?n ngu?i dùng (H?iS?n.vn)

---

## 1. Các file dã s?a / t?o m?i

| Ðu?ng d?n file | Mô t? thay d?i |
|---|---|
| client/src/utils/labelMaps.js | **[NEW]** T?o helper ánh x? (map) các giá tr? danh m?c (category), d? tuoi (freshness) và d? khó (difficulty) sang ti?ng Vi?t (chu?n hóa ch? thu?ng/hoa và lo?i b? kho?ng tr?ng tru?c khi tra c?u) |
| client/src/components/ProductCard.jsx | S? d?ng helper getCategoryLabel d? hi?n th? danh m?c ti?ng Vi?t (Ví d?: FISH -> Cá, OTHERS -> Khác) |
| client/src/pages/ProductDetail.jsx | Áp d?ng getCategoryLabel cho danh m?c ? trang chi ti?t s?n ph?m |
| client/src/pages/Marketplace.jsx | Áp d?ng getCategoryLabel trong b? l?c danh m?c và xóa eyebrow ti?ng Anh |
| client/src/pages/LandingBatchDetail.jsx | Áp d?ng getCategoryLabel trong b? l?c danh m?c, xóa các eyebrow ti?ng Anh (JOURNEY, LOCATION, SEAFOOD IN THIS BATCH, CABIN LOG) |
| client/src/pages/Home.jsx | Vi?t hóa DIRECT SEAFOOD MARKETPLACE thành CH? H?I S?N TR?C TI?P, lo?i b? các eyebrow ti?ng Anh FRESH LISTINGS, SELLER NETWORK |
| client/src/pages/Recipes.jsx | Lo?i b? eyebrow ti?ng Anh SEAFOOD KITCHEN, c?p nh?t các nhãn recipe card footer thành ti?ng Vi?t ("kh?u ph?n", "lu?t thích"), b? sung ánh x? các c?p d? khó case-insensitive |
| client/src/pages/Community.jsx | Lo?i b? eyebrow ti?ng Anh SEAFOOD COMMUNITY |
| client/src/components/seller/SellerOverview.jsx | Lo?i b? eyebrow ti?ng Anh SELLER DASHBOARD / SELLER ANALYTICS |
| client/src/components/preview/LivePreviewShell.jsx | Thay th? giá tr? nhãn badge m?c d?nh t? Preview thành XEM TRU?C |
| client/src/components/preview/ProductLivePreview.jsx | S? d?ng helper getCategoryLabel chung t? labelMaps |
| client/src/components/preview/RecipeLivePreview.jsx | C?p nh?t getDifficultyLabel d? h? tr? case-insensitive cho các m?c d? khó ti?ng Vi?t |
| client/src/pages/RecipeDetail.jsx | C?p nh?t getDifficultyLabel và class map d? h? tr? case-insensitive cho các m?c d? khó ti?ng Vi?t |
| client/src/utils/product.js | Vi?t hóa tr?ng thái d? tuoi và gi? ch?/h?t hàng (Fresh Today -> Tuoi hôm nay, Reserved -> Ðã gi? ch?, Sold Out -> H?t hàng) |

---

## 2. Các t? ti?ng Anh dã du?c chuy?n d?i

- DIRECT SEAFOOD MARKETPLACE -> CH? H?I S?N TR?C TI?P
- FRESH LISTINGS -> B? qua (không c?n thi?t vì dã có tiêu d? "M? hàng m?i")
- SELLER NETWORK -> B? qua (không c?n thi?t vì dã có tiêu d? "Ngu dân n?i b?t")
- SEAFOOD MARKETPLACE -> B? qua (không c?n thi?t vì dã có tiêu d? "Ch? h?i s?n")
- SEAFOOD KITCHEN -> B? qua (dã có tiêu d? "C?m nang công th?c")
- SEAFOOD COMMUNITY -> B? qua (dã có tiêu d? "Di?n dàn c?ng d?ng")
- SELLER DASHBOARD / SELLER ANALYTICS -> B? qua (dã có tiêu d? tuong ?ng)
- Preview / Recipe Preview -> XEM TRU?C
- FISH / ish -> Cá
- SHRIMP / shrimp -> Tôm
- CRAB / crab -> Cua, gh?
- SQUID / squid -> M?c
- SHELLFISH / shellfish -> Nhuy?n th?
- OTHERS / others -> Khác
- Easy / easy -> D?
- Medium / medium -> Trung bình
- Hard / hard -> Khó
- Fresh Today -> Tuoi hôm nay
- In stock -> Còn hàng
- Out of stock / Sold Out -> H?t hàng
- Reserved -> Ðã gi? ch?

---

## 3. Các t? ti?ng Anh còn gi? l?i và lý do

- **Tên bi?n, tên file, CSS class name, route, API endpoints**: Gi? nguyên theo thi?t k? k? thu?t c?a h? th?ng d? không làm ?nh hu?ng d?n mã ngu?n backend ho?c database (ví d?: ProductCard.jsx, category, /marketplace, /recipes).
- **Premium**: Gi? nguyên d? d?ng b? thuong hi?u gói thành viên nâng cao c?a d? án.

---

## 4. Các trang dã rà soát

1. **Trang ch? (Home)**: Ðã xóa eyebrow English, Vi?t hóa banner chính.
2. **Ch? h?i s?n (Marketplace)**: B? l?c và danh sách s?n ph?m hi?n th? 100% ti?ng Vi?t.
3. **C?m nang công th?c (Recipes & Recipe Detail)**: Ðã chuy?n d?i m?c d? khó, nhãn kh?u ph?n, lu?t thích và ngày dang sang ti?ng Vi?t.
4. **Di?n dàn c?ng d?ng (Community)**: Ðã Vi?t hóa các nút tuong tác và tiêu d?.
5. **Khu v?c ngu?i bán (Seller Dashboard & Form)**: Các bi?u d?, d? li?u th?ng kê, bi?u m?u v?a cá dã s?ch ch? ti?ng Anh trên UI.
6. **AI Assistant & Tour Guide**: Toàn b? câu h?i, câu tr? l?i, placeholder và h?p tho?i hu?ng d?n d?u b?ng ti?ng Vi?t.

---

## 5. K?t qu? 
pm run build

- **Tr?ng thái**: Build thành công 100% không c?nh báo (warnings) hay l?i (errors).
- **Vite compilation**: 309 modules transformed, built in ~330ms.
