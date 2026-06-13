# Chuyên Đề 06: Hướng Dẫn Vòng Đời Use Case & Kiến Trúc Kiểm Thử Tự Động từ A-Z

Tài liệu này được biên soạn nhằm giải thích cặn kẽ cách dự án **HảiSản.vn** vận hành "dưới mui xe" (Under the Hood). Cho dù bạn là người mới bắt đầu học lập trình hay lập trình viên có kinh nghiệm, hướng dẫn này sẽ chỉ rõ từng bước yêu cầu từ trình duyệt của người dùng (User Request) chảy qua những tệp tin nào, lớp code nào xử lý, lưu xuống cơ sở dữ liệu ra sao, và cơ chế kiểm thử tự động của hệ thống hoạt động như thế nào.

---

## 1. Bản Đồ Tổng Quan: Hành Trình Hai Chiều Của Yêu Cầu & Phản Hồi (Request & Response Flow)

Khi người dùng thực hiện một thao tác trên giao diện (ví dụ: đăng nhập, đăng sản phẩm, bình luận), dữ liệu sẽ đi qua một hành trình phân lớp nghiêm ngặt từ Client tới Database (Request) và sau đó kết quả xử lý sẽ chảy ngược trở lại từ Database tới tận tay người dùng (Response). 

Dưới đây là sơ đồ hành trình hai chiều hoàn chỉnh:

```
                                 HÀNH TRÌNH HAI CHIỀU (BIDIRECTIONAL FLOW)
 
  CHIỀU GỬI YÊU CẦU (REQUEST PATH)                               CHIỀU TRẢ PHẢN HỒI (RESPONSE PATH)
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│     [Người dùng (UI Browser)]   │ ──(1. Nhấp chuột/Nhập liệu)─>│    [Người dùng (UI Browser)]    │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (18. Nhìn thấy thông báo/Toast)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│   [React Component (Client)]    │ ──(2. Gọi api("/endpoint"))─>│   [React Component (Client)]    │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (17. Cập nhật State giao diện)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│     [api.js (API Client)]       │ ──(3. Gửi HTTP Request JWT)─>│     [api.js (API Client)]       │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (16. Đọc Headers & Parse JSON)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│     [Backend Middlewares]       │ ──(4. Kiểm tra bảo mật)─────>│     [Backend Middlewares]       │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (15. Chuyển tiếp HTTP Response)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│ [Express Router (routes.ts)]    │ ──(5. Tìm đường dẫn xử lý)──>│ [Express Router (routes.ts)]    │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (14. Gửi HTTP Status + Body)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│ [Presentation Controller]       │ ──(6. Lấy dữ liệu gửi lên)──>│ [Presentation Controller]       │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (13. Chuyển kết quả sang JSON)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│ [Application UseCase (.ts)]     │ ──(7. Chạy logic nghiệp vụ)─>│ [Application UseCase (.ts)]     │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (12. Trả kết quả xử lý)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│ [Domain Entity / AggRoot]       │ ──(8. Check điều kiện/luật)─>│ [Domain Entity / AggRoot]       │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (11. Trả thực thể nghiệp vụ)
                 ▼                                                               │
┌─────────────────────────────────┐                             ┌─────────────────────────────────┐
│ [Infrastructure Repository]     │ ──(9. Chuyển đổi lưu vào DB)─>│ [Infrastructure Repository]     │
└─────────────────────────────────┘                             └─────────────────────────────────┘
                 │                                                               ▲ (10. Đọc dữ liệu từ Database)
                 ▼                                                               │
┌─────────────────────────────────┐                                              │
│    [Database MongoDB / Redis]   │ ─────────────────────────────────────────────┘
└─────────────────────────────────┘
```

#### Sơ đồ khối trực quan (Mermaid Flowchart):

```mermaid
graph TD
    User["Người dùng (UI Browser)"] --->|1. Thao tác UI| ReactComp["React Component (pages/ hoặc components/)"]
    ReactComp --->|2. Gọi API| ApiJs["api.js (Client API Wrapper)"]
    ApiJs --->|3. Gửi HTTP Request| Middleware["Security Middlewares (Cors, Auth, Csrf)"]
    Middleware --->|4. Kiểm tra bảo mật| Router["Express Router (routes/*.routes.ts)"]
    Router --->|5. Tìm đường dẫn xử lý| Controller["Presentation Controller (*Controller.ts)"]
    Controller --->|6. Lấy dữ liệu gửi lên| UseCase["Application UseCase (*UseCase.ts)"]
    UseCase --->|7. Chạy logic nghiệp vụ| Domain["Domain Entity / Aggregate Root"]
    UseCase --->|8. Đọc/Ghi dữ liệu qua Repository| Repo["Infrastructure Repository (*Repository.ts)"]
    Repo --->|9. Chuyển đổi dữ liệu lưu vào Database| Database[("Database MongoDB / Redis Cache")]

    Database ===>|10. Đọc dữ liệu từ Database| Repo
    Repo ===>|11. Trả thực thể nghiệp vụ| UseCase
    UseCase ===>|12. Trả kết quả xử lý| Controller
    Controller ===>|13. Chuyển kết quả sang JSON| Router
    Router ===>|14. Chuyển tiếp HTTP Response| Middleware
    Middleware ===>|15. Trả qua HTTP Channel| ApiJs
    ApiJs ===>|16. Parse JSON / Trả Promise| ReactComp
    ReactComp ===>|17. Cập nhật State / Rerender| User

    linkStyle 0 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 1 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 2 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 3 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 4 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 5 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 6 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 7 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 8 stroke:#28a745,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 9 stroke:#dc3545,stroke-width:2px;
    linkStyle 10 stroke:#dc3545,stroke-width:2px;
    linkStyle 11 stroke:#dc3545,stroke-width:2px;
    linkStyle 12 stroke:#dc3545,stroke-width:2px;
    linkStyle 13 stroke:#dc3545,stroke-width:2px;
    linkStyle 14 stroke:#dc3545,stroke-width:2px;
    linkStyle 15 stroke:#dc3545,stroke-width:2px;
    linkStyle 16 stroke:#dc3545,stroke-width:2px;
    
    classDef reqClass fill:#d4edda,stroke:#28a745,stroke-width:1px;
    classDef resClass fill:#f8d7da,stroke:#dc3545,stroke-width:1px;
```
*(Ghi chú: Đường đứt nét màu xanh lá cây đại diện cho chiều Request gửi đi, đường nét liền màu đỏ dày đại diện cho chiều Response trả kết quả ngược lại).*

---

## 2. Bản Đồ Danh Sách Toàn Bộ 20 Use Cases Nghiệp Vụ Trong Dự Án

