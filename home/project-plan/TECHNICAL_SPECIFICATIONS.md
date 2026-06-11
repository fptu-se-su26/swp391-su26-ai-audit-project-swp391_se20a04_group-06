# 🔧 TECHNICAL SPECIFICATIONS - Fisherman Direct Market

## I. BACKEND SPECIFICATIONS

### Technology Stack
```
Runtime: Node.js 20.x LTS
Framework: Express.js 4.x
Database: MongoDB 6.0+
ODM: Mongoose 7.x
Authentication: JWT + bcrypt
Validation: Joi
File Upload: Multer
CORS: cors package
Environment: dotenv
```

### API Endpoints Overview

#### Authentication Routes (`/api/auth`)
```
POST   /register              - Register new user
POST   /login                 - Login user
POST   /refresh-token         - Refresh JWT token
POST   /logout                - Logout user
POST   /forgot-password       - Request password reset
POST   /reset-password        - Reset password
```

#### User Routes (`/api/users`)
```
GET    /:id                   - Get user profile
PUT    /:id                   - Update user profile
DELETE /:id                   - Delete user account
GET    /:id/orders           - Get user orders
GET    /:id/wishlist         - Get user wishlist
```

#### Product Routes (`/api/products`)
```
GET    /                      - Get all products (with filters)
GET    /:id                   - Get product detail
POST   /                      - Create product (admin only)
PUT    /:id                   - Update product (admin only)
DELETE /:id                   - Delete product (admin only)
GET    /search?q=keyword      - Search products
GET    /category/:category    - Get products by category
POST   /:id/reviews          - Add product review
```

#### Order Routes (`/api/orders`)
```
GET    /                      - Get user orders
POST   /                      - Create new order
GET    /:id                   - Get order detail
PUT    /:id                   - Update order status (admin only)
DELETE /:id                   - Cancel order
GET    /track/:trackingNumber - Track shipment
```

#### Fisherman Routes (`/api/fishermen`)
```
GET    /                      - Get all fishermen
GET    /:id                   - Get fisherman detail
GET    /:id/products         - Get fisherman's products
POST   /                      - Register as fisherman
PUT    /:id                   - Update fisherman profile
```

#### Recipe Routes (`/api/recipes`)
```
GET    /                      - Get all recipes
GET    /:id                   - Get recipe detail
POST   /                      - Create recipe (admin only)
PUT    /:id                   - Update recipe
DELETE /:id                   - Delete recipe
GET    /search?q=keyword      - Search recipes
```

#### Community Routes (`/api/posts`)
```
GET    /                      - Get all posts
POST   /                      - Create new post
GET    /:id                   - Get post detail
PUT    /:id                   - Update post
DELETE /:id                   - Delete post
POST   /:id/comments         - Add comment
DELETE /:id/comments/:commentId - Delete comment
POST   /:id/like             - Like/unlike post
```

### API Response Format

#### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

#### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "error": {
    "field": "error details"
  }
}
```

### Database Indexes
```javascript
// Users
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "createdAt": -1 })

// Products
db.products.createIndex({ "name": "text" })
db.products.createIndex({ "category": 1 })
db.products.createIndex({ "fishermanId": 1 })
db.products.createIndex({ "price": 1 })

// Orders
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "createdAt": -1 })

