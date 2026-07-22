# Prompts — Trần Minh Đức (DE190058)

> Tài liệu này lưu lại các prompt quan trọng đã sử dụng với AI trong dự án HảiSản.vn. Các prompt được ghi lại theo mục tiêu, output nhận được, phần đã chỉnh sửa và cách xác minh.

---

## P-001 — Thiết kế thuộc tính Seafood Size và Validation

**Công cụ:** Claude Sonnet  
**Ngày:** 14/07/2026  
**Tham chiếu:** AL-001

**Prompt đã gửi:**

```text
Thiết kế enum và validation cho thuộc tính kích thước hải sản (Seafood Size)
trong Mongoose Schema sử dụng Node.js và TypeScript.

Yêu cầu:
- Hỗ trợ phân loại size tiêu chuẩn như S, M, L, XL hoặc theo số con/kg.
- Dữ liệu phải dễ filter trong MongoDB.
- Hiển thị rõ ràng trên React Client.
- Đề xuất cách hiển thị badge phù hợp với Light Mode.
```

**Output AI trả về:** Đề xuất cấu trúc enum, validation rule, label mapping và cách hiển thị badge.

**Đã chỉnh sửa:** Tích hợp vào Product Schema, điều chỉnh tên hiển thị và CSS theo UI hiện tại.

**Cách xác minh:** Kiểm tra dữ liệu Product, filter sản phẩm và giao diện frontend.

---

## P-002 — Viết Backend Unit Test bằng Jest

**Công cụ:** GitHub Copilot  
**Ngày:** 17/07/2026  
**Tham chiếu:** AL-002

**Prompt đã gửi:**

```text
Viết Unit Test bằng Jest cho các service, validation và response helper
trong backend Express TypeScript.

Yêu cầu:
- Mock MongoDB repository.
- Mock Redis client.
- Không kết nối database thật.
- Bao phủ success case, validation error và unexpected error.
- Giữ test độc lập và có thể chạy bằng --runInBand.
```

**Output AI trả về:** Các test suite mẫu, mock data và cấu trúc `describe/it`.

**Đã chỉnh sửa:** Chỉnh mock Redis, MongoDB connection và import path theo repository.

**Cách xác minh:** Chạy Jest và kiểm tra test summary.

---

## P-003 — Vá NoSQL Injection và ObjectId Validation

**Công cụ:** Claude Sonnet  
**Ngày:** 19/07/2026  
**Tham chiếu:** AL-003

**Prompt đã gửi:**

```text
Hãy rà soát Express controller lọc sản phẩm theo ID và vị trí GeoJSON.

Yêu cầu:
- Chỉ ra nguy cơ NoSQL Injection từ req.params và req.query.
- Viết middleware validate ObjectId bằng Mongoose.
- Đề xuất sanitization cho search, category, latitude, longitude và radius.
- Không làm thay đổi business flow hiện tại.
```

**Output AI trả về:** Đề xuất `mongoose.Types.ObjectId.isValid()`, input sanitization và giới hạn kiểu dữ liệu.

**Đã chỉnh sửa:** Áp dụng vào route handler và validation module phù hợp.

**Cách xác minh:** Review controller/middleware và chạy backend tests.

---

## P-004 — Quản lý Redis Quota và Rate Limit Cache

**Công cụ:** ChatGPT / Claude  
**Ngày:** 19/07/2026  
**Tham chiếu:** AL-004

**Prompt đã gửi:**

```text
Hướng dẫn cài đặt Redis quota limiter trong Express TypeScript.

Yêu cầu:
- Giới hạn số request theo user hoặc IP.
- Tự động xóa key bằng TTL expiration.
- Tránh race condition khi tăng counter.
- Có fallback khi Redis tạm thời unavailable.
```

**Output AI trả về:** Pattern `INCR`, `EXPIRE`, key convention và middleware flow.

**Đã chỉnh sửa:** Tích hợp vào Redis helper và cấu trúc middleware hiện tại.

**Cách xác minh:** Chạy test middleware và kiểm tra TTL trên Redis.

---

## P-005 — Đồng bộ Batch Products bằng Mongoose Transaction

**Công cụ:** Claude Sonnet  
**Ngày:** 20/07/2026  
**Tham chiếu:** AL-005

**Prompt đã gửi:**