Để giúp bạn có cái nhìn từ A-Z về mọi ngóc ngách của dự án HảiSản.vn, dưới đây là bảng danh mục toàn bộ **20 Use Cases** đang vận hành trong lõi nghiệp vụ backend, phân tách theo từng Bounded Context (Module):

### 2.1 Phân hệ Định danh & Phân quyền (IAM - 3 Use Cases)
| STT | Tên Use Case | Đường dẫn tệp tin | Mô tả chức năng nghiệp vụ | DB Collections tác động |
| --- | --- | --- | --- | --- |
| 1 | **GoogleAuthUseCase** | [GoogleAuthUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/application/use-cases/GoogleAuthUseCase.ts) | Xác thực mã token Google OAuth 2.0 hoặc giả lập môi trường Local Dev để đăng nhập nhanh. | `users` |
| 2 | **UpdateProfileUseCase** | [UpdateProfileUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/application/use-cases/UpdateProfileUseCase.ts) | Thay đổi thông tin cá nhân như họ tên, số điện thoại, avatar URL. | `users` |
| 3 | **DeleteAccountUseCase** | [DeleteAccountUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/application/use-cases/DeleteAccountUseCase.ts) | Xóa vĩnh viễn tài khoản người dùng và thực hiện dọn dẹp bắc cầu (Cascade delete) toàn bộ dữ liệu liên quan (sản phẩm, chat, like, ảnh trên Cloudinary) dưới dạng ACID Transaction. | Tất cả collections |

### 2.2 Phân hệ Tin đăng & Hải sản (Product - 4 Use Cases)
| STT | Tên Use Case | Đường dẫn tệp tin | Mô tả chức năng nghiệp vụ | DB Collections tác động |
| --- | --- | --- | --- | --- |
| 4 | **CreateProductUseCase** | [CreateProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/CreateProductUseCase.ts) | Đăng mẻ hải sản mới bán, xác thực thông tin sản phẩm và GPS, kiểm tra giới hạn đăng bài theo ngày đối với tài khoản thường. | `products`, `users` |
| 5 | **UpdateProductUseCase** | [UpdateProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/UpdateProductUseCase.ts) | Cập nhật thông tin chi tiết mẻ sản phẩm đã đăng bán. | `products` |
| 6 | **DeleteProductUseCase** | [DeleteProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/DeleteProductUseCase.ts) | Xóa mẻ hải sản khỏi sàn, đồng thời xóa các dữ liệu liên kết (reviews, messages, notifications). | `products`, `reviews`, `messages`, `notifications` |
| 7 | **BumpProductUseCase** | [BumpProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/BumpProductUseCase.ts) | Đẩy tin bài đăng của mẻ hàng lên đầu trang, áp dụng cooldown 24h nghiêm ngặt để chống spam tin bài. | `products` |

### 2.3 Phân hệ Diễn đàn & Bài viết Cộng đồng (Post - 5 Use Cases)
| STT | Tên Use Case | Đường dẫn tệp tin | Mô tả chức năng nghiệp vụ | DB Collections tác động |
| --- | --- | --- | --- | --- |
| 8 | **CreatePostUseCase** | [CreatePostUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/CreatePostUseCase.ts) | Tạo bài đăng mới chia sẻ kinh nghiệm đi biển hoặc đời sống ngư nghiệp của ngư dân. | `posts` |
| 9 | **DeletePostUseCase** | [DeletePostUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/DeletePostUseCase.ts) | Xóa vĩnh viễn bài đăng của người dùng và toàn bộ bình luận liên kết. | `posts` |
| 10 | **ToggleLikePostUseCase** | [ToggleLikePostUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/ToggleLikePostUseCase.ts) | Thích hoặc bỏ thích một bài đăng của ngư dân trên diễn đàn. | `posts` |
| 11 | **AddCommentUseCase** | [AddCommentUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/AddCommentUseCase.ts) | Thêm bình luận dưới bài viết cộng đồng. | `posts` |
| 12 | **DeleteCommentUseCase** | [DeleteCommentUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/DeleteCommentUseCase.ts) | Gỡ bỏ bình luận của chính mình dưới bài viết. | `posts` |

### 2.4 Phân hệ Cẩm nang Công thức ẩm thực (Recipe - 5 Use Cases)
| STT | Tên Use Case | Đường dẫn tệp tin | Mô tả chức năng nghiệp vụ | DB Collections tác động |
| --- | --- | --- | --- | --- |
| 13 | **CreateRecipeUseCase** | [CreateRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/CreateRecipeUseCase.ts) | Đăng công thức nấu nướng hải sản mới với danh sách nguyên liệu, hình ảnh và các bước thực hiện. | `recipes` |
| 14 | **UpdateRecipeUseCase** | [UpdateRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/UpdateRecipeUseCase.ts) | Điều chỉnh các nguyên liệu, hình ảnh hoặc các bước hướng dẫn của công thức đã đăng. | `recipes` |
| 15 | **DeleteRecipeUseCase** | [DeleteRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/DeleteRecipeUseCase.ts) | Xóa vĩnh viễn công thức nấu ăn khỏi hệ thống. | `recipes` |
| 16 | **ToggleLikeRecipeUseCase** | [ToggleLikeRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/ToggleLikeRecipeUseCase.ts) | Người dùng thả tim yêu thích hoặc bỏ thích công thức món ăn. | `recipes` |
| 17 | **IncrementRecipeViewsUseCase** | [IncrementRecipeViewsUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/IncrementRecipeViewsUseCase.ts) | Tăng chỉ số lượt xem (views) của bài viết công thức khi người dùng mở xem chi tiết. | `recipes` |

### 2.5 Phân hệ Nhật ký Cabin thuyền trưởng (Boat Log - 3 Use Cases)
| STT | Tên Use Case | Đường dẫn tệp tin | Mô tả chức năng nghiệp vụ | DB Collections tác động |
| --- | --- | --- | --- | --- |
| 18 | **CreateBoatLogUseCase** | [CreateBoatLogUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/application/use-cases/CreateBoatLogUseCase.ts) | Ngư dân viết nhật ký đánh cá ghi nhận tọa độ hành trình trên biển và hình ảnh hoạt động thực tế. | `boatlogs` |
| 19 | **DeleteBoatLogUseCase** | [DeleteBoatLogUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/application/use-cases/DeleteBoatLogUseCase.ts) | Xóa nhật ký đi biển đã đăng. | `boatlogs` |
| 20 | **ToggleLikeBoatLogUseCase** | [ToggleLikeBoatLogUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/application/use-cases/ToggleLikeBoatLogUseCase.ts) | Người theo dõi nhấn thích hoặc bỏ thích nhật ký đi biển của thuyền trưởng. | `boatlogs` |

---