// Posts
db.posts.createIndex({ "userId": 1 })
db.posts.createIndex({ "createdAt": -1 })
db.posts.createIndex({ "tags": 1 })
```

### Middleware Stack
```
1. CORS - Enable cross-origin requests
2. Body Parser - Parse JSON/URL-encoded bodies
3. Helmet - Security headers
4. Rate Limiter - Prevent abuse
5. Request Logger - Log all requests
6. Error Handler - Global error handling
```

---

## II. FRONTEND SPECIFICATIONS

### Technology Stack
```
Runtime: Node.js 20.x LTS
Framework: React 18.x
Build Tool: Vite 5.x
Router: React Router 6.x
State Management: Context API
HTTP Client: Axios
CSS: CSS Modules + Tailwind CSS
Icons: React Icons
Form Validation: React Hook Form
```

### Component Structure

#### Layout Components
```
components/
├── Layout.jsx              - Main layout wrapper
├── Header.jsx              - Navigation header
├── Footer.jsx              - Page footer
├── Sidebar.jsx             - Sidebar navigation
└── Loading.jsx             - Loading spinner
```

#### Common Components
```
components/
├── ProductCard.jsx         - Product display card
├── ProductGrid.jsx         - Grid of products
├── Modal.jsx               - Modal dialog
├── Button.jsx              - Reusable button
├── Input.jsx               - Form input
├── Select.jsx              - Dropdown select
├── Pagination.jsx          - Pagination control
├── Breadcrumb.jsx          - Breadcrumb navigation
└── Star-Rating.jsx         - Star rating display
```

#### Page Components
```
pages/
├── Home.jsx                - Home page
├── Products/
│   ├── ProductList.jsx     - Products listing
│   └── ProductDetail.jsx   - Product detail
├── Cart.jsx                - Shopping cart
├── Checkout.jsx            - Checkout page
├── Order.jsx               - Order confirmation
├── Orders.jsx              - Order history
├── Profile.jsx             - User profile
├── Fishermen/
│   ├── List.jsx            - Fishermen list
│   └── Detail.jsx          - Fisherman detail
├── Recipes/
│   ├── List.jsx            - Recipes list
│   └── Detail.jsx          - Recipe detail
├── Community/
│   ├── Feed.jsx            - Community posts feed
│   └── PostDetail.jsx      - Post detail
├── Auth/
│   ├── Login.jsx           - Login page
│   └── Register.jsx        - Registration page
└── NotFound.jsx            - 404 page
```

### Folder Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── product/
│   │   └── ...
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Products/
│   │   ├── Cart.jsx
│   │   └── ...
│   ├── services/
│   │   ├── api.js          - API configuration
│   │   ├── productService.js
│   │   ├── userService.js
│   │   ├── orderService.js
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProduct.js
│   │   ├── useCart.js
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── UserContext.jsx
│   │   └── ThemeContext.jsx
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   ├── responsive.css
│   │   └── ...
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── ...
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── .env.example
├── package.json
├── vite.config.js
└── Dockerfile
```

### State Management (Context API)

#### AuthContext
```javascript
{
  user: null,
  isAuthenticated: false,
  loading: false,
  login: (email, password) => Promise,
  register: (userData) => Promise,
  logout: () => void,
  refreshToken: () => Promise
}
```

#### CartContext
```javascript
{
  items: [],
  totalPrice: 0,
  itemCount: 0,
  addItem: (product, quantity) => void,
  removeItem: (productId) => void,
  updateQuantity: (productId, quantity) => void,
  clearCart: () => void
}
```

#### UserContext
```javascript
{
  profile: null,
  orders: [],
  loading: false,
  fetchProfile: () => Promise,
  updateProfile: (data) => Promise,
  fetchOrders: () => Promise
}
```

### Routing Configuration
```javascript
const routes = [
  { path: '/', element: <Home /> },
  { path: '/products', element: <ProductList /> },
  { path: '/products/:id', element: <ProductDetail /> },
  { path: '/cart', element: <Cart /> },
  { path: '/checkout', element: <Checkout /> },
  { path: '/orders', element: <Orders />, protected: true },
  { path: '/orders/:id', element: <OrderDetail />, protected: true },
  { path: '/profile', element: <Profile />, protected: true },
  { path: '/fishermen', element: <FishermenList /> },
  { path: '/fishermen/:id', element: <FishermanDetail /> },
  { path: '/recipes', element: <RecipeList /> },
  { path: '/recipes/:id', element: <RecipeDetail /> },
  { path: '/community', element: <CommunityFeed /> },
  { path: '/community/:id', element: <PostDetail /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '*', element: <NotFound /> }
];
```

---

## III. DATABASE SPECIFICATIONS

### MongoDB Collections

