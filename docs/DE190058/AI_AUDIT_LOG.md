# AI Audit Log — Trần Minh Đức (DE190058)

> Tài liệu này ghi lại các lần sử dụng AI có ý nghĩa trong quá trình phát triển, kiểm thử, audit và hoàn thiện dự án HảiSản.vn của sinh viên **Trần Minh Đức (MSSV: DE190058)**.

---

## Thông tin chung

| Thông tin | Nội dung |
|---|---|
| **Sinh viên** | Trần Minh Đức |
| **MSSV** | DE190058 |
| **Dự án** | HảiSản.vn / SeaShop — SWP391 |
| **Repository** | `swp391-su26-ai-audit-project-swp391_se20a04_group-06` |
| **Branch cá nhân** | `docs/DE190058-add-personal-folder` |
| **Vai trò chính** | Core Developer & Performance/Security Specialist |
| **Giai đoạn ghi nhận** | 14/07/2026 — 22/07/2026 |

---

## Log

### AL-001

| | |
|---|---|
| **Ngày** | 14/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | Claude Sonnet |
| **Commit** | `df5712b8`, `dd414018` |
| **Nhiệm vụ** | Bổ sung thuộc tính Seafood Size và tối ưu giao diện Light Mode |
| **Mục đích** | Gợi ý cấu trúc enum dữ liệu kích thước hải sản và quy chuẩn nhãn hiển thị |
| **Kết quả** | AI đề xuất bảng phân loại size hải sản tiêu chuẩn. Đã tích hợp vào Product Schema và bổ sung hiển thị nổi bật tên hải sản trên UI |
| **Cách xác minh** | Kiểm tra Product Schema, giao diện hiển thị và chạy lại frontend |
| **Đánh giá** | ✅ Tốt — áp dụng trực tiếp, tự điều chỉnh CSS hiển thị |

---

### AL-002

| | |
|---|---|
| **Ngày** | 17/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | GitHub Copilot |
| **Commit** | `5bc3912f` |
| **Nhiệm vụ** | Viết Unit Test cho hệ thống Backend |
| **Mục đích** | Gợi ý test case và mock data cho Jest runner |
| **Kết quả** | Copilot sinh các test suite kiểm tra validation và response format. Đã chỉnh sửa lại mock Redis và MongoDB connection để phù hợp với kiến trúc dự án |
| **Cách xác minh** | Chạy Jest và đối chiếu số lượng test pass |
| **Đánh giá** | ✅ Tốt — tiết kiệm khoảng 50% thời gian viết test |

---

### AL-003

| | |
|---|---|
| **Ngày** | 19/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | Claude Sonnet |
| **Commit** | `9ec22f73` |
| **Nhiệm vụ** | Audit bảo mật backend và rà soát lỗ hổng dữ liệu |
| **Mục đích** | Tìm các điểm có nguy cơ NoSQL Injection và rò rỉ dữ liệu khi filter sản phẩm |
| **Kết quả** | AI chỉ ra điểm thiếu `ObjectId.isValid()` trong controller và các query địa lý chưa được sanitization. Các điểm này đã được vá |
| **Cách xác minh** | Review middleware, controller, validation và chạy lại backend tests |
| **Đánh giá** | ✅ Tốt — phát hiện đúng điểm yếu bảo mật |

---

### AL-004

| | |
|---|---|
| **Ngày** | 19/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT / Claude |
| **Commit** | `330f5922` |
| **Nhiệm vụ** | Tối ưu Redis Quota và xử lý validation ObjectId |
| **Mục đích** | Xây dựng middleware kiểm tra quota Redis và cơ chế tự giải phóng cache stale |
| **Kết quả** | AI đề xuất pattern Redis TTL, cơ chế tăng bộ đếm request và middleware validate `ObjectId`. Đã áp dụng vào các route liên quan |
| **Cách xác minh** | Kiểm tra Redis helper, route middleware và chạy Unit Test |
| **Đánh giá** | ✅ Tốt |

---

### AL-005

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | Claude Sonnet |
| **Commit** | `9bbec4a4` |
| **Nhiệm vụ** | Đồng bộ hóa lô sản phẩm và củng cố Auth Messaging Integrity |
| **Mục đích** | Thiết kế logic đồng bộ giao dịch theo lô trong MongoDB bằng session transaction |
| **Kết quả** | AI cung cấp pattern Mongoose `withTransaction` để đảm bảo tính toàn vẹn dữ liệu khi đồng bộ hàng loạt sản phẩm |
| **Cách xác minh** | Review transaction flow, kiểm tra rollback và chạy test liên quan |
| **Đánh giá** | ✅ Tốt — giúp mã nguồn ổn định và an toàn hơn |