### 2.6 Khái Quát Hóa: 4 Mẫu Kiến Trúc Vòng Đời Cho 20 Use Cases

Mặc dù hệ thống có tới 20 Use Cases khác nhau, tuy nhiên tất cả đều được thiết kế tuân theo **4 khuôn mẫu kiến trúc vòng đời (Flow Patterns)** chuẩn mực dưới đây. Điều này đảm bảo tính nhất quán (Consistency), dễ bảo trì và dễ hiểu cho toàn bộ hệ thống từ A-Z:

```mermaid
graph TD
    subgraph A ["Mẫu A: Command Use Case (Ghi/Xóa dữ liệu - 14 Use Cases)"]
        UI_A["Client UI (React Component)"] -->|1. Request POST/PUT/DELETE| Route_A["Express Route (Zod Validation)"]
        Route_A -->|2. Dispatch| Ctrl_A["Controller (Bóc tách request)"]
        Ctrl_A -->|3. Invoke| UC_A["Use Case (Chạy logic nghiệp vụ)"]
        UC_A -->|4. Invariant Check| Domain_A["Domain Entity (Kiểm tra điều kiện)"]
        UC_A -->|5. Save| Repo_A["Mongoose Repo (Ghi Database)"]
        UC_A -->|6. Evict| Cache_A["Redis Cache (Xóa/Incr Version)"]
        Cache_A -->|7. Gửi Response| UI_A
    end
```

```mermaid
graph TD
    subgraph B ["Mẫu B: Query Use Case (Truy vấn/Đọc dữ liệu)"]
        UI_B["Client UI (React Component)"] -->|1. Request GET| Route_B["Express Route (Query params)"]
        Route_B -->|2. Dispatch| Ctrl_B["Controller (Bóc tách params)"]
        Ctrl_B -->|3. Invoke| Service_B["Service / Read Model"]
        Service_B -->|4. Check Cache| Redis_B{"Redis Cache"}
        Redis_B -->|5. Cache Hit| Ctrl_B
        Redis_B -->|6. Cache Miss| Repo_B["Mongoose Repo (Chỉ mục GPS/Text)"]
        Repo_B -->|7. Query DB| DB_B[(MongoDB)]
        DB_B -->|8. Save Cache| Redis_B
        Repo_B -->|9. Trả về dữ liệu| Service_B
        Service_B -->|10. Response JSON| UI_B
    end
```

```mermaid
graph TD
    subgraph C ["Mẫu C: WebSocket Signaling (Giao tiếp thời gian thực)"]
        UI_C["Client Socket (socket.js)"] -->|1. Emit Event| WS_C["Socket.IO Server (socket.ts)"]
        WS_C -->|2. Verify Token| JWT_C["JWT Middleware"]
        WS_C -->|3. Broadcast / Emit| Partner_C["Partner Socket (Client)"]
        Partner_C -->|4. Update UI| Client_C["UI View (React Component)"]
    end
```

```mermaid
graph TD
    subgraph D ["Mẫu D: Third-Party Integration (Tích hợp cổng Webhook)"]
        Gateway_D["Sepay Gateway (External)"] -->|1. POST Webhook| Route_D["Express Route"]
        Route_D -->|2. Timing Check| Ctrl_D["Payment Controller (safeCompare)"]
        Ctrl_D -->|3. Update DB| DB_D[(MongoDB: users)]
        Ctrl_D -->|4. Evict Sessions| Redis_D["Redis (Delete keys)"]
        Ctrl_D -->|5. Confirm HTTP 200| Gateway_D
    end
```

#### Phân loại chi tiết 20 Use Cases theo 4 khuôn mẫu:

1. **Mẫu A (Ghi/Xóa dữ liệu - 14 Use Cases)**:
   * **IAM**: [UpdateProfileUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/application/use-cases/UpdateProfileUseCase.ts), [DeleteAccountUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/application/use-cases/DeleteAccountUseCase.ts).
   * **Product**: [CreateProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/CreateProductUseCase.ts), [UpdateProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/UpdateProductUseCase.ts), [DeleteProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/DeleteProductUseCase.ts), [BumpProductUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/BumpProductUseCase.ts).
   * **Post**: [CreatePostUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/CreatePostUseCase.ts), [DeletePostUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/DeletePostUseCase.ts), [ToggleLikePostUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/ToggleLikePostUseCase.ts), [AddCommentUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/AddCommentUseCase.ts), [DeleteCommentUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/application/use-cases/DeleteCommentUseCase.ts).
   * **Recipe**: [CreateRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/CreateRecipeUseCase.ts), [UpdateRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/UpdateRecipeUseCase.ts), [DeleteRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/DeleteRecipeUseCase.ts), [ToggleLikeRecipeUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/ToggleLikeRecipeUseCase.ts), [IncrementRecipeViewsUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/application/use-cases/IncrementRecipeViewsUseCase.ts).
   * **Boat Log**: [CreateBoatLogUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/application/use-cases/CreateBoatLogUseCase.ts), [DeleteBoatLogUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/application/use-cases/DeleteBoatLogUseCase.ts), [ToggleLikeBoatLogUseCase.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/application/use-cases/ToggleLikeBoatLogUseCase.ts).
2. **Mẫu B (Đọc/Lọc dữ liệu)**:
   * Tất cả các luồng danh sách như lọc GPS (`list`), xem chi tiết sản phẩm, xem công thức nấu ăn, lấy danh sách bài đăng.
3. **Mẫu C (Realtime Signaling)**:
   * **WebRTC**: Luồng bắt tay cuộc gọi video trực tuyến (SDP Offer/Answer, ICE Candidates).
   * **Chat**: Gửi/nhận tin nhắn, thu hồi tin nhắn, chỉnh sửa tin nhắn thời gian thực.
4. **Mẫu D (Cổng thanh toán & Webhook)**:
   * **Payment**: Sepay Webhook tự động nâng cấp Premium qua VietQR.

---

## 3. Vòng Đời Use Case 1: Đăng Nhập Google & Giả Lập Dev (Google/Mock Auth)

### 📌 Mục đích:
Hệ thống cho phép người dùng đăng nhập an toàn bằng tài khoản Google thật thông qua OAuth 2.0 hoặc tài khoản giả lập trên máy cá nhân để tăng tốc độ phát triển dự án (Local Dev Quick Login).

