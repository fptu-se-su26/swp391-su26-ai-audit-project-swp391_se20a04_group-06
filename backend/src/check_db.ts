import mongoose from "mongoose";
import { Product } from "./models/Product";
import { LandingBatch } from "./models/LandingBatch";
import { User } from "./models/User";
import "dotenv/config";

async function main() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/seafood_db";
  console.log("Connecting to:", mongoUri);
  await mongoose.connect(mongoUri);

  const users = await User.find({}, "name role isVerified isPremium").lean();
  console.log("=== USERS ===");
  console.log(users);

  const batches = await LandingBatch.find({}).lean();
  console.log("=== LANDING BATCHES ===");
  console.log(batches);

  const products = await Product.find({}).lean();
  console.log("=== PRODUCTS ===");
  console.log(products);

  await mongoose.disconnect();
}

main().catch(console.error);
