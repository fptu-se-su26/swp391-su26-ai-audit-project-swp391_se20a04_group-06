# Chuyên Đề 03: Bản Đồ Nghiệp Vụ & Hệ Thống Kiểm Thử Backend

Chuyên đề này cung cấp cái nhìn toàn cảnh về cấu trúc nghiệp vụ của Backend theo mô hình MVC + Repository, bản đồ tra cứu của toàn bộ các tệp tin trong hệ thống, giải thích mã nguồn các nghiệp vụ ph## 1. Bản Đồ Tra Cứu Toàn Bộ File Nghiệp Vụ Backend (Kiến trúc DDD & Hexagonal)

Hệ thống đã chuyển dịch hoàn toàn từ MVC sang kiến trúc **Domain-Driven Design (DDD) & Hexagonal Architecture** kết hợp phân tách **CQRS** (Đọc/Ghi riêng biệt). Dưới đây là sơ đồ tra cứu cấu trúc tệp tin trong `backend/src`:

### 1.1 Nhân chung của miền dữ liệu (`src/shared/domain`)
Thư mục này chứa các thành phần cốt lõi của DDD dùng chung (Shared Kernel) giữa các Bounded Contexts:
* [Entity.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/shared/domain/Entity.ts): Lớp cơ sở trừu tượng cho thực thể miền (Entity) định danh bằng ID.
* [ValueObject.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/shared/domain/ValueObject.ts): Lớp cơ sở cho các giá trị không đổi trong miền (Value Object).
* [AggregateRoot.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/shared/domain/AggregateRoot.ts): Lớp cơ sở cho các thực thể chịu trách nhiệm quản lý tính toàn vẹn (Aggregate Root).
* [exceptions/DomainException.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/shared/domain/exceptions/DomainException.ts): Định nghĩa các lỗi nghiệp vụ miền (ValidationError, ConflictError).
* [events/DomainEvents.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/shared/domain/events/DomainEvents.ts): Bộ trung gian bắt giữ và truyền đạt sự kiện miền (Domain Events).

### 1.2 Các Phân Hệ Nghiệp Vụ DDD (`src/modules`)
Được phân thành các **Bounded Contexts** độc lập. Mỗi Bounded Context được tổ chức thành các lớp:
* **Domain Layer (Lõi nghiệp vụ):** Chứa Aggregate Roots, Entities, Value Objects và Interfaces Port.
* **Application Layer (Lớp ứng dụng):** Chứa các Use Cases thực hiện luồng xử lý đơn lập.
* **Infrastructure Layer (Hạ tầng):** Chứa các Database Persistence Adapters và Mappers chuyển đổi thực thể.
* **Presentation Layer (Lớp giao diện/API):** Chứa các HTTP Controllers.

#### A. Phân hệ Định danh & Phân quyền (`src/modules/iam`)
* **Domain:** [User.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/domain/entities/User.ts) (Aggregate Root kiểm soát tài khoản), [IUserRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/domain/repositories/IUserRepository.ts) (Port).
* **Application:** Use cases Đăng ký (`RegisterUseCase`), Đăng nhập (`LoginUseCase`), Cập nhật Profile (`UpdateProfileUseCase`), Đổi mật khẩu (`ChangePasswordUseCase`), Xóa tài khoản (`DeleteAccountUseCase`), Đăng nhập Google (`GoogleAuthUseCase`).
* **Infrastructure:** [MongooseUserRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/infrastructure/persistence/mongoose/MongooseUserRepository.ts) (Adapter), [UserMapper.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/infrastructure/persistence/mongoose/mappers/UserMapper.ts) (Mapper).
* **Presentation:** [AuthController.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/iam/presentation/http/AuthController.ts) (Controller đón tiếp HTTP).

#### B. Phân hệ Tin đăng Hải sản (`src/modules/product`)
* **Domain:** [Product.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/domain/entities/Product.ts) (Aggregate Root), [GPSCoordinates.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/domain/value-objects/GPSCoordinates.ts), [PriceHistory.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/domain/value-objects/PriceHistory.ts), [IProductRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/domain/repositories/IProductRepository.ts) (Port).
* **Application:** Use cases Đăng tin (`CreateProductUseCase`), Đẩy tin (`BumpProductUseCase`), Cập nhật (`UpdateProductUseCase`), Xóa sản phẩm (`DeleteProductUseCase`).
* **Infrastructure:** [MongooseProductRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/infrastructure/persistence/mongoose/MongooseProductRepository.ts) (Adapter), [ProductMapper.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/infrastructure/persistence/mongoose/mappers/ProductMapper.ts) (Mapper).
* **Presentation:** [ProductController.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/product/presentation/http/ProductController.ts) (Controller).