### 📊 Sơ đồ tuần tự Vòng đời hoàn chỉnh (Request & Response Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant AuthPage as AuthPage.jsx (Client UI)
    participant ApiJs as api.js (API Client Wrapper)
    participant Router as auth.routes.ts (Express Router)
    participant AuthCtrl as AuthController.ts (Controller)
    participant AuthUC as GoogleAuthUseCase.ts (Use Case)
    participant GoogleAPI as Google API (Token verification)
    participant UserRepo as MongooseUserRepository.ts (Repository)
    participant UserMapper as UserMapper.ts (Data Mapper)
    participant UserDomain as User.ts (Domain Entity)
    participant DB as MongoDB (Collection: users)
    participant Redis as Redis Cache (auth:refresh:*)

    User->>AuthPage: Nhấp chọn tài khoản (Ví dụ: binh@haisan.vn)
    AuthPage->>ApiJs: Gọi api("/auth/google", { method: "POST", body: { idToken } })
    ApiJs->>ApiJs: Đọc cookie "csrfToken" gán vào header "x-csrf-token"
    ApiJs->>Router: Gửi HTTP Request (POST /api/auth/google) kèm credentials: "include"
    Router->>AuthCtrl: Điều phối điều khiển tới hàm googleAuth(req, res, next)
    AuthCtrl->>AuthUC: googleAuthUseCase.execute(idToken)
    
    alt Trường hợp Token thật (Production)
        AuthUC->>GoogleAPI: HTTP GET oauth2.googleapis.com/tokeninfo?id_token=...
        GoogleAPI-->>AuthUC: Trả về payload (email, name, picture, email_verified)
    else Trường hợp Token giả lập (Local Dev Mode)
        Note over AuthUC: Tự động phân tích chuỗi idToken để lấy thông tin giả lập (email, name)
    end

    AuthUC->>UserRepo: findByEmail(email)
    UserRepo->>DB: Query: findOne({ email })
    DB-->>UserRepo: Trả về tài liệu MongooseDoc (hoặc null)
    
    alt Nếu Người dùng chưa tồn tại (Đăng ký mới)
        UserRepo->>UserMapper: Ánh xạ dữ liệu mới
        UserMapper->>UserDomain: new User(props) (Khởi tạo Domain Entity)
        UserDomain-->>UserRepo: Thực thể domain User
        UserRepo->>DB: save() -> User.create()
        DB-->>UserRepo: Acknowledge (Xác nhận đã tạo bản ghi)
    else Nếu Người dùng đã tồn tại (Đăng nhập)
        UserRepo->>UserMapper: toDomain(mongooseDoc)
        UserMapper->>UserDomain: Khởi tạo thực thể domain User từ database
        UserDomain-->>UserRepo: Thực thể domain User
        AuthUC->>UserDomain: user.checkActive() (Kiểm tra xem tài khoản có bị Admin khóa không)
    end
    
    AuthUC-->>AuthCtrl: Trả về kết quả xác thực { userId, role, email, avatarUrl, isPremium }
    
    AuthCtrl->>AuthCtrl: signToken(userId, role) -> Sinh Access Token (JWT, hạn 15 phút)
    AuthCtrl->>AuthCtrl: Sinh Refresh Token ngẫu nhiên (40 ký tự)
    AuthCtrl->>Redis: set(`auth:refresh:${userId}:${refreshToken}`, "1", "EX", 7 ngày)
    AuthCtrl->>AuthCtrl: rotateCsrfToken(res) (Xoay vòng CSRF Token mới)
    
    AuthCtrl-->>ApiJs: Gửi HTTP Response 200/201 OK kèm cookies: token (Access Token), refreshToken, csrfToken
    ApiJs-->>AuthPage: Trả về kết quả JSON chứa thông tin user
    AuthPage->>AuthPage: Gọi setUser(data.user) để cập nhật React Context
    AuthPage->>User: Điều hướng về Trang chủ / Dashboard. Hiển thị thông báo đăng nhập thành công!
```

---

## 4. Vòng Đời Use Case 2: Đẩy Tin Bài Đăng Bán (Bump Product)

### 📌 Mục đích:
Hệ thống cho phép ngư dân đẩy bài viết bán sản phẩm của mình lên đầu bảng tin để tiếp cận khách hàng tốt hơn, tuy nhiên có cơ chế cooldown nghiêm ngặt **24 tiếng** để chống spam bài đăng.

### 📊 Sơ đồ tuần tự Vòng đời hoàn chỉnh (Request & Response Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Ngư dân (Seller)
    participant DashPage as DashboardPage.jsx (Client UI)
    participant ApiJs as api.js (API Client Wrapper)
    participant AuthMW as auth.ts (Authentication Middleware)
    participant CsrfMW as csrf.ts (CSRF Middleware)
    participant Router as product.routes.ts (Express Router)
    participant ProdCtrl as ProductController.ts (Controller)
    participant BumpUC as BumpProductUseCase.ts (Use Case)
    participant ProdRepo as MongooseProductRepository.ts (Repository)
    participant ProdMapper as ProductMapper.ts (Data Mapper)
    participant ProdDomain as Product.ts (Domain Entity)
    participant DB as MongoDB (Collection: products)
    participant Redis as Redis Cache (product:list:version:Fresh)

    Seller->>DashPage: Nhấn nút "Đẩy bài" (Bump) của mẻ hàng cụ thể
    DashPage->>ApiJs: Gọi api(`/products/${productId}/bump`, { method: "POST" })
    ApiJs->>ApiJs: Đọc cookie "csrfToken" gán vào header "x-csrf-token"
    ApiJs->>AuthMW: Gửi HTTP POST request kèm cookie xác thực "token"
    
    alt Kiểm tra xác thực (Auth Middleware)
        AuthMW->>AuthMW: Giải mã token JWT bằng JWT_SECRET
        Note over AuthMW: Gán req.user = { userId, role }
    else Token hết hạn hoặc không hợp lệ
        AuthMW-->>ApiJs: Trả về HTTP 401 Unauthorized
        ApiJs-->>DashPage: Kích hoạt luồng làm mới token (Silent Refresh) hoặc bắt đăng nhập lại
    end

    AuthMW->>CsrfMW: Chuyển tiếp request đã xác thực
    
    alt Kiểm tra CSRF (CSRF Middleware)
        CsrfMW->>CsrfMW: So khớp header "x-csrf-token" với cookie "csrfToken" bằng safeCompare
    else Token CSRF không khớp
        CsrfMW-->>ApiJs: Trả về HTTP 403 Forbidden ("CSRF token không hợp lệ")
    end

    CsrfMW->>Router: Tiếp tục chuyển tiếp request an toàn
    Router->>ProdCtrl: Điều phối tới hàm bumpProduct(req, res, next)
    ProdCtrl->>BumpUC: bumpProductUseCase.execute(productId, userId)
    
    BumpUC->>ProdRepo: findById(productId)
    ProdRepo->>DB: Query: findById(productId)
    DB-->>ProdRepo: Trả về tài liệu MongooseDoc
    ProdRepo->>ProdMapper: toDomain(mongooseDoc)
    ProdMapper->>ProdDomain: Khởi tạo thực thể domain Product
    ProdDomain-->>BumpUC: Đối tượng thực thể domain Product

    BumpUC->>ProdDomain: product.bump(userId)
    
    alt Logic kiểm tra cooldown (Domain Entity)
        Note over ProdDomain: Lấy ra mốc bumpedAt cuối của sản phẩm
        Note over ProdDomain: So sánh: now.getTime() - bumpedAt.getTime() < 24 giờ?
    else Vi phạm cooldown
        ProdDomain-->>BumpUC: Ném lỗi ConflictError ("Sản phẩm này đã được đẩy lên gần đây...")
        BumpUC-->>ProdCtrl: Chuyển tiếp lỗi
        ProdCtrl-->>ApiJs: Trả về HTTP 429 / 409 Error
    end

    BumpUC->>ProdRepo: save(product) (Yêu cầu lưu thay đổi)
    ProdRepo->>ProdRepo: Dùng updateOne cập nhật trường bumpedAt = now
    ProdRepo->>DB: Gửi truy vấn nguyên tử findOneAndUpdate với điều kiện lte cutoffTime
    DB-->>ProdRepo: Xác nhận cập nhật thành công (Acknowledge)

    BumpUC->>Redis: incr("product:list:version:Fresh") (Tăng phiên bản danh sách để xóa cache)
    Redis-->>BumpUC: Acknowledge
    
    BumpUC-->>ProdCtrl: Hoàn tất xử lý đẩy tin
    ProdCtrl-->>ApiJs: Trả về HTTP 200 OK { message: "Đã đẩy tin thành công!" }
    ApiJs-->>DashPage: Nhận phản hồi thành công
    DashPage->>Seller: Hiển thị thông báo Toast thành công và cập nhật lại giao diện!
```

