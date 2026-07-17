# Hướng dẫn chạy kiểm thử

## 1. Cài dependencies

```bash
npm ci
npm ci --prefix backend
npm ci --prefix client
```

## 2. Chạy toàn bộ build + unit/integration test

```bash
npm run test:all
```

Lệnh này không yêu cầu MongoDB, Redis hoặc trình duyệt Playwright đang chạy.

## 3. Chạy coverage backend

```bash
npm run test:cov --prefix backend
```

Báo cáo HTML được tạo tại `backend/coverage/lcov-report/index.html`.

## 4. Chạy E2E giao diện

Cài trình duyệt một lần:

```bash
npx playwright install chromium
```

Sau đó chạy:

```bash
npm run test:e2e
```

E2E mặc định chỉ khởi động frontend nên không cần MongoDB/Redis. Với luồng cần backend:

```bash
E2E_WITH_BACKEND=true npm run test:e2e
```

Trước khi chạy chế độ có backend, cần cấu hình `.env` và bật MongoDB/Redis.