#### C. Phân hệ Diễn đàn Cộng đồng (`src/modules/post`)
* **Domain:** [Post.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/domain/entities/Post.ts) (Aggregate Root quản lý Like & Comment), [IPostRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/domain/repositories/IPostRepository.ts) (Port).
* **Application:** Use cases Tạo bài viết (`CreatePostUseCase`), Xóa bài viết (`DeletePostUseCase`), Thích bài viết (`ToggleLikePostUseCase`), Thêm bình luận (`AddCommentUseCase`), Xóa bình luận (`DeleteCommentUseCase`).
* **Infrastructure:** [MongoosePostRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/infrastructure/persistence/mongoose/MongoosePostRepository.ts) (Adapter), [PostMapper.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/infrastructure/persistence/mongoose/mappers/PostMapper.ts) (Mapper).
* **Presentation:** [PostController.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/post/presentation/http/PostController.ts) (Controller).

#### D. Phân hệ Cẩm nang Công thức (`src/modules/recipe`)
* **Domain:** [Recipe.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/domain/entities/Recipe.ts) (Aggregate Root), [IRecipeRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/domain/repositories/IRecipeRepository.ts) (Port).
* **Application:** Use cases Tạo công thức (`CreateRecipeUseCase`), Sửa (`UpdateRecipeUseCase`), Xóa (`DeleteRecipeUseCase`), Thích (`ToggleLikeRecipeUseCase`), Tăng lượt xem (`IncrementRecipeViewsUseCase`).
* **Infrastructure:** [MongooseRecipeRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/infrastructure/persistence/mongoose/MongooseRecipeRepository.ts) (Adapter), [RecipeMapper.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/infrastructure/persistence/mongoose/mappers/RecipeMapper.ts) (Mapper).
* **Presentation:** [RecipeController.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/recipe/presentation/http/RecipeController.ts) (Controller).

#### E. Phân hệ Nhật ký Cabin (`src/modules/boat-log`)
* **Domain:** [BoatLog.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/domain/entities/BoatLog.ts) (Aggregate Root), [IBoatLogRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/domain/repositories/IBoatLogRepository.ts) (Port).
* **Application:** Use cases Viết nhật ký (`CreateBoatLogUseCase`), Xóa (`DeleteBoatLogUseCase`), Thích (`ToggleLikeBoatLogUseCase`).
* **Infrastructure:** [MongooseBoatLogRepository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/infrastructure/persistence/mongoose/MongooseBoatLogRepository.ts) (Adapter), [BoatLogMapper.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/infrastructure/persistence/mongoose/mappers/BoatLogMapper.ts) (Mapper).
* **Presentation:** [BoatLogController.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/modules/boat-log/presentation/http/BoatLogController.ts) (Controller).

### 1.3 Lớp Chống Tham Nhũng Tương Thích Ngược (`src/repositories`)
Đóng vai trò làm lớp trung gian (Anti-Corruption Layer - ACL) bọc các tệp truy vấn cũ để tự động ánh xạ sang các Use Cases và thực thể của DDD mà không gây phá vỡ các phần chưa nâng cấp hoặc Client:
* [user.repository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/repositories/user.repository.ts): Chuyển luồng đọc/ghi thông tin người dùng sang DDD.
* [product.repository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/repositories/product.repository.ts): Chuyển luồng đọc/ghi sản phẩm sang DDD.
* [recipe.repository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/repositories/recipe.repository.ts): ACL ánh xạ nghiệp vụ Recipe.
* [boatlog.repository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/repositories/boatlog.repository.ts): ACL ánh xạ nghiệp vụ BoatLog.
* [post.repository.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/repositories/post.repository.ts): ACL ánh xạ nghiệp vụ Diễn đàn & Bình luận.

