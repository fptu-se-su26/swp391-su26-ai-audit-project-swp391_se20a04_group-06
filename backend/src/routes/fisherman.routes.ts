// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm xử lý từ fisherman.controller để lấy danh sách và thông tin chi tiết liên quan đến ngư dân
import {
  // Lấy danh sách tất cả các ngư dân
  listFishermen,
  // Lấy thông tin cá nhân của một ngư dân cụ thể
  getFishermanProfile,
  // Lấy danh sách sản phẩm đăng bán của một ngư dân
  getFishermanProducts,
  // Lấy danh sách công thức nấu ăn của một ngư dân
  getFishermanRecipes,
  // Lấy danh sách bài viết trên diễn đàn của một ngư dân
  getFishermanPosts,
  // Lấy danh sách nhật ký cabin của một ngư dân
  getFishermanBoatLogs,
} from "../controllers/fisherman.controller";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường GET / lấy danh sách tất cả ngư dân trong hệ thống
router.get("/",                listFishermen);

// Định nghĩa tuyến đường GET /:id/profile lấy hồ sơ thông tin cá nhân của ngư dân dựa theo ID
router.get("/:id/profile",     getFishermanProfile);

// Định nghĩa tuyến đường GET /:id/products lấy danh sách sản phẩm của ngư dân dựa theo ID
router.get("/:id/products",    getFishermanProducts);

// Định nghĩa tuyến đường GET /:id/recipes lấy danh sách công thức nấu ăn của ngư dân dựa theo ID
router.get("/:id/recipes",     getFishermanRecipes);

// Định nghĩa tuyến đường GET /:id/posts lấy danh sách bài viết diễn đàn của ngư dân dựa theo ID
router.get("/:id/posts",       getFishermanPosts);

// Định nghĩa tuyến đường GET /:id/boat-logs lấy danh sách nhật ký cabin của ngư dân dựa theo ID
router.get("/:id/boat-logs",   getFishermanBoatLogs);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
