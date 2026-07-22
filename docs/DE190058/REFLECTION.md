# Reflection — Trần Minh Đức (DE190058)

> Phản ánh quá trình học tập, quyết định kỹ thuật và kinh nghiệm sử dụng AI trong dự án HảiSản.vn.

---

## Thông tin cá nhân

| Thông tin | Nội dung |
|---|---|
| **Sinh viên** | Trần Minh Đức |
| **MSSV** | DE190058 |
| **Dự án** | HảiSản.vn / SeaShop — SWP391 |
| **Vai trò** | Core Developer & Performance/Security Specialist |
| **Branch cá nhân** | `docs/DE190058-add-personal-folder` |

---

## 1. Vai trò và đóng góp cá nhân

Trong dự án HảiSản.vn, tôi tập trung vào backend security, data integrity, performance, automated testing và quy trình audit bằng AI.

### 1.1 Thiết kế Seafood Size và cải thiện UI

Tôi bổ sung thuộc tính Seafood Size vào Product Schema để sản phẩm hải sản có thể được phân loại theo size tiêu chuẩn hoặc số con/kg. Phần này giúp dữ liệu dễ filter hơn và làm thông tin sản phẩm trực quan hơn trên frontend.

Tôi cũng điều chỉnh Light Mode, badge và cách hiển thị tên hải sản để người dùng dễ nhận biết sản phẩm chính.

### 1.2 Bảo mật và Backend Validation

Tôi tăng cường validation cho MongoDB ObjectId và rà soát các query nhận dữ liệu từ `req.params` và `req.query`.

Các quyết định chính:

- Kiểm tra `ObjectId.isValid()` trước khi query.
- Sanitization input để giảm nguy cơ NoSQL Injection.
- Kiểm tra kiểu dữ liệu của latitude, longitude, radius và category.
- Xử lý Mongoose `CastError` thành HTTP 400 thay vì HTTP 500.

Tôi học được rằng validation cần được thiết kế theo nhiều lớp gồm route validation, middleware, service rule và global error handling.

### 1.3 Redis Cache, Quota và Performance

Tôi áp dụng Redis Quota để giới hạn request và giảm tải MongoDB ở các API có tần suất truy cập cao.

Các pattern quan trọng:

- `INCR` để tăng counter.
- TTL để key tự hết hạn.
- Quy ước key theo user hoặc IP.
- Cache invalidation sau thao tác thay đổi dữ liệu.

Tôi nhận ra cache không chỉ để tăng tốc. Nếu thiếu invalidation rule và fallback, cache có thể gây stale data.

### 1.4 MongoDB Transaction cho Batch Products

Khi đồng bộ hàng loạt sản phẩm, tôi sử dụng Mongoose session và `withTransaction` để đảm bảo tính toàn vẹn dữ liệu.

Nếu một bước thất bại, toàn bộ thay đổi phải rollback thay vì để hệ thống ở trạng thái dữ liệu dở dang. Phần này giúp tôi hiểu rõ hơn về atomic operation và transaction boundary.

### 1.5 Data Integrity khi xóa sản phẩm

Trong `DeleteProductUseCase`, tôi cải thiện logic cleanup favorites.

Thay vì update tất cả user, hệ thống chỉ tác động user có `favorites` chứa `productId` bị xóa. Tôi cũng bổ sung rule không trả sản phẩm có status `Deleted` trong favorite list.

Soft-delete vẫn giữ lịch sử trong database nhưng không nên hiển thị như sản phẩm đang hoạt động.

### 1.6 Automated Testing

Tôi mở rộng test bằng Jest, Vitest và Playwright.

Kết quả cuối:

- 153/153 backend test suites pass.
- 228/228 backend tests pass.
- 7/7 frontend test files pass.
- 31/31 frontend tests pass.
- 4/4 E2E tests pass.
- Backend TypeScript build pass.
- Frontend Vite build pass.

Tôi học được test tốt phải kiểm tra behavior và business rule, không chỉ kiểm tra function có chạy hay không.

---

## 2. Bài học rút ra khi sử dụng AI

### 2.1 AI giúp tăng tốc nhưng không thay thế review

AI hỗ trợ tốt trong:

- security pattern,
- Unit Test boilerplate,
- mock data,
- stack trace analysis,
- Git recovery workflow,
- audit documentation.

Tuy nhiên, output AI luôn cần được kiểm tra xem có phù hợp architecture, business rule, import path và dependency của project hay không.

### 2.2 Prompt rõ ràng tạo output tốt hơn

Khi prompt chỉ nói “hãy sửa code”, giải pháp thường quá rộng.

Khi prompt nêu rõ file, behavior, ràng buộc, loại test và môi trường Windows PowerShell, output thực tế hơn và ít phải chỉnh sửa hơn.

### 2.3 Phải phân loại đúng loại lỗi

Tôi học cách phân biệt:

- logger output có chủ đích,
- framework warning,
- dependency error,
- assertion failure,
- build error,
- runtime error.

Ví dụ `Cannot find module '@playwright/test'` là lỗi dependency, không phải application bug.

### 2.4 Bằng chứng quan trọng hơn cảm giác

Tôi chỉ xem thay đổi hoàn thành khi có bằng chứng như:

- Unit Test pass.
- Integration Test pass.
- E2E Test pass.
- Build pass.
- `git diff --check` sạch.
- Staged diff đúng phạm vi.

