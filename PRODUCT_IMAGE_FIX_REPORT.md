# BÁO CÁO SỬA LỖI ẢNH SẢN PHẨM - HẢISẢN.VN (PRODUCT IMAGE FIX REPORT)

Hệ thống đã được rà soát và khắc phục triệt để các vấn đề liên quan đến việc xử lý, hiển thị và đồng bộ hóa ảnh sản phẩm giữa người bán và người mua.

## 1. Các file đã sửa (Files Modified)
- **Backend**:
  - [`backend/src/controllers/image.controller.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/controllers/image.controller.ts)
  - [`backend/src/services/product.service.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/services/product.service.ts)
- **Frontend**:
  - [`client/src/utils/product.js`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/utils/product.js)
  - [`client/src/components/seller/ProductForm.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/seller/ProductForm.jsx)
  - [`client/src/components/seller/SellerProducts.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/seller/SellerProducts.jsx)

---

## 2. Nguyên nhân lỗi (Root Causes)
1. **Không đồng bộ Cache Redis**:
   - Khi người bán tải lên (`uploadImages`) hoặc xóa (`deleteImage`) hình ảnh sản phẩm trực tiếp, dữ liệu lưu trong MongoDB thay đổi nhưng bộ nhớ đệm chi tiết sản phẩm (`product:detail:<id>`) và cache phiên bản danh sách (`product:list:version:<type>`) không bị xóa hoặc tăng phiên bản. Do đó, người mua ở Chợ hải sản vẫn nhìn thấy dữ liệu ảnh cũ/trống.
2. **Form Edit Không hiển thị ảnh cũ**:
   - Form chỉnh sửa sản phẩm (`ProductForm.jsx`) chỉ truyền mảng ảnh mới chọn (`form.imageFiles`) vào component `ImageUploader`, bỏ qua danh sách URL ảnh cũ đã lưu từ database (`form.images`), khiến người bán không thể xem hoặc xóa các ảnh cũ của sản phẩm khi bấm Sửa.
3. **Thiếu trường dữ liệu trong API danh sách**:
   - API lấy danh sách sản phẩm công khai trả về cho Chợ hải sản thiếu trường `images` (mảng danh sách tất cả các ảnh), chỉ trả về trường `coverImg` và `imgCount`, gây khó khăn cho việc xử lý ảnh linh hoạt trên giao diện.
4. **Hàm lấy ảnh sản phẩm chưa tối ưu**:
   - Hàm `getProductImage` cũ chưa chuẩn hóa định dạng ảnh (có thể là chuỗi hoặc đối tượng `{ url, secure_url }`), dẫn đến trường hợp đối tượng ảnh bị truyền thẳng vào thẻ `<img> src` làm lỗi hiển thị.
5. **Luồng Lưu và Upload ảnh không an toàn**:
   - Khi tạo mới hoặc cập nhật sản phẩm, nếu có lỗi xảy ra trong quá trình upload ảnh lên Cloudinary sau khi lưu thông tin sản phẩm thành công, form chỉnh sửa bị đóng đột ngột, gây khó khăn cho người bán trong việc lưu hoặc tải lại ảnh.

---

## 3. Cách đã sửa (Solutions Applied)
1. **Tự động làm mới cache Redis**:
   - Tích hợp thêm logic dọn dẹp cache `redis.del` cho chi tiết sản phẩm và tăng phiên bản danh sách cho cả 2 loại `Fresh` và `Dried` ngay sau khi cập nhật danh sách ảnh thành công ở cả 2 API `uploadImages` và `deleteImage`.
2. **Hợp nhất hiển thị ảnh cũ & ảnh mới trong Form**:
   - Trong `ProductForm.jsx`, truyền mảng gộp `[...(form.images || []), ...(form.imageFiles || [])]` vào `ImageUploader`.
   - Tách biệt chính xác ảnh cũ (dạng URL string) và ảnh mới (dạng File) khi người bán thực hiện thêm/xóa ảnh để cập nhật đúng vào `form.images` và `form.imageFiles`.
3. **Bổ sung trường `images` vào API danh sách**:
   - Cập nhật hàm trả về danh sách sản phẩm ở `product.service.ts` để trả thêm mảng `images: p.images || []`.
4. **Chuẩn hóa hàm `getProductImage`**:
   - Thêm hàm `normalizeImageUrl(image)` để trích xuất URL an toàn kể cả khi ảnh ở dạng đối tượng `{ url, secure_url, src }` hoặc chuỗi thường.
5. **Cải tiến luồng Save & Upload của Người bán**:
   - Tách biệt rõ hai bước lưu thông tin sản phẩm và tải ảnh lên.
   - Nếu lưu thông tin sản phẩm thành công nhưng tải ảnh thất bại: Giữ nguyên form, hiển thị thông báo lỗi chi tiết để người bán có thể bấm tải lại ảnh mà không cần nhập lại từ đầu, đồng thời tự động cập nhật `id` sản phẩm mới tạo vào form để tránh tạo trùng bản ghi.

---

## 4. Các case đã test (Test Cases Validated)
- [x] **Case 1**: Người bán tạo sản phẩm mới có ảnh từ máy -> Thông tin và ảnh lưu đúng, hiển thị ngay lập tức bên người mua.
- [x] **Case 2**: Người bán bấm Sửa sản phẩm -> Xem được toàn bộ ảnh cũ hiển thị trong uploader.
- [x] **Case 3**: Lưu sản phẩm mà không chỉnh sửa ảnh -> Giữ nguyên danh sách ảnh cũ.
- [x] **Case 4**: Xóa bớt ảnh cũ và lưu -> Ảnh bị gỡ bỏ khỏi cơ sở dữ liệu và cache.
- [x] **Case 5**: Tải thêm ảnh mới khi sửa sản phẩm -> Các ảnh mới được lưu nối tiếp vào danh sách ảnh cũ và hiển thị ngay trên Chợ hải sản.
- [x] **Case 6**: Tạo vựa cá có ảnh chung và sản phẩm con có ảnh riêng -> Fallback hoạt động đúng (sản phẩm con hiển thị ảnh riêng, nếu không có ảnh riêng sẽ hiển thị ảnh của vựa).
- [x] **Case 7**: Build toàn bộ dự án client và backend -> Biên dịch thành công 100%, không có lỗi TypeScript hay cú pháp.
