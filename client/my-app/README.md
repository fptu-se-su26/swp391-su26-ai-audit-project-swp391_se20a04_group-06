# 🧑‍💻 Code Review Report — HảiSản.vn Frontend

> **Role:** Technical Lead / Senior Code Reviewer  
> **Stack:** React 18 + Vite + React Router v6  
> **Date:** 2026-05-27

---

## 1. TỔNG QUAN DỰ ÁN

Đây là marketplace bán hải sản online (HảiSản.vn), frontend React đã được build khá tốt với nhiều điểm tốt:

✅ Code-splitting với `lazy()` + `Suspense`  
✅ `useMemo` / `useCallback` / `React.memo` đúng chỗ  
✅ Cookie-based auth (bảo mật hơn localStorage)  
✅ SEO tốt với `useSEO` hook  
✅ Design tokens tập trung trong `theme.js`  
✅ Custom hooks (`useNotifications`, `useCountdown`)  
✅ Cloudinary optimization  
✅ Socket.IO real-time notifications

---

## 2. PHÂN TÍCH VẤN ĐỀ

### 🔴 Critical

#### P1 — Prop Drilling: `user` và `setUser` truyền qua mọi component

```
AppShell (state)
  → Navbar (user, setUser)
  → HomePage (user)
  → ProductDetailPage (user)
  → DashboardPage (user)
  → ProfilePage (user, setUser)
  → SellerProfilePage (user)
  → ChatBox (user)
  → ProductCard (user)
```

**Hậu quả:** Mỗi khi thêm component mới cần user, phải sửa toàn bộ chuỗi truyền props.

#### P2 — `alert()` và `confirm()` native browser vẫn còn trong 8 files

- `DashboardPage.jsx`: 4 chỗ alert + 1 chỗ confirm
- `ProductDetailPage.jsx`: 3 chỗ alert
- `AdminPage.jsx`: 5 chỗ alert + 1 chỗ confirm
- `ReviewList.jsx`, `ProfilePage.jsx`: nhiều alert

`alert()` chặn JavaScript thread, không có animation, trông thô, không khớp với UI premium đã xây dựng.

#### P3 — Toast system bị orphaned trong `client.jsx`

File `client.jsx` ở thư mục gốc là file cũ/standalone, chứa Toast system đã build sẵn nhưng KHÔNG ĐƯỢC import vào app mới (`my-app/src/`). App mới không có toast system nào cả.

### 🟡 Medium

#### P4 — Route protection bị scatter với inline ternary

```jsx
// 5 lần lặp pattern này trong App.jsx:
element={user ? <DashboardPage user={user} /> : <Navigate to="/dang-nhap" replace />}
```

#### P5 — Duplicated fetch pattern trong route components

`ProductDetailPageRoute` và `SellerProfilePageRoute` copy-paste y hệt nhau:

- `useState(null)` cho data
- `useState(true)` cho loading
- `useEffect` gọi `api().then().catch().finally()`
- Loading spinner markup trùng nhau

#### P6 — `client.jsx` là dead code / duplicate codebase

File này duplicate toàn bộ app trong 1 file duy nhất với logic cũ (localStorage token, không có React Router). Không nên tồn tại song song với `my-app/src/`.

### 🟢 Minor

#### P7 — Design tokens bị duplicate

- `client.jsx`: định nghĩa `const C = { ocean: "#0B4F6C", ... }`
- `utils/theme.js`: định nghĩa lại `C` với một số giá trị khác nhau

---

## 3. DESIGN PATTERNS ĐÃ ÁP DỤNG

### Pattern 1: **Context + Provider Pattern** (Auth)

> **File mới:** `src/context/AuthContext.jsx`

```
VẤN ĐỀ CŨ:
AppShell → props.user → Navbar → props.user → ChatPopover
                    → props.user → ProductCard
         → props.setUser → ProfilePage
         → props.setUser → AuthPage

GIẢI PHÁP MỚI:
<AuthProvider>          ← bọc toàn bộ app
  const { user } = useAuth()   ← bất kỳ component nào cũng gọi được
```

**Lợi ích:**

- Xoá 15+ chỗ truyền `user={user}` trong JSX
- Component nào cần user thì tự lấy, không phụ thuộc parent
- Thêm component mới cần auth → chỉ cần `useAuth()`, không sửa gì ở trên