### 1.4 Thư mục Route Định Tuyến Layer (`src/routes`)
Đón tiếp các REST Request và chuyển trực tiếp tới các Controller trong lớp Presentation của DDD:
* Các tệp tin routes: `auth.routes.ts`, `product.routes.ts`, `recipe.routes.ts`, `boatLog.routes.ts`, `post.routes.ts`.
* Các tệp tin controllers: `auth.controller.ts`, `product.controller.ts`, `message.controller.ts`, `admin.controller.ts`, `follow.controller.ts`, `review.controller.ts`, `notification.controller.ts`, `favorite.controller.ts`, `report.controller.ts`, `payment.controller.ts`, `chatbot.controller.ts`, `recipe.controller.ts`, `post.controller.ts`, `boatLog.controller.ts`, `otp.controller.ts`, `user.controller.ts`, `fisherman.controller.ts`, `image.controller.ts`.roller tương ứng đứng trước để đón tiếp request HTTP, chuyển đổi dữ liệu và gọi Service Layer:
* Các tệp tin routes: `auth.routes.ts`, `product.routes.ts`, `message.routes.ts`, `admin.routes.ts`, `follow.routes.ts`, `review.routes.ts`, `notification.routes.ts`, `favorite.routes.ts`, `report.routes.ts`, `payment.routes.ts`, `chatbot.routes.ts`, `recipe.routes.ts`, `post.routes.ts`, `boatLog.routes.ts`, `otp.routes.ts`, `fisherman.routes.ts`.
* Các tệp tin controllers: `auth.controller.ts`, `product.controller.ts`, `message.controller.ts`, `admin.controller.ts`, `follow.controller.ts`, `review.controller.ts`, `notification.controller.ts`, `favorite.controller.ts`, `report.controller.ts`, `payment.controller.ts`, `chatbot.controller.ts`, `recipe.controller.ts`, `post.controller.ts`, `boatLog.controller.ts`, `otp.controller.ts`, `user.controller.ts`, `fisherman.controller.ts`, `image.controller.ts`.

### 1.6 Thư mục Validations & Utilities (`src/validations` & `src/utils`)
* Các tệp tin validations (sử dụng thư viện Zod để validate request payload): `auth.validation.ts`, `product.validation.ts`, `message.validation.ts`, `post.validation.ts`, `recipe.validation.ts`, `boatLog.validation.ts`, `report.validation.ts`, `review.validation.ts`.
* Các tệp tin utils:
  - `logger.ts`: Cấu hình Winston ghi logs xoay vòng hàng ngày (Daily Rotate File).
  - `security.ts`: Hàm so khớp chuỗi an toàn `safeCompare`.
  - `pagination.ts`: Helper phân tích tham số phân trang.
  - `haversine.ts`: Công thức lượng giác Haversine tính toán khoảng cách thực tế giữa 2 điểm GPS dạng mặt cầu.
  - `fillDays.ts`: Thống kê lắp đầy dữ liệu ngày trống trong biểu đồ doanh thu Admin.
  - `cloudinary.ts`: Hàm trích xuất public ID từ URL Cloudinary.

---

## 2. Phân Tích Mã Nguồn Nghiệp Vụ Phức Tạp (Line-by-Line)

### 2.1 Xóa Tài Khoản Cascade GDPR (`auth.service.ts` dòng 214-349)

Hàm `deleteAccount` thực hiện dọn dẹp dữ liệu của người dùng trên toàn bộ hệ thống để tuân thủ luật GDPR (quyền được quên), sử dụng cơ chế an toàn ACID Transaction trên MongoDB.

```typescript
async deleteAccount(userId: string): Promise<void> {
  const session = await mongoose.startSession();
  let dbOptions: any = {};
  ...
  try {
    session.startTransaction();
    dbOptions = { session };
  } catch (err: any) {
    session.endSession();
    // Fallback nếu MongoDB chạy Standalone không có replica set (không hỗ trợ multi-document transactions)
    if (err.message && err.message.includes("replica set")) {
      logger.warn("MongoDB Standalone detected. Bỏ qua Transaction ACID.");
    } else {
      throw err;
    }
  }
```
* **Giải thích:** Khởi tạo phiên làm việc Transaction. Điều này đảm bảo tính toàn vẹn của dữ liệu: Hoặc là toàn bộ dữ liệu liên quan đến người dùng được xóa sạch thành công, hoặc nếu có một thao tác lỗi, toàn bộ quá trình sẽ được phục hồi lại trạng thái cũ (Rollback), tránh tình trạng mồ côi dữ liệu rác trong database.

