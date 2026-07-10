import { Router } from "express";
import {
  cancelOmakase,
  getMyOmakase,
  subscribeOmakase,
} from "../controllers/omakase.controller";
import { authenticate } from "../middlewares/auth";
import { validateSchema } from "../middlewares/validate";
import { createOmakaseSchema } from "../validations/omakase.validation";

const router = Router();

router.use(authenticate);
router.get("/me", getMyOmakase);
router.post("/", validateSchema(createOmakaseSchema), subscribeOmakase);
router.patch("/cancel", cancelOmakase);

export default router;
