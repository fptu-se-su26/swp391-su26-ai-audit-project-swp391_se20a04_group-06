import { Router } from "express";
import { getTargetedAds } from "../controllers/ad.controller";

const router = Router();

router.get("/", getTargetedAds);

export default router;