---

### Pattern 2: **Observer / Publisher-Subscriber Pattern** (Toast)

> **File mới:** `src/context/ToastContext.jsx`

```
VẤN ĐỀ CŨ:
saveWeight() { catch (e) { alert(e.message) } }   // chặn thread

GIẢI PHÁP MỚI:
const toast = useToast()
saveWeight() { catch (e) { toast.error(e.message) } }  // non-blocking
```

**Cơ chế:**

- `ToastProvider` = Publisher: nhận lệnh addToast, render ToastContainer
- `useToast()` = Subscriber interface: component publish event lên hệ thống
- Mọi component trong cây đều là subscriber tiềm năng, zero coupling

**Thay thế:**
| Trước | Sau |
|-------|-----|
| `alert(e.message)` | `toast.error(e.message)` |
| `alert("Thành công!")` | `toast.success("Thành công!")` |
| `alert("Cảnh báo")` | `toast.warn("Cảnh báo")` |
| `window.confirm("Xoá?")` | `<ConfirmDialog onConfirm={...} />` |

---

### Pattern 3: **Higher-Order Component / Wrapper Pattern** (Route Guard)

> **File mới:** `src/components/PrivateRoute.jsx`

```jsx
// TRƯỚC (lặp 5 lần):
element={user ? <DashboardPage user={user} /> : <Navigate to="/dang-nhap" replace />}

// SAU (khai báo như spec):
<Route path="/dashboard" element={
  <PrivateRoute><DashboardPage /></PrivateRoute>
} />
```

3 loại guard:

- `PrivateRoute` — cần đăng nhập
- `AdminRoute` — cần role Admin
- `GuestRoute` — chỉ cho user chưa đăng nhập (trang login)

**Lợi ích:**

- Logic bảo vệ route tập trung một chỗ
- App.jsx đọc như spec của ứng dụng
- Thêm route mới → 3 dòng, không suy nghĩ

---

### Pattern 4: **Custom Hook Pattern** (Data Fetching)

> **File mới:** `src/hooks/useApiFetch.js`

```jsx
// TRƯỚC (copy-paste trong ProductDetailPageRoute):
const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  api(`/products/${productId}`)
    .then((p) => setProduct(p))
    .catch(() => {})
    .finally(() => setLoading(false));
}, [productId]);

// SAU:
const { data: product, loading } = useApiFetch(`/products/${productId}`, [
  productId,
]);
```

**Lợi ích:**

- Eliminates 30 dòng duplicate thành 1 dòng
- Handles mounting/unmounting cleanup tự động (tránh setState trên unmounted component)
- `refetch` function để reload data khi cần

---

### Pattern 5: **Facade Pattern** (API Layer — đã có sẵn)

> **File hiện có:** `src/services/api.js` — **GIỮ NGUYÊN, không thay đổi**

```js
export async function api(path, options = {}) {
  // CSRF token, credentials, error handling
  // → tất cả đều ẩn đằng sau một hàm duy nhất
}
```

Đây là Facade Pattern được implement đúng. Mọi API call đều qua `api()` thay vì gọi `fetch()` trực tiếp.

---

## 4. FILES THAY ĐỔI

### Files mới tạo

| File                              | Pattern            | Mục đích             |
| --------------------------------- | ------------------ | -------------------- |
| `src/context/AuthContext.jsx`     | Context + Provider | Global auth state    |
| `src/context/ToastContext.jsx`    | Observer/Pub-Sub   | Global notifications |
| `src/components/PrivateRoute.jsx` | HOC/Wrapper        | Route protection     |
| `src/hooks/useApiFetch.js`        | Custom Hook        | DRY data fetching    |

### Files refactored

| File                              | Thay đổi chính                                                       |
| --------------------------------- | -------------------------------------------------------------------- |
| `src/App.jsx`                     | Dùng AuthProvider, ToastProvider, PrivateRoute; xoá inline ternaries |
| `src/layout/Navbar.jsx`           | Xoá prop `user`/`setUser`; dùng `useAuth()`                          |
| `src/pages/DashboardPage.jsx`     | Xoá prop `user`; alert→toast; confirm→ConfirmDialog                  |
| `src/pages/ProductDetailPage.jsx` | Xoá prop `user`; alert→toast                                         |

