# Hướng Dẫn Đọc Swagger UI và Tích Hợp API Dành Cho Lập Trình Viên Frontend Mới

Tài liệu này được biên soạn nhằm giúp các thành viên mới gia nhập đội ngũ Frontend của dự án **HảiSản.vn** nhanh chóng làm quen với cách đọc tài liệu API thông qua giao diện **Swagger UI**, cách chạy thử nghiệm API trực tiếp và cách ánh xạ từ thông tin trên tài liệu thành mã nguồn React (sử dụng Fetch API hoặc thư viện Axios).

---

## 1. Tổng Quan về Swagger UI và Vai Trò Đối Với Frontend

Trong quá trình phát triển dự án, **Swagger UI (định dạng OpenAPI 3.0)** đóng vai trò là một **"Bản hợp đồng cam kết" (API Contract)** giữa hai đội Backend và Frontend:
* **Hạn chế giao tiếp thừa**: Frontend không cần đọc mã nguồn của Backend hoặc liên tục đặt câu hỏi về tên trường, kiểu dữ liệu, hay method. Tất cả đã được quy ước rõ trên Swagger.
* **Hỗ trợ phát triển song song**: Dựa trên cấu trúc dữ liệu trả về mẫu trong tài liệu Swagger, Frontend có thể tự tạo dữ liệu giả lập (Mock Data) để dựng giao diện trước ngay cả khi Backend chưa viết xong code logic.
* **Xác định lỗi nhanh chóng (Debug)**: Khi tích hợp API bị lỗi, bạn có thể chạy thử trực tiếp trên Swagger. Nếu trên Swagger cũng lỗi $\rightarrow$ báo Backend sửa. Nếu trên Swagger chạy đúng mà code của bạn lỗi $\rightarrow$ rà soát lại mã nguồn Frontend.

---

## 2. Cách Khởi Chạy và Truy Cập Swagger UI Cục Bộ

Để xem được tài liệu API, bạn cần chạy máy chủ Backend trên máy tính cá nhân của mình:

1. **Khởi động Cơ sở dữ liệu và Redis (Docker)**:
   Mở terminal và chạy lệnh khởi động các container dữ liệu:
   ```bash
   docker start seafood_mongo seafood_redis
   ```
2. **Khởi động server Backend**:
   Di chuyển vào thư mục `backend` và chạy lệnh dev:
   ```bash
   cd backend
   npm run dev
   ```
3. **Truy cập đường dẫn tài liệu**:
   Mở trình duyệt web và truy cập: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

## 3. Hướng Dẫn Đọc Cấu Trúc API Trên Giao Diện Swagger

Mỗi API hiển thị trên giao diện Swagger UI được cấu thành từ các thành phần sau:

```
┌──────────────────────────────────────────────────────────────┐
│  [GET]   /api/products                                       │ <── Phương thức & Đường dẫn API
├──────────────────────────────────────────────────────────────┤
│  Parameters:                                                 │
│  - search (query, string): Tìm kiếm sản phẩm                 │ <── Tham số truyền đi (Query Params)
├──────────────────────────────────────────────────────────────┤
│  Responses:                                                  │
│  - 200: Thành công (Dữ liệu trả về dạng Array các Product)   │ <── Kết quả trả về (Response)
└──────────────────────────────────────────────────────────────┘
```

### 3.1. Các Phương Thức HTTP (HTTP Methods) Phổ Biến:
* <span style="color: #49cc90; font-weight: bold;">GET</span>: Dùng để **lấy dữ liệu** từ Server (ví dụ: danh sách sản phẩm, chi tiết bài đăng). Không có request body.
* <span style="color: #fca130; font-weight: bold;">POST</span>: Dùng để **tạo mới** dữ liệu (ví dụ: đăng tin bán hàng mới, đăng ký tài khoản). Dữ liệu gửi đi nằm trong request body.
* <span style="color: #50e3c2; font-weight: bold;">PUT</span>: Dùng để **cập nhật ghi đè toàn bộ** dữ liệu cũ (ví dụ: sửa thông tin trang cá nhân).
* <span style="color: #50e3c2; font-weight: bold;">PATCH</span>: Dùng để **cập nhật một phần** dữ liệu (ví dụ: cập nhật riêng trạng thái ẩn/hiện sản phẩm).
* <span style="color: #f93e3e; font-weight: bold;">DELETE</span>: Dùng để **xóa** dữ liệu (ví dụ: xóa tin đăng).

