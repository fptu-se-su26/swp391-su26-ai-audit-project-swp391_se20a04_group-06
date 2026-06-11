import { Router } from "express";
import {
  toggleFollow,
  checkFollow,
  getFollowing,
  getFollowers,
} from "../controllers/follow.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Thêm các tuyến đường lấy danh sách (đặt trước các tuyến có chứa tham số động :sellerId)
router.get("/following", authenticate, getFollowing);
router.get("/followers", authenticate, getFollowers);

router.post("/:sellerId/toggle", authenticate, toggleFollow);
router.get("/:sellerId/check", authenticate, checkFollow);

export default router;
