# 📋 Kế Hoạch Triển Khai Dự Án - Hệ Thống Bán Hải Sản Trực Tuyến
**Ngày tạo:** 03/06/2026  
**Phiên bản:** 1.0

---

## 📌 I. TỔNG QUAN DỰ ÁN

### Tên dự án
**Fisherman Direct Market** - Nền tảng thương mại điện tử bán hải sản trực tiếp từ ngư dân

### Mục tiêu
- ✅ Chuyển đổi website tĩnh HTML thành ứng dụng web động
- ✅ Xây dựng backend API với Node.js + Express
- ✅ Phát triển frontend modern với React
- ✅ Lưu trữ dữ liệu bằng MongoDB
- ✅ Containerized với Docker
- ✅ Dễ dàng triển khai (deployment)

### Stack công nghệ
| Thành phần | Công nghệ | Phiên bản |
|-----------|-----------|---------|
| **Frontend** | React | 18.x |
| **Backend** | Node.js + Express | 20.x LTS + 4.x |
| **Database** | MongoDB | 6.0+ |
| **Container** | Docker | 24.x |
| **Orchestration** | Docker Compose | 2.x |
| **Build Tool** | Vite | 5.x |
| **Package Manager** | npm/yarn | Latest |

---

## 📊 II. CẤU TRÚC DỬ ÁN

```
fisherman-market/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── env.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Order.js
│   │   │   ├── Fisherman.js
│   │   │   ├── Recipe.js
│   │   │   └── Post.js
│   │   ├── routes/
│   │   │   ├── users.js
│   │   │   ├── products.js
│   │   │   ├── orders.js
│   │   │   ├── fishermen.js
│   │   │   ├── recipes.js
│   │   │   └── posts.js
│   │   ├── controllers/
│   │   │   ├── userController.js
│   │   │   ├── productController.js
│   │   │   ├── orderController.js
│   │   │   ├── fishermenController.js
│   │   │   ├── recipeController.js
│   │   │   └── postController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   └── index.js
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductList.jsx
│   │   │   └── [...]
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Order.jsx
│   │   │   ├── Fishermen.jsx
│   │   │   ├── Recipes.jsx
│   │   │   ├── Community.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── productService.js
│   │   │   ├── orderService.js
│   │   │   └── userService.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useProduct.js
│   │   │   └── useCart.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   └── UserContext.jsx
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── variables.css
│   │   │   └── responsive.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── [assets]
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
├── README.md
└── project-plan/
    └── DEPLOYMENT_PLAN.md
```

---

## 🗄️ III. MÔ HÌNH DỮ LIỆU (MongoDB Collections)

### 1. **Users** - Người dùng
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,
  address: String,
  city: String,
  prefecture: String,
  postalCode: String,
  role: String (enum: ['user', 'admin', 'fisherman']),
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **Products** - Sản phẩm
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String (enum: ['fish', 'seafood', 'crab', 'gift']),
  price: Number,
  originalPrice: Number,
  quantity: Number,
  imageUrl: String,
  images: [String],
  fishermanId: ObjectId (ref: Fisherman),
  deliveryType: String (enum: ['date-specified', 'as-available', 'subscription']),
  availableDate: Date,
  rating: Number,
  reviews: [Object],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Orders** - Đơn hàng
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  items: [{
    productId: ObjectId,
    quantity: Number,
    price: Number
  }],
  totalPrice: Number,
  shippingAddress: String,
  paymentMethod: String (enum: ['cod', 'credit_card', 'bank_transfer']),
  status: String (enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: String,
  deliveryDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **Fishermen** - Người bán (ngư dân)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  businessName: String,
  description: String,
  location: String,
  prefecture: String,
  profileImage: String,
  rating: Number,
  totalSales: Number,
  products: [ObjectId] (ref: Product),
  verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **Recipes** - Công thức nấu ăn
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  ingredients: [String],
  instructions: [String],
  imageUrl: String,
  author: String,
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  cookingTime: Number,
  servings: Number,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **Posts** - Bài viết cộng đồng
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  images: [String],
  likes: Number,
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date
  }],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 IV. CÁC TÍNH NĂNG CHÍNH

### Frontend (React)
- [ ] **Trang chủ** - Banner, sản phẩm nổi bật, tin tức
- [ ] **Danh sách sản phẩm** - Lọc, tìm kiếm, phân trang
- [ ] **Chi tiết sản phẩm** - Thông tin, hình ảnh, đánh giá, "thêm giỏ hàng"
- [ ] **Giỏ hàng** - Xem, chỉnh sửa, xóa sản phẩm
- [ ] **Thanh toán** - Nhập địa chỉ, chọn phương thức thanh toán
- [ ] **Đơn hàng** - Xem danh sách, theo dõi
- [ ] **Hồ sơ người dùng** - Chỉnh sửa thông tin, xem đơn hàng
- [ ] **Danh sách ngư dân** - Xem thông tin, liên hệ
- [ ] **Công thức nấu ăn** - Danh sách, chi tiết, tìm kiếm
- [ ] **Cộng đồng** - Xem bài viết, bình luận, tạo bài viết
- [ ] **Xác thực** - Đăng ký, đăng nhập, quên mật khẩu