---

## 5. Vòng Đời Use Case 3: Đăng Bán Mẻ Hải Sản Mới (Create Product)

### 📌 Mục đích:
Cho phép ngư dân đăng bán các mẻ hải sản mới (Tươi hoặc Khô). Nếu là hàng tươi (`Fresh`), hệ thống bắt buộc phải thu nhận định vị tọa độ GPS để người mua tìm thấy mẻ hàng gần nhất. Để tránh spam, người dùng thường bị giới hạn đăng tối đa 5 tin một ngày (Premium không giới hạn).

### 📊 Sơ đồ tuần tự Vòng đời hoàn chỉnh (Request & Response Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Ngư dân (Seller)
    participant PostPage as PostListingPage.jsx (Client UI)
    participant ApiJs as api.js (API Client Wrapper)
    participant Router as product.routes.ts (Express Router)
    participant ProdCtrl as ProductController.ts (Controller)
    participant CreateUC as CreateProductUseCase.ts (Use Case)
    participant Redis as Redis (Limit Counter & Version Cache)
    participant UserRepo as UserRepository (User DB check)
    participant ProdRepo as MongooseProductRepository (Repository)
    participant DB as MongoDB (Collection: products)

    Seller->>PostPage: Điền thông tin & Click "Đăng bán"
    PostPage->>ApiJs: Gọi api("/products", { method: "POST", body: productData })
    ApiJs->>Router: HTTP POST /api/products (kèm jwt cookie + csrf token)
    Router->>Router: Chạy validateSchema(productCreateSchema) để check định dạng dữ liệu
    Router->>ProdCtrl: Gọi hàm createProduct(req, res, next)
    ProdCtrl->>CreateUC: createProductUseCase.execute(userId, body)

    CreateUC->>UserRepo: findById(userId)
    UserRepo-->>CreateUC: Trả về user
    
    alt Nếu là tài khoản thường (không phải Premium)
        CreateUC->>Redis: incr(`product:limit:${userId}:${today}`) (Tăng lượt đếm trong ngày)
        Redis-->>CreateUC: Trả về số lượng đã đăng
        alt Nếu lượt đăng > 5
            CreateUC->>Redis: decr(...) (Trừ lại lượt)
            CreateUC-->>ProdCtrl: Ném lỗi ConflictError (Đăng quá giới hạn 5 bài/ngày)
            ProdCtrl-->>ApiJs: Trả về HTTP 403 Forbidden
        end
    end

    CreateUC->>CreateUC: Khởi tạo thực thể domain Product và validate()
    CreateUC->>ProdRepo: save(product)
    ProdRepo->>DB: insertOne(productData)
    DB-->>ProdRepo: Xác nhận lưu (Acknowledge)
    
    CreateUC->>Redis: incr(`product:list:version:${type}`) (Tăng phiên bản cache sản phẩm)
    Redis-->>CreateUC: Acknowledge

    CreateUC-->>ProdCtrl: Trả về { productId }
    ProdCtrl-->>ApiJs: Trả về HTTP 201 Created { message: "Đăng bài thành công", productId }
    ApiJs-->>PostPage: Trả về JSON thành công
    PostPage->>Seller: Chuyển hướng về trang Dashboard và báo đăng thành công!
```

---

## 6. Vòng Đời Use Case 4: Lọc & Tìm Kiếm Theo GPS và Từ Khóa (List Products)

### 📌 Mục đích:
Khách hàng mua hải sản có thể tìm thấy các mẻ hàng tươi xung quanh mình trong bán kính tối đa 20km sử dụng GPS, hoặc tìm kiếm hải sản theo tên/mô tả sử dụng Text Index. Ứng dụng tích hợp bộ đệm cache Redis thông minh giúp giảm tải truy vấn MongoDB và phản hồi dưới 100ms.

### 📊 Sơ đồ tuần tự Vòng đời hoàn chỉnh (Request & Response Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Khách mua (Buyer)
    participant Home as HomePage.jsx (Client UI)
    participant ApiJs as api.js (API Client Wrapper)
    participant Router as product.routes.ts (Express Router)
    participant ProdCtrl as ProductController.ts (Controller)
    participant ProdSrv as product.service.ts (Service)
    participant Redis as Redis Cache (Bộ đệm)
    participant ProdRepo as MongooseProductRepository (Repository)
    participant DB as MongoDB (Collection: products)

    Buyer->>Home: Mở trang chủ (Trình duyệt xin quyền GPS)
    Home->>ApiJs: Gọi api("/products?type=Fresh&lat=20.84&lng=106.68")
    ApiJs->>Router: HTTP GET /api/products?...
    Router->>ProdCtrl: Gọi hàm getProducts(req, res, next)
    ProdCtrl->>ProdSrv: productService.list(query)

    ProdSrv->>Redis: GET product:list:version:Fresh (Lấy phiên bản hiện tại)
    Redis-->>ProdSrv: Trả về version (Ví dụ: "4")
    ProdSrv->>ProdSrv: Hash chuỗi query lọc + số version thành cacheKey
    ProdSrv->>Redis: GET cacheKey
    
    alt Trường hợp có Cache (Cache Hit)
        Redis-->>ProdSrv: Trả về JSON danh sách mẻ hàng đã lưu
    else Trường hợp không có Cache (Cache Miss)
        ProdSrv->>ProdRepo: find(filter)
        Note over ProdRepo: Tạo filter location: { $geoWithin: { $centerSphere: [...] } }
        ProdRepo->>DB: Truy vấn dữ liệu sử dụng Chỉ mục 2dsphere
        DB-->>ProdRepo: Trả về các mẻ hàng trong bán kính 20km
        ProdRepo-->>ProdSrv: Trả về danh sách mẻ hàng
        ProdSrv->>Redis: SET cacheKey = listData (Lưu lại cache thời hạn 10 phút)
    end

    ProdSrv-->>ProdCtrl: Trả về danh sách sản phẩm và thông tin người bán
    ProdCtrl-->>ApiJs: Trả về HTTP 200 OK
    ApiJs-->>Home: Cập nhật danh sách mẻ hàng vào State
    Home->>Home: Vẽ các Marker sản phẩm và Lộ trình nét đứt (Polyline) trên Bản đồ Leaflet
    Home->>Buyer: Người dùng nhìn thấy các mẻ hàng gần nhất trực quan trên bản đồ!
```