---

### AL-006

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Chưa xác nhận commit hash trong log làm việc |
| **Nhiệm vụ** | Sửa cơ chế xử lý Mongoose `CastError` trong global error handler |
| **Mục đích** | Ngăn ID sai định dạng bị trả về HTTP 500 và chuyển thành lỗi phía client |
| **Kết quả** | Cập nhật `backend/src/middlewares/errorHandler.ts` để trả HTTP 400 với thông báo ID không hợp lệ |
| **Cách xác minh** | Mở rộng `errorHandler.test.ts`; test `CastError` pass |
| **Đánh giá** | ✅ Tốt — đúng semantics của HTTP và hỗ trợ frontend xử lý lỗi rõ ràng hơn |

---

### AL-007

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Chưa xác nhận commit hash trong log làm việc |
| **Nhiệm vụ** | Tối ưu `DeleteProductUseCase` |
| **Mục đích** | Tránh update toàn bộ user khi cleanup sản phẩm đã xóa khỏi favorites |
| **Kết quả** | Chỉ cập nhật các user có `favorites` chứa `productId` bị xóa; giữ nguyên authorization và Redis invalidation |
| **Cách xác minh** | Bổ sung test về ownership, cleanup có điều kiện và cache invalidation |
| **Đánh giá** | ✅ Tốt — giảm thao tác database không cần thiết |

---

### AL-008

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Chưa xác nhận commit hash trong log làm việc |
| **Nhiệm vụ** | Bảo đảm tính toàn vẹn dữ liệu favorites |
| **Mục đích** | Ngăn sản phẩm soft-delete tiếp tục xuất hiện trong danh sách yêu thích |
| **Kết quả** | Cập nhật `favorite.service.ts` để lọc sản phẩm có status `Deleted` |
| **Cách xác minh** | Thêm regression test trong `favorite.service.test.ts` |
| **Đánh giá** | ✅ Tốt — phù hợp với business rule của hệ thống |

---

### AL-009

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Chưa xác nhận commit hash trong log làm việc |
| **Nhiệm vụ** | Mở rộng Backend Unit Test |
| **Mục đích** | Thay các smoke test yếu bằng test kiểm tra behavior và edge case |
| **Kết quả** | Mở rộng test cho error handler, auth service, favorite service và `DeleteProductUseCase` |
| **Cách xác minh** | Backend đạt **153/153 test suites** và **228/228 tests** |
| **Đánh giá** | ✅ Tốt — tăng khả năng phát hiện regression |

---

### AL-010

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Chưa xác nhận commit hash trong log làm việc |
| **Nhiệm vụ** | Bổ sung Frontend Unit Test |
| **Mục đích** | Kiểm tra riêng logic authentication, loading state và role-based route protection |
| **Kết quả** | Thêm `RouteGuard.test.jsx` và `AuthContext.test.jsx` |
| **Cách xác minh** | Frontend đạt **7/7 test files** và **31/31 tests** |
| **Đánh giá** | ✅ Tốt — bảo vệ các luồng xác thực quan trọng |

---

### AL-011

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Chưa xác nhận commit hash trong log làm việc |
| **Nhiệm vụ** | Hoàn thiện Playwright E2E Test |
| **Mục đích** | Kiểm tra các luồng marketplace, seller dashboard và error route |
| **Kết quả** | Thêm `tests/e2e/flows.spec.ts`; cấu hình Playwright chỉ chạy `*.spec.ts` để tránh chạy lặp file JavaScript build |
| **Cách xác minh** | Playwright đạt **4/4 E2E tests** |
| **Đánh giá** | ✅ Tốt — test tập trung vào critical user flows |

---

### AL-012

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Chưa xác nhận commit hash trong log làm việc |
| **Nhiệm vụ** | Chẩn đoán lỗi `Cannot find module '@playwright/test'` |
| **Mục đích** | Phân biệt lỗi dependency với lỗi application source |
| **Kết quả** | Xác định thiếu local dependency Playwright và browser runtime; cài đặt lại để E2E chạy được |
| **Cách xác minh** | Chạy lại `npm run test:e2e` và nhận kết quả 4 tests pass |
| **Đánh giá** | ✅ Tốt — tránh chỉnh sửa sai vào source code |

---

### AL-013

| | |
|---|---|
| **Ngày** | 22/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Không áp dụng |
| **Nhiệm vụ** | Chuyển thay đổi từ `main` sang branch cá nhân |
| **Mục đích** | Đưa phần việc cá nhân lên `docs/DE190058-add-personal-folder` mà không làm mất file mới |
| **Kết quả** | Phân loại file generated và source; dùng `git stash push -u` để giữ cả tracked và untracked files |
| **Cách xác minh** | `git stash list` hiển thị stash hợp lệ; switch branch thành công |
| **Đánh giá** | ✅ Tốt — bảo toàn đầy đủ WIP |