### Backend (API REST)
- [ ] **Users API** - CRUD người dùng, xác thực
- [ ] **Products API** - CRUD sản phẩm, lọc, tìm kiếm
- [ ] **Orders API** - CRUD đơn hàng, cập nhật trạng thái
- [ ] **Fishermen API** - Thông tin ngư dân, danh sách sản phẩm
- [ ] **Recipes API** - CRUD công thức
- [ ] **Posts API** - CRUD bài viết, bình luận
- [ ] **Auth API** - Đăng ký, đăng nhập, làm mới token
- [ ] **Upload API** - Tải lên hình ảnh

---

## 🔄 V. QUY TRÌNH PHÁT TRIỂN (Phases)

### **Phase 1: Chuẩn Bị (Week 1)**
- [ ] Thiết lập project structure
- [ ] Cấu hình Docker & Docker Compose
- [ ] Cài đặt dependencies
- [ ] Tạo file .env
- [ ] Kết nối MongoDB

**Deliverable:** Project setup hoàn chỉnh, có thể chạy local

---

### **Phase 2: Backend (Week 2-3)**
- [ ] Cấu hình Express server
- [ ] Tạo models MongoDB (Mongoose)
- [ ] Viết authentication (JWT)
- [ ] Tạo routes & controllers
- [ ] Viết middleware validation
- [ ] Tạo seed data

**Deliverable:** API hoàn chỉnh, có thể test bằng Postman

---

### **Phase 3: Frontend (Week 4-5)**
- [ ] Tạo layout components cơ bản
- [ ] Tạo pages chính
- [ ] Kết nối API
- [ ] Xử lý state (Context API / Redux)
- [ ] Styling responsive
- [ ] Tối ưu hóa hiệu suất

**Deliverable:** Frontend hoàn chỉnh, chạy local

---

### **Phase 4: Tích Hợp & Testing (Week 6)**
- [ ] Integration testing
- [ ] E2E testing
- [ ] Bug fixing
- [ ] Performance optimization
- [ ] Security audit

**Deliverable:** Ứng dụng sẵn sàng production

---

### **Phase 5: Deployment (Week 7)**
- [ ] Build Docker images
- [ ] Test Docker Compose
- [ ] Deploy to server
- [ ] Cấu hình domain, SSL
- [ ] Monitoring & logging

**Deliverable:** Ứng dụng chạy trên server

---

## 🐳 VI. DOCKER SETUP

### **docker-compose.yml**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: fisherman_market
    volumes:
      - mongo_data:/data/db
    networks:
      - fisherman-network

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongodb:27017/fisherman_market
      - NODE_ENV=development
      - JWT_SECRET=your_jwt_secret_key
    depends_on:
      - mongodb
    networks:
      - fisherman-network
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000
    depends_on:
      - backend
    networks:
      - fisherman-network
    volumes:
      - ./frontend:/app

volumes:
  mongo_data:

networks:
  fisherman-network:
    driver: bridge
```

---

## 📝 VII. BIẾN MÔI TRƯỜNG (.env)

### **Backend .env**
```
MONGO_URI=mongodb://mongodb:27017/fisherman_market
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
STRIPE_API_KEY=your_stripe_key
```

### **Frontend .env**
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Fisherman Direct Market
```

---

## 🔒 VIII. BẢO MẬT

- [ ] JWT authentication
- [ ] Password hashing (bcrypt)
- [ ] Input validation
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] HTTPS/SSL
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Environment variables protection
- [ ] Secure headers (helmet.js)

---

## 📊 IX. DATABASE MIGRATIONS

### Initial Setup
```javascript
// Seed data creation
- 5 Fishermen
- 50 Products
- 10 Recipes
- Sample Users
```

---

## 🚀 X. HƯỚNG DẪN CHẠY LỐC BỘ

### Yêu cầu
- Docker & Docker Compose
- Node.js 20+
- npm/yarn

### Bước 1: Clone & Setup
```bash
cd fisherman-market
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Bước 2: Run Docker Compose
```bash
docker-compose up -d
```

### Bước 3: Seed Database
```bash
docker-compose exec backend npm run seed
```

### Bước 4: Truy cập
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: mongodb://localhost:27017

---

## 📈 XI. PERFORMANCE TARGETS

| Metric | Target |
|--------|--------|
| **First Contentful Paint** | < 1.5s |
| **Largest Contentful Paint** | < 2.5s |
| **Time to Interactive** | < 3.5s |
| **API Response Time** | < 200ms |
| **Database Query Time** | < 100ms |
| **Page Load Score** | > 90 |

---

## 🎓 XII. TEAM & RESPONSIBILITIES

| Role | Responsibility |
|------|-----------------|
| **Backend Developer** | API, Database, Authentication |
| **Frontend Developer** | UI/UX, Components, Integration |
| **DevOps** | Docker, Deployment, Monitoring |
| **QA** | Testing, Bug Reports |

---

## 📅 XIII. TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| Setup | 1 week | ⏳ Pending |
| Backend | 2 weeks | ⏳ Pending |
| Frontend | 2 weeks | ⏳ Pending |
| Integration | 1 week | ⏳ Pending |
| Deployment | 1 week | ⏳ Pending |
| **Total** | **~7 weeks** | ⏳ |

---

## 📞 XV. LIÊN HỆ & SUPPORT

- **Repository:** [GitHub Link]
- **Documentation:** [Docs Link]
- **Issues:** GitHub Issues
- **Slack Channel:** #fisherman-market

---

**Cập nhật lần cuối:** 03/06/2026  
**Phiên bản:** 1.0