---

## 7. Vòng Đời Use Case 5: Bắt Tay Báo Hiệu Cuộc Gọi Video (WebRTC Video Call Signaling)

### 📌 Mục đích:
Hỗ trợ cuộc gọi video trực tuyến thời gian thực giữa Người mua và Người bán để trực tiếp kiểm tra độ tươi sống của mẻ cá trên thuyền. WebRTC truyền dẫn media trực tiếp (Peer-to-Peer), nhưng cần server WebSocket (Socket.IO) làm trung gian trao đổi thông số cấu hình mạng ban đầu.

### 📊 Sơ đồ tuần tự Vòng đời hoàn chỉnh (Request & Response Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Người gọi (Buyer)
    participant BuyerWS as socket.js (Client Socket)
    participant WSServer as socket.ts (Socket.IO Server)
    participant SellerWS as socket.js (Client Socket)
    actor Seller as Người nhận (Seller)

    Buyer->>BuyerWS: Nhấp nút "Gọi Video cho Ngư dân"
    BuyerWS->>WSServer: Connection Handshake (Gửi kèm Cookie JWT xác thực)
    WSServer->>WSServer: Verify token & gán socket.user = { userId }
    
    Buyer->>BuyerWS: Khởi tạo RTCPeerConnection & tạo SDP Offer
    BuyerWS->>WSServer: emit("call_user", { to: SellerId, offer })
    WSServer->>SellerWS: emit("incoming_call", { from: BuyerId, offer })
    
    SellerWS->>Seller: Hiển thị cuộc gọi đến (Rung chuông, nút Nhận/Từ chối)
    Seller->>SellerWS: Nhấn "Đồng ý nhận cuộc gọi"
    SellerWS->>SellerWS: Khởi tạo local stream & tạo SDP Answer
    SellerWS->>WSServer: emit("answer_call", { to: BuyerId, answer })
    WSServer->>BuyerWS: emit("call_accepted", { answer })

    par Quá trình kết nối luồng mạng ICE Candidates
        BuyerWS->>WSServer: emit("ice_candidate", { to: SellerId, candidate })
        WSServer->>SellerWS: emit("ice_candidate", { candidate })
    and
        SellerWS->>WSServer: emit("ice_candidate", { to: BuyerId, candidate })
        WSServer->>BuyerWS: emit("ice_candidate", { candidate })
    end

    Note over Buyer,Seller: Hai trình duyệt kết nối trực tiếp Peer-to-Peer thành công (Băng thông riêng)!
```

---

## 8. Vòng Đời Use Case 6: Nâng Cấp Premium Tự Động Qua Sepay Webhook

### 📌 Mục đích:
Khi ngư dân muốn đăng tin bán không giới hạn và nhận huy hiệu vương miện Premium uy tín, họ sẽ quét mã VietQR chuyển khoản nâng cấp tài khoản. Hệ thống nhận webhook thanh toán từ đối tác Sepay, xác thực chữ ký bảo mật và tự động nâng cấp thời gian thực.

### 📊 Sơ đồ tuần tự Vòng đời hoàn chỉnh (Request & Response Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Ngư dân
    participant Bank as App Ngân Hàng
    participant Sepay as Sepay Gateway
    participant Router as payment.routes.ts (Router)
    participant PayCtrl as payment.controller.ts (Controller)
    participant Redis as Redis Session
    participant DB as MongoDB (Collection: users)

    Seller->>Bank: Quét mã QR chuyển khoản nội dung: "SF <UserID>"
    Bank->>Sepay: Giao dịch liên ngân hàng thành công qua Napas
    Sepay->>Router: HTTP POST /api/payment/webhook (Gửi payload giao dịch)
    
    Note over Router: Xác thực Header Authorization: ApiKey <webhook_key>
    alt Chữ ký Authorization không trùng khớp
        Router-->>Sepay: Phản hồi HTTP 401 Unauthorized (Từ chối xử lý)
    end

    Router->>PayCtrl: Gọi hàm sepayWebhook(req, res)
    PayCtrl->>PayCtrl: safeCompare(token, process.env.SEPAY_WEBHOOK_KEY) (Chống Timing Attack)
    
    alt Verify Key thành công
        PayCtrl->>PayCtrl: Phân tích cú pháp lấy UserID từ nội dung chuyển khoản (Memo)
        PayCtrl->>DB: User.updateOne({ _id: UserID }, { isPremium: true })
        DB-->>PayCtrl: Xác nhận cập nhật (Acknowledge)
        
        PayCtrl->>Redis: Quét và xóa tất cả Refresh Token của User này (auth:refresh:UserID:*)
        Note over Redis: Buộc thiết bị của ngư dân phải logout chéo để đăng nhập lại nhận Token Premium mới
        Redis-->>PayCtrl: Hoàn tất xóa session
        
        PayCtrl-->>Sepay: Trả về HTTP 200 OK (Xác nhận xử lý thành công)
        Note over Seller: Thiết bị của ngư dân tự động reload, cập nhật giao diện thành Premium vương miện 👑!
    end
```

---

## 9. Vòng Đời Use Case 7: Xóa Tài Khoản GDPR Cascade (Quyền Được Quên)

### 📌 Mục đích:
Tuân thủ luật bảo vệ quyền riêng tư người dùng nghiêm ngặt (GDPR). Khi người dùng yêu cầu xóa tài khoản, hệ thống sẽ thực hiện xóa bắc cầu (Cascade Delete) toàn bộ các dữ liệu liên quan (tin nhắn, bài đăng, công thức nấu ăn, nhật ký đi biển, file ảnh trên Cloudinary) dưới dạng một MongoDB Transaction an toàn để đảm bảo không để lại dữ liệu mồ côi.

