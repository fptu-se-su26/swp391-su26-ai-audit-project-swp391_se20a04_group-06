import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "./models/Product";
import { User } from "./models/User";
import { cloudinary } from "./config/cloudinary";
import * as path from "path";
import * as fs from "fs";

// Explicitly configure Cloudinary in the script
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/seafood_db";
const IMAGES_DIR = path.join(__dirname, "../../images_real");

interface RawProductData {
  imageFile: string;
  name: string;
  type: "Fresh" | "Dried";
  category: "Fish" | "Shrimp" | "Squid" | "Crab" | "Shellfish" | "Others";
  description: string;
  price: number;
  salesType: "Retail" | "Wholesale";
  totalWeight: number;
  remainingWeight: number;
  productSize: "LARGE" | "MEDIUM" | "SMALL";
  locationCoords: [number, number]; // [lng, lat]
  catchLocationCoords?: [number, number];
  origin?: string;
  expiryMonths?: number;
  catchHoursAgo?: number;
}

const rawProducts: RawProductData[] = [
  {
    imageFile: "7.jpg",
    name: "Mực Ống Tươi Hàm Ninh Phú Quốc",
    type: "Fresh",
    category: "Squid",
    description: "Mực ống tươi vừa cập bến Hàm Ninh Phú Quốc sáng nay. Mực ống tươi rói được cấp đông đá lạnh ngay tại tàu giúp giữ nguyên độ giòn ngọt. Da mực óng ánh lóng lánh, dày cơm. Thích hợp làm lẩu, xào chua ngọt hoặc hấp hành gừng ngon ngọt.",
    price: 240000,
    salesType: "Retail",
    totalWeight: 35,
    remainingWeight: 35,
    productSize: "MEDIUM",
    locationCoords: [104.0197, 10.2288], // Phú Quốc
    catchLocationCoords: [103.8, 10.0],
    catchHoursAgo: 3
  },
  {
    imageFile: "ca-com-MNMN.jpg",
    name: "Cá Cơm Tươi Nha Trang",
    type: "Fresh",
    category: "Fish",
    description: "Cá cơm tươi vừa đánh lưới ven vịnh Nha Trang sáng nay. Con cá trắng ngần, thịt săn chắc ngọt bùi. Rất thích hợp kho tiêu tỏi ớt, chiên bột giòn tan ăn kèm rau sống hoặc nấu canh chua.",
    price: 75000,
    salesType: "Retail",
    totalWeight: 60,
    remainingWeight: 60,
    productSize: "SMALL",
    locationCoords: [109.1967, 12.2458], // Nha Trang
    catchLocationCoords: [109.3, 12.2],
    catchHoursAgo: 2
  },
  {
    imageFile: "ca-duoi (2).jpg",
    name: "Cá Đuối Sen Đồ Sơn Hải Phòng",
    type: "Fresh",
    category: "Fish",
    description: "Cá đuối tươi rói mới cập bến cảng cá Đồ Sơn. Thịt cá đuối chắc, sụn cá mềm giòn sần sật béo ngậy. Thích hợp để nấu canh chua lá giang, xào sả ớt hoặc nướng mọi chấm muối ớt siêu ngon.",
    price: 185000,
    salesType: "Retail",
    totalWeight: 15,
    remainingWeight: 15,
    productSize: "LARGE",
    locationCoords: [106.6881, 20.8449], // Đồ Sơn
    catchLocationCoords: [107.0, 20.5],
    catchHoursAgo: 4
  },
  {
    imageFile: "ca-ngu-dai-duong-15.jpg",
    name: "Cá Ngừ Đại Dương Phú Yên Nguyên Con",
    type: "Fresh",
    category: "Fish",
    description: "Cá ngừ đại dương Phú Yên đánh bắt khơi xa, con to chắc nịch thịt đỏ tươi chuẩn xuất khẩu. Phù hợp làm các món phi lê sashimi ăn sống, áp chảo sốt bơ tỏi hoặc nấu lẩu chua cực kỳ bổ dưỡng.",
    price: 320000,
    salesType: "Wholesale",
    totalWeight: 120,
    remainingWeight: 120,
    productSize: "LARGE",
    locationCoords: [109.3486, 13.0882], // Phú Yên
    catchLocationCoords: [110.5, 12.8],
    catchHoursAgo: 10
  },
  {
    imageFile: "kho-ca-hanh-1.jpg",
    name: "Cá Hanh Tươi Biển Vũng Tàu",
    type: "Fresh",
    category: "Fish",
    description: "Cá hanh (cá tráp) tươi sống được đánh bắt ven biển Vũng Tàu. Thịt cá trắng ngần, béo ngọt tự nhiên, da cá óng ánh vảy bạc. Phù hợp làm món hấp hành gừng, nướng muối ớt hoặc nấu cháo giải nhiệt cực tốt.",
    price: 195000,
    salesType: "Retail",
    totalWeight: 20,
    remainingWeight: 20,
    productSize: "MEDIUM",
    locationCoords: [107.0843, 10.3460], // Vũng Tàu
    catchLocationCoords: [107.2, 10.2],
    catchHoursAgo: 5
  },
  {
    imageFile: "OIP (1).jpg",
    name: "Tôm Thẻ Chân Trắng Quảng Ninh",
    type: "Fresh",
    category: "Shrimp",
    description: "Tôm thẻ tươi xanh bơi lội khỏe mạnh tại đầm Quảng Ninh. Vỏ tôm mỏng trong suốt, thịt tôm săn chắc ngọt đậm đà. Rất ngon khi làm món hấp sả, nướng mọi hoặc rim tỏi ớt ăn cơm gia đình.",
    price: 210000,
    salesType: "Retail",
    totalWeight: 30,
    remainingWeight: 30,
    productSize: "MEDIUM",
    locationCoords: [107.0734, 20.9501], // Quảng Ninh
    catchLocationCoords: [107.2, 20.8],
    catchHoursAgo: 3
  },
  {
    imageFile: "OIP (1).webp",
    name: "Khô Cá Chỉ Vàng Nha Trang",
    type: "Dried",
    category: "Fish",
    description: "Khô cá chỉ vàng Nha Trang phơi đủ 2 nắng dẻo thơm, tẩm gia vị mặn ngọt truyền thống hài hòa. Con cá dày thịt, màu vàng óng tự nhiên. Nướng cồn hoặc chiên giòn làm mồi nhắm hoặc ăn cơm đều cực đỉnh.",
    price: 220000,
    salesType: "Retail",
    totalWeight: 50,
    remainingWeight: 50,
    productSize: "MEDIUM",
    locationCoords: [109.1967, 12.2458], // Nha Trang
    origin: "Nha Trang, Khánh Hòa",
    expiryMonths: 6
  },
  {
    imageFile: "OIP (2).webp",
    name: "Tôm Sú Biển Cà Mau Loại Lớn",
    type: "Fresh",
    category: "Shrimp",
    description: "Tôm sú tự nhiên đánh bắt từ vùng rừng ngập mặn Cà Mau. Con tôm siêu to béo, vỏ dày chắc khỏe, thịt tôm giòn ngọt đậm vị biển tự nhiên. Thích hợp cho tiệc nướng, hấp nước dừa hoặc ăn sashimi cực sang.",
    price: 390000,
    salesType: "Retail",
    totalWeight: 25,
    remainingWeight: 25,
    productSize: "LARGE",
    locationCoords: [104.9089, 9.1764], // Cà Mau
    catchLocationCoords: [104.7, 9.0],
    catchHoursAgo: 6
  },
  {
    imageFile: "OIP.jpg",
    name: "Khô Mực Phú Quốc Loại 1",
    type: "Dried",
    category: "Squid",
    description: "Mực khô được phơi từ những con mực ống câu tươi rói xẻ dọc phơi đủ nắng biển khơi Phú Quốc. Thân mực thẳng, phấn trắng đều, thịt mềm ngọt tự nhiên thơm phức khi nướng, không bị xơ cứng.",
    price: 720000,
    salesType: "Retail",
    totalWeight: 15,
    remainingWeight: 15,
    productSize: "LARGE",
    locationCoords: [104.0197, 10.2288], // Phú Quốc
    origin: "Hàm Ninh, Phú Quốc",
    expiryMonths: 12
  },
  {
    imageFile: "OIP.webp",
    name: "Cá Chỉ Vàng Tươi Bình Thuận",
    type: "Fresh",
    category: "Fish",
    description: "Cá chỉ vàng tươi đánh lưới ven bờ biển Phan Thiết Bình Thuận. Con cá mập mạp béo tròn, thịt ngọt thơm và lành tính. Rất ngon khi kho tiêu, chiên sả ớt hoặc nấu canh ngót.",
    price: 95000,
    salesType: "Retail",
    totalWeight: 40,
    remainingWeight: 40,
    productSize: "SMALL",
    locationCoords: [108.1000, 10.9300], // Bình Thuận
    catchLocationCoords: [108.2, 10.8],
    catchHoursAgo: 2
  },
  {
    imageFile: "phan.jpg",
    name: "Cá Thu Nhật Tươi Cô Tô",
    type: "Fresh",
    category: "Fish",
    description: "Cá thu nhật (cá saba) tươi xanh vừa đánh bắt tại vùng biển đảo Cô Tô. Thịt cá béo bùi, giàu dinh dưỡng và omega-3. Rất ngon khi làm món kho cà chua, nướng giấy bạc hoặc kho thơm.",
    price: 110000,
    salesType: "Retail",
    totalWeight: 50,
    remainingWeight: 50,
    productSize: "MEDIUM",
    locationCoords: [107.7600, 20.9800], // Cô Tô
    catchLocationCoords: [107.9, 20.9],
    catchHoursAgo: 5
  },
  {
    imageFile: "tp-muctuoi-7-6197-646-1740198247277-17401982473942017617307.webp",
    name: "Mực Lá Tươi Cô Tô Quảng Ninh",
    type: "Fresh",
    category: "Squid",
    description: "Mực lá Cô Tô nổi tiếng dày cơm, thịt ngọt lịm và giòn sần sật. Mực tươi nguyên con da óng ánh nhấp nháy bắt mắt. Phù hợp tuyệt vời cho các món nướng muối ớt, xào sa tế hoặc hấp cuốn lá lốt bánh tráng.",
    price: 360000,
    salesType: "Retail",
    totalWeight: 20,
    remainingWeight: 20,
    productSize: "LARGE",
    locationCoords: [107.7600, 20.9800], // Cô Tô
    catchLocationCoords: [107.9, 20.9],
    catchHoursAgo: 4
  }
];