---

### AL-014

| | |
|---|---|
| **Ngày** | 22/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Không áp dụng |
| **Nhiệm vụ** | Xử lý conflict lớn sau `git stash pop` |
| **Mục đích** | Tránh giải quyết thủ công hàng trăm conflict không liên quan |
| **Kết quả** | Giữ stash, tạo branch backup, reset trạng thái conflict và dọn working tree có kiểm soát |
| **Cách xác minh** | Backup branch tồn tại; working tree trở về trạng thái clean |
| **Đánh giá** | ✅ Tốt — có phương án rollback và giảm rủi ro mất code |

---

### AL-015

| | |
|---|---|
| **Ngày** | 22/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Không áp dụng |
| **Nhiệm vụ** | Đồng bộ baseline branch cá nhân với `origin/main` |
| **Mục đích** | Áp dụng WIP lên đúng phiên bản source mới nhất |
| **Kết quả** | Reset local personal branch về commit `74248a7a` của `origin/main`, sau đó dùng `git stash apply` |
| **Cách xác minh** | Các file mục tiêu được khôi phục mà không còn merge conflict |
| **Đánh giá** | ✅ Tốt — khôi phục thay đổi trên baseline sạch |

---

### AL-016

| | |
|---|---|
| **Ngày** | 22/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Không áp dụng |
| **Nhiệm vụ** | Dọn diff và generated artifacts trước commit |
| **Mục đích** | Không đưa `backend/dist`, Playwright report, test result và file rác vào commit |
| **Kết quả** | Dùng `git restore backend/dist`, xóa `playwright-report`, `test-results` và kiểm tra bằng `git diff --check` |
| **Cách xác minh** | `git diff --check` không còn lỗi whitespace |
| **Đánh giá** | ✅ Tốt — commit scope rõ ràng và sạch hơn |

---

### AL-017

| | |
|---|---|
| **Ngày** | 22/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT |
| **Commit** | Đề xuất: `fix(testing): harden error handling and optimize favorites integrity` |
| **Nhiệm vụ** | Tổng hợp kết quả audit, test và chuẩn bị commit |
| **Mục đích** | Đảm bảo chỉ commit các file source, config, test và documentation có liên quan |
| **Kết quả** | Backend build pass, frontend build pass, 228 backend tests pass, 31 frontend tests pass, 4 E2E tests pass |
| **Cách xác minh** | `npm run test:all`, `npm run test:e2e`, `git diff --check`, `git status` |
| **Đánh giá** | ✅ Tốt — có đầy đủ bằng chứng kỹ thuật; bước push cuối cần xác minh trực tiếp trên GitHub |

---

## Tổng hợp kết quả kỹ thuật

| Hạng mục | Kết quả |
|---|---|
| Backend TypeScript build | ✅ PASS |
| Frontend Vite build | ✅ PASS |
| Backend Jest suites | ✅ 153 / 153 |
| Backend Jest tests | ✅ 228 / 228 |
| Frontend Vitest files | ✅ 7 / 7 |
| Frontend Vitest tests | ✅ 31 / 31 |
| Playwright E2E tests | ✅ 4 / 4 |
| `git diff --check` | ✅ Không còn lỗi |
| Push branch cá nhân | ⚠️ Cần xác minh kết quả cuối trên GitHub |

---

## Thống kê sử dụng công cụ AI

| Công cụ | Số log | Mức độ sử dụng được |
|---|---:|---|
| Claude Sonnet | 4 | Cao — hỗ trợ design, security audit và transaction pattern |
| GitHub Copilot | 1 | Cao — hỗ trợ tạo Unit Test boilerplate |
| ChatGPT / Claude | 1 | Cao — hỗ trợ Redis Quota và ObjectId validation |
| ChatGPT | 11 | Cao — hỗ trợ test, E2E, Git recovery, audit và documentation |

---

## Nguyên tắc sử dụng AI trong dự án

- Không áp dụng output AI nếu chưa review source code.
- Mọi thay đổi quan trọng phải được xác minh bằng build hoặc automated test.
- Không xem log chứa từ `error` là test fail nếu summary cuối vẫn pass.
- Không dùng `git push --force` khi có thể dùng `--force-with-lease`.
- Luôn tạo backup trước các lệnh có tính destructive như `reset --hard`.
- Không khẳng định commit hoặc push thành công nếu chưa có bằng chứng từ Git hoặc GitHub.