### 3.2. Cách đọc tham số gửi đi (Parameters):
Trong cột **"Parameters"** trên Swagger, chú ý cột **"In"** để biết tham số đó được truyền theo cách nào:
* **`query` (Query Parameter)**: Tham số đính kèm sau dấu chấm hỏi trên URL. Ví dụ: `/api/products?search=cá&limit=10`.
* **`path` (Path Parameter)**: Tham số nằm trực tiếp trong đường dẫn URL, ký hiệu bằng cặp dấu ngoặc nhọn `{}` trên Swagger. Ví dụ: `/api/products/{productId}` trên code sẽ gọi là `/api/products/12345`.
* **`body` (Request Body)**: Thường dành cho POST, PUT, PATCH. Dữ liệu được đóng gói dưới dạng đối tượng JSON gửi ngầm dưới HTTP request.

---

## 4. Hướng Dẫn Ánh Xạ Từ Swagger Sang Code React (Thực Tế)

Dưới đây là 4 trường hợp viết code tích hợp phổ biến nhất tương ứng với các đặc tả trên Swagger UI:

### 4.1. Trường hợp 1: Gọi API Lấy Dữ Liệu Có Bộ Lọc (GET + Query Parameters)
* **Đặc tả trên Swagger**: `GET /api/products` có tham số query `search` (string) và `limit` (number).
* **Cách ánh xạ thành code React (dùng Fetch API)**:

```javascript
import React, { useState, useEffect } from "react";

function ProductList() {
  const [products, setProducts] = useState([]); // Lưu danh sách sản phẩm
  const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu
  const [searchQuery, setSearchQuery] = useState(""); // Từ khóa tìm kiếm

  useEffect(() => {
    // 1. Ánh xạ tham số query từ Swagger thành chuỗi URL
    const url = `http://localhost:5000/api/products?search=${encodeURIComponent(searchQuery)}&limit=10`;

    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi tải dữ liệu");
        return res.json(); // Chuyển phản hồi thành đối tượng JSON
      })
      .then((data) => {
        setProducts(data); // Đưa dữ liệu mảng nhận được từ Swagger vào state
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [searchQuery]); // Nạp lại dữ liệu mỗi khi từ khóa tìm kiếm thay đổi

  if (loading) return <p>Đang tải hải sản tươi ngon...</p>;

  return (
    <ul>
      {products.map((item) => (
        <li key={item.id}>{item.name} - {item.price}đ</li>
      ))}
    </ul>
  );
}
```

---

### 4.2. Trường hợp 2: Gửi Dữ Liệu Tạo Mới (POST + Request Body JSON)
* **Đặc tả trên Swagger**: `POST /api/auth/login` yêu cầu gửi body JSON dạng:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
* **Cách ánh xạ thành code React**:

```javascript
import React, { useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Đóng gói dữ liệu dạng Object khớp chính xác 100% các keys trên Swagger
    const requestBody = { email, password };

    fetch("http://localhost:5000/api/auth/login", {
      method: "POST", // Phương thức POST quy định trên Swagger
      headers: {
        "Content-Type": "application/json", // Bắt buộc khai báo gửi dữ liệu dạng JSON
      },
      body: JSON.stringify(requestBody), // Chuyển đối tượng JS thành chuỗi JSON
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => { throw new Error(err.message); });
        }
        return res.json();
      })
      .then((data) => {
        alert("Đăng nhập thành công! Chào mừng " + data.user.name);
      })
      .catch((err) => {
        alert("Thất bại: " + err.message);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" />
      <button type="submit">Đăng Nhập</button>
    </form>
  );
}
```

---

### 4.3. Trường Hợp 3: API chứa tham số đường dẫn (Path Parameter)
* **Đặc tả trên Swagger**: `GET /api/products/{productId}` (Lấy chi tiết một sản phẩm cụ thể).
* **Cách ánh xạ thành code React**:

```javascript
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Hook lấy param từ Router URL