```typescript
  try {
    // 1. Quét thu hồi toàn bộ token phiên làm việc của User trong Redis
    let cursor = "0";
    do {
      const reply = await redis.scan(cursor, "MATCH", `auth:refresh:${userId}:*`, "COUNT", 100);
      cursor = reply[0];
      keysToDelete.push(...reply[1]);
    } while (cursor !== "0");
```
* **Giải thích:** Sử dụng lệnh `SCAN` bất đồng bộ của Redis (thay vì lệnh `KEYS` vốn gây block đơn luồng của Redis) để dò tìm tất cả các Refresh Token đang hoạt động của người dùng này và đưa vào danh sách thu hồi nhằm logout lập tức tài khoản trên mọi thiết bị.

```typescript
    // 2. Tìm tất cả sản phẩm của User này để trích xuất Public ID ảnh trên Cloudinary
    const products = await Product.find({ sellerId: userId }, null, dbOptions);
    allPublicIds = products.flatMap((p) => (p.images || []).map(extractPublicId)).filter((id): id is string => !!id);
    productIds = products.map((p) => p._id);

    // 3. Thực hiện kéo ID người dùng ra khỏi mảng following của tất cả tài khoản khác
    await User.updateMany({}, { $pull: { following: userId as any } }, dbOptions);

    if (productIds.length > 0) {
      // 4. Xóa liên kết yêu thích, bình luận, tin nhắn, báo cáo liên quan đến sản phẩm
      await User.updateMany({}, { $pull: { favorites: { $in: productIds } as any } }, dbOptions);
      await Review.deleteMany({ productId: { $in: productIds } }, dbOptions);
      await Message.deleteMany({ productId: { $in: productIds } }, dbOptions);
      await Report.deleteMany({ productId: { $in: productIds } }, dbOptions);
      await Notification.deleteMany({ productId: { $in: productIds } }, dbOptions);
    }
```
* **Giải thích:**
  - `flatMap`: Thu gom toàn bộ URL hình ảnh của tất cả sản phẩm và dùng hàm `extractPublicId` để lấy khóa định danh ảnh lưu trên Cloudinary.
  - `$pull`: Toán tử MongoDB loại bỏ lập tức ID người dùng khỏi danh sách `following` và sản phẩm của người dùng khỏi danh sách `favorites` của các tài khoản khác trong toàn bộ database.
  - `deleteMany`: Xóa hàng loạt toàn bộ tin nhắn chat, đánh giá, thông báo và báo cáo vi phạm liên quan đến mẻ hàng của ngư dân này.

```typescript
    // 5. Xóa các tài liệu nghiệp vụ do người dùng sở hữu trực tiếp
    await Product.deleteMany({ sellerId: userId }, dbOptions);
    await Review.deleteMany({ $or: [{ reviewerId: userId as any }, { sellerId: userId as any }] }, dbOptions);
    await Message.deleteMany({ $or: [{ senderId: userId as any }, { receiverId: userId as any }] }, dbOptions);
    await Report.deleteMany({ reporterId: userId }, dbOptions);
    await Notification.deleteMany({ userId: userId }, dbOptions);
    await Post.deleteMany({ userId: userId }, dbOptions);
    await Recipe.deleteMany({ authorId: userId }, dbOptions);
    await BoatLog.deleteMany({ userId: userId }, dbOptions);

    // 6. Xóa tương tác like và bình luận của người dùng trên bài viết của người khác
    await Post.updateMany({}, { $pull: { likes: userId as any } }, dbOptions);
    await Recipe.updateMany({}, { $pull: { likes: userId as any } }, dbOptions);
    await Post.updateMany({}, { $pull: { comments: { userId: userId as any } } }, dbOptions);

    // 7. Xóa vĩnh viễn tài liệu User
    await User.findByIdAndDelete(userId, dbOptions);

    if (dbOptions.session) await session.commitTransaction();
```
* **Giải thích:** Xóa toàn bộ sản phẩm đăng bán, lượt đánh giá (cả nhận và viết), tin nhắn chat (cả gửi và nhận), báo cáo vi phạm, thông báo cá nhân, các bài viết, công thức nấu ăn và nhật ký đi biển. Kéo ID người dùng ra khỏi mảng thả tim (`likes`) và xóa toàn bộ comment do người dùng viết trên các bài đăng khác. Cuối cùng thực thi xóa tài khoản User và cam kết lưu thay đổi (`commitTransaction`).

