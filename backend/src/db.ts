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

    // Drop the old unique index 'phone_1' if it exists to avoid duplication issues
    try {
      const usersCollection = mongoose.connection.collection("users");
      const indexes = await usersCollection.indexes();
      const hasPhoneIndex = indexes.some(idx => idx.name === "phone_1");
      if (hasPhoneIndex) {
        await usersCollection.dropIndex("phone_1");
        logger.info("🗑️ Dropped legacy unique index 'phone_1' successfully");
      }
    } catch (indexErr: any) {
      logger.warn(`Could not drop phone_1 index (it might not exist): ${indexErr.message}`);
    }
  } catch (err: any) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}