### 📊 Sơ đồ tuần tự Vòng đời hoàn chỉnh (Request & Response Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant ProfilePage as ProfilePage.jsx (Client UI)
    participant ApiJs as api.js (API Client Wrapper)
    participant Router as auth.routes.ts (Express Router)
    participant AuthCtrl as AuthController.ts (Controller)
    participant DeleteUC as DeleteAccountUseCase.ts (Use Case)
    participant DB as MongoDB Transaction
    participant Cloudinary as Cloudinary CDN (Image storage)
    participant Redis as Redis Cache

    User->>ProfilePage: Nhấp nút "Xóa vĩnh viễn tài khoản của tôi"
    ProfilePage->>ApiJs: Gọi api("/auth/account", { method: "DELETE" })
    ApiJs->>Router: HTTP DELETE /api/auth/account (kèm jwt cookie + csrf token)
    Router->>AuthCtrl: Gọi hàm deleteAccount(req, res, next)
    AuthCtrl->>DeleteUC: deleteAccountUseCase.execute(userId)

    DeleteUC->>DB: mongoose.startSession() -> Bắt đầu ACID Transaction
    
    DeleteUC->>Redis: Quét và xóa toàn bộ Refresh Token của User
    
    DeleteUC->>DB: Query các sản phẩm đăng bán của User để lấy URL ảnh
    DB-->>DeleteUC: Trả về danh sách ảnh sản phẩm
    Note over DeleteUC: Trích xuất các public ID của ảnh lưu trữ trên Cloudinary
    
    DeleteUC->>DB: Rút ID của User khỏi mảng following và favorites của tất cả mọi người
    DeleteUC->>DB: deleteMany(products) -> Xóa sản phẩm của User
    DeleteUC->>DB: deleteMany(messages) -> Xóa toàn bộ tin nhắn chat liên quan
    DeleteUC->>DB: deleteMany(posts, comments, recipes, boatLogs) -> Xóa dữ liệu cộng đồng
    DeleteUC->>DB: findByIdAndDelete(userId) -> Xóa thông tin cá nhân User
    
    DeleteUC->>DB: commitTransaction() -> Lưu tất cả thay đổi vĩnh viễn vào Database
    DB-->>DeleteUC: Transaction committed thành công
    
    DeleteUC->>Cloudinary: delete_resources(allPublicIds) -> Xóa vật lý ảnh sản phẩm trên cloud
    Cloudinary-->>DeleteUC: Xác nhận đã xóa file ảnh
    
    DeleteUC-->>AuthCtrl: Trả về kết quả thành công
    AuthCtrl->>AuthCtrl: res.clearCookie("token") & res.clearCookie("refreshToken")
    AuthCtrl-->>ApiJs: Trả về HTTP 200 OK
    ApiJs-->>ProfilePage: Trả về JSON thông báo xóa thành công
    ProfilePage->>User: Xóa sạch bộ nhớ cục bộ, chuyển hướng về Trang chủ và hiện thông báo tạm biệt!
```

---

## 10. Hệ Thống Kiểm Thử Tự Động (Jest Testing Guide)

Kiểm thử tự động giúp nhà phát triển tự tin thay đổi mã nguồn mà không sợ làm hỏng các tính năng cũ đang chạy tốt. Dự án sử dụng framework **Jest** kết hợp **ts-jest** để biên dịch TypeScript động khi kiểm thử.

### 10.1 Sơ Đồ Vòng Đời Hoạt Động Của Hệ Thống Kiểm Thử Tự Động (Jest Testing Lifecycle)

Để hiểu rõ làm thế nào một lệnh test `npm run test` có thể thực thi và kiểm thử mã nguồn độc lập mà không cần khởi chạy server thực tế hay ghi đè vào MongoDB/Redis thật, dưới đây là sơ đồ tuần tự biểu diễn vòng đời kiểm thử tự động trong dự án:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Nhà phát triển (Developer)
    participant Terminal as NPM Terminal CLI
    participant Jest as Jest Runner (Test Engine)
    participant Config as jest.config.js (Config Reader)
    participant TSJest as ts-jest (TS Compiler Adapter)
    participant Sandbox as Node.js Test Sandbox (Môi trường ảo)
    participant Mock as Jest Mock Register (Bộ giả lập)
    participant Target as Target Code File (Service/UseCase test)
    participant RepoMock as Mongoose Repository Mock
    participant Reporter as Jest CLI Reporter & Coverage

    Dev->>Terminal: Thực thi lệnh: npm run test / npm run test:cov
    Terminal->>Jest: Khởi tạo Jest Test Engine process
    Jest->>Config: Đọc tệp cấu hình jest.config.js
    Config-->>Jest: Trả về cấu hình (preset: "ts-jest", testEnvironment: "node", v.v.)
    
    Jest->>Jest: Quét hệ thống tìm các file khớp mẫu *.test.ts
    
    loop Đối với mỗi file test được phát hiện (ví dụ: admin.service.test.ts)
        Jest->>TSJest: Gửi mã nguồn TypeScript của file test và các file import liên quan
        TSJest->>TSJest: Biên dịch TypeScript sang JavaScript trong RAM (In-Memory Compilation)
        TSJest-->>Jest: Trả về mã nguồn JavaScript đã biên dịch
        
        Jest->>Sandbox: Khởi tạo một Node.js Sandbox biệt lập (tránh nhiễm chéo state giữa các file test)
        Sandbox->>Mock: Đăng ký các Mock definitions: jest.mock("../repositories/user.repository")
        Mock-->>Sandbox: Ghi đè và đóng băng module thật, thay bằng hàm rỗng jest.fn()
        
        Sandbox->>Target: Import thực thể cần test (ví dụ: AdminService)
        
        loop Đối với mỗi khối kiểm thử "it()" hoặc "test()" bên trong file test
            Note over Sandbox,RepoMock: Giai đoạn 1: SETUP (Dàn dựng bối cảnh)
            Sandbox->>RepoMock: Thiết lập giá trị trả về giả lập: mockResolvedValue(null) hoặc mockResolvedValue(userDoc)
            
            Note over Sandbox,Target: Giai đoạn 2: EXECUTE (Thực thi hàm cần test)
            Sandbox->>Target: Gọi phương thức cần kiểm thử (ví dụ: toggleUserActive(userId))
            Target->>RepoMock: Gọi hàm truy vấn (ví dụ: findRawById(userId))
            RepoMock-->>Target: Trả về ngay lập tức giá trị giả lập đã cấu hình ở Setup (không đụng tới MongoDB)
            Target-->>Sandbox: Trả về kết quả đầu ra (hoặc ném lỗi HttpError)
            
            Note over Sandbox,RepoMock: Giai đoạn 3: ASSERT (Khẳng định tính đúng đắn)
            Sandbox->>Sandbox: Kiểm tra kết quả trả về bằng expect(result).toBe(...)
            Sandbox->>RepoMock: Kiểm chứng cuộc gọi bằng expect(repo.updateActiveStatus).toHaveBeenCalledWith(...)
        end
        
        Sandbox-->>Jest: Trả về kết quả chạy test của file (Pass / Fail)
        Jest->>Sandbox: Hủy bỏ môi trường Sandbox để giải phóng bộ nhớ
    end
    
    Jest->>Reporter: Tổng hợp kết quả từ tất cả các test suites
    
    alt Nếu có cờ báo cáo độ bao phủ (:cov)
        Jest->>Reporter: Tính toán tỷ lệ dòng code được chạy qua (Statements, Branches, Functions, Lines)
        Reporter->>Terminal: Ghi file HTML báo cáo vào thư mục coverage/lcov-report/index.html
    end
    
    Reporter-->>Dev: Xuất thông tin tổng hợp lên màn hình terminal (Ví dụ: 22 suites passed, 68 tests passed)
```