```typescript
    // 8. Thực hiện giải phóng hạ tầng mạng ngoài Database
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }

    if (allPublicIds.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < allPublicIds.length; i += BATCH_SIZE) {
        const batch = allPublicIds.slice(i, i + BATCH_SIZE);
        await cloudinary.api.delete_resources(batch);
      }
    }
```
* **Giải thích:** Sau khi commit DB thành công, hệ thống tiến hành xóa các khóa phiên làm việc trong Redis và gọi Cloudinary API để xóa vật lý toàn bộ các file ảnh sản phẩm trên cloud CDN để tiết kiệm dung lượng lưu trữ thực tế, hoàn thành chu kỳ GDPR cascade.

---

### 2.2 Định Vị GPS & Giới Hạn Đẩy Bài (`product.service.ts`)

#### Lọc hải sản theo tọa độ bán kính GPS (Dòng 139-149)
```typescript
if (type === "Fresh" && lat && lng) {
  const latVal = parseFloat(lat);
  const lngVal = parseFloat(lng);
  if (!isNaN(latVal) && !isNaN(lngVal)) {
    filter.location = {
      $geoWithin: {
        $centerSphere: [[lngVal, latVal], MAX_FRESH_DISTANCE_KM / 6378.1],
      },
    };
  }
}
```
* **Giải thích:** 
  - Chỉ lọc vị trí địa lý đối với hải sản tươi sống (`Fresh`).
  - Sử dụng toán tử địa lý `$geoWithin` kết hợp với `$centerSphere` của MongoDB để vẽ một vòng tròn bán kính ảo trên mặt cầu Trái Đất.
  - Điểm tâm vòng tròn là tọa độ của người mua `[lngVal, latVal]`.
  - Bán kính được tính bằng công thức: Khoảng cách bán kính tìm kiếm (ví dụ: `20km`) chia cho bán kính Trái Đất trung bình là `6378.1 km` (chuyển đổi đơn vị sang Radians). Truy vấn này sẽ chỉ lọc ra các mẻ hải sản nằm trong phạm vi chỉ định.

#### Cơ chế chống spam đẩy bài đăng (Dòng 667-700)
```typescript
async bump(id: string, userId: string): Promise<void> {
  const currentProduct = await productRepository.findById(id);
  if (!currentProduct) throw new HttpError(404, "Không tìm thấy sản phẩm");
  if (currentProduct.sellerId.toString() !== userId) throw new HttpError(403, "Không có quyền");

  const cutoffTime = new Date(Date.now() - 24 * 3600 * 1000); // Mốc 24 tiếng trước

  const updated = await productRepository.findOneAndUpdate(
    {
      _id: id,
      sellerId: userId,
      $or: [
        { bumpedAt: { $lte: cutoffTime } },
        { bumpedAt: { $exists: false } },
      ],
    },
    { $set: { bumpedAt: new Date() } }
  );

  if (!updated) {
    throw new HttpError(429, `Sản phẩm này đã được đẩy lên gần đây. Vui lòng đẩy tin lại sau.`);
  }
```
* **Giải thích:**
  - Nhằm tránh việc ngư dân liên tục nhấn nút để đẩy tin bán của mình lên đầu feed hiển thị, hệ thống giới hạn cooldown **24 tiếng**.
  - `cutoffTime` lưu thời điểm cách đây đúng 24 tiếng.
  - Lệnh `findOneAndUpdate` thực hiện truy vấn nguyên tử (Atomic Query): Chỉ cập nhật trường `bumpedAt` thành thời gian hiện tại nếu sản phẩm đó chưa từng được bump (`bumpedAt` không tồn tại) HOẶC thời điểm bump lần cuối đã cũ hơn mốc 24 tiếng trước (`bumpedAt <= cutoffTime`).
  - Nếu điều kiện không thỏa mãn, MongoDB không tìm thấy bản ghi phù hợp để update → trả về `updated = null` → ném lỗi `HTTP 429 Too Many Requests`.

---

### 2.3 Bảo Mật Chữ Ký Webhook Nâng Cấp Premium (`payment.controller.ts`)

