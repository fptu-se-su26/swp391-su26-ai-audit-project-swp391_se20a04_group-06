import { Router } from "express";
import {
  createReport,
  getReports,
  handleReport,
} from "../controllers/report.controller";
import { authenticate, adminOnly } from "../middlewares/auth";
import { validateSchema } from "../middlewares/validate";
import {
  createReportSchema,
  handleReportSchema,
} from "../validations/report.validation";

const router = Router();

router.post(
  "/:productId",
  authenticate,
  validateSchema(createReportSchema),
  createReport,
);
router.get("/", authenticate, adminOnly, getReports);
router.patch(
  "/:id",
  authenticate,
  adminOnly,
  validateSchema(handleReportSchema),
  handleReport,
);

export default router;
