import { Router } from "express";
import { sepayWebhook } from "../controllers/payment.controller";

const router = Router();

// Endpoint webhook nhận dữ liệu từ Sepay (bypass CSRF protection trong app.ts)
router.post("/webhook", sepayWebhook);

export default router;