async function uploadToCloudinary(filePath: string): Promise<string> {
  console.log(`Uploading ${path.basename(filePath)} to Cloudinary...`);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "products",
      resource_type: "auto"
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${filePath}:`, error);
    throw error;
  }
}

async function main() {
  console.log("Connecting to database...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // Delete previous test products to avoid duplicates and errors
  console.log("Deleting old seeded products...");
  const oldProductNames = [
    "Cá Cơm Khô Sông Đốc Cà Mau",
    "Cá Đuối Tươi Đồ Sơn",
    "Cá Ngừ Đại Dương Phú Yên Phi Lê",
    "Khô Cá Hố Mép Bình Thuận",
    "Mực Lá Tươi Hàm Ninh Phú Quốc",
    "Tôm Thẻ Chân Trắng Quảng Ninh",
    "Bạch Tuộc Đá Vũng Tàu",
    "Cua Biển Cà Mau Gạch Son",
    
    "Mực Ống Tươi Hàm Ninh Phú Quốc",
    "Cá Cơm Tươi Nha Trang",
    "Cá Đuối Sen Đồ Sơn Hải Phòng",
    "Cá Ngừ Đại Dương Phú Yên Nguyên Con",
    "Cá Hanh Tươi Biển Vũng Tàu",
    "Khô Cá Chỉ Vàng Nha Trang",
    "Tôm Sú Biển Cà Mau Loại Lớn",
    "Khô Mực Phú Quốc Loại 1",
    "Cá Chỉ Vàng Tươi Bình Thuận",
    "Cá Thu Nhật Tươi Cô Tô",
    "Mực Lá Tươi Cô Tô Quảng Ninh"
  ];
  await Product.deleteMany({ name: { $in: oldProductNames } });
  console.log("Old seeded products deleted.");

  // Find target users
  const binhUser = await User.findOne({ name: "Nguyễn Văn Bình" });
  const daudauUser = await User.findOne({ name: "but daudau" });

  if (!binhUser || !daudauUser) {
    console.error("Required users 'Nguyễn Văn Bình' or 'but daudau' not found in DB. Please run seed_mongo.js first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found users: \n- Bình ID: ${binhUser._id}\n- Đầudầu ID: ${daudauUser._id}`);

  for (const raw of rawProducts) {
    const imgPath = path.join(IMAGES_DIR, raw.imageFile);
    if (!fs.existsSync(imgPath)) {
      console.warn(`⚠️ File ${raw.imageFile} does not exist in images_real directory. Skipping...`);
      continue;
    }

    try {
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(imgPath);
      console.log(`Uploaded secure URL: ${imageUrl}`);

      // Determine seller
      let sellerId = daudauUser._id;
      if (raw.name.includes("Đồ Sơn") || raw.name.includes("Quảng Ninh") || raw.name.includes("Cô Tô")) {
        sellerId = binhUser._id;
      }

      // Create product
      const productObj: any = {
        sellerId,
        type: raw.type,
        category: raw.category,
        name: raw.name,
        description: raw.description,
        price: raw.price,
        salesType: raw.salesType,
        totalWeight: raw.totalWeight,
        remainingWeight: raw.remainingWeight,
        productSize: raw.productSize,
        status: "Active",
        location: {
          type: "Point",
          coordinates: raw.locationCoords
        },
        images: [imageUrl],
        viewCount: Math.floor(Math.random() * 40) + 10,
        bumpedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (raw.type === "Fresh") {
        if (raw.catchHoursAgo) {
          productObj.catchTime = new Date(Date.now() - raw.catchHoursAgo * 60 * 60 * 1000);
        }
        if (raw.catchLocationCoords) {
          productObj.catchLocation = {
            type: "Point",
            coordinates: raw.catchLocationCoords
          };
        }
      } else {
        if (raw.origin) {
          productObj.origin = raw.origin;
        }
        if (raw.expiryMonths) {
          productObj.expiryDate = new Date(Date.now() + raw.expiryMonths * 30 * 24 * 60 * 60 * 1000);
        }
      }

      const newProduct = new Product(productObj);
      await newProduct.save();
      console.log(`✅ Successfully created product: "${raw.name}" under seller "${sellerId === binhUser._id ? "Bình" : "Đầudầu"}"`);
    } catch (err) {
      console.error(`Error processing product "${raw.name}":`, err);
    }
  }

  console.log("Product seeding finished.");
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

main().catch(console.error);
