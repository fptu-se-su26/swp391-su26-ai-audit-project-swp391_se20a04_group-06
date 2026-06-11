# 📋 Fisherman Direct Market - Project Overview

🎣 **An e-commerce platform connecting fishermen directly with consumers for fresh seafood delivery**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-24.x-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📖 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Phases & Timeline](#phases--timeline)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## ✨ Features

### 🛒 For Customers
- ✅ Browse fresh seafood products
- ✅ Filter by category, delivery type, price
- ✅ View fisherman profiles and background
- ✅ Add to cart and checkout
- ✅ Track orders in real-time
- ✅ Read and write product reviews
- ✅ View recipes and cooking tips
- ✅ Participate in community discussions
- ✅ Save wishlists
- ✅ Multiple payment methods (COD, Credit Card, Bank Transfer)

### 🐟 For Fishermen (Sellers)
- ✅ Create and manage product listings
- ✅ Set delivery dates and types
- ✅ Track sales and revenue
- ✅ Communicate with customers
- ✅ View analytics and reports
- ✅ Manage inventory

### 👨‍💼 For Admins
- ✅ Manage users, fishermen, products
- ✅ View sales reports and analytics
- ✅ Moderate community posts
- ✅ Manage recipes and content
- ✅ Handle customer support tickets

---

## 🛠️ Tech Stack

### Backend
```
- Runtime: Node.js 20.x LTS
- Framework: Express.js 4.x
- Database: MongoDB 6.0+
- ODM: Mongoose 7.x
- Authentication: JWT + bcrypt
- Validation: Joi
- File Upload: Multer
```

### Frontend
```
- Framework: React 18.x
- Build Tool: Vite 5.x
- Router: React Router 6.x
- State: Context API
- HTTP: Axios
- CSS: Tailwind CSS
- Form: React Hook Form
```

### DevOps
```
- Container: Docker 24.x
- Orchestration: Docker Compose 2.x
- Cloud: AWS/Heroku/DigitalOcean (flexible)
- CI/CD: GitHub Actions (optional)
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- Node.js 20+

### 5-Minute Setup
```bash
# 1. Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Start services
docker-compose up -d

# 3. Seed database (optional)
docker-compose exec backend npm run seed

# 4. Access
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

For detailed setup, see [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## 📁 Project Structure

```
fisherman-market/
├── backend/                         # Node.js + Express Backend
│   ├── src/
│   │   ├── config/                 # Configuration
│   │   │   ├── database.js
│   │   │   └── env.js
│   │   ├── models/                 # Mongoose Schemas
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Order.js
│   │   │   ├── Fisherman.js
│   │   │   ├── Recipe.js
│   │   │   └── Post.js
│   │   ├── routes/                 # API Routes
│   │   │   ├── users.js
│   │   │   ├── products.js
│   │   │   ├── orders.js
│   │   │   ├── fishermen.js
│   │   │   ├── recipes.js
│   │   │   └── posts.js
│   │   ├── controllers/            # Route Handlers
│   │   ├── middleware/             # Custom Middleware
│   │   └── index.js                # Entry Point
│   ├── .env.example
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                        # React + Vite Frontend
│   ├── src/
│   │   ├── components/             # Reusable Components
│   │   ├── pages/                  # Page Components
│   │   ├── services/               # API Services
│   │   ├── hooks/                  # Custom Hooks
│   │   ├── context/                # Context API
│   │   ├── styles/                 # CSS Files
│   │   └── App.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── README.md
│
├── docker-compose.yml              # Docker Compose Config
├── .gitignore
├── README.md                        # This file
├── GETTING_STARTED.md              # Setup Guide
└── project-plan/                   # Documentation
    ├── DEPLOYMENT_PLAN.md          # Overall Plan
    ├── TECHNICAL_SPECIFICATIONS.md # Technical Details
    └── TASKS.json                  # Task Breakdown
```

---

## 📅 Phases & Timeline

| Phase | Duration | Focus |
|-------|----------|-------|
| **1: Setup** | 1 week | Project initialization, Docker setup |
| **2: Backend** | 2 weeks | API development, Database, Authentication |
| **3: Frontend** | 2 weeks | React components, Pages, Integration |
| **4: Integration** | 1 week | Testing, Optimization, Bug fixes |
| **5: Deployment** | 1 week | Production setup, Monitoring |
| **Total** | ~7 weeks | Ready for production |

**Total Tasks: 67** (48 HIGH, 17 MEDIUM, 2 LOW priority)

For detailed task breakdown, see [DEPLOYMENT_PLAN.md](./project-plan/DEPLOYMENT_PLAN.md)

---

## 🗄️ Database Schema

### Core Collections

#### Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,
  address: String,
  role: String (enum: ['user', 'admin', 'fisherman']),
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Products
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Number,
  quantity: Number,
  images: [String],
  fishermanId: ObjectId,
  deliveryType: String (enum: ['date-specified', 'as-available', 'subscription']),
  rating: Number,
  reviews: [Object],
  tags: [String],
  createdAt: Date
}
```

#### Orders
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  items: [{productId, quantity, price}],
  totalPrice: Number,
  shippingAddress: String,
  paymentMethod: String,
  status: String (enum: ['pending', 'confirmed', 'shipped', 'delivered']),
  trackingNumber: String,
  createdAt: Date
}
```

#### Fishermen
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  businessName: String,
  description: String,
  location: String,
  profileImage: String,
  rating: Number,
  totalSales: Number,
  verified: Boolean,
  createdAt: Date
}
```

#### Recipes
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  ingredients: [String],
  instructions: [String],
  imageUrl: String,
  author: String,
  difficulty: String,
  cookingTime: Number,
  tags: [String],
  createdAt: Date
}
```

