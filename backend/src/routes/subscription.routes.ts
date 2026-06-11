import { Router } from "express";
import {
  createSubscription,
  getMySubscriptions,
  getAllSubscriptions,
  updateSubscriptionStatus,
} from "../controllers/subscription.controller";
import { authenticate, adminOnly } from "../middlewares/auth";
import { validateSchema } from "../middlewares/validate";
import { createSubscriptionSchema } from "../validations/subscription.validation";

const router = Router();

router.post("/", authenticate, validateSchema(createSubscriptionSchema), createSubscription);
router.get("/my", authenticate, getMySubscriptions);
router.get("/all", authenticate, adminOnly, getAllSubscriptions);
router.patch("/:id/status", authenticate, updateSubscriptionStatus);

export default router;
