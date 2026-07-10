// Import thư viện mongoose để tương tác với cơ sở dữ liệu MongoDB
import mongoose from "mongoose";
// Import logger phục vụ ghi log hệ thống
import { logger } from "./utils/logger";
import { User } from "./models/User";
import { Product } from "./models/Product";
import { Recipe } from "./models/Recipe";
import { Post } from "./models/Post";
import bcrypt from "bcryptjs";

const seedDatabase = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // Không seed nếu bất kỳ collection nghiệp vụ nào đã có dữ liệu.
    // Điều này bảo vệ dữ liệu thật kể cả khi collection users vô tình trống.
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    for (const { name } of collections) {
      if (name.startsWith("system.")) continue;
      if ((await db.collection(name).estimatedDocumentCount()) > 0) return;
    }

    logger.info("🌱 Database is empty. Seeding fallback database data...");
    const hash = bcrypt.hashSync("123456", 10);

    // 1. Seed Users
    const admin = await User.create({
      name: "Tô Minh Cường",
      email: "tominhcuong5g@gmail.com",
      passwordHash: hash,
      role: "Admin",
      isVerified: true,
      isPremium: true,
    });

    const s1 = await User.create({
      name: "Tàu Cô Ba Cần Giờ",
      email: "seller1@haisan.vn",
      passwordHash: hash,
      role: "User",
      isVerified: true,
      isPremium: true,
      badges: ["Nguồn gốc rõ", "Giao nhanh"],
    });

    const s2 = await User.create({
      name: "Vựa Biển Bạc Liêu",
      email: "seller2@haisan.vn",
      passwordHash: hash,
      role: "User",
      isVerified: true,
      isPremium: false,
      badges: ["Đánh bắt trong ngày"],
    });

    const s3 = await User.create({
      name: "Làng Chài Phú Quốc",
      email: "seller3@haisan.vn",
      passwordHash: hash,
      role: "User",
      isVerified: true,
      isPremium: true,
      badges: ["Premium", "Đóng gói hút chân không"],
    });

    const s4 = await User.create({
      name: "Thuyền Nhà Trần",
      email: "seller4@haisan.vn",
      passwordHash: hash,
      role: "User",
      isVerified: true,
      isPremium: false,
      badges: ["Giá sỉ"],
    });

    const b1 = await User.create({
      name: "Buyer Minh",
      email: "buyer.minh@haisan.vn",
      passwordHash: hash,
      role: "User",
      isVerified: false,
      isPremium: false,
    });

    const b2 = await User.create({
      name: "Bếp Mộc",
      email: "bepmoc@haisan.vn",
      passwordHash: hash,
      role: "User",
      isVerified: false,
      isPremium: false,
    });

    // 2. Seed Products
    await Product.create([
      {
        sellerId: s1._id,
        type: "Fresh",
        category: "Crab",
        name: "Cua gạch Cần Giờ",
        description: "Mẻ cua gạch chắc thịt, còn sống, giao trong buổi sáng.",
        price: 360000,
        salesType: "Retail",
        totalWeight: 24,
        remainingWeight: 11,
        status: "Active",
        origin: "Cần Giờ, TP.HCM",
        location: { type: "Point", coordinates: [106.9583, 10.4233] },
        images: [],
        viewCount: 189,
      },
      {
        sellerId: s2._id,
        type: "Fresh",
        category: "Shrimp",
        name: "Tôm sú oxy",
        description: "Tôm sú size lớn, đóng thùng xốp có oxy cho đơn nội thành.",
        price: 285000,
        salesType: "Wholesale",
        totalWeight: 60,
        remainingWeight: 38,
        status: "Active",
        origin: "Bạc Liêu",
        location: { type: "Point", coordinates: [105.7244, 9.2941] },
        images: [],
        viewCount: 96,
      },
      {
        sellerId: s3._id,
        type: "Dried",
        category: "Squid",
        name: "Mực một nắng Phú Quốc",
        description: "Mực câu phơi một nắng, vị ngọt đậm, hợp nướng hoặc rim me.",
        price: 520000,
        salesType: "Retail",
        totalWeight: 18,
        remainingWeight: 8,
        status: "Active",
        origin: "Phú Quốc, Kiên Giang",
        location: { type: "Point", coordinates: [103.9608, 10.2289] },
        images: [],
        viewCount: 241,
      },
      {
        sellerId: s4._id,
        type: "Fresh",
        category: "Fish",
        name: "Cá thu cắt khoanh",
        description: "Cá thu vừa cập bến, cắt khoanh theo yêu cầu, phù hợp quán ăn.",
        price: 210000,
        salesType: "Wholesale",
        totalWeight: 80,
        remainingWeight: 53,
        status: "Active",
        origin: "Nha Trang, Khánh Hòa",
        location: { type: "Point", coordinates: [109.1967, 12.2389] },
        images: [],
        viewCount: 73,
      },
    ]);

    // 3. Seed Recipes
    await Recipe.create([
      {
        title: "Cua hấp sả gừng",
        description: "Giữ vị ngọt của cua sống, ăn cùng muối tiêu chanh.",
        ingredients: ["Cua gạch Cần Giờ", "Sả", "Gừng"],
        instructions: ["Rửa sạch cua", "Hấp cua cùng sả gừng trong 15 phút", "Thưởng thức"],
        authorId: s1._id,
        difficulty: "Easy",
        cookingTime: 25,
        servings: 3,
        tags: ["Cua", "Hấp"],
        likes: [b1._id, b2._id],
        viewCount: 420,
      },
      {
        title: "Mực một nắng rim me",
        description: "Món nhắm chua ngọt, làm nhanh trên chảo nóng.",
        ingredients: ["Mực một nắng", "Nước sốt me", "Tỏi", "Ớt"],
        instructions: ["Cắt mực vừa ăn", "Phi thơm tỏi ớt", "Cho mực và nước sốt me vào rim sệt"],
        authorId: s3._id,
        difficulty: "Medium",
        cookingTime: 35,
        servings: 4,
        tags: ["Mực", "Rim"],
        likes: [b1._id],
        viewCount: 315,
      },
      {
        title: "Lẩu cá thu chua cay",
        description: "Nước dùng trong, cay nhẹ, hợp bữa tối cuối tuần.",
        ingredients: ["Cá thu", "Dứa", "Cà chua", "Rau thơm"],
        instructions: ["Rửa cá", "Nấu nước lẩu chua cay cùng dứa, cà chua", "Cho cá vào chín và dùng kèm rau"],
        authorId: s4._id,
        difficulty: "Medium",
        cookingTime: 45,
        servings: 5,
        tags: ["Cá", "Lẩu"],
        likes: [b2._id],
        viewCount: 287,
      },
    ]);

    // 4. Seed Posts
    await Post.create([
      {
        userId: b1._id,
        userName: b1.name,
        userAvatar: null,
        title: "Cách chọn cua còn khỏe khi mua online",
        content: "Ưu tiên người bán có giờ bắt, ảnh mẻ hàng và cam kết đổi trả rõ ràng.",
        images: [],
        likes: [s1._id, s2._id],
        comments: [
          {
            userId: s1._id,
            userName: s1.name,
            userAvatar: null,
            text: "Mẹo rất hữu ích.",
            createdAt: new Date(),
          },
        ],
        tags: ["Kinh nghiệm", "Cua"],
        viewCount: 120,
      },
      {
        userId: b2._id,
        userName: b2.name,
        userAvatar: null,
        title: "Khu vực nào giao hải sản tươi tốt ở TP.HCM?",
        content: "Mình đang tìm seller có giao sáng sớm cho quán nhỏ ở Bình Thạnh.",
        images: [],
        likes: [b1._id],
        comments: [],
        tags: ["Giao hàng", "TP.HCM"],
        viewCount: 95,
      },
    ]);

    logger.info("✅ Database seeded successfully!");
  } catch (err: any) {
    logger.error(`❌ Database seeding failed: ${err.message}`);
  }
};

