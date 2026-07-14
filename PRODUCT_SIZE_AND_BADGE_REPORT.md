# Báo cáo tích hợp trường Kích thước Hải sản & Nâng cấp Badge phân loại

Dự án: **HảiSản.vn**

---

## 1. Các file đã sửa đổi (Modified Files)

### Backend
1.  **[`backend/src/models/Product.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/models/Product.ts)**:
    *   Bổ sung thuộc tính tùy chọn `productSize?: "LARGE" | "MEDIUM" | "SMALL"` vào interface `IProduct`.
    *   Cấu hình mongoose schema hỗ trợ trường `productSize` với enum gồm các giá trị `["LARGE", "MEDIUM", "SMALL"]`.
2.  **[`backend/src/validations/product.validation.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/validations/product.validation.ts)**:
    *   Bổ sung quy tắc kiểm thực bằng Zod schema cho trường `productSize` trong danh sách các trường thuộc body của product.
3.  **[`backend/src/modules/product/domain/entities/Product.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/domain/entities/Product.ts)**:
    *   Cập nhật domain entity `Product` để lưu trữ và quản lý thuộc tính `productSize`.
    *   Bổ sung getter cho `productSize`.
    *   Cập nhật các phương thức `updateProfile` và `toProps` để ánh xạ trường `productSize`.
4.  **[`backend/src/modules/product/infrastructure/persistence/mongoose/mappers/ProductMapper.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/infrastructure/persistence/mongoose/mappers/ProductMapper.ts)**:
    *   Ánh xạ dữ liệu trường `productSize` từ Mongoose Document sang Domain Entity (`toDomain`) và ngược lại (`toPersistence`).
5.  **[`backend/src/modules/product/application/use-cases/CreateProductUseCase.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/CreateProductUseCase.ts)**:
    *   Nhận trường `productSize` từ dữ liệu gửi lên và đưa vào hàm khởi tạo thực thể `Product`.
6.  **[`backend/src/modules/product/application/use-cases/UpdateProductUseCase.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/application/use-cases/UpdateProductUseCase.ts)**:
    *   Nhận trường `productSize` từ dữ liệu cập nhật và truyền vào phương thức `updateProfile` của thực thể `Product`.

### Frontend (Client)
1.  **[`client/src/utils/labelMaps.js`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/utils/labelMaps.js)**:
    *   Tạo bản đồ nhãn kích thước `productSizeLabelMap` và hàm hỗ trợ hiển thị tiếng Việt `getProductSizeLabel(value)` (To / Trung bình / Nhỏ / Chưa cập nhật).
2.  **[`client/src/styles/marketplace-refactor.css`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/styles/marketplace-refactor.css)**:
    *   Bổ sung style cho các badge mới: `.seafood-type-badge` (nền cyan mờ, viền cyan nhẹ, font chữ in hoa đậm), `.freshness-badge`, `.seafood-size-badge` (màu vàng/amber đặc trưng).
    *   Hỗ trợ đầy đủ biến thể hiển thị sắc nét, tương phản tốt cho cả **Light Theme** (`.theme-light`).
    *   Bổ sung style cho `.segmented-control` và `.segmented-button` để tạo hộp tùy chọn kích thước dạng trượt ngang cao cấp và dễ tương tác.
3.  **[`client/src/components/seller/ProductForm.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/seller/ProductForm.jsx)**:
    *   Bổ sung trường nhập **Kích thước hải sản** bằng bộ nút bấm segmented button: `[ To ] [ Trung bình ] [ Nhỏ ]` giúp dễ thao tác trên thiết bị di động.
4.  **[`client/src/components/seller/SellerProducts.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/seller/SellerProducts.jsx)**:
    *   Mặc định chọn kích thước `"MEDIUM"` cho sản phẩm mới.
    *   Map thuộc tính `productSize` cũ khi bấm nút sửa (edit) và fallback `"MEDIUM"` nếu dữ liệu cũ chưa có.
    *   Bổ sung cột thông tin sản phẩm có kèm các tag phân loại và size hiển thị trực quan dưới dạng badge thu nhỏ ngay trong bảng quản lý của người bán.
