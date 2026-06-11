import { Router } from "express";
import {
  addReview,
  getReviewsBySeller,
} from "../controllers/review.controller";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import { validateSchema } from "../middlewares/validate";
import { createReviewSchema } from "../validations/review.validation";

const router = Router();

router.post(
  "/",
  authenticate,
  upload.single("image"),
  validateSchema(createReviewSchema),
  addReview,
);
router.get("/seller/:sellerId", getReviewsBySeller);

export default router;