// Định nghĩa và xuất hàm testConnection thực hiện kết nối tới MongoDB
export const testConnection = async () => {
  // Lấy đường dẫn kết nối MongoDB từ biến môi trường MONGO_URI, mặc định kết nối localhost nếu thiếu
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/seafood_db";

  try {
    // Chờ kết nối MongoDB thông qua Mongoose với cấu hình bổ sung
    await mongoose.connect(mongoUri, {
      // Tự động đồng bộ xây dựng các chỉ mục (như 2dsphere cho GPS và text cho tìm kiếm toàn văn) khi khởi chạy ứng dụng
      autoIndex: true,
    });
    // Ghi nhận log thông báo kết nối cơ sở dữ liệu MongoDB thành công
    logger.info("✅ MongoDB connected successfully via Mongoose");

    // Tự động seed dữ liệu mẫu vào MongoDB nếu database trống
    await seedDatabase();

    // Thử dọn dẹp và xóa bỏ chỉ mục duy nhất 'phone_1' (nếu tồn tại) của phiên bản cũ để tránh lỗi xung đột số điện thoại rỗng
    try {
      // Truy cập trực tiếp vào collection "users" từ kết nối Mongoose hiện hành
      const usersCollection = mongoose.connection.collection("users");
      // Truy vấn danh sách toàn bộ các chỉ mục indexes hiện có của bảng users
      const indexes = await usersCollection.indexes();
      // Kiểm tra xem có tồn tại chỉ mục nào có tên là "phone_1" hay không
      const hasPhoneIndex = indexes.some(idx => idx.name === "phone_1");
      // Nếu tồn tại chỉ mục cũ "phone_1"
      if (hasPhoneIndex) {
        // Thực hiện xóa bỏ chỉ mục này khỏi database
        await usersCollection.dropIndex("phone_1");
        // Ghi nhận log đã xóa thành công chỉ mục cũ
        logger.info("🗑️ Dropped legacy unique index 'phone_1' successfully");
      }
    } catch (indexErr: any) {
      // Ghi log cảnh báo nếu không xóa được chỉ mục (có thể do chỉ mục không tồn tại)
      logger.warn(`Could not drop phone_1 index (it might not exist): ${indexErr.message}`);
    }
  } catch (err: any) {
    // Ghi log lỗi nghiêm trọng nếu kết nối cơ sở dữ liệu thất bại
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    // Thoát tiến trình ngay lập tức với mã lỗi 1 để hệ thống quản lý container tự động khởi động lại ứng dụng
    process.exit(1);
  }
}