#### Posts (Community)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  content: String,
  images: [String],
  likes: Number,
  comments: [{userId, text, createdAt}],
  tags: [String],
  createdAt: Date
}
```

---

## 🔌 API Overview

### Base URL
```
http://localhost:5000/api
```

### Main Endpoints

#### Authentication
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
```

#### Products
```
GET    /products              # Get all products
GET    /products/:id          # Get product detail
POST   /products              # Create product (admin)
PUT    /products/:id          # Update product
DELETE /products/:id          # Delete product
GET    /products/search       # Search products
```

#### Orders
```
GET    /orders                # Get user orders
POST   /orders                # Create new order
GET    /orders/:id            # Get order detail
PUT    /orders/:id            # Update order
```

#### Users
```
GET    /users/:id             # Get profile
PUT    /users/:id             # Update profile
DELETE /users/:id             # Delete account
```

#### Fishermen
```
GET    /fishermen             # Get all fishermen
GET    /fishermen/:id         # Get fisherman detail
GET    /fishermen/:id/products
```

#### Recipes
```
GET    /recipes               # Get all recipes
GET    /recipes/:id           # Get recipe detail
POST   /recipes               # Create recipe (admin)
```

#### Posts (Community)
```
GET    /posts                 # Get all posts
POST   /posts                 # Create post
GET    /posts/:id             # Get post detail
POST   /posts/:id/comments    # Add comment
```

For full API documentation, see [API.md](./project-plan/API.md)

---

## 🐳 Docker & Deployment

### Docker Compose Services
```yaml
- mongodb       # NoSQL Database
- backend       # Node.js + Express API
- frontend      # React Application
```

### Common Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Access container
docker-compose exec backend sh
```

### Production Deployment
See [DEPLOYMENT_PLAN.md](./project-plan/DEPLOYMENT_PLAN.md) for:
- Cloud setup (AWS, Heroku, DigitalOcean)
- CI/CD pipeline
- Database backups
- Monitoring & logging
- SSL/TLS configuration

---

## 🧪 Testing

### Backend
```bash
cd backend
npm run test              # Run all tests
npm run test:coverage    # With coverage report
npm run test:watch      # Watch mode
```

### Frontend
```bash
cd frontend
npm run test             # Run all tests
npm run test:coverage   # With coverage report
npm run test:watch     # Watch mode
```

---

## 📊 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | 🎯 |
| Largest Contentful Paint | < 2.5s | 🎯 |
| Time to Interactive | < 3.5s | 🎯 |
| Lighthouse Score | > 90 | 🎯 |

---

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Rate limiting on API endpoints
- ✅ HTTPS/SSL support
- ✅ XSS protection with Helmet.js
- ✅ SQL/NoSQL injection prevention
- ✅ CSRF token protection
- ✅ Environment variables protection

---

## 📈 Scalability

The architecture supports:
- **Horizontal Scaling**: Stateless API design
- **Database Scaling**: MongoDB replication
- **Caching**: Redis for session storage
- **CDN**: CloudFront for static assets
- **Load Balancing**: Nginx or cloud load balancer

---

## 📝 Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Setup & local development
- **[DEPLOYMENT_PLAN.md](./project-plan/DEPLOYMENT_PLAN.md)** - Full deployment plan & timeline
- **[TECHNICAL_SPECIFICATIONS.md](./project-plan/TECHNICAL_SPECIFICATIONS.md)** - Technical details
- **[TASKS.json](./project-plan/TASKS.json)** - Detailed task breakdown
- **[backend/README.md](./backend/README.md)** - Backend documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend documentation

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

### Code Standards
- Use ESLint for code style
- Write tests for new features
- Follow commit message conventions
- Keep components small and focused

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- 📧 Email: support@fishermanmarket.com
- 💬 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📚 Wiki: [GitHub Wiki](https://github.com/your-repo/wiki)
- 💼 Discord: [Community Server](https://discord.gg/your-server)

---

## 🎉 Acknowledgments

- Original website design from umai.fish
- Built with modern web technologies
- Inspired by direct-to-consumer marketplaces

---

**Last Updated:** June 3, 2026  
**Version:** 1.0.0  
**Status:** 🚀 Ready for Development

---

<div align="center">

**[⬆ back to top](#table-of-contents)**

Made with ❤️ by the Fisherman Direct Market Team

</div>
