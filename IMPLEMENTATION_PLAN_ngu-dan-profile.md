# IMPLEMENTATION PLAN: Trang Hồ Sơ Ngư Dân — HảiSản.vn

> **Dành cho AI agent thực thi. Đọc toàn bộ file trước khi bắt đầu.**  
> Thực hiện đúng thứ tự Phase 0 → 1 → 2 → 3. Không bỏ qua bước nào.  
> Sau mỗi Phase hoàn thành, chạy "Verification" trước khi qua Phase tiếp theo.

---

## CONTEXT — Đọc trước khi code

### Tính năng cần xây dựng
Hiện tại lưới ngư dân trên `HomePage.jsx` dùng **dữ liệu hardcode**, click chỉ filter sản phẩm theo tên. Cần chuyển sang:
1. Fetch ngư dân thật từ database
2. Click card → mở trang hồ sơ cá nhân `/nguoi-ban/:id` đầy đủ
3. Trang hồ sơ có **5 tab**: Sản phẩm · Công thức · Bài cộng đồng · Nhật ký cabin · Đánh giá
4. Thêm trang `/ngu-dan` liệt kê toàn bộ ngư dân

### Tech stack
- **Backend:** Node.js + TypeScript + Express + MongoDB/Mongoose
- **Frontend:** React 18 + Vite (JSX, không TypeScript)
- **API pattern:** REST, base URL `/api`, credentials: include (cookie auth)
- **Frontend API calls:** dùng `api()` từ `services/api.js`
- **Frontend data fetching:** dùng `useApiFetch(path, deps)` từ `hooks/useApiFetch.js`
- **Colors/theme:** dùng `C` object từ `utils/theme.js` (C.ocean, C.coral, C.border, v.v.)
- **Navigation:** dùng `useViewTransitionNavigate()` từ `hooks/useViewTransitionNavigate.js`
- **Toast:** dùng `useToast()` từ `context/ToastContext.jsx`
- **Auth:** dùng `useAuth()` từ `context/AuthContext.jsx` — trả về `{ user, loading }`

### Cấu trúc thư mục frontend (client/my-app/src/)
```
components/          ← shared UI components
pages/               ← route-level pages
pages/tabs/          ← tạo thư mục này (chưa có)
hooks/
context/
services/
utils/
layout/
```

### Cấu trúc thư mục backend (src/)
```
controllers/         ← logic xử lý request
routes/              ← khai báo Express router
models/              ← Mongoose schemas
services/            ← business logic
app.ts               ← Express app setup, đăng ký routes
```

### Pattern quan trọng cần tuân theo

**Frontend — component style:**
```jsx
// Tất cả style dùng inline object (không dùng className ngoại trừ Bootstrap grid)
// Import C cho màu sắc
import { C } from "../utils/theme";

// Loading state dùng skeleton-shimmer class
<div className="skeleton-shimmer" style={{ height: 200, borderRadius: 12 }} />

// Empty state pattern
<div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
  <div style={{ fontWeight: 700, color: C.dark }}>Tiêu đề</div>
</div>
```

**Frontend — data fetching pattern:**
```jsx
const { data, loading, error } = useApiFetch(`/endpoint/${id}`, [id]);
// data = null khi loading hoặc error
// loading = true khi đang fetch
// Luôn handle cả 3 state: loading, error/null, data
```

**Backend — response format cho list:**
```json
{ "data": [...], "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
```

**Backend — helper đã có sẵn (dùng lại):**
```typescript
// Từ bất kỳ controller hiện tại — copy pattern
const page   = parseInt(req.query.page as string) || 1;
const limit  = Math.min(parseInt(req.query.limit as string) || 20, 50);
const offset = (page - 1) * limit;
```

---

## MODELS — Schema tham chiếu (inferred từ frontend code)

### User (SQL hoặc Mongo — xem code hiện tại để biết chính xác)
```
id / _id, name, email, avatarUrl / avatar, role, isActive, isVerified,
isPremium, badges (array), createdAt
```

### Product
```
id / _id, name, type ("Fresh"|"Dried"), category, price, totalWeight,
remainingWeight, status ("Active"|"Inactive"|"Sold"|"Expired"),
sellerId, sellerName, coverImg, images, bumpedAt, createdAt, viewCount
```

### Recipe (MongoDB)
```
_id, title, description, ingredients[], instructions[], imageUrl,
difficulty ("Easy"|"Medium"|"Hard"), cookingTime (number),
servings (number), tags[], authorId (ref User), likes[], viewCount, createdAt
```

### Post (MongoDB)
```
_id, title, content, images[], userId, userName,
likes[], comments[], viewCount, createdAt
```

### BoatLog (MongoDB)
```
_id, content, images[], userId, userName, userAvatar,
likes[], createdAt
```

### Review (SQL hoặc Mongo)
```
ReviewID/_id, sellerId, ReviewerID, ReviewerName, Rating,
Comment, ImageURL, CreatedAt, ProductName
```

---

## PHASE 0 — Backend (thực hiện trước tất cả frontend)

**Prerequisite:** Đọc file `src/app.ts` để biết cách đăng ký routes hiện tại.  
Đọc 1 controller mẫu (ví dụ `review.controller.ts`) để biết pattern error handling.

---

### STEP 0.1 — Sửa `src/controllers/recipe.controller.ts`

**Tìm hàm** `getRecipes` (hoặc tên tương đương xử lý `GET /api/recipes`).

**Tìm đoạn xây dựng `filter` object**, thêm vào sau các filter hiện có:
```typescript
// Thêm vào trong hàm getRecipes, trong block xây dựng filter:
const authorId = req.query.authorId as string;
if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
  filter.authorId = new mongoose.Types.ObjectId(authorId);
}
```

**Kiểm tra:** Sau khi sửa, gọi `GET /api/recipes?authorId=<valid_mongo_id>` phải trả về chỉ recipes của author đó. Nếu filter object đang là SQL WHERE clause thay vì Mongo, điều chỉnh syntax cho phù hợp.

---

### STEP 0.2 — Sửa `src/controllers/post.controller.ts`

**Tìm hàm** `getPosts` (hoặc tên tương đương xử lý `GET /api/posts`).

**Tìm đoạn xây dựng `filter` object**, thêm vào:
```typescript
// Thêm vào trong hàm getPosts, trong block xây dựng filter:
const userId = req.query.userId as string;
if (userId && mongoose.Types.ObjectId.isValid(userId)) {
  filter.userId = new mongoose.Types.ObjectId(userId);
}
```

**Kiểm tra:** `GET /api/posts?userId=<id>` trả về chỉ posts của user đó.

---

### STEP 0.3 — Tạo `src/controllers/fisherman.controller.ts`

Tạo file mới với đầy đủ nội dung sau. **Trước khi viết code, đọc 1 controller hiện tại** (ví dụ `product.controller.ts`) để biết cách import models và pattern xử lý lỗi. Điều chỉnh các import cho khớp với project structure thực tế.