---

### 10.2 Cấu hình kiểm thử Jest (`jest.config.js`)
* **Tệp tin**: [jest.config.js](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/jest.config.js)
* **Ý nghĩa cấu hình**:
  - `preset: "ts-jest"`: Hướng dẫn Jest tự động dịch code `.ts` sang `.js` trong bộ nhớ RAM khi chạy thử nghiệm.
  - `testEnvironment: "node"`: Chạy môi trường Node.js tách biệt, không cần khởi động trình duyệt.
  - `testMatch: ["**/*.test.ts"]`: Jest sẽ chỉ tìm và chạy các file có chứa từ `.test.ts`.

---

### 10.3 Bản chất của cơ chế Giả Lập (Mocking Dependencies)
> **❓ Câu hỏi**: Tại sao không kết nối trực tiếp vào MongoDB hay gửi email thật khi chạy test?
> 
> **💡 Trả lời**: Chạy thử nghiệm cần diễn ra cực kỳ nhanh (dưới 5 giây). Nếu kết nối vào cơ sở dữ liệu thật, dữ liệu rác sẽ làm bẩn database, đồng thời làm chậm tiến trình và phụ thuộc vào kết nối Internet. Do đó, chúng ta sử dụng cơ chế **Mocking** (tạo lập các vật thế thân giả lập) bằng cách khai báo ở đầu file test:
```typescript
jest.mock("../repositories/user.repository");
jest.mock("../config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn()
  }
}));
```
Đoạn code trên sẽ biến toàn bộ các hàm gọi database và Redis thành các hàm rỗng (`jest.fn()`). Chúng ta có thể chủ động cấu hình kết quả trả về giả định cho chúng để kiểm tra xem code của ta phản ứng như thế nào.

---

### 10.4 Phân Tích Code File Test Mẫu 1: `admin.service.test.ts`
* **Tệp tin**: [admin.service.test.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/services/admin.service.test.ts)
* **Logic kiểm thử khóa tài khoản của Admin**:

```typescript
it("Nên báo lỗi 404 nếu không tìm thấy thông tin tài khoản người dùng cần xử lý", async () => {
  // 1. Dàn dựng bối cảnh: Giả lập repository trả về null (không tìm thấy user)
  (userRepository.findRawById as jest.Mock).mockResolvedValue(null);

  // 2. Chạy & Kiểm tra kết quả: AdminService phải từ chối xử lý và ném lỗi 404
  await expect(adminService.toggleUserActive(mockUserId)).rejects.toThrow(
    expect.objectContaining({
      status: 404,
      message: "Không tìm thấy người dùng",
    })
  );
});
```

* **Phân tích luồng thành công**:
```typescript
it("Nên đảo trạng thái hoạt động của tài khoản thành công", async () => {
  // 1. Giả lập tìm thấy tài khoản đang hoạt động (isActive = true)
  (userRepository.findRawById as jest.Mock).mockResolvedValue({
    _id: mockUserId,
    isActive: true,
  });

  // 2. Giả lập lưu thành công trạng thái mới là đã khóa (isActive = false)
  (userRepository.updateActiveStatus as jest.Mock).mockResolvedValue({
    isActive: false,
  });

  // 3. Thực thi hàm
  const result = await adminService.toggleUserActive(mockUserId);

  // 4. Khẳng định (Assertions)
  expect(result).toBe(false); // Kết quả trả về phải là trạng thái mới (false - đã khóa)
  expect(userRepository.updateActiveStatus).toHaveBeenCalledWith(mockUserId, false); // Xác nhận repository đã được gọi đúng tham số
});
```

---

### 10.5 Phân Tích Code File Test Mẫu 2: `product.service.test.ts`
* **Tệp tin**: [product.service.test.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/services/product.service.test.ts)
* **Logic kiểm thử bộ lọc địa lý trắc địa GPS**:

```typescript
it("Nên áp dụng bộ lọc $geoWithin khi truy vấn sản phẩm loại Fresh với lat và lng hợp lệ", async () => {
  // 1. Thực thi hàm tìm kiếm sản phẩm tươi kèm tọa độ GPS
  await productService.list({
    type: "Fresh",
    lat: "20.8449",
    lng: "106.6881",
  });

  // 2. Khẳng định: Hệ thống phải gọi repository tìm kiếm chứa toán tử $geoWithin
  expect(productRepository.find).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "Fresh",
      location: expect.objectContaining({
        $geoWithin: expect.objectContaining({
          $centerSphere: expect.any(Array), // Vẽ bán kính vòng tròn mặt cầu trái đất
        }),
      }),
    }),
    expect.any(Object),
    expect.any(Object)
  );
});
```

---

### 10.6 Các lệnh vận hành kiểm thử

Để chạy kiểm thử và theo dõi kết quả, hãy di chuyển vào thư mục `backend/` và mở cửa sổ Terminal:

1. **Chạy toàn bộ các ca kiểm thử**:
   ```bash
   npm run test
   ```
2. **Chạy test và xuất báo cáo tỷ lệ bao phủ code (Coverage Report)**:
   ```bash
   npm run test:cov
   ```
   *Sau khi chạy xong, Jest sẽ sinh thư mục `backend/coverage/`. Hãy mở tệp tin [index.html](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/coverage/lcov-report/index.html) bằng trình duyệt web để xem chi tiết biểu đồ màu báo cáo xem dòng code nào đã được chạy qua và dòng nào chưa.*