```typescript
export async function sepayWebhook(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });

  let token = authHeader.replace(/^(Bearer|ApiKey)\s+/i, "").trim();
  const expectedKey = process.env.SEPAY_WEBHOOK_KEY;
  
  // So sánh an toàn thời gian để ngăn chặn Timing Attack
  if (!safeCompare(token, expectedKey)) {
    return res.status(401).json({ message: "Invalid API Key" });
  }

  const { transferAmount, content } = req.body;
```
* **Giải thích:**
  - Khi ngân hàng nhận tiền chuyển khoản của ngư dân, Sepay Gateway sẽ gọi Webhook POST thẳng vào API của backend.
  - Để xác minh request này thực sự đến từ Sepay chứ không phải do kẻ xấu giả lập dữ liệu gửi lên, hệ thống kiểm tra Header Authorization.
  - Sử dụng hàm `safeCompare` để đối chiếu chuỗi token nhận được với `SEPAY_WEBHOOK_KEY` cấu hình trong `.env`. `safeCompare` chạy một vòng lặp có thời gian xử lý không đổi (Constant Time comparison) để so khớp các ký tự chuỗi, bảo vệ hệ thống trước hình thức tấn công Timing Attack dò tìm khóa bảo mật qua phản hồi của CPU.

---

### 2.4 Quản Lý Hội Thoại & Tính Năng Chat Nâng Cao (`message.controller.ts` & `socket.ts`)

#### Thu hồi tin nhắn (Recall Message)
```typescript
export async function recallMessage(req: Request, res: Response) {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    if (msg.senderId.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    msg.isRecalled = true;
    await msg.save();

    // Đồng bộ Realtime qua Socket
    getIO().to(`product_${msg.productId}_${msg.senderId}`).emit("message_recalled", { id });
    getIO().to(`product_${msg.productId}_${msg.receiverId}`).emit("message_recalled", { id });

    return res.json({ success: true, message: "Thu hồi thành công" });
  } catch (err) {
    return sendServerError(res, err);
  }
}
```
* **Giải thích:**
  - Hàm thực hiện cập nhật thuộc tính `isRecalled = true` của bản ghi tin nhắn cụ thể trong MongoDB.
  - Thực hiện kiểm tra quyền sở hữu (`msg.senderId.toString() !== userId`) để đảm bảo một người dùng không thể thu hồi tin nhắn của đối phương.
  - Sử dụng `getIO().to(room).emit("message_recalled", { id })` để broadcast sự kiện thu hồi tin nhắn tới cả người gửi và người nhận thông qua Socket.IO room chuyên biệt. Phía Frontend React sẽ nhận sự kiện này và ẩn nội dung tin nhắn đó đi trên giao diện tức thời.

#### Chỉnh sửa nội dung tin nhắn (Edit Message) & Thả cảm xúc (React Message)
* Khi người gửi chỉnh sửa tin nhắn hoặc thả biểu tượng cảm xúc (emoji), controller sẽ cập nhật trực tiếp vào trường `content` hoặc `reaction` trong database.
* Đồng thời emit sự kiện `"message_edited"` hoặc `"message_reacted"` qua Socket.io để đồng bộ giao diện cho người nhận tức thì mà không cần reload trang.

---

## 3. Hệ Thống Kiểm Thử Tự Động (Unit Tests)

Bộ kiểm thử đơn vị (Unit Tests) của backend được cấu hình và thực thi bằng thư viện **Jest** kết hợp bộ chuyển dịch **ts-jest** để trực tiếp biên dịch mã nguồn TypeScript trong lúc test.

### 3.1 Khai báo cấu hình Jest (`jest.config.js`)
Hệ thống sử dụng các tùy chọn:
* `preset: "ts-jest"`: Hướng dẫn Jest dùng `ts-jest` để biên dịch trực tiếp file `.ts`.
* `testEnvironment: "node"`: Chạy môi trường Node.js giả lập không có DOM trình duyệt.
* `testMatch: ["**/*.test.ts"]`: Chỉ thu gom các tệp tin có đuôi `.test.ts` để thực thi kiểm thử.

### 3.2 Phân tích dòng code file test mẫu: [admin.service.test.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/services/admin.service.test.ts)

File này thực hiện kiểm thử logic bật/tắt kích hoạt tài khoản của Admin.