---

## 3. Bài học về Git và quản lý rủi ro

### 3.1 Generated artifacts làm nhiễu Git status

Sau build và test, nhiều file tự sinh xuất hiện trong:

- `backend/dist`
- `backend/coverage`
- `backend/logs`
- `playwright-report`
- `test-results`

Nếu không dọn, việc review diff khó và dễ commit nhầm.

### 3.2 `git stash push -u` quan trọng khi có file mới

WIP có nhiều untracked files như `test.md`, E2E test và frontend tests. Dùng `-u` giúp bảo toàn cả tracked và untracked files.

### 3.3 Conflict lớn không nên luôn giải quyết thủ công

Khi branch cá nhân khác `main` quá nhiều, stash tạo ra hàng loạt conflict. Giải pháp an toàn hơn:

1. Giữ stash.
2. Tạo backup branch.
3. Reset conflict.
4. Reset branch cá nhân về `origin/main`.
5. Apply stash lại trên baseline sạch.

### 3.4 Các lệnh destructive cần safety control

Các nguyên tắc tôi tiếp tục sử dụng:

- `git clean -fdn` trước `git clean -fd`.
- Backup branch trước `git reset --hard`.
- `git stash apply` khi cần giữ stash.
- `git push --force-with-lease` thay vì `git push --force`.
- Chỉ drop stash sau khi xác minh remote.

---

## 4. Khó khăn và cách xử lý

### Khó khăn 1 — Invalid ObjectId gây HTTP 500

**Nguyên nhân:** Mongoose `CastError` bị xem như lỗi server.

**Cách xử lý:** Trả HTTP 400 và thêm Unit Test.

**Bài học:** Client input error không nên bị báo thành Internal Server Error.

### Khó khăn 2 — Product Deleted vẫn xuất hiện trong favorites

**Nguyên nhân:** Service chưa filter status của soft-deleted product.

**Cách xử lý:** Lọc `Deleted` product và thêm regression test.

**Bài học:** Soft-delete cần rule rõ ràng ở tầng query/service.

### Khó khăn 3 — Playwright không tìm thấy module

**Nguyên nhân:** Root project chưa có local dependency `@playwright/test`.

**Cách xử lý:** Cài dependency và Chromium runtime.

**Bài học:** Phải phân biệt dependency setup với application bug.

### Khó khăn 4 — Git không cho switch branch

**Nguyên nhân:** Working tree có source changes, generated files và untracked files.

**Cách xử lý:** Restore generated artifacts, stash với `-u`, rồi switch branch.

**Bài học:** Phải hiểu file nào là source và file nào là output tự sinh.

### Khó khăn 5 — Stash tạo conflict lớn

**Nguyên nhân:** Branch cá nhân có lịch sử và cấu trúc khác `main`.

**Cách xử lý:** Backup, reset về `origin/main`, apply stash lại.

**Bài học:** Baseline đúng giúp giảm conflict tốt hơn việc cố merge tất cả.

---

## 5. Sử dụng AI có trách nhiệm

Tôi sử dụng AI như trợ lý kỹ thuật, không phải người chịu trách nhiệm cuối cùng.

AI hỗ trợ:

- phân tích lỗi,
- đề xuất code pattern,
- gợi ý test case,
- hướng dẫn Git,
- chuẩn hóa tài liệu.

Tôi chịu trách nhiệm:

- review output,
- điều chỉnh theo project,
- chạy command,
- kiểm tra test result,
- kiểm tra staged diff,
- không ghi nhận kết quả chưa xác minh.

Trong tài liệu này, tôi không khẳng định push branch đã thành công nếu chưa có log Git hoặc bằng chứng trực tiếp trên GitHub.

---

## 6. Điểm cần cải thiện trong tương lai

1. Tạo branch cá nhân trước khi bắt đầu thay đổi lớn.
2. Chia commit nhỏ theo concern: security, testing, performance, documentation.
3. Cập nhật `.gitignore` cho generated artifacts.
4. Chạy targeted test trong lúc phát triển và full test trước commit.
5. Chạy `git diff --check` trước khi stage.
6. Khai báo dependency E2E local ngay từ đầu.
7. Ghi prompt và AI output ngay tại thời điểm sử dụng.
8. Review Jest open handles và giảm phụ thuộc vào `--forceExit`.
9. Bổ sung Integration Test cho transaction và Redis failure.
10. Theo dõi performance bằng metrics.

---

## 7. Kết luận

AI giúp tôi tăng tốc ở các công việc audit, viết test, phân tích lỗi và xử lý Git. Giá trị lớn nhất không nằm ở số dòng code AI tạo ra mà ở việc AI giúp tôi đặt đúng câu hỏi và phát hiện các trường hợp dễ bỏ sót.

Quy trình tôi rút ra:

1. Xác định vấn đề.
2. Viết prompt có phạm vi rõ ràng.
3. Review output AI.
4. Triển khai thay đổi nhỏ nhất cần thiết.
5. Xác minh bằng build và automated test.
6. Kiểm tra Git diff.
7. Giữ phương án rollback.
8. Ghi lại bằng chứng trung thực.

AI giúp phát triển nhanh hơn, nhưng việc kiểm chứng của con người mới làm kết quả đáng tin cậy.