```text
Thiết kế logic đồng bộ batch products trong MongoDB bằng Mongoose session.

Yêu cầu:
- Sử dụng withTransaction.
- Nếu một bước lỗi phải rollback toàn bộ.
- Không làm mất liên kết giữa batch và products.
- Có xử lý transaction abort rõ ràng.
```

**Output AI trả về:** Pattern transaction, session lifecycle và rollback handling.

**Đã chỉnh sửa:** Tích hợp vào business flow của batch product và kiểm tra repository calls.

**Cách xác minh:** Review transaction flow và test success/failure.

---

## P-006 — Xử lý Mongoose CastError trong Global Error Handler

**Công cụ:** ChatGPT  
**Ngày:** 20/07/2026  
**Tham chiếu:** AL-006

**Prompt đã gửi:**

```text
Rà soát global error handler của Express TypeScript.

Hiện tại khi truyền MongoDB ObjectId sai định dạng, Mongoose phát sinh CastError
và hệ thống trả HTTP 500.

Hãy đề xuất cách:
- Nhận diện CastError an toàn.
- Trả HTTP 400.
- Giữ format response hiện tại.
- Viết Unit Test cho trường hợp invalid ObjectId.
```

**Output AI trả về:** Đề xuất kiểm tra `err.name === "CastError"` và trả message ID không hợp lệ.

**Đã chỉnh sửa:** Tích hợp vào `errorHandler.ts`, giữ response helper hiện có.

**Cách xác minh:** `errorHandler.test.ts` và toàn bộ backend tests pass.

---

## P-007 — Tối ưu DeleteProductUseCase và Favorite Cleanup

**Công cụ:** ChatGPT  
**Ngày:** 20/07/2026  
**Tham chiếu:** AL-007

**Prompt đã gửi:**

```text
Audit DeleteProductUseCase trong dự án Express TypeScript + MongoDB + Redis.

Yêu cầu:
- Kiểm tra quyền sở hữu sản phẩm.
- Không update toàn bộ user khi xóa product khỏi favorites.
- Chỉ tác động user có favorites chứa productId.
- Giữ cache invalidation sau khi xóa.
- Viết test cho unauthorized, not found, cleanup và Redis.
```

**Output AI trả về:** Đề xuất query `{ favorites: productId }` và danh sách behavior test.

**Đã chỉnh sửa:** Điều chỉnh repository/update query, mock authorization và Redis calls.

**Cách xác minh:** `DeleteProductUseCase.test.ts` pass.

---

## P-008 — Lọc Soft-Deleted Product khỏi Favorites

**Công cụ:** ChatGPT  
**Ngày:** 20/07/2026  
**Tham chiếu:** AL-008

**Prompt đã gửi:**

```text
Kiểm tra favorite.service.ts.

Vấn đề:
Product đã soft-delete với status "Deleted" vẫn có thể xuất hiện
trong danh sách favorites.

Hãy đề xuất thay đổi nhỏ nhất để:
- Không trả sản phẩm Deleted.
- Không xóa lịch sử database.
- Có regression test.
```

**Output AI trả về:** Đề xuất filter status khi lấy hoặc sau khi populate favorites.

**Đã chỉnh sửa:** Chọn cách phù hợp với service hiện tại và thêm regression test.

**Cách xác minh:** `favorite.service.test.ts` pass.

---

## P-009 — Viết Frontend Unit Test cho RouteGuard và AuthContext

**Công cụ:** ChatGPT  
**Ngày:** 20/07/2026  
**Tham chiếu:** AL-010

**Prompt đã gửi:**

```text
Viết Unit Test bằng Vitest và React Testing Library cho:

1. RouteGuard:
- loading state
- chưa đăng nhập
- đã đăng nhập
- sai role
- đúng role

2. AuthContext:
- initial state
- login state
- logout state

Không gọi API thật và phải mock các dependency cần thiết.
```

**Output AI trả về:** Cấu trúc test, mock context, router wrapper và assertion.

**Đã chỉnh sửa:** Chỉnh import path, provider wrapper và behavior theo code thực tế.

**Cách xác minh:** 7/7 frontend test files và 31/31 tests pass.

---

## P-010 — Thiết kế Playwright E2E Critical Flows

**Công cụ:** ChatGPT  
**Ngày:** 20/07/2026  
**Tham chiếu:** AL-011

**Prompt đã gửi:**