### Files nên được xoá / deprecate

| File                                     | Lý do                                             |
| ---------------------------------------- | ------------------------------------------------- |
| `client.jsx` (root)                      | Orphaned standalone app, code cũ, duplicate logic |
| `src/pages/DashboardPage_PATCH_NOTES.js` | Patch notes file không phải source code           |
| `src/pages/AdminPage_verify_patch.jsx`   | Nên merge vào AdminPage.jsx                       |

---

## 5. HƯỚNG DẪN MIGRATION

### Bước 1 — Thêm Providers vào App.jsx

```jsx
// App.jsx đã được refactor, copy vào src/App.jsx
```

### Bước 2 — Xoá prop `user` khỏi các pages còn lại

Các file chưa refactor cần làm tương tự:

```jsx
// AdminPage.jsx, PostListingPage.jsx, ProfilePage.jsx, SellerProfilePage.jsx
// Thêm ở đầu:
import { useAuth } from "../context/AuthContext";
// Xoá khỏi function signature:
export function AdminPage() { // ← bỏ { user }
  const { user } = useAuth(); // ← thêm dòng này
```

### Bước 3 — Thay alert() còn lại

```bash
# Grep toàn bộ codebase tìm alert còn lại
grep -rn "alert(" src/ --include="*.jsx" --include="*.js"
```

Mỗi chỗ:

```jsx
// Thay:
alert(e.message);
// Bằng:
const toast = useToast(); // ← thêm ở đầu component
toast.error(e.message);
```

### Bước 4 — Xoá `client.jsx`

File này không được import bởi app chính. Kiểm tra không có import nào trỏ đến nó rồi xoá.

---

## 6. TRƯỚC / SAU — SO SÁNH

### App.jsx Routes

```jsx
// ❌ TRƯỚC — 35 dòng, lặp lại, props truyền tay
<Route path="/dashboard" element={
  user ? <DashboardPage user={user} /> : <Navigate to="/dang-nhap" replace />
} />
<Route path="/profile" element={
  user ? <ProfilePage user={user} setUser={handleSetUser} /> : <Navigate to="/dang-nhap" replace />
} />

// ✅ SAU — Đọc như spec của ứng dụng
<Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
<Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
```

### Error Handling

```jsx
// ❌ TRƯỚC — chặn thread, UI bị đơ
catch (e) { alert(e.message) }
if (!confirm("Xoá?")) return;

// ✅ SAU — non-blocking, animated, khớp với thiết kế
const toast = useToast();
catch (e) { toast.error(e.message) }
// Confirm qua ConfirmDialog component với animation
```

### Route Components

```jsx
// ❌ TRƯỚC — 30 dòng copy-paste giữa 2 components
function ProductDetailPageRoute({ user }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api(`/products/${productId}`)
      .then((p) => setProduct(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);
  // ...loading UI...
  // ...error UI...
}

// ✅ SAU — 5 dòng
function ProductDetailPageRoute() {
  const { productId } = useParams();
  const { data: product, loading } = useApiFetch(`/products/${productId}`, [
    productId,
  ]);
  const { user } = useAuth();
  if (loading) return <PageLoader label="ĐANG TẢI…" />;
  if (!product) return <Navigate to="/" replace />;
  return <ProductDetailPage product={product} user={user} />;
}
```

---

## 7. VẤN ĐỀ CHƯA GIẢI QUYẾT (Backlog)

| Priority  | Issue                                           | Gợi ý                                   |
| --------- | ----------------------------------------------- | --------------------------------------- |
| 🟡 Medium | `AdminPage.jsx` còn 5 alert + 1 confirm         | Áp dụng useToast tương tự DashboardPage |
| 🟡 Medium | `ProfilePage.jsx` còn alert                     | Áp dụng useToast                        |
| 🟢 Low    | `unread` message count vẫn poll 30s             | Xem xét chuyển sang socket event        |
| 🟢 Low    | `AdminPage_verify_patch.jsx` file patch         | Merge vào AdminPage.jsx                 |
| 🟢 Low    | `DashboardPage_PATCH_NOTES.js`                  | Xoá hoặc chuyển sang CHANGELOG.md       |
| 🟢 Low    | Inline styles quá nhiều trong Dashboard, Detail | Extract ra CSS Module                   |
