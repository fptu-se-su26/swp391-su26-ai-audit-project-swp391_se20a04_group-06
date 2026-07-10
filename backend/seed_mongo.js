const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/seafood_db";
async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding");

    const collections = await mongoose.connection.db
      .listCollections({}, { nameOnly: true })
      .toArray();
    for (const { name } of collections) {
      if (name.startsWith("system.")) continue;
      const count = await mongoose.connection.db
        .collection(name)
        .estimatedDocumentCount();
      if (count > 0) {
        console.log(
          `Seed skipped: collection "${name}" already contains data. No records were deleted.`,
        );
        return;
      }
    }

    const passwordHash =
      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/"; // password123

    // Insert Users
    const usersData = [
      {
        name: "Admin",
        email: "admin@haisan.vn",
        passwordHash,
        role: "Admin",
        isActive: true,
        isVerified: true,
      },
      {
        name: "Nguyễn Văn Bình",
        email: "binh@haisan.vn",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: true,
      },
      {
        name: "Trần Thị Lan",
        email: "lan@haisan.vn",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: true,
      },
      {
        name: "Lê Minh Tuấn",
        email: "tuan@haisan.vn",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: true,
      },
      {
        name: "Phạm Thu Hương",
        email: "huong@haisan.vn",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: true,
      },
      {
        name: "Võ Thị Mai",
        email: "mai@haisan.vn",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: true,
      },
      {
        name: "Nguyễn Văn An",
        email: "an@haisan.vn",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: true,
      },
      {
        name: "Trần Văn Dũng",
        email: "dung@haisan.vn",
        passwordHash,
        role: "User",
        isActive: true,
        isVerified: true,
      },
    ];

    const usersResult = await mongoose.connection.db
      .collection("users")
      .insertMany(usersData);
    console.log(`Inserted ${usersResult.insertedCount} users`);

    // Get user IDs
    const users = await mongoose.connection.db
      .collection("users")
      .find()
      .toArray();
    const binhId = users.find((u) => u.name === "Nguyễn Văn Bình")._id;
    const lanId = users.find((u) => u.name === "Trần Thị Lan")._id;
    const tuanId = users.find((u) => u.name === "Lê Minh Tuấn")._id;
    const huongId = users.find((u) => u.name === "Phạm Thu Hương")._id;
    const maiId = users.find((u) => u.name === "Võ Thị Mai")._id;
    const anId = users.find((u) => u.name === "Nguyễn Văn An")._id;
    const dungId = users.find((u) => u.name === "Trần Văn Dũng")._id;

    // Insert Products
    const productsData = [
      {
        sellerId: binhId,
        type: "Fresh",
        category: "Fish",
        name: "Cá Thu Tươi Đồ Sơn",
        description:
          "Cá thu vừa cập bến Hải Phòng, còn tươi nguyên. Thịt chắc, ngọt nước. Hỗ trợ cắt lát cho gia đình.",
        price: 180000,
        salesType: "Retail",
        totalWeight: 50,
        remainingWeight: 38,
        status: "Active",
        catchTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        location: { type: "Point", coordinates: [106.6881, 20.8449] }, // [lng, lat]
        images: [
          "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 15,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sellerId: lanId,
        type: "Fresh",
        category: "Shrimp",
        name: "Tôm Hùm Bông Khánh Hòa",
        description:
          "Tôm hùm bông sống, cam kết bơi lội khỏe mạnh. Vận chuyển toàn quốc bằng bình oxy.",
        price: 850000,
        salesType: "Retail",
        totalWeight: 20,
        remainingWeight: 12,
        status: "Active",
        catchTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        location: { type: "Point", coordinates: [109.2197, 12.2388] },
        images: [
          "https://images.unsplash.com/photo-1559737607-35789393fad9?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 42,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sellerId: tuanId,
        type: "Fresh",
        category: "Crab",
        name: "Cua Biển Cà Mau Gạch Son",
        description:
          "Cua biển gạch son Cà Mau chính gốc, dây trói siêu nhỏ. Cua nhiều gạch ngọt béo.",
        price: 320000,
        salesType: "Wholesale",
        totalWeight: 30,
        remainingWeight: 30,
        status: "Active",
        catchTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        location: { type: "Point", coordinates: [104.9089, 9.1764] },
        images: [
          "https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 28,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sellerId: binhId,
        type: "Fresh",
        category: "Squid",
        name: "Mực Ống Tươi Côn Đảo",
        description:
          "Mực ống nháy Côn Đảo, cấp đông nhanh trên tàu. Da mực còn lóng lánh nhấp nháy.",
        price: 150000,
        salesType: "Retail",
        totalWeight: 40,
        remainingWeight: 40,
        status: "Active",
        catchTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        location: { type: "Point", coordinates: [106.6083, 8.6811] },
        images: [
          "https://images.unsplash.com/photo-1616781296184-25e2e8e3919e?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 9,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sellerId: huongId,
        type: "Dried",
        category: "Squid",
        name: "Mực Khô Phú Quốc Loại 1",
        description:
          "Mực một nắng Phú Quốc phơi từ mực ống tươi roi rói. Thịt mềm ngọt, không dai cứng.",
        price: 680000,
        salesType: "Retail",
        totalWeight: 100,
        remainingWeight: 75,
        status: "Active",
        origin: "Phú Quốc",
        expiryDate: new Date("2026-12-31"),
        images: [
          "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 50,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sellerId: maiId,
        type: "Dried",
        category: "Fish",
        name: "Cá Thiều Khô Bình Thuận",
        description:
          "Cá thiều khô tẩm gia vị truyền thống phơi 2 nắng. Miếng cá dày thịt thơm ngọt.",
        price: 280000,
        salesType: "Retail",
        totalWeight: 50,
        remainingWeight: 50,
        status: "Active",
        origin: "Bình Thuận",
        expiryDate: new Date("2026-03-15"),
        images: [
          "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 11,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sellerId: anId,
        type: "Dried",
        category: "Shrimp",
        name: "Tôm Khô Đất Cà Mau",
        description:
          "Tôm đất khô làm thủ công từ tôm đất tự nhiên sông Đốc Cà Mau. Màu đỏ gạch tự nhiên.",
        price: 420000,
        salesType: "Retail",
        totalWeight: 30,
        remainingWeight: 20,
        status: "Active",
        origin: "Cà Mau",
        expiryDate: new Date("2025-09-30"),
        images: [
          "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 30,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        sellerId: dungId,
        type: "Dried",
        category: "Fish",
        name: "Cá Cơm Khô Nha Trang",
        description:
          "Cá cơm phơi khô giòn, thích hợp làm món rim tỏi ớt hoặc kho tiêu ngon cơm.",
        price: 180000,
        salesType: "Retail",
        totalWeight: 20,
        remainingWeight: 18,
        status: "Active",
        origin: "Nha Trang",
        expiryDate: new Date("2025-08-20"),
        images: [
          "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=600&q=80",
        ],
        viewCount: 7,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const productsResult = await mongoose.connection.db
      .collection("products")
      .insertMany(productsData);
    console.log(`Inserted ${productsResult.insertedCount} products`);

    // Insert Messages
    const firstProduct = await mongoose.connection.db
      .collection("products")
      .findOne({ name: "Cá Thu Tươi Đồ Sơn" });
    const messagesData = [
      {
        productId: firstProduct._id,
        senderId: lanId,
        receiverId: binhId,
        content: "Bác ơi cá thu còn không?",
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        productId: firstProduct._id,
        senderId: binhId,
        receiverId: lanId,
        content: "Còn bác ơi, còn khoảng 38kg",
        isRead: false,
        createdAt: new Date(Date.now() - 28 * 60 * 1000),
      },
      {
        productId: firstProduct._id,
        senderId: lanId,
        receiverId: binhId,
        content: "Mua 5kg giá bao nhiêu?",
        isRead: false,
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
      },
    ];

    const messagesResult = await mongoose.connection.db
      .collection("messages")
      .insertMany(messagesData);
    console.log(`Inserted ${messagesResult.insertedCount} messages`);

    // Get admin ID
    const adminId = users.find((u) => u.name === "Admin")._id;



    // Insert Recipes
    const recipesData = [
      {
        title: "Mực ống nhúng giấm giòn sần sật",
        description:
          "Món ăn dân dã dễ chế biến giúp giữ nguyên vị ngọt đậm đà tự nhiên của mực ống tươi nháy.",
        ingredients: [
          "500g Mực ống tươi",
          "300ml Giấm gạo",
          "1 củ Hành tây",
          "Sả, ớt, gừng, tỏi",
          "Rau thơm, chuối chát, khế chua",
        ],
        instructions: [
          "Làm sạch mực ống, cắt khoanh vừa ăn (hoặc để nguyên con nếu mực nhỏ).",
          "Đun sôi hỗn hợp giấm gạo cùng sả đập dập, hành tây xắt múi cau, gừng thái chỉ và một chút đường, bột nêm.",
          "Khi nước dùng sôi sùng sục, nhúng nhanh mực ống vào khoảng 1-2 phút cho mực vừa chín tới, xoăn nhẹ.",
          "Vớt mực ra cuốn kèm rau sống, khế chua, chuối chát và chấm nước mắm gừng cay nồng.",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=600&q=80",
        authorId: binhId, // Nguyễn Văn Bình (Ngư dân)
        difficulty: "Easy",
        cookingTime: 20,
        servings: 4,
        tags: ["mực", "nhúng giấm", "ngư dân chia sẻ", "món lẩu"],
        likes: [lanId, tuanId],
        viewCount: 142,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Cua biển hấp bia sả sành điệu",
        description:
          "Bí quyết hấp cua biển ngọt thịt, thơm ngậy không tanh từ đầu bếp HảiSản.vn.",
        ingredients: [
          "2 con Cua biển Cà Mau",
          "1 lon Bia",
          "5 cây Sả",
          "Gia vị chấm: Muối tiêu chanh hoặc nước sốt ớt xanh",
        ],
        instructions: [
          "Dùng dao nhọn đâm nhẹ vào ức cua dưới yếm để cua chết lâm sàng, rửa sạch bùn đất.",
          "Xếp sả đập dập xuống đáy xửng hấp, xếp cua lên trên yếm ngửa lên trên để giữ nước ngọt.",
          "Đổ 1 lon bia xuống phần nồi đun dưới xửng hấp.",
          "Đậy vung kín, hấp lửa lớn trong 15-20 phút đến khi vỏ cua chuyển màu đỏ cam rực rỡ.",
          "Thưởng thức nóng cùng muối tiêu chanh hoặc sốt ớt xanh.",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=600&q=80",
        authorId: adminId, // Admin
        difficulty: "Medium",
        cookingTime: 25,
        servings: 2,
        tags: ["cua biển", "hấp bia", "đầu bếp chia sẻ"],
        likes: [binhId],
        viewCount: 310,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const recipesResult = await mongoose.connection.db
      .collection("recipes")
      .insertMany(recipesData);
    console.log(`Inserted ${recipesResult.insertedCount} recipes`);

    // Insert Posts
    const postsData = [
      {
        userId: lanId,
        userName: "Trần Thị Lan",
        userAvatar: null,
        title: "Mẻ cá thu hôm nay ngon quá xá các bác ơi!",
        content:
          "Vừa nhận được 2kg cá thu cắt lát của bác Bình chuyển lên sáng nay. Cá thịt dai ngọt cực kỳ, chiên sốt cà chua đưa cơm dã man. Cảm ơn bác Bình nhé!",
        images: [
          "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
        ],
        likes: [binhId, tuanId],
        comments: [
          {
            userId: binhId,
            userName: "Nguyễn Văn Bình",
            userAvatar: null,
            text: "Cảm ơn cô Lan đã tin tưởng ủng hộ mẻ cá của tôi! Chúc gia đình ngon miệng nhé.",
            createdAt: new Date(),
          },
        ],
        tags: ["cá thu", "mâm cơm gia đình", "đánh giá tốt"],
        viewCount: 55,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: tuanId,
        userName: "Lê Minh Tuấn",
        userAvatar: null,
        title: "Lần đầu trải nghiệm gói Hộp định kỳ Hải sản Omakase",
        content:
          "Mới nhận hộp định kỳ tuần này từ HảiSản.vn. Bên trong có 1 con cá song biển đỏ tươi rói khoảng 1.2kg, thêm nửa cân tôm rằn và nghêu lụa sạch cát. Hải sản bọc đá xay cứng ngắc mát lạnh cực kỳ. Quá tiện cho nhà bận rộn!",
        images: [
          "https://images.unsplash.com/photo-1559737607-35789393fad9?auto=format&fit=crop&w=600&q=80",
        ],
        likes: [lanId],
        comments: [
          {
            userId: adminId,
            userName: "Admin",
            userAvatar: null,
            text: "Cảm ơn anh Tuấn đã ủng hộ mô hình Định kỳ Teikibin của HTX ngư dân! Chúc anh nấu được nhiều món ngon.",
            createdAt: new Date(),
          },
        ],
        tags: ["omakase", "định kỳ", "review thực tế"],
        viewCount: 88,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const postsResult = await mongoose.connection.db
      .collection("posts")
      .insertMany(postsData);
    console.log(`Inserted ${postsResult.insertedCount} posts`);

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