```text
Thiết kế Playwright E2E Test cho dự án HảiSản.vn.

Critical flows:
- Truy cập trang chủ và marketplace.
- Filter/search sản phẩm.
- Đăng nhập seller.
- Truy cập seller dashboard.
- Kiểm tra error route redirect.

Yêu cầu:
- Test ổn định.
- Không phụ thuộc dữ liệu random.
- Chỉ chạy TypeScript spec.
```

**Output AI trả về:** Test flow, locator strategy và cấu hình `testMatch`.

**Đã chỉnh sửa:** Điều chỉnh locator theo UI và cấu hình `playwright.config.ts`.

**Cách xác minh:** 4/4 Playwright E2E tests pass.

---

## P-011 — Chẩn đoán lỗi Cannot Find Module @playwright/test

**Công cụ:** ChatGPT  
**Ngày:** 20/07/2026  
**Tham chiếu:** AL-012

**Prompt đã gửi:**

```text
Khi chạy npm run test:e2e, Playwright báo:

Cannot find module '@playwright/test'
Require stack bắt đầu từ playwright.config.ts.

Hãy xác định đây là lỗi source, config hay dependency
và đưa ra các lệnh sửa phù hợp trên Windows PowerShell.
```

**Output AI trả về:** Xác định thiếu local dependency và browser runtime.

**Đã chỉnh sửa:** Cài dependency tại root project và chạy lại bằng npm script.

**Cách xác minh:** Playwright khởi động và 4 tests pass.

---

## P-012 — Chuyển WIP sang Branch Cá nhân an toàn

**Công cụ:** ChatGPT  
**Ngày:** 22/07/2026  
**Tham chiếu:** AL-013

**Prompt đã gửi:**

```text
Tôi đang ở branch main và có nhiều modified/untracked files.
Tôi cần chuyển toàn bộ phần việc sang branch:

docs/DE190058-add-personal-folder

Hãy hướng dẫn lệnh Git an toàn trên Windows PowerShell,
không làm mất file mới và không commit coverage/dist/logs.
```

**Output AI trả về:** Restore generated files, `git stash push -u`, fetch, switch và apply stash.

**Đã chỉnh sửa:** Thực hiện từng lệnh và kiểm tra `git status` sau mỗi bước.

**Cách xác minh:** Stash được lưu và branch được switch thành công.

---

## P-013 — Khôi phục sau Stash Conflict lớn

**Công cụ:** ChatGPT  
**Ngày:** 22/07/2026  
**Tham chiếu:** AL-014, AL-015

**Prompt đã gửi:**

```text
git stash pop tạo rất nhiều conflict gồm:
- both modified
- modify/delete
- hàng loạt file needs merge

Branch cá nhân có lịch sử rất khác main.
Hãy đưa ra phương án khôi phục an toàn, có backup và không mất stash.
```

**Output AI trả về:** Tạo backup branch, reset conflict, preview `git clean`, reset về `origin/main` và dùng `git stash apply`.

**Đã chỉnh sửa:** Thực hiện đúng thứ tự và giữ stash đến khi xác minh remote.

**Cách xác minh:** Stash áp dụng lại không còn conflict.

---

## P-014 — Review Kết quả Test và Đặt Commit Message

**Công cụ:** ChatGPT  
**Ngày:** 22/07/2026  
**Tham chiếu:** AL-017

**Prompt đã gửi:**

```text
Dựa trên các thay đổi sau, hãy đề xuất commit message phù hợp:

- Handle Mongoose CastError thành HTTP 400.
- Tối ưu DeleteProductUseCase favorite cleanup.
- Lọc product Deleted khỏi favorites.
- Mở rộng backend/frontend/E2E tests.
- Chỉnh Playwright config.
- Cập nhật test documentation.

Dùng Conventional Commits.
```

**Output AI trả về:**

```text
fix(testing): harden error handling and optimize favorites integrity
```

**Đã chỉnh sửa:** Giữ commit title ngắn, commit body mô tả behavior và test.

**Cách xác minh:** Đối chiếu staged diff và test summary trước commit.

---

## Nguyên tắc lưu prompt

- Prompt phải mô tả rõ vấn đề, phạm vi và ràng buộc.
- Không yêu cầu AI viết lại toàn bộ project nếu chỉ cần sửa một behavior nhỏ.
- Output AI luôn phải được điều chỉnh theo architecture thực tế.
- Mỗi prompt quan trọng phải có cách xác minh bằng test, build, diff hoặc review.