5.  **[`client/src/components/ProductCard.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ProductCard.jsx)**:
    *   Nâng cấp phần đầu card sản phẩm từ text đơn giản thành cụm badge rực rỡ, cân đối: loại hải sản (Tôm/Cá/Cua/Mực...), độ tươi (Tươi sống/Đồ khô), và kích thước (To/Trung bình/Nhỏ) nếu có.
    *   Thêm dòng hiển thị **Kích thước** kèm icon `Ruler` vào danh sách thông tin chi tiết (`product-facts`) trên card.
6.  **[`client/src/pages/ProductDetail.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/ProductDetail.jsx)**:
    *   Hiển thị badge kích thước trên ảnh bìa sản phẩm chi tiết.
    *   Bổ sung trường dữ liệu **Kích thước** kèm icon `Ruler` vào danh sách các thông số cơ bản (`product-detail-facts`).
7.  **[`client/src/components/preview/ProductLivePreview.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/preview/ProductLivePreview.jsx)**:
    *   Hiển thị thông số kích thước hải sản đồng bộ trong cửa sổ xem trước trực tiếp khi người bán đang soạn thảo sản phẩm.
8.  **[`client/src/pages/seller/LandingBatchForm.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/seller/LandingBatchForm.jsx)**:
    *   Bổ sung lựa chọn kích thước bằng segmented button vào từng dòng hải sản khi người bán thêm sản phẩm hàng loạt qua form tạo/chỉnh sửa vựa cá.
    *   Ánh xạ trường dữ liệu `productSize` (mặc định là `"MEDIUM"`) khi tạo danh sách payload gửi lên server.

---

## 2. Cách xử lý dữ liệu cũ (Backward Compatibility)
*   **MongoDB Schema**: Trường `productSize` được định nghĩa là **tùy chọn (optional)** trên Mongoose model, cho phép dữ liệu cũ không có thuộc tính này vẫn tồn tại bình thường và không bị lỗi.
*   **Trình chuyển đổi dữ liệu (Mapper)**:
    *   If sản phẩm cũ không có thuộc tính `productSize`, khi lấy dữ liệu, API/Database Mapper sẽ giữ nguyên giá trị là `undefined` hoặc trả về `null`.
*   **Phía Giao diện (Frontend Fallback)**:
    *   Hàm hỗ trợ `getProductSizeLabel(product.productSize)` sẽ tự động fallback trả về `"Chưa cập nhật"` khi thuộc tính này thiếu hoặc trống.
    *   Trên ProductCard và các badge phụ trợ, nếu size chưa cập nhật, badge kích thước sẽ tự động được ẩn đi một cách thông minh để đảm bảo giao diện gọn gàng, trong khi thông tin chi tiết trong bảng thông số vẫn ghi rõ `"Kích thước: Chưa cập nhật"`.
    *   Khi người bán chỉnh sửa một sản phẩm cũ, form chỉnh sửa sẽ tự động chọn mặc định kích thước là `"Trung bình"` nhưng không làm ghi đè trực tiếp xuống database trừ khi người dùng chủ động nhấn nút **Lưu sản phẩm**.

---

## 3. Kết quả Build dự án (Compilation Status)

*   **Backend Build**: Thực hiện chạy biên dịch thành công 100% không gặp bất cứ lỗi TypeScript nào:
    ```bash
    > seafood-backend@1.0.0 build
    > tsc -p tsconfig.build.json
    ```
*   **Client (Frontend) Build**: Biên dịch thành công 100% bằng Vite, toàn bộ bundle CSS/JS mới đã được tạo chính xác:
    ```bash
    > haisan-frontend-react@1.0.0 build
    > vite build
    ✓ built in 402ms
    ```
