import { Router } from "express";
import {
  addLandingBatchProducts,
  createLandingBatch,
  deleteLandingBatch,
  getLandingBatch,
  listLandingBatches,
  listMarketplaceLandingBatches,
  listMyLandingBatches,
  updateLandingBatch,
} from "../controllers/landingBatch.controller";
import { authenticate, sellerOnly } from "../middlewares/auth";
import { validateSchema } from "../middlewares/validate";
import {
  addLandingBatchProductsSchema,
  createLandingBatchSchema,
  updateLandingBatchSchema,
} from "../validations/landingBatch.validation";

const router = Router();

router.get("/", listLandingBatches);
router.get("/marketplace", listMarketplaceLandingBatches);
router.get("/mine", authenticate, sellerOnly, listMyLandingBatches);
router.get("/:id", getLandingBatch);

router.post(
  "/",
  authenticate,
  sellerOnly,
  validateSchema(createLandingBatchSchema),
  createLandingBatch,
);
router.put(
  "/:id",
  authenticate,
  sellerOnly,
  validateSchema(updateLandingBatchSchema),
  updateLandingBatch,
);
router.delete("/:id", authenticate, sellerOnly, deleteLandingBatch);
router.post(
  "/:id/products",
  authenticate,
  sellerOnly,
  validateSchema(addLandingBatchProductsSchema),
  addLandingBatchProducts,
);

export default router;
