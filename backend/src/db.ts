import mongoose from "mongoose";
import { logger } from "./utils/logger";

export async function testConnection() {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/seafood_db";

  try {
    // Kết nối MongoDB thông qua Mongoose
    await mongoose.connect(mongoUri, {
      autoIndex: true, // Tự động đồng bộ xây dựng các chỉ mục 2dsphere và text khi khởi động
    });
    logger.info("✅ MongoDB connected successfully via Mongoose");
  } catch (err: any) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}
