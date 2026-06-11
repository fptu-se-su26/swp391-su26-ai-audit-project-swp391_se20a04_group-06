# 🚀 Getting Started - Fisherman Direct Market

## Prerequisites

Đảm bảo bạn đã cài đặt các phần mềm sau:

- **Docker** (v24.0 trở lên) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0 trở lên) - [Install Compose](https://docs.docker.com/compose/install/)
- **Git** - [Install Git](https://git-scm.com/downloads)
- **Node.js** (v20 LTS) - [Install Node.js](https://nodejs.org/)
- **npm** hoặc **yarn**

## Quick Start (5 phút)

### 1️⃣ Clone Repository & Navigate
```bash
cd fisherman-market
```

### 2️⃣ Setup Environment Files
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3️⃣ Start Services with Docker Compose
```bash
docker-compose up -d
```

Điều này sẽ khởi động:
- ✅ MongoDB (port 27017)
- ✅ Backend API (port 5000)
- ✅ Frontend (port 3000)

### 4️⃣ Seed Database (tùy chọn)
```bash
docker-compose exec backend npm run seed
```

### 5️⃣ Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017

---

## Detailed Setup

### Backend Setup (Local Development)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start development server
npm run dev
```

#### Backend Scripts
```json
{
  "dev": "nodemon src/index.js",
  "start": "node src/index.js",
  "seed": "node scripts/seed.js",
  "test": "jest",
  "lint": "eslint src/"
}
```

### Frontend Setup (Local Development)

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env

# Start development server with Vite
npm run dev
```

#### Frontend Scripts
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "lint": "eslint src/"
}
```

---

## 🐳 Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Stop Services
```bash
docker-compose down
```

### Remove Volumes (delete database)
```bash
docker-compose down -v
```

### Rebuild Images
```bash
docker-compose build --no-cache
```

### Access Container Shell
```bash
# Backend
docker-compose exec backend sh

# MongoDB
docker-compose exec mongodb mongosh
```

---

## 📁 Project Structure

```
fisherman-market/
├── backend/                    # Node.js + Express
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Custom middleware
│   │   └── index.js           # Entry point
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── context/           # Context API
│   │   ├── hooks/             # Custom hooks
│   │   ├── styles/            # CSS files
│   │   └── App.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── docker-compose.yml         # Docker Compose config
├── .gitignore
├── README.md
└── project-plan/              # Deployment documentation
    ├── DEPLOYMENT_PLAN.md
    ├── TASKS.json
    └── TECHNICAL_SPECIFICATIONS.md
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
# Database
MONGO_URI=mongodb://mongodb:27017/fisherman_market
MONGO_USER=admin
MONGO_PASSWORD=password

# Server
NODE_ENV=development
PORT=5000

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Fisherman Direct Market
VITE_APP_VERSION=1.0.0
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📱 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Example API Calls

#### Get All Products
```bash
curl -X GET http://localhost:5000/api/products
```

#### Create Product (Admin Only)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Fresh Tuna",
    "description": "Premium fresh tuna",
    "category": "fish",
    "price": 5000,
    "quantity": 10
  }'
```

#### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔗 Useful URLs During Development

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | React Frontend |
| http://localhost:5000 | Backend API |
| http://localhost:5000/api | API Base URL |
| http://localhost:27017 | MongoDB (local) |

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MongoDB Connection Error
```bash
# Check MongoDB is running
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Frontend Can't Connect to Backend
```bash
# Check backend is running
docker-compose logs backend

# Verify .env has correct API URL
cat frontend/.env
```

### Docker Image Build Failed
```bash
# Rebuild from scratch
docker-compose build --no-cache

# Check Dockerfile syntax
docker build ./backend -t backend-test
```

---

## 📚 Documentation Files

- **[DEPLOYMENT_PLAN.md](./project-plan/DEPLOYMENT_PLAN.md)** - Overall deployment plan
- **[TECHNICAL_SPECIFICATIONS.md](./project-plan/TECHNICAL_SPECIFICATIONS.md)** - Technical details
- **[TASKS.json](./project-plan/TASKS.json)** - Detailed task breakdown
- **[API Documentation](./API.md)** - API endpoint documentation
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute

---

## 🚀 Next Steps

1. ✅ Complete Phase 1: Setup
2. 🔧 Start Phase 2: Backend Development
3. 🎨 Continue with Phase 3: Frontend Development
4. 🧪 Phase 4: Integration & Testing
5. 🌐 Phase 5: Deployment

---

## 💡 Development Tips

### Use Nodemon for Hot Reload (Backend)
```bash
# Already configured in backend
npm run dev
```

### Use Vite Hot Module Replacement (Frontend)
```bash
# Already configured
npm run dev
```

### Debug Backend with Chrome DevTools
```bash
node --inspect=9229 src/index.js
# Go to chrome://inspect
```

### Format Code with Prettier
```bash
# Backend
npm run format

# Frontend
npm run format
```

---

## 📞 Getting Help

- Check documentation in `project-plan/` folder
- Review issue templates on GitHub
- Check console logs: `docker-compose logs`
- Read error messages carefully

---

**Happy Coding! 🎉**

For more information, refer to [DEPLOYMENT_PLAN.md](./project-plan/DEPLOYMENT_PLAN.md)
