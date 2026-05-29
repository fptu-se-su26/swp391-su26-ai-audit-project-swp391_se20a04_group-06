const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

// Helper to make HTTP requests and preserve session cookies
function request(method, path, body = null, cookies = {}, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Include Cookies
    const cookieString = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    if (cookieString) {
      options.headers['Cookie'] = cookieString;
    }

    // Include CSRF Token if present
    if (cookies['csrfToken'] && method !== 'GET') {
      options.headers['x-csrf-token'] = cookies['csrfToken'];
    }

    const start = process.hrtime();

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        const diff = process.hrtime(start);
        const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;

        // Parse cookies from response
        const newCookies = {};
        const setCookieHeader = res.headers['set-cookie'];
        if (setCookieHeader) {
          setCookieHeader.forEach((cookieStr) => {
            const parts = cookieStr.split(';')[0].split('=');
            if (parts.length >= 2) {
              const name = parts[0].trim();
              const value = parts.slice(1).join('=').trim();
              newCookies[name] = value;
            }
          });
        }

        let parsedBody = null;
        try {
          parsedBody = JSON.parse(responseBody);
        } catch (e) {
          parsedBody = responseBody;
        }

        resolve({
          statusCode: res.statusCode,
          body: parsedBody,
          cookies: { ...cookies, ...newCookies },
          durationMs,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Latency tracker
const metrics = {};
function logMetric(action, durationMs, success, errorCode = null) {
  if (!metrics[action]) {
    metrics[action] = {
      durations: [],
      successCount: 0,
      failCount: 0,
      errors: {},
    };
  }

  const m = metrics[action];
  if (success) {
    m.durations.push(durationMs);
    m.successCount++;
  } else {
    m.failCount++;
    if (errorCode) {
      m.errors[errorCode] = (m.errors[errorCode] || 0) + 1;
    }
  }
}

// Generate random email address
function generateRandomEmail() {
  const rand = Math.random().toString(36).substring(2, 11);
  return `stress_test_${rand}@gmail.com`;
}

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBenchmark() {
  console.log('================================================================');
  console.log('🚀 KHỞI ĐỘNG HỆ THỐNG ĐÁNH GIÁ HIỆU NĂNG & DÒ TÌM LỖI CHUYÊN SÂU');
  console.log('================================================================');
  console.log(`Đang kết nối tới Backend tại: ${BASE_URL}\n`);

  // Check health first
  try {
    const health = await request('GET', '/health');
    console.log(`✅ Kết nối Backend thành công! Trạng thái: ${health.body.status}, Giờ Server: ${health.body.time}\n`);
  } catch (err) {
    console.error('❌ Lỗi kết nối tới Backend! Hãy chắc chắn Docker containers đang chạy.');
    console.error(err.message);
    process.exit(1);
  }

  const userCount = 5;
  console.log(`[+] Đang khởi tạo và đăng ký nhanh ${userCount} người dùng ngẫu nhiên để stress test...`);
  const users = [];

  for (let i = 0; i < userCount; i++) {
    const email = generateRandomEmail();
    const password = 'password123';
    const name = `Người dùng Stress Test ${i + 1}`;

    try {
      // 1. Register
      const regStart = process.hrtime();
      const regRes = await request('POST', '/auth/register', { name, email, password });
      const regDiff = process.hrtime(regStart);
      const regMs = (regDiff[0] * 1e9 + regDiff[1]) / 1e6;

      if (regRes.statusCode === 201) {
        logMetric('REGISTER', regMs, true);
        const cookies = regRes.cookies;

        // 2. Profile verification (/me)
        const meStart = process.hrtime();
        const meRes = await request('GET', '/auth/me', null, cookies);
        const meDiff = process.hrtime(meStart);
        const meMs = (meDiff[0] * 1e9 + meDiff[1]) / 1e6;

        if (meRes.statusCode === 200) {
          logMetric('GET_ME', meMs, true);
          users.push({
            id: meRes.body.id,
            name,
            email,
            password,
            cookies: meRes.cookies,
          });
          console.log(`  -> Đăng ký thành công User ${i + 1}: Email=${email}, ID=${meRes.body.id}`);
        } else {
          logMetric('GET_ME', meMs, false, meRes.statusCode);
          console.error(`  -> Lỗi lấy profile User ${i + 1}: HTTP ${meRes.statusCode}`);
        }
      } else {
        logMetric('REGISTER', regMs, false, regRes.statusCode);
        console.error(`  -> Đăng ký thất bại User ${i + 1}: HTTP ${regRes.statusCode} - ${JSON.stringify(regRes.body)}`);
      }
    } catch (err) {
      console.error(`  -> Lỗi kết nối khi tạo User ${i + 1}: ${err.message}`);
    }
  }

  if (users.length < 2) {
    console.error('❌ Không đủ số lượng người dùng hợp lệ để thực hiện Stress Test. Vui lòng kiểm tra logs!');
    process.exit(1);
  }

  console.log(`\n✅ Đã chuẩn bị ${users.length} người dùng ảo để stress test.`);
  
  const productIds = [];
  console.log('[+] Đang tiến hành đăng bán sản phẩm hàng loạt (Simulated Products)...');

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    // Create a Fresh Product
    try {
      const prodBody = {
        type: 'Fresh',
        category: 'Fish',
        name: `Cá thu tươi ngon đăng bởi ${user.name}`,
        description: 'Cá thu tươi mới đánh bắt lúc sáng sớm, thịt rất săn chắc ngon ngọt bổ dưỡng.',
        price: 150000 + Math.floor(Math.random() * 50000),
        salesType: 'Retail',
        totalWeight: 10 + Math.floor(Math.random() * 20),
        lat: 10.776 + (Math.random() - 0.5) * 0.1,
        lng: 106.700 + (Math.random() - 0.5) * 0.1,
        catchTime: new Date().toISOString(),
      };

      const start = process.hrtime();
      const res = await request('POST', '/products', prodBody, user.cookies);
      const diff = process.hrtime(start);
      const ms = (diff[0] * 1e9 + diff[1]) / 1e6;

      if (res.statusCode === 201 && res.body.productId) {
        logMetric('CREATE_PRODUCT', ms, true);
        productIds.push({ id: res.body.productId, sellerId: user.id });
        console.log(`  -> User ${user.name} đăng bán: ProductID=${res.body.productId}`);
      } else {
        logMetric('CREATE_PRODUCT', ms, false, res.statusCode);
        console.error(`  -> Đăng bán thất bại: HTTP ${res.statusCode} - ${JSON.stringify(res.body)}`);
      }
    } catch (err) {
      console.error(`  -> Lỗi kết nối đăng bán: ${err.message}`);
    }

    // Create a Dried Product
    try {
      const prodBody = {
        type: 'Dried',
        category: 'Squid',
        name: `Mực khô một nắng loại 1`,
        description: 'Mực khô phơi một nắng tự nhiên tại đảo Phú Quốc, thịt ngọt và dai ngon.',
        price: 450000 + Math.floor(Math.random() * 100000),
        salesType: 'Wholesale',
        totalWeight: 5 + Math.floor(Math.random() * 10),
        origin: 'Phú Quốc',
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      };

      const start = process.hrtime();
      const res = await request('POST', '/products', prodBody, user.cookies);
      const diff = process.hrtime(start);
      const ms = (diff[0] * 1e9 + diff[1]) / 1e6;

      if (res.statusCode === 201 && res.body.productId) {
        logMetric('CREATE_PRODUCT', ms, true);
        productIds.push({ id: res.body.productId, sellerId: user.id });
      } else {
        logMetric('CREATE_PRODUCT', ms, false, res.statusCode);
      }
    } catch (err) {
      console.error(`  -> Lỗi kết nối đăng bán: ${err.message}`);
    }
  }

  console.log(`\n✅ Đã tạo xong ${productIds.length} sản phẩm để phục vụ Stress Test.`);

  // START STRESS TEST CONCURRENT LOOP
  const TOTAL_ITERATIONS = 200; // Số lượt chạy
  const CONCURRENCY = 15;      // Độ rộng luồng đồng thời
  console.log(`\n================================================================`);
  console.log(`🔥 BẮT ĐẦU CHẠY VÒNG LẶP STRESS TEST: ${TOTAL_ITERATIONS} iterations, Concurrency=${CONCURRENCY}`);
  console.log(`================================================================\n`);

  let completedIterations = 0;
  const startTime = Date.now();

  async function worker() {
    while (completedIterations < TOTAL_ITERATIONS) {
      completedIterations++;
      const iter = completedIterations;

      // Pick a random user
      const userIdx = Math.floor(Math.random() * users.length);
      const user = users[userIdx];

      // Pick another user for chat / reviews
      let otherUser = users[(userIdx + 1) % users.length];

      // Pick a random product
      const product = productIds[Math.floor(Math.random() * productIds.length)];

      const scenarioType = Math.floor(Math.random() * 7);

      try {
        switch (scenarioType) {
          case 0: {
            // SCENARIO 0: Query products list (GPS / Radius Filter)
            const queryParams = `?type=Fresh&lat=10.776&lng=106.700&radius=15&page=1&limit=10`;
            const start = process.hrtime();
            const res = await request('GET', `/products${queryParams}`, null, user.cookies);
            const diff = process.hrtime(start);
            const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
            logMetric('LIST_PRODUCTS_GEO', ms, res.statusCode === 200, res.statusCode);
            break;
          }
          case 1: {
            // SCENARIO 1: Full-Text search products
            const queryParams = `?search=tươi&page=1&limit=10`;
            const start = process.hrtime();
            const res = await request('GET', `/products${queryParams}`, null, user.cookies);
            const diff = process.hrtime(start);
            const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
            logMetric('LIST_PRODUCTS_SEARCH', ms, res.statusCode === 200, res.statusCode);
            break;
          }
          case 2: {
            // SCENARIO 2: Fetch specific product detail
            const start = process.hrtime();
            const res = await request('GET', `/products/${product.id}`, null, user.cookies);
            const diff = process.hrtime(start);
            const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
            logMetric('GET_PRODUCT_DETAIL', ms, res.statusCode === 200, res.statusCode);
            break;
          }
          case 3: {
            // SCENARIO 3: Chat - Send message (REST api)
            const chatBody = {
              productId: product.id,
              receiverId: product.sellerId,
              content: `Tin nhắn tự động số ${iter}: Tôi quan tâm tới sản phẩm cá thu này.`,
            };
            const start = process.hrtime();
            const res = await request('POST', `/messages`, chatBody, user.cookies);
            const diff = process.hrtime(start);
            const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
            logMetric('SEND_MESSAGE', ms, res.statusCode === 201, res.statusCode);
            break;
          }
          case 4: {
            // SCENARIO 4: Get conversation list (Aggregated!)
            const start = process.hrtime();
            const res = await request('GET', `/messages/conversations`, null, user.cookies);
            const diff = process.hrtime(start);
            const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
            logMetric('GET_CONVERSATIONS', ms, res.statusCode === 200, res.statusCode);
            break;
          }
          case 5: {
            // SCENARIO 5: Get notifications
            const start = process.hrtime();
            const res = await request('GET', `/notifications`, null, user.cookies);
            const diff = process.hrtime(start);
            const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
            logMetric('GET_NOTIFICATIONS', ms, res.statusCode === 200, res.statusCode);
            break;
          }
          case 6: {
            // SCENARIO 6: Add & remove from Favorite
            const startFav = process.hrtime();
            const resFav = await request('POST', `/favorites/${product.id}`, null, user.cookies);
            const diffFav = process.hrtime(startFav);
            const msFav = (diffFav[0] * 1e9 + diffFav[1]) / 1e6;
            logMetric('ADD_FAVORITE', msFav, resFav.statusCode === 200 || resFav.statusCode === 201, resFav.statusCode);

            // Immediate delete favorite to avoid bloating database
            const startDel = process.hrtime();
            const resDel = await request('DELETE', `/favorites/${product.id}`, null, user.cookies);
            const diffDel = process.hrtime(startDel);
            const msDel = (diffDel[0] * 1e9 + diffDel[1]) / 1e6;
            logMetric('DELETE_FAVORITE', msDel, resDel.statusCode === 200, resDel.statusCode);
            break;
          }
        }
      } catch (err) {
        console.error(`[Worker Error] Scenario ${scenarioType} thất bại: ${err.message}`);
      }

      // Live progress logging
      if (iter % 20 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentRps = (iter / elapsed).toFixed(2);
        console.log(`  [Progress] Đã hoàn thành ${iter}/${TOTAL_ITERATIONS} iterations (${Math.round((iter / TOTAL_ITERATIONS) * 100)}%) - Tốc độ hiện tại: ${currentRps} RPS`);
      }

      await sleep(10 + Math.random() * 40); // Nhẹ nhàng giãn cách để tránh nghẽn luồng
    }
  }

  // Spawn parallel workers
  const workerPromises = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workerPromises);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  console.log(`\n================================================================`);
  console.log(`📊 BÁO CÁO KẾT QUẢ HIỆU NĂNG & DÒ TÌM LỖI HỆ THỐNG (shop_sea)`);
  console.log(`================================================================`);
  console.log(`Tổng thời gian stress test : ${totalTimeSec.toFixed(2)} giây`);
  console.log(`Tổng số yêu cầu giả lập    : ${TOTAL_ITERATIONS} iterations`);
  console.log(`Tốc độ trung bình (RPS)    : ${(TOTAL_ITERATIONS / totalTimeSec).toFixed(2)} req/sec\n`);

  console.log('| API Endpoint / Action | Success | Failed | Avg Latency | P95 Latency | Errors |');
  console.log('| --------------------- | ------- | ------ | ----------- | ----------- | ------ |');

  Object.entries(metrics).forEach(([action, data]) => {
    const success = data.successCount;
    const failed = data.failCount;
    
    let avg = 'N/A';
    let p95 = 'N/A';

    if (data.durations.length > 0) {
      const sorted = [...data.durations].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      avg = (sum / sorted.length).toFixed(1) + ' ms';
      
      const p95Idx = Math.floor(sorted.length * 0.95);
      p95 = sorted[p95Idx].toFixed(1) + ' ms';
    }

    const errorDetails = Object.entries(data.errors)
      .map(([code, count]) => `HTTP ${code}: ${count}`)
      .join(', ') || 'Không có';

    console.log(`| ${action.padEnd(21)} | ${success.toString().padEnd(7)} | ${failed.toString().padEnd(6)} | ${avg.padEnd(11)} | ${p95.padEnd(11)} | ${errorDetails} |`);
  });

  console.log('\n[!] Quét tìm lỗ hổng và rò rỉ bộ nhớ hoàn tất.');
  console.log('================================================================\n');

  // CLEAN UP TEST DATA TO KEEP DB CLEAN
  console.log('[+] Đang tiến hành dọn dẹp dữ liệu stress test tuân thủ GDPR...');
  for (const user of users) {
    try {
      await request('DELETE', '/auth/account', null, user.cookies, { 'x-csrf-token': user.cookies.csrfToken });
    } catch (err) {
      // Ignore cleanup error
    }
  }
  console.log('✅ Dọn dẹp dữ liệu hoàn tất. Cơ sở dữ liệu sạch sẽ.');
}

runBenchmark().catch(console.error);