* **Dòng 5-11: Giả lập Mocking Dependency**
  ```typescript
  jest.mock("../repositories/user.repository");
  jest.mock("../utils/logger", () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  }));
  ```
  - `jest.mock`: Thay vì thực hiện kết nối vào database MongoDB thực tế gây tốn tài nguyên và sai lệch dữ liệu thật, Jest tiến hành ghi đè (mock) toàn bộ các hàm của `userRepository` thành các hàm giả lập (`jest.fn()`).
  - Đồng thời mock Winstron logger để tránh làm bẩn màn hình terminal khi xuất logs kiểm thử.

* **Dòng 20-30: Viết ca kiểm thử ném lỗi 404**
  ```typescript
  it("Nên báo lỗi 404 nếu không tìm thấy thông tin tài khoản người dùng cần xử lý", async () => {
    (userRepository.findRawById as jest.Mock).mockResolvedValue(null);

    await expect(adminService.toggleUserActive(mockUserId)).rejects.toThrow(
      expect.objectContaining({
        status: 404,
        message: "Không tìm thấy người dùng",
      }),
    );
  });
  ```
  - `mockResolvedValue(null)`: Định nghĩa hành vi giả lập: Khi hàm `findRawById` của user repository được gọi, nó sẽ trả về giá trị `null` (giả lập không tìm thấy tài khoản).
  - `expect(...).rejects.toThrow(...)`: Kỳ vọng khi admin service gọi hàm `toggleUserActive`, hàm này phải ném ra một lỗi có chứa thuộc tính status 404 và thông báo tương ứng.

* **Dòng 32-49: Viết ca kiểm thử bật/tắt thành công**
  ```typescript
  it("Nên đảo trạng thái hoạt động của tài khoản thành công", async () => {
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      _id: mockUserId,
      isActive: true, // Đang hoạt động
    });

    (userRepository.updateActiveStatus as jest.Mock).mockResolvedValue({
      isActive: false, // Bị khóa
    });

    const result = await adminService.toggleUserActive(mockUserId);

    expect(result).toBe(false);
    expect(userRepository.updateActiveStatus).toHaveBeenCalledWith(mockUserId, false);
  });
  ```
  - Giả lập tài khoản tìm thấy đang có trạng thái `isActive = true`.
  - Giả lập hàm lưu trạng thái mới `updateActiveStatus` trả về kết quả `isActive = false`.
  - Gọi thực thi hàm. Kỳ vọng kết quả đầu ra nhận được là trạng thái mới của user (`false`).
  - Sử dụng `toHaveBeenCalledWith` kiểm chứng xem hàm update trong database thực tế có được gọi đúng tham số ID người dùng và cờ trạng thái mới `false` hay không.

### 3.3 Phân tích kiểm thử định vị GPS và cooldown đẩy bài: [product.service.test.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/services/product.service.test.ts)

Tệp tin này thực hiện kiểm thử ba logic nghiệp vụ cốt lõi:
1. **Giới hạn số lượng bài đăng:** Chặn tài khoản thường không cho đăng quá 5 bài/ngày nhưng cho phép tài khoản Premium đăng không giới hạn.
2. **Thời gian chờ (cooldown) đẩy bài (bump):** Chỉ cho phép đẩy bài viết lên đầu trang nếu khoảng cách giữa 2 lần đẩy lớn hơn 24 giờ.
3. **Bộ lọc định vị địa lý GPS:** Tự động áp dụng `$geoWithin` để truy vấn hải sản tươi sống (`Fresh`) dựa trên tọa độ mặt cầu.

* **Kiểm thử bộ lọc GPS:**
  ```typescript
  it("Nên áp dụng bộ lọc $geoWithin khi truy vấn sản phẩm loại Fresh với lat và lng hợp lệ", async () => {
    ...
    await productService.list({ type: "Fresh", lat: "20.8449", lng: "106.6881" });
    expect(productRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Fresh",
        location: expect.objectContaining({
          $geoWithin: expect.objectContaining({
            $centerSphere: expect.any(Array),
          }),
        }),
      }),
      expect.any(Object),
      expect.any(Object)
    );
  });
  ```
  - `expect.objectContaining`: Sử dụng matcher của Jest để đảm bảo filter truyền vào repository chứa đúng toán tử địa lý `$geoWithin` với tâm và bán kính được tính toán chính xác mà không cần so khớp toàn bộ object.