function ProductDetail() {
  const { productId } = useParams(); // Lấy productId động từ đường dẫn trình duyệt (ví dụ: /san-pham/123)
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Sử dụng ký tự huyền (Template Literal ``) để truyền tham số đường dẫn động vào URL gọi API
    fetch(`http://localhost:5000/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((err) => console.error(err));
  }, [productId]);

  if (!product) return <p>Đang tải chi tiết...</p>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Giá: {product.price}đ</p>
    </div>
  );
}
```

---

### 4.4. Trường Hợp 4: Đăng tải tệp tin hình ảnh (File Upload - multipart/form-data)
* **Đặc tả trên Swagger**: `POST /api/products` yêu cầu body không phải JSON thông thường mà là kiểu **`multipart/form-data`** để gửi file đính kèm.
* **Cách ánh xạ thành code React**:

```javascript
import React, { useState } from "react";

function CreateProductForm() {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null); // Lưu trữ File object của ảnh

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]); // Lấy file ảnh đầu tiên được chọn
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Khởi tạo đối tượng FormData (bắt buộc đối với tải file)
    const formData = new FormData();
    formData.append("name", name); // Gắn dữ liệu chuỗi chữ thông thường
    if (imageFile) {
      formData.append("image", imageFile); // Gắn file ảnh thực tế (trùng khóa "image" yêu cầu trên Swagger)
    }

    // 2. Gửi request
    fetch("http://localhost:5000/api/products", {
      method: "POST",
      // LƯU Ý: KHÔNG ĐƯỢC thiết lập header "Content-Type" khi dùng FormData.
      // Trình duyệt sẽ tự động nhận diện và cấu hình Content-Type thích hợp đi kèm boundary.
      body: formData, 
    })
      .then((res) => res.json())
      .then((data) => alert("Đăng sản phẩm thành công!"))
      .catch((err) => console.error(err));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên hải sản" />
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button type="submit">Đăng Bán</button>
    </form>
  );
}
```

---

## 5. Cơ Chế Xác Thực (Authentication) Bằng Cookie Trên Website

Dự án này áp dụng cơ chế xác thực bảo mật tối ưu bằng **HTTP-Only Cookie** thay vì lưu JWT Token trong LocalStorage (để chống tấn công XSS):
* **Tự động gửi Cookie**: Khi bạn đăng nhập thành công, máy chủ Backend tự động gửi một cookie tên là `token` về trình duyệt. Kể từ lúc này, mọi request gửi từ Frontend đến các API được bảo vệ (Protected API) sẽ **tự động đính kèm cookie này** đi kèm mà bạn không cần cấu hình thủ công trong Header của code JS.
* **Thử nghiệm trên Swagger**:
  1. Vào API `POST /api/auth/login`.
  2. Bấm **"Try it out"**, nhập tài khoản đăng nhập mẫu và chọn **"Execute"**.
  3. Khi kết quả trả về mã `200` thành công, trình duyệt của bạn đã lưu cookie `token`.
  4. Bạn có thể thoải mái bấm chạy thử tất cả các API có ký hiệu ổ khóa khác trên Swagger mà không bị báo lỗi `401 Unauthorized` nữa.

---

## 6. Các Mã Lỗi HTTP Phổ Biến Cần Nắm Được Để Xử Lý Giao Diện

Khi tích hợp API, bạn cần bắt lỗi (Catch error) và ánh xạ mã trạng thái (HTTP Status Code) nhận được từ Swagger thành thông báo dễ hiểu cho người dùng:

| Mã trạng thái | Ý nghĩa trên Swagger | Cách xử lý trong code Frontend |
| :--- | :--- | :--- |
| **`200`** / **`201`** | Thành công (OK / Created) | Tiếp tục xử lý dữ liệu và chuyển trang hoặc hiển thị thông báo thành công. |
| **`400`** | Lỗi dữ liệu gửi lên (Bad Request) | Hiển thị chi tiết lỗi của form (ví dụ: "Mật khẩu phải dài hơn 6 ký tự"). |
| **`401`** | Chưa đăng nhập (Unauthorized) | Điều hướng người dùng về trang Đăng nhập (`/dang-nhap`). |
| **`403`** | Không có quyền truy cập (Forbidden) | Hiển thị thông báo "Bạn không có quyền thực hiện hành động này". |
| **`404`** | Không tìm thấy trang/dữ liệu (Not Found) | Hiển thị trang lỗi 404 hoặc thông báo "Sản phẩm đã bị xóa". |
| **`429`** | Gửi yêu cầu quá nhanh (Rate Limit) | Hiển thị thông báo "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút". |
| **`500`** / **`503`** | Lỗi máy chủ (Server Error) | Hiển thị giao diện bảo trì hoặc thông báo "Hệ thống đang bận". |

---

## 7. Mẹo (Tips) Quan Trọng Dành Cho Lập Trình Viên Mới

1. **Luôn bật Tab Network của Trình duyệt**:
   Nhấn phím `F12` và chọn tab **Network** (Mạng) khi test code của mình. Tại đây bạn sẽ đối chiếu được URL, Method, Header và Payload gửi đi có trùng khớp hoàn toàn với những gì Swagger quy định hay không.
2. **Không tự ý chỉnh sửa URL hoặc tên biến**:
   Tên biến trên Swagger là bất di bất dịch (ví dụ: `sellerId` khác với `seller_id`, `productSellerId` khác với `product_seller_id`). Bất kỳ sự sai khác chữ hoa/thường nào cũng sẽ khiến API trả về mã lỗi `400` hoặc `500`.
3. **Sử dụng Swagger để kiểm lỗi nhanh**:
   Nếu code Frontend gọi API báo lỗi, việc đầu tiên bạn làm là chạy lại API đó trên giao diện Swagger. Điều này giúp bạn xác định ngay lập tức lỗi thuộc về code Frontend của mình hay Backend của đồng nghiệp.