```typescript
import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";

// ⚠️ Điều chỉnh import paths cho khớp với project thực tế
// Xem các controller hiện tại để biết cách import models đúng
import { User }     from "../models/User";
import { Product }  from "../models/Product";
import { Recipe }   from "../models/Recipe";
import { Post }     from "../models/Post";
import { BoatLog }  from "../models/BoatLog";
import { Review }   from "../models/Review";

// ─── Helper: parse & clamp pagination ────────────────────────
function parsePagination(pageStr: string, limitStr: string, maxLimit = 50) {
  const page   = Math.max(1, parseInt(pageStr) || 1);
  const limit  = Math.min(Math.max(1, parseInt(limitStr) || 20), maxLimit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ─── Helper: format product preview (dùng trong profile response) ─
function formatProductPreview(p: any) {
  return {
    id:               p._id ?? p.id,
    name:             p.name,
    price:            p.price,
    type:             p.type,
    category:         p.category,
    coverImg:         p.images?.[0]?.url ?? p.coverImg ?? null,
    remainingWeight:  p.remainingWeight,
    bumpedAt:         p.bumpedAt,
  };
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen
// Danh sách ngư dân có phân trang + batch stats
// Query: page, limit, verified, hasActive (default true)
// ═══════════════════════════════════════════════════════════
export async function listFishermen(req: Request, res: Response) {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string,
      50
    );
    const verified  = req.query.verified === "true";
    const hasActive = req.query.hasActive !== "false"; // default true

    // Bước 1: Lấy sellerId của ngư dân có sản phẩm Active (nếu hasActive=true)
    let sellerIdFilter: any = {};
    if (hasActive) {
      // ⚠️ Nếu Product dùng SQL, điều chỉnh query này
      const activeSellerIds = await Product.distinct("sellerId", { status: "Active" });
      if (activeSellerIds.length === 0) {
        return res.json({ data: [], page, limit, total: 0, totalPages: 0 });
      }
      sellerIdFilter = { _id: { $in: activeSellerIds } };
    }

    // Bước 2: Build user filter
    const filter: any = {
      ...sellerIdFilter,
      isActive: true,
      role:     { $ne: "Admin" },
    };
    if (verified) filter.isVerified = true;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("name avatar avatarUrl isVerified isPremium badges createdAt")
      .sort({ isPremium: -1, isVerified: -1, createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    if (users.length === 0) {
      return res.json({ data: [], page, limit, total, totalPages: Math.ceil(total / limit) });
    }

    // Bước 3: Batch stats (1 aggregate — không N+1 query)
    const ids = users.map((u: any) => u._id);

    const [productCounts, reviewStats] = await Promise.all([
      Product.aggregate([
        { $match: { sellerId: { $in: ids }, status: "Active" } },
        { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { sellerId: { $in: ids } } },
        { $group: { _id: "$sellerId", avg: { $avg: "$rating" }, total: { $sum: 1 } } },
      ]),
    ]);

    const productMap = new Map(productCounts.map((p: any) => [p._id.toString(), p.count]));
    const reviewMap  = new Map(reviewStats.map((r: any) => [r._id.toString(), r]));

    const data = users.map((u: any) => {
      const rv = reviewMap.get(u._id.toString());
      return {
        id:             u._id,
        name:           u.name,
        avatar:         u.avatarUrl ?? u.avatar ?? null,
        isVerified:     u.isVerified ?? false,
        isPremium:      u.isPremium ?? false,
        badges:         u.badges ?? [],
        activeProducts: productMap.get(u._id.toString()) ?? 0,
        avgRating:      rv ? Math.round(rv.avg * 10) / 10 : 0,
        ratingCount:    rv?.total ?? 0,
        memberSince:    u.createdAt,
      };
    });

    return res.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("[listFishermen]", err);
    return res.status(500).json({ message: "Lỗi server khi tải danh sách ngư dân" });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/profile
// Hồ sơ tổng hợp 1 lần gọi — tất cả chạy song song Promise.all
// ═══════════════════════════════════════════════════════════
export async function getFishermanProfile(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "ID ngư dân không hợp lệ" });
    }
    const id = new Types.ObjectId(rawId);

    // Tất cả query chạy song song — tránh waterfall
    const [
      user,
      prodCount,
      recipeCount,
      postCount,
      boatLogCount,
      reviewAgg,
      followersCount,
      recentProducts,
      recentRecipes,
      recentPosts,
    ] = await Promise.all([
      User.findOne({ _id: id, isActive: true })
          .select("name avatar avatarUrl isVerified isPremium badges createdAt")
          .lean(),

      Product.countDocuments({ sellerId: id, status: "Active" }),
      Recipe.countDocuments({ authorId: id }),
      Post.countDocuments({ userId: id }),
      BoatLog.countDocuments({ userId: id }),

      Review.aggregate([
        { $match: { sellerId: id } },
        { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } },
      ]),

      // Đếm followers = số user có id này trong mảng following của họ
      User.countDocuments({ following: id }),

      // Preview: 4 sản phẩm mới nhất
      Product.find({ sellerId: id, status: "Active" })
             .sort({ bumpedAt: -1, createdAt: -1 })
             .limit(4)
             .select("name price type category images coverImg remainingWeight bumpedAt")
             .lean(),

      // Preview: 3 công thức mới nhất
      Recipe.find({ authorId: id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("title imageUrl difficulty cookingTime servings likes viewCount createdAt")
            .lean(),

      // Preview: 3 bài đăng mới nhất
      Post.find({ userId: id })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("title images likes comments viewCount createdAt")
          .lean(),
    ]);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy ngư dân này" });
    }

    const rv = (reviewAgg as any[])[0];

    return res.json({
      user: {
        id:          (user as any)._id,
        name:        (user as any).name,
        avatar:      (user as any).avatarUrl ?? (user as any).avatar ?? null,
        isVerified:  (user as any).isVerified ?? false,
        isPremium:   (user as any).isPremium ?? false,
        badges:      (user as any).badges ?? [],
        memberSince: (user as any).createdAt,
      },
      stats: {
        activeProducts: prodCount,
        totalRecipes:   recipeCount,
        totalPosts:     postCount,
        totalBoatLogs:  boatLogCount,
        avgRating:      rv ? Math.round(rv.avg * 10) / 10 : 0,
        ratingCount:    rv?.total ?? 0,
        followersCount,
      },
      recentProducts: (recentProducts as any[]).map(formatProductPreview),
      recentRecipes,
      recentPosts,
    });
  } catch (err: any) {
    console.error("[getFishermanProfile]", err);
    return res.status(500).json({ message: "Lỗi server khi tải hồ sơ ngư dân" });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/products
// Alias: set sellerId rồi gọi lại product list handler
// ═══════════════════════════════════════════════════════════
export async function getFishermanProducts(req: Request, res: Response) {
  // Inject sellerId vào query, sau đó gọi product list handler
  // ⚠️ Điều chỉnh để gọi đúng product list function trong project của bạn
  req.query.sellerId = req.params.id;
  // Import và gọi: return getProducts(req, res);
  // Hoặc duplicate logic tối giản dưới đây nếu không thể import:
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 50
    );
    const sellerId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter: any = { sellerId: new Types.ObjectId(sellerId) };
    if (req.query.includeExpired !== "true") {
      filter.status = "Active";
    }
    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ bumpedAt: -1, createdAt: -1 })
      .skip(offset).limit(limit).lean();
    return res.json({ data: products, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/recipes
// ═══════════════════════════════════════════════════════════
export async function getFishermanRecipes(req: Request, res: Response) {
  req.query.authorId = req.params.id;
  // Gọi getRecipes từ recipe.controller sau khi đã sửa ở STEP 0.1
  // Import: import { getRecipes } from "./recipe.controller";
  // return getRecipes(req, res);
  // Hoặc fallback tối giản:
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 20
    );
    const authorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter = { authorId: new Types.ObjectId(authorId) };
    const total   = await Recipe.countDocuments(filter);
    const recipes = await Recipe.find(filter)
      .sort({ createdAt: -1 }).skip(offset).limit(limit)
      .populate("authorId", "name avatar avatarUrl isVerified")
      .lean();
    return res.json({ recipes, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/posts
// ═══════════════════════════════════════════════════════════
export async function getFishermanPosts(req: Request, res: Response) {
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 20
    );
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter = { userId: new Types.ObjectId(userId) };
    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
    return res.json({ posts, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// GET /api/fishermen/:id/boat-logs
// ═══════════════════════════════════════════════════════════
export async function getFishermanBoatLogs(req: Request, res: Response) {
  // BoatLog đã có filter userId trong getBoatLogs — inject rồi gọi lại
  // Hoặc fallback tối giản:
  try {
    const { page, limit, offset } = parsePagination(
      req.query.page as string, req.query.limit as string, 20
    );
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const filter = { userId: new Types.ObjectId(userId) };
    const total    = await BoatLog.countDocuments(filter);
    const boatLogs = await BoatLog.find(filter)
      .sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
    return res.json({ boatLogs, page, limit, total });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}
```