#### Users Collection
```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "firstName", "role"],
      properties: {
        _id: { bsonType: "objectId" },
        email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
        password: { bsonType: "string", minLength: 6 },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        phone: { bsonType: "string" },
        address: { bsonType: "string" },
        city: { bsonType: "string" },
        prefecture: { bsonType: "string" },
        postalCode: { bsonType: "string" },
        role: { enum: ["user", "admin", "fisherman"] },
        profileImage: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});
```

#### Products Collection Structure
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  quantity: Number,
  imageUrl: String,
  images: [String],
  fishermanId: ObjectId,
  deliveryType: String,
  availableDate: Date,
  rating: Number,
  reviews: [{
    userId: ObjectId,
    rating: Number,
    comment: String,
    createdAt: Date
  }],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Query Performance Tips
1. Always use indexes on frequently searched fields
2. Limit query results with pagination
3. Use projection to return only needed fields
4. Aggregate pipeline for complex queries
5. Cache frequently accessed data

---

## IV. SECURITY SPECIFICATIONS

### Authentication
- JWT tokens with 7-day expiration
- Refresh tokens for extended sessions
- Password hashing with bcrypt (rounds: 10)
- Rate limiting on login endpoints

### Authorization
- Role-based access control (RBAC)
- Three roles: user, admin, fisherman
- Protected routes middleware

### Data Protection
- HTTPS/TLS for all communications
- Input validation and sanitization
- SQL/NoSQL injection prevention
- XSS protection with helmet.js
- CSRF tokens for state-changing operations

### API Security
- CORS configuration (whitelist domains)
- Request size limits
- Rate limiting (100 requests/15 minutes per IP)
- API key rotation for third-party integrations

---

## V. PERFORMANCE SPECIFICATIONS

### Caching Strategy
- Redis cache for frequently accessed data
- Browser caching for static assets
- API response caching (5-minute TTL)

### Optimization Targets
| Metric | Target | Tools |
|--------|--------|-------|
| FCP | < 1.5s | Lighthouse |
| LCP | < 2.5s | Core Web Vitals |
| TTI | < 3.5s | Lighthouse |
| CLS | < 0.1 | Core Web Vitals |
| Lighthouse Score | > 90 | Lighthouse |

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Separate vendor chunks

---

## VI. TESTING SPECIFICATIONS

### Unit Tests
- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library
- Coverage target: > 80%

### Integration Tests
- API integration tests
- Database integration tests
- Full workflow tests

### E2E Tests
- Playwright for browser automation
- User flow testing
- Cross-browser testing

---

## VII. DEPLOYMENT SPECIFICATIONS

### Environment Configurations

#### Development
- MongoDB local instance or atlas dev cluster
- Hot module reloading enabled
- Debug logging enabled
- CORS: all origins

#### Production
- MongoDB atlas production cluster
- Minified assets
- Error tracking (Sentry)
- CORS: specific domains only

### Monitoring
- Application Performance Monitoring (APM)
- Error tracking and reporting
- Uptime monitoring
- Log aggregation (ELK stack or similar)

---

## VIII. API RATE LIMITING

```javascript
// Default: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

// Auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});
```

---

## IX. LOGGING STRATEGY

### Backend Logging Levels
```
ERROR   - Error messages
WARN    - Warning messages
INFO    - General information
DEBUG   - Debug information
TRACE   - Detailed trace information
```

### Log Format
```
[TIMESTAMP] [LEVEL] [SERVICE] [REQUEST_ID] - MESSAGE
```

---

## X. SCALABILITY CONSIDERATIONS

1. **Horizontal Scaling**
   - Stateless API design
   - Load balancer (nginx)
   - Database replication

2. **Caching Layer**
   - Redis for session storage
   - API response caching

3. **Database Optimization**
   - Indexes on common queries
   - Connection pooling
   - Query optimization

4. **CDN**
   - CloudFront or similar for static assets
   - Image optimization

---

**Version:** 1.0  
**Last Updated:** 03/06/2026