---

### STEP 0.4 — Tạo `src/routes/fisherman.routes.ts`

```typescript
import { Router } from "express";
import {
  listFishermen,
  getFishermanProfile,
  getFishermanProducts,
  getFishermanRecipes,
  getFishermanPosts,
  getFishermanBoatLogs,
} from "../controllers/fisherman.controller";

// ⚠️ Import rateLimit nếu project có sử dụng
// import rateLimit from "express-rate-limit";

const router = Router();

// Tất cả routes này là PUBLIC (không cần auth)
router.get("/",                listFishermen);
router.get("/:id/profile",     getFishermanProfile);
router.get("/:id/products",    getFishermanProducts);
router.get("/:id/recipes",     getFishermanRecipes);
router.get("/:id/posts",       getFishermanPosts);
router.get("/:id/boat-logs",   getFishermanBoatLogs);

export default router;
```

---

### STEP 0.5 — Sửa `src/app.ts`

**Tìm khối đăng ký routes** (ví dụ: `app.use("/api/products", productRoutes)`).  
Thêm vào ngay sau khối đó:

```typescript
// Thêm import ở đầu file
import fishermanRoutes from "./routes/fisherman.routes";

// Thêm vào khối đăng ký routes
app.use("/api/fishermen", fishermanRoutes);
```

---

### VERIFICATION Phase 0 ✓

Chạy server và test các endpoint sau (dùng curl hoặc browser):

```
GET /api/fishermen                         → { data: [...], total: N, ... }
GET /api/fishermen?limit=5&hasActive=true  → array tối đa 5 phần tử
GET /api/fishermen/:validUserId/profile    → { user: {...}, stats: {...}, recentProducts: [...] }
GET /api/fishermen/:id/products            → { data: [...], total: N }
GET /api/fishermen/:id/recipes             → { recipes: [...], total: N }
GET /api/fishermen/:id/posts               → { posts: [...], total: N }
GET /api/fishermen/:id/boat-logs           → { boatLogs: [...], total: N }
```

**Không qua Phase 1 nếu bất kỳ endpoint nào trả về 500 hoặc 404 sai.**

---

## PHASE 1 — Frontend: Profile Page Tabs

**Prerequisite:** Phase 0 đã xong, tất cả 7 endpoints hoạt động.

---

### STEP 1.1 — Tạo `pages/tabs/FishermanRecipesTab.jsx`

Tạo thư mục `pages/tabs/` nếu chưa có.

```jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../utils/theme";
import { useApiFetch } from "../../hooks/useApiFetch";

export function FishermanRecipesTab({ sellerId }) {
  const navigate = useNavigate();
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/recipes?limit=9`,
    [sellerId]
  );

  const recipes = data?.recipes ?? [];

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ height: 240, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px",
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍳</div>
        <div style={{ fontWeight: 700, color: C.dark, marginBottom: 4 }}>
          Chưa có công thức nấu ăn
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          Ngư dân chưa chia sẻ bí quyết chế biến nào.
        </div>
      </div>
    );
  }

  const diffLabel = { Easy: "Dễ", Medium: "Vừa", Hard: "Khó" };

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 20,
        marginBottom: 24,
      }}>
        {recipes.map((r) => (
          <div
            key={r._id}
            onClick={() => navigate(`/cong-thuc/${r._id}`)}
            style={{
              background: C.white,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Ảnh */}
            <div style={{ height: 150, background: "#1a7060", overflow: "hidden", position: "relative" }}>
              {r.imageUrl ? (
                <img src={r.imageUrl} alt={r.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 48 }}>🐟</div>
              )}
              <span style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,0.55)", color: "#fff",
                fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
              }}>
                {diffLabel[r.difficulty] ?? r.difficulty}
              </span>
            </div>

            {/* Nội dung */}
            <div style={{ padding: "12px 14px" }}>
              <div style={{
                fontWeight: 700, fontSize: 14, color: C.dark,
                marginBottom: 6, overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {r.title}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted }}>
                <span>⏱️ {r.cookingTime} phút</span>
                <span>👥 {r.servings} người</span>
                <span>❤️ {r.likes?.length ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.total > 9 && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => navigate(`/cong-thuc?authorId=${sellerId}`)}
            style={{
              background: C.white, border: `1.5px solid ${C.ocean}`,
              color: C.ocean, borderRadius: 10, padding: "10px 24px",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Xem thêm {data.total - 9} công thức →
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### STEP 1.2 — Tạo `pages/tabs/FishermanPostsTab.jsx`

```jsx
import React, { useState } from "react";
import { C } from "../../utils/theme";
import { useApiFetch } from "../../hooks/useApiFetch";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export function FishermanPostsTab({ sellerId }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/posts?limit=10`,
    [sellerId]
  );
  const [activePost, setActivePost] = useState(null);
  const [likingId, setLikingId] = useState(null);

  const posts = data?.posts ?? [];

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!user) { toast.warn("Vui lòng đăng nhập để thích bài viết"); return; }
    setLikingId(postId);
    try {
      await api(`/posts/${postId}/like`, { method: "POST" });
    } catch { /* silent */ }
    finally { setLikingId(null); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px",
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
        <div style={{ fontWeight: 700, color: C.dark }}>Chưa có bài đăng cộng đồng</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post) => (
          <div
            key={post._id}
            onClick={() => setActivePost(post)}
            style={{
              background: C.white, borderRadius: 14,
              border: `1px solid ${C.border}`, padding: "18px 20px",
              cursor: "pointer", transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
          >
            <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, marginBottom: 6 }}>
              {post.title}
            </div>
            <div style={{
              fontSize: 13, color: C.muted,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden", marginBottom: 10, lineHeight: 1.55,
            }}>
              {post.content}
            </div>

            {post.images?.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {post.images.slice(0, 4).map((img, i) => (
                  <img key={i} src={img} alt=""
                    style={{ width: 64, height: 64, objectFit: "cover",
                      borderRadius: 8, border: `1px solid ${C.border}` }} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted, alignItems: "center" }}>
              <button
                onClick={(e) => handleLike(post._id, e)}
                disabled={likingId === post._id}
                style={{ background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}
              >
                ❤️ {post.likes?.length ?? 0}
              </button>
              <span>💬 {post.comments?.length ?? 0}</span>
              <span>👁️ {post.viewCount ?? 0}</span>
              <span style={{ marginLeft: "auto" }}>
                {new Date(post.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal xem đầy đủ bài đăng */}
      {activePost && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 9999, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16 }}
          onClick={() => setActivePost(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 20, padding: 28,
              maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)", position: "relative" }}
          >
            <button onClick={() => setActivePost(null)} style={{
              position: "absolute", top: 16, right: 16, background: "none",
              border: "none", fontSize: 22, cursor: "pointer", color: C.muted,
            }}>×</button>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 12, marginTop: 0 }}>
              {activePost.title}
            </h3>
            <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7,
              whiteSpace: "pre-line", marginBottom: 16 }}>
              {activePost.content}
            </p>
            {activePost.images?.length > 0 && (
              <div style={{ display: "grid",
                gridTemplateColumns: activePost.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                gap: 8, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                {activePost.images.map((img, i) => (
                  <img key={i} src={img} alt=""
                    style={{ width: "100%", height: activePost.images.length === 1 ? "auto" : 160,
                      objectFit: "cover" }} />
                ))}
              </div>
            )}
            <div style={{ fontSize: 12, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              ❤️ {activePost.likes?.length ?? 0} thích ·
              💬 {activePost.comments?.length ?? 0} bình luận ·
              {new Date(activePost.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

### STEP 1.3 — Tạo `pages/tabs/FishermanBoatLogsTab.jsx`

```jsx
import React, { useState } from "react";
import { C } from "../../utils/theme";
import { useApiFetch } from "../../hooks/useApiFetch";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export function FishermanBoatLogsTab({ sellerId }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading } = useApiFetch(
    `/fishermen/${sellerId}/boat-logs?limit=10`,
    [sellerId]
  );
  const [activeLog, setActiveLog] = useState(null);
  const [localLikes, setLocalLikes] = useState({});

  const logs = data?.boatLogs ?? [];

  const handleLike = async (logId, e) => {
    e.stopPropagation();
    if (!user) { toast.warn("Vui lòng đăng nhập để thả tim"); return; }
    try {
      const res = await api(`/boat-logs/${logId}/like`, { method: "POST" });
      setLocalLikes((prev) => ({ ...prev, [logId]: { liked: res.liked, count: res.likeCount } }));
    } catch { /* silent */ }
  };

  const getLikeInfo = (log) => localLikes[log._id] ?? {
    liked: user ? (log.likes ?? []).includes(user.userId ?? user.id) : false,
    count: log.likes?.length ?? 0,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ height: 100, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px",
        background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⛵</div>
        <div style={{ fontWeight: 700, color: C.dark }}>Chưa có nhật ký cabin</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {logs.map((log) => {
          const likeInfo = getLikeInfo(log);
          return (
            <div
              key={log._id}
              onClick={() => setActiveLog(log)}
              style={{
                background: C.white, borderRadius: 14,
                border: `1px solid ${C.border}`, padding: "16px 20px",
                cursor: "pointer", transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>
                ⛵ {new Date(log.createdAt).toLocaleString("vi-VN")}
              </div>
              <p style={{
                fontSize: 13.5, color: C.dark, lineHeight: 1.6, margin: "0 0 10px",
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {log.content}
              </p>
              {log.images?.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {log.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt=""
                      style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                  ))}
                </div>
              )}
              <button
                onClick={(e) => handleLike(log._id, e)}
                style={{
                  background: likeInfo.liked ? "#FFF1F2" : "none",
                  border: `1px solid ${likeInfo.liked ? "#FECACA" : C.border}`,
                  color: likeInfo.liked ? "#EF4444" : C.muted,
                  borderRadius: 8, padding: "4px 12px", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                }}
              >
                {likeInfo.liked ? "❤️" : "🤍"} {likeInfo.count}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal xem đầy đủ log */}
      {activeLog && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 9999, display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16 }}
          onClick={() => setActiveLog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 20, padding: 28,
              maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 24px 48px rgba(0,0,0,0.25)", position: "relative" }}
          >
            <button onClick={() => setActiveLog(null)} style={{
              position: "absolute", top: 16, right: 16, background: "none",
              border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, fontWeight: 600 }}>
              ⛵ {new Date(activeLog.createdAt).toLocaleString("vi-VN")}
            </div>
            <p style={{ fontSize: 14, color: C.dark, lineHeight: 1.7,
              whiteSpace: "pre-line", marginBottom: 16 }}>
              {activeLog.content}
            </p>
            {activeLog.images?.length > 0 && (
              <div style={{ display: "grid",
                gridTemplateColumns: activeLog.images.length === 1 ? "1fr" : "repeat(2, 1fr)",
                gap: 8, borderRadius: 12, overflow: "hidden" }}>
                {activeLog.images.map((img, i) => (
                  <img key={i} src={img} alt=""
                    style={{ width: "100%", height: activeLog.images.length === 1 ? "auto" : 160,
                      objectFit: "cover" }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

---

### STEP 1.4 — Tạo `components/FishermanProfileHeader.jsx`

```jsx
import React, { useState } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { VerifiedBadge } from "./VerifiedBadge";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

export function FishermanProfileHeader({ profile, isLoading, sellerId }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useViewTransitionNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const isOwnProfile = user && (user.userId === sellerId || user.id === sellerId);

  const handleToggleFollow = async () => {
    if (!user) { toast.warn("Vui lòng đăng nhập để theo dõi!"); return; }
    if (isOwnProfile) { toast.warn("Bạn không thể tự theo dõi chính mình!"); return; }
    setTogglingFollow(true);
    try {
      const res = await api(`/follows/${sellerId}/toggle`, { method: "POST" });
      setIsFollowing(res.isFollowing);
      toast.success(res.message);
    } catch (e) { toast.error(e.message); }
    finally { setTogglingFollow(false); }
  };

  // ── Skeleton loading ─────────────────────────────────────
  if (isLoading || !profile) {
    return (
      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`,
        overflow: "hidden", marginBottom: 28 }}>
        <div className="skeleton-shimmer" style={{ height: 110 }} />
        <div style={{ padding: "44px 28px 24px" }}>
          <div className="skeleton-shimmer" style={{ width: 200, height: 24, borderRadius: 6, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer" style={{ width: 80, height: 60, borderRadius: 12 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { user: sellerUser, stats } = profile;

  const statCards = [
    { emoji: "📦", value: stats.activeProducts, label: "Đang bán" },
    { emoji: "🍳", value: stats.totalRecipes, label: "Công thức" },
    { emoji: "💬", value: stats.totalPosts, label: "Cộng đồng" },
    { emoji: "⛵", value: stats.totalBoatLogs, label: "Nhật ký" },
    { emoji: "👥", value: stats.followersCount, label: "Theo dõi" },
    { emoji: "⭐", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", label: `(${stats.ratingCount} đg)` },
  ];

  return (
    <div style={{ background: C.white, borderRadius: 20,
      border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 28,
      boxShadow: "0 10px 25px -5px rgba(11, 79, 108, 0.04)" }}>

      {/* Banner */}
      <div style={{ height: 110,
        background: "linear-gradient(135deg, #0B4F6C 0%, #1A7FA0 100%)",
        position: "relative" }}>
        {/* Avatar */}
        <div style={{ position: "absolute", bottom: -28, left: 28,
          width: 68, height: 68, borderRadius: "50%",
          border: "3px solid #fff", overflow: "hidden", zIndex: 3,
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
          {sellerUser.avatar ? (
            <img src={sellerUser.avatar} alt={sellerUser.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%",
              background: "linear-gradient(135deg, #E8643A, #D94E21)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, color: "#fff", fontWeight: 800 }}>
              {sellerUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "44px 28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>

          {/* Tên + badges */}
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: C.dark,
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {sellerUser.name}
              {sellerUser.isVerified && <VerifiedBadge size="md" showLabel />}
              {sellerUser.isPremium && (
                <span title="Thành viên Premium" style={{ fontSize: 18 }}>👑</span>
              )}
            </h1>

            {/* Badges row */}
            {sellerUser.badges?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {sellerUser.badges.map((b, i) => (
                  <span key={i} style={{ background: "#F0FDF4",
                    border: "1px solid #99F6E4", color: "#0F766E",
                    borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                    🎖️ {b}
                  </span>
                ))}
              </div>
            )}

            {/* Thành viên từ */}
            {sellerUser.memberSince && (
              <div style={{ fontSize: 12, color: C.muted }}>
                Thành viên từ {new Date(sellerUser.memberSince).toLocaleDateString("vi-VN", {
                  month: "long", year: "numeric" })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isOwnProfile ? (
              <button onClick={() => navigate("/profile")}
                style={{ padding: "10px 20px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.white,
                  color: C.text, fontWeight: 700, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit" }}>
                ✏️ Chỉnh sửa hồ sơ
              </button>
            ) : (
              <button onClick={handleToggleFollow} disabled={togglingFollow}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none",
                  background: isFollowing
                    ? "rgba(11,79,108,0.08)"
                    : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                  color: isFollowing ? C.ocean : "#fff",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  border: isFollowing ? `1.5px solid ${C.ocean}` : "none" }}>
                {togglingFollow ? "..." : isFollowing ? "✅ Đang theo dõi" : "+ Theo dõi ngư dân"}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          {statCards.map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "10px 16px",
              background: "#F8FAFC", borderRadius: 12, border: `1px solid ${C.border}`,
              minWidth: 72 }}>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{s.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.dark, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### STEP 1.5 — Sửa `pages/SellerProfilePage.jsx`

**Đây là sửa đổi lớn nhất.** Giữ nguyên toàn bộ logic hiện có, chỉ thêm/thay theo các điểm sau:

#### A. Thêm imports ở đầu file (sau các import hiện tại)
```jsx
import { useApiFetch } from "../hooks/useApiFetch";
import { FishermanProfileHeader } from "../components/FishermanProfileHeader";
import { FishermanRecipesTab } from "./tabs/FishermanRecipesTab";
import { FishermanPostsTab } from "./tabs/FishermanPostsTab";
import { FishermanBoatLogsTab } from "./tabs/FishermanBoatLogsTab";
```

#### B. Thêm hook fetchProfile và LazyTab ở đầu component function

**Tìm** dòng `const { user } = useAuth();` trong `SellerProfilePage` component,  
**Thêm vào ngay bên dưới:**
```jsx
// Fetch profile tổng hợp — stats đầy đủ
const { data: profile, loading: profileLoading } = useApiFetch(
  `/fishermen/${seller.id}/profile`,
  [seller.id]
);
```

#### C. Thêm component LazyTab (định nghĩa ngay trên component SellerProfilePage hoặc bên trong file)
```jsx
// Thêm TRƯỚC dòng export function SellerProfilePage
function LazyTab({ active, children }) {
  const hasBeenActive = React.useRef(false);
  if (active) hasBeenActive.current = true;
  if (!hasBeenActive.current) return null;
  return <div style={{ display: active ? "block" : "none" }}>{children}</div>;
}
```

#### D. Thay phần tab definitions

**Tìm** đoạn render tab buttons (hiện có 2 tab: "products" và "reviews"),  
**Thay hoàn toàn** bằng:
```jsx
{/* ── Tab bar ── */}
<div style={{ display: "flex", gap: 4, background: "#E2E8F0",
  borderRadius: 12, padding: 4, width: "fit-content",
  marginBottom: 24, flexWrap: "wrap" }}>
  {[
    ["products",  `🐟 Gian hàng (${products.length})`],
    ["recipes",   `🍳 Công thức (${profile?.stats?.totalRecipes ?? "..."})`],
    ["posts",     `💬 Cộng đồng (${profile?.stats?.totalPosts ?? "..."})`],
    ["boatlogs",  `⛵ Nhật ký (${profile?.stats?.totalBoatLogs ?? "..."})`],
    ["reviews",   `⭐ Đánh giá (${profile?.stats?.ratingCount ?? "..."})`],
  ].map(([k, l]) => (
    <button key={k} onClick={() => setTab(k)}
      style={{ padding: "10px 18px", borderRadius: 10, border: "none",
        cursor: "pointer", fontWeight: 700, fontSize: 13,
        fontFamily: "inherit",
        background: tab === k ? C.white : "transparent",
        color: tab === k ? C.ocean : C.muted,
        boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.2s" }}>
      {l}
    </button>
  ))}
</div>
```

#### E. Thay phần render header

**Tìm** đoạn render seller info (phần có tên, avatar, rating, stats),  
**Thay hoàn toàn** bằng:
```jsx
<FishermanProfileHeader
  profile={profile}
  isLoading={profileLoading}
  sellerId={seller.id}
/>
```

#### F. Thay phần render tab content

**Tìm** phần render tab products và reviews,  
**Thay hoàn toàn** bằng:
```jsx
{/* Tab: Sản phẩm (giữ nguyên logic cũ) */}
{tab === "products" && (
  /* ... giữ nguyên toàn bộ JSX products hiện tại ... */
)}

{/* Tab: Công thức — lazy */}
<LazyTab active={tab === "recipes"}>
  <FishermanRecipesTab sellerId={seller.id} />
</LazyTab>

{/* Tab: Bài đăng cộng đồng — lazy */}
<LazyTab active={tab === "posts"}>
  <FishermanPostsTab sellerId={seller.id} />
</LazyTab>

{/* Tab: Nhật ký cabin — lazy */}
<LazyTab active={tab === "boatlogs"}>
  <FishermanBoatLogsTab sellerId={seller.id} />
</LazyTab>

{/* Tab: Đánh giá (giữ nguyên) */}
{tab === "reviews" && (
  <ReviewList sellerId={seller.id} user={user} productId={null} />
)}
```

---

### VERIFICATION Phase 1 ✓

Mở trang `/nguoi-ban/:id` của một ngư dân thật và kiểm tra:
- [ ] Header hiển thị đủ 6 stat cards (không bị skeleton mãi)
- [ ] Tab "🍳 Công thức" hiển thị grid cards công thức (hoặc empty state)
- [ ] Tab "💬 Cộng đồng" hiển thị danh sách bài đăng, click mở modal
- [ ] Tab "⛵ Nhật ký" hiển thị logs, nút like hoạt động
- [ ] Tab "⭐ Đánh giá" vẫn hoạt động như cũ (ReviewList)
- [ ] Chuyển tab không reload page, không fetch lại data đã fetch

---

## PHASE 2 — Frontend: Homepage Grid với Data Thật

**Prerequisite:** Phase 0 xong (endpoint `/api/fishermen` hoạt động).

---

### STEP 2.1 — Tạo `components/FishermanCard.jsx`

```jsx
import React from "react";
import { C } from "../utils/theme";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

/**
 * FishermanCard
 * @param {object} fisherman - { id, name, avatar, isVerified, isPremium, badges,
 *                               activeProducts, avgRating, ratingCount }
 * @param {"compact"|"full"} size - compact = grid nhỏ (homepage), full = list card
 */
export function FishermanCard({ fisherman, size = "compact" }) {
  const navigate = useViewTransitionNavigate();
  const {
    id, name, avatar, isVerified, isPremium,
    badges = [], activeProducts = 0, avgRating = 0, ratingCount = 0
  } = fisherman;

  const hasActive = activeProducts > 0;

  const handleClick = () => navigate(`/nguoi-ban/${id}`);

  // ── Compact size (dùng ở HomePage grid) ────────────────
  if (size === "compact") {
    return (
      <div
        onClick={handleClick}
        style={{ display: "flex", flexDirection: "column", alignItems: "center",
          cursor: "pointer", padding: "10px 12px", borderRadius: 12,
          border: `1px solid ${C.border}`, background: "#FAFAFA",
          transition: "all 0.22s ease", textAlign: "center", width: 110 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
          e.currentTarget.style.borderColor = C.ocean;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = C.border;
        }}
      >
        {/* Avatar với ring gradient khi có listing active */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", marginBottom: 8,
          padding: hasActive ? 3 : 2,
          background: hasActive
            ? "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #bc1888 100%)"
            : C.border,
          position: "relative", flexShrink: 0,
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%",
            background: "#fff", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {avatar ? (
              <img src={avatar} alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 18 }}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Badge xác minh */}
          {isVerified && (
            <div style={{ position: "absolute", bottom: 0, right: 0,
              background: "#0284C7", color: "#fff", borderRadius: "50%",
              width: 16, height: 16, fontSize: 9, display: "flex",
              alignItems: "center", justifyContent: "center",
              border: "1.5px solid #fff", fontWeight: 700 }}>✓</div>
          )}
        </div>

        {/* Tên */}
        <span style={{ fontSize: 11, fontWeight: 700, color: C.dark,
          overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", width: "100%", display: "block" }}>
          {isPremium ? "👑 " : ""}{name}
        </span>

        {/* Stats mini */}
        {activeProducts > 0 && (
          <span style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
            📦 {activeProducts}
            {avgRating > 0 ? ` · ⭐ ${avgRating}` : ""}
          </span>
        )}
      </div>
    );
  }

  // ── Full size (dùng ở FishermanListPage) ────────────────
  return (
    <div
      onClick={handleClick}
      style={{ display: "flex", alignItems: "center", gap: 14,
        padding: "16px 20px", background: C.white, borderRadius: 14,
        border: `1px solid ${C.border}`, cursor: "pointer",
        transition: "all 0.22s ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.ocean;
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(11,79,108,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Avatar */}
      <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
        padding: hasActive ? 2.5 : 2,
        background: hasActive
          ? "linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)"
          : C.border }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%",
          background: "#fff", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          {avatar ? (
            <img src={avatar} alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 18 }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.dark,
          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {isPremium && <span>👑</span>}
          {name}
          {isVerified && (
            <span style={{ background: "#0284C7", color: "#fff",
              borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>✓</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted, marginTop: 3 }}>
          {activeProducts > 0 && <span>📦 {activeProducts} sản phẩm</span>}
          {avgRating > 0 && <span>⭐ {avgRating} ({ratingCount} đánh giá)</span>}
        </div>
        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
            {badges.slice(0, 2).map((b, i) => (
              <span key={i} style={{ background: "#F0FDF4", border: "1px solid #99F6E4",
                color: "#0F766E", borderRadius: 4, padding: "2px 7px",
                fontSize: 10, fontWeight: 700 }}>🎖️ {b}</span>
            ))}
          </div>
        )}
      </div>

      <span style={{ fontSize: 18, color: C.muted }}>›</span>
    </div>
  );
}
```

---

### STEP 2.2 — Tạo `components/FishermanGrid.jsx`

```jsx
import React from "react";
import { C } from "../utils/theme";
import { useApiFetch } from "../hooks/useApiFetch";
import { FishermanCard } from "./FishermanCard";
import { useViewTransitionNavigate } from "../hooks/useViewTransitionNavigate";

// ── Hardcode fallback (giữ nguyên từ HomePage hiện tại khi API fail) ──────
// Copy 17 phần tử từ mảng hardcode trong HomePage.jsx vào đây
const HARDCODE_FALLBACK = [
  { id: null, img: "/n_ryo01.png", name: "Ngư dân Sasaoka", loc: "Côn Đảo" },
  { id: null, img: "/n_ryo02.png", name: "Tàu Kadoshima", loc: "Hạ Long" },
  { id: null, img: "/n_ryo03.png", name: "Hộ thuyền Kim Vinh", loc: "Vũng Tàu" },
  { id: null, img: "/n_ryo04.png", name: "HTX Misaki", loc: "Vịnh Bắc Bộ" },
  { id: null, img: "/n_ryo05.png", name: "Tàu Bangmeemaru", loc: "Sông Đốc" },
  { id: null, img: "/n_ryo06.png", name: "Tàu Matsueimaru", loc: "Phú Quốc" },
  { id: null, img: "/n_ryo07.png", name: "Đầm hào Honjyo", loc: "Nha Trang" },
  { id: null, img: "/n_ryo08.png", name: "Tàu Horyomaru", loc: "Phan Thiết" },
  { id: null, img: "/n_ryo09.png", name: "Thủy sản Konishi", loc: "Cát Bà" },
  { id: null, img: "/n_ryo10.png", name: "HTX Arifuku", loc: "Kê Gà" },
  { id: null, img: "/n_ryo11.png", name: "Tàu Fudomaru", loc: "Vân Đồn" },
  { id: null, img: "/n_ryo12.png", name: "Thủy sản Kurobe", loc: "Cửa Lò" },
  { id: null, img: "/n_ryo13.png", name: "Tàu Shotokumaru", loc: "Vũng Tàu" },
  { id: null, img: "/n_ryo14.png", name: "Tàu câu Katuura", loc: "Đà Nẵng" },
  { id: null, img: "/n_ryo15.png", name: "HTX Lý Sơn", loc: "Quảng Ngãi" },
  { id: null, img: "/n_ryo16.png", name: "Thủy sản Aita", loc: "Vịnh Hạ Long" },
  { id: null, img: "/n_ryo17.png", name: "Tàu Yamatake", loc: "Đồ Sơn" },
];

function HardcodeFallbackGrid({ onViewAll }) {
  const navigate = useViewTransitionNavigate();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      {HARDCODE_FALLBACK.map((item, i) => (
        <div key={i}
          onClick={() => navigate("/ngu-dan")}
          style={{ display: "flex", flexDirection: "column", alignItems: "center",
            cursor: "pointer", padding: "8px 12px", borderRadius: 12,
            border: `1px solid ${C.border}`, background: "#FAFAFA",
            transition: "all 0.22s", textAlign: "center", width: 110 }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = C.ocean; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = C.border; }}>
          <img src={item.img} alt={item.name}
            style={{ width: 52, height: 52, borderRadius: "50%",
              objectFit: "cover", marginBottom: 6, border: `2px solid ${C.border}` }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.dark,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
            {item.name}
          </span>
          <span style={{ fontSize: 9, color: C.muted }}>📍 {item.loc}</span>
        </div>
      ))}
    </div>
  );
}

export function FishermanGrid({ limit = 17, onViewAll }) {
  const { data, loading, error } = useApiFetch(
    `/fishermen?limit=${limit}&hasActive=true`,
    []
  );

  // Fallback graceful nếu API lỗi hoặc chưa có
  if (error) return <HardcodeFallbackGrid onViewAll={onViewAll} />;

  if (loading) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="skeleton-shimmer"
            style={{ width: 110, height: 100, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  const fishermen = data?.data ?? [];

  // Nếu không có data thật → fallback hardcode
  if (fishermen.length === 0) return <HardcodeFallbackGrid onViewAll={onViewAll} />;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
      {fishermen.map((f) => (
        <FishermanCard key={f.id} fisherman={f} size="compact" />
      ))}
    </div>
  );
}
```

---

### STEP 2.3 — Sửa `pages/HomePage.jsx`

#### A. Thêm import ở đầu file
```jsx
import { FishermanGrid } from "../components/FishermanGrid";
```

#### B. Tìm khối render lưới ngư dân

**Tìm** đoạn bắt đầu bằng `{[ { img: "/n_ryo01.png", ...` (khoảng 90 dòng hardcode + map).

**Xóa toàn bộ** mảng hardcode `[{ img: "/n_ryo01.png", ... }].map(...)`.

**Thay bằng:**
```jsx
<FishermanGrid
  limit={17}
  onViewAll={() => vtNavigate("/ngu-dan")}
/>
```

#### C. Tìm nút "Xem Tất Cả Gian Hàng Ngư Dân"

**Tìm dòng:**
```jsx
onClick={() => handleFishermanFilter("")}
```
**Đổi thành:**
```jsx
onClick={() => vtNavigate("/ngu-dan")}
```

#### D. Xóa hàm `handleFishermanFilter` nếu không còn dùng ở đâu khác

Kiểm tra trong file — nếu `handleFishermanFilter` còn được dùng cho các filter khác trong trang thì giữ nguyên. Chỉ xóa dòng `handleFishermanFilter("")` trong nút "Xem Tất Cả".

---

### VERIFICATION Phase 2 ✓

- [ ] Homepage hiển thị lưới ngư dân thật từ database (không còn hardcode ảnh /n_ryo01.png ở grid)
- [ ] Khi API `/api/fishermen` lỗi → fallback hiển thị lưới ảnh cũ (không vỡ layout)
- [ ] Click vào card ngư dân thật → điều hướng đúng `/nguoi-ban/:realId`
- [ ] Loading state hiển thị skeleton đúng số lượng cards
- [ ] Nút "Xem Tất Cả Gian Hàng Ngư Dân" → `/ngu-dan`

---

## PHASE 3 — Frontend: Trang Danh Sách Ngư Dân

**Prerequisite:** Phase 2 xong.

---

### STEP 3.1 — Tạo `pages/FishermanListPage.jsx`

```jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { useSEO } from "../hooks/useSEO";
import { FishermanCard } from "../components/FishermanCard";

const PAGE_SIZE = 20;

export function FishermanListPage() {
  useSEO({
    title: "Mạng Lưới Ngư Dân Bản Địa | HảiSản.vn",
    description: "Khám phá cộng đồng ngư dân và tàu cá đánh bắt trực tiếp trên HảiSản.vn.",
  });

  const [fishermen, setFishermen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);

  const sentinelRef = useRef(null);
  const stateRef = useRef({ page, hasMore, loadingMore, loading });

  useEffect(() => {
    stateRef.current = { page, hasMore, loadingMore, loading };
  }, [page, hasMore, loadingMore, loading]);

  const buildParams = useCallback((pageNum) => {
    const p = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
    if (search) p.set("search", search);
    if (onlyVerified) p.set("verified", "true");
    return p.toString();
  }, [search, onlyVerified]);

  // Fetch trang đầu (reset)
  const fetchPage1 = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const data = await api(`/fishermen?${buildParams(1)}`);
      const items = data.data ?? [];
      setFishermen(items);
      setTotal(data.total ?? 0);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => {
    const t = setTimeout(fetchPage1, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchPage1]);

  // Infinite scroll — load more
  const fetchMore = useCallback(async () => {
    const s = stateRef.current;
    if (s.loadingMore || !s.hasMore || s.loading) return;
    setLoadingMore(true);
    const nextPage = s.page + 1;
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (onlyVerified) params.set("verified", "true");
      const data = await api(`/fishermen?${params}`);
      const items = data.data ?? [];
      setFishermen((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  }, [search, onlyVerified]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMore(); },
      { rootMargin: "200px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMore]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.dark, marginBottom: 8 }}>
          🚢 Mạng Lưới Ngư Dân HảiSản.vn
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          {total > 0 ? `${total} ngư dân đang hoạt động` : "Đang tải..."}
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", fontSize: 14, color: C.muted }}>🔍</span>
          <input type="text" placeholder="Tìm theo tên ngư dân..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px",
              borderRadius: 10, border: `1.5px solid ${C.border}`,
              fontSize: 13, outline: "none", boxSizing: "border-box",
              fontFamily: "inherit", background: C.white }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer",
          padding: "10px 16px", borderRadius: 10,
          border: `1.5px solid ${onlyVerified ? C.ocean : C.border}`,
          background: onlyVerified ? "#E6F4F9" : C.white,
          transition: "all 0.2s" }}>
          <input type="checkbox" checked={onlyVerified}
            onChange={(e) => setOnlyVerified(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.ocean }} />
          ✓ Chỉ đã xác minh
        </label>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
      ) : fishermen.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px",
          background: C.white, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, color: C.dark, marginBottom: 6 }}>
            Không tìm thấy ngư dân
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Thử thay đổi từ khóa tìm kiếm
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fishermen.map((f) => (
            <FishermanCard key={f.id} fisherman={f} size="full" />
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

      {loadingMore && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!hasMore && fishermen.length > PAGE_SIZE && (
        <div style={{ textAlign: "center", fontSize: 12, color: C.muted,
          marginTop: 28, fontWeight: 600 }}>
          Đã hiển thị tất cả {fishermen.length} ngư dân
        </div>
      )}
    </div>
  );
}
```

---

### STEP 3.2 — Sửa `App.jsx`

#### A. Thêm lazy import (vào nhóm lazy imports hiện có)
```jsx
const FishermanListPage = lazy(() =>
  import("./pages/FishermanListPage").then((m) => ({
    default: m.FishermanListPage,
  }))
);
```

#### B. Thêm route (vào phần "Public routes" trong `<Routes>`)
```jsx
{/* Thêm vào nhóm Public routes, sau route /cong-dong */}
<Route path="/ngu-dan" element={<FishermanListPage />} />
```

---

### STEP 3.3 — Sửa `layout/Navbar.jsx` (tuỳ chọn)

**Tìm** nhóm `navLinks` trong Navbar (các nút Trang chủ, Sản phẩm, Bí quyết, Cộng đồng).  
**Thêm sau nút "Cộng đồng":**

```jsx
<button
  className={`${styles.navBtn} ${isActive("/ngu-dan") ? styles.active : ""}`}
  onClick={() => navTo("/ngu-dan")}
>
  🚢 Ngư Dân
</button>
```

**Tìm** nhóm mobile menu và thêm tương tự:
```jsx
<button className={styles.mobileMenuItem} onClick={() => navTo("/ngu-dan")}>
  🚢 Ngư dân bản địa
</button>
```

---

### VERIFICATION Phase 3 ✓

- [ ] `/ngu-dan` render đúng trang FishermanListPage
- [ ] Search theo tên hoạt động (debounce ~350ms)
- [ ] Checkbox "Chỉ đã xác minh" lọc đúng
- [ ] Infinite scroll load thêm khi scroll xuống cuối
- [ ] Click card → điều hướng đúng `/nguoi-ban/:id`
- [ ] Link navbar "🚢 Ngư Dân" hiển thị và hoạt động (nếu đã thêm)

---

## FINAL VERIFICATION — Kiểm Tra Toàn Bộ Tính Năng

Thực hiện flow end-to-end:

```
1. Vào HomePage
   ✓ Lưới ngư dân hiển thị từ database (avatar thật, tên thật)
   ✓ Click card ngư dân → /nguoi-ban/:id

2. Trang /nguoi-ban/:id
   ✓ Header: tên, verified badge, stats 6 ô
   ✓ Tab "🐟 Gian hàng": danh sách sản phẩm
   ✓ Tab "🍳 Công thức": grid công thức, click → /cong-thuc/:id
   ✓ Tab "💬 Cộng đồng": danh sách bài, click → modal
   ✓ Tab "⛵ Nhật ký": logs, like button hoạt động
   ✓ Tab "⭐ Đánh giá": ReviewList hoạt động như cũ
   ✓ Nút "Theo dõi" / "Chỉnh sửa" hiển thị đúng theo user context

3. Trang /ngu-dan
   ✓ Danh sách đầy đủ, search hoạt động
   ✓ Filter xác minh hoạt động
   ✓ Infinite scroll load thêm

4. Graceful degradation
   ✓ Tắt API → homepage fallback về lưới ảnh cũ, không crash
   ✓ Tab không có data → hiển thị empty state, không lỗi
```

---

## CÁC LỖI THƯỜNG GẶP — ĐỌC TRƯỚC KHI DEBUG

| Triệu chứng | Nguyên nhân | Cách fix |
|---|---|---|
| `FishermanGrid` hiển thị skeleton mãi | API `/api/fishermen` trả 404/500 | Kiểm tra Phase 0, đặc biệt STEP 0.5 (đăng ký route) |
| Stats trong header hiển thị "..." mãi | `/fishermen/:id/profile` fail | Kiểm tra model imports trong fisherman.controller.ts |
| Tab recipes rỗng dù có data | `authorId` filter chưa đúng type (string vs ObjectId) | Đảm bảo cast `new Types.ObjectId(authorId)` trong STEP 0.1 |
| Click card ngư dân trên homepage không navigate | `id` trong response là null (hardcode fallback) | Đảm bảo API trả về `id` không null, kiểm tra User model field name |
| `LazyTab` không hiện content | `active` prop không đúng kiểu | Kiểm tra tab key string khớp với `tab === k` condition |
| Follow button không hiện | `isOwnProfile` check sai | User object có thể dùng `userId` hoặc `id` — đảm bảo kiểm tra cả 2 |
| Avatar ring gradient không hiện | `hasActive` = false dù có sản phẩm | `activeProducts` field trong API response bằng 0 — debug aggregate query |
