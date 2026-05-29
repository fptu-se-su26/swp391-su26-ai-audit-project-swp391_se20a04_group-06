import { Request, Response } from "express";
import { User } from "../models/User";
import { logger } from "../utils/logger";

export async function sepayWebhook(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn("[Sepay Webhook] Missing Authorization header");
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    // Hỗ trợ cả "Apikey <key>" và "Bearer <key>" từ Sepay
    let token = authHeader;
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7);
    } else if (authHeader.toLowerCase().startsWith("apikey ")) {
      token = authHeader.substring(7);
    }
    token = token.trim();

    if (token !== "seafood-secret-key-1052003") {
      logger.warn(`[Sepay Webhook] Unauthorized request. Invalid API Key: ${token}`);
      return res.status(401).json({ message: "Invalid API Key" });
    }

    // Sepay JSON payload standard fields:
    // transferAmount: Số tiền chuyển khoản
    // content: Nội dung chuyển khoản
    // Cũng có thể có các trường fallback như amount, description
    const { transferAmount, amount, content, description } = req.body;
    const finalAmount = transferAmount ?? amount;
    const finalContent = content ?? description;

    logger.info(`[Sepay Webhook] Received transaction. Amount: ${finalAmount}, Content: "${finalContent}"`);

    if (finalAmount === undefined || finalContent === undefined) {
      logger.warn("[Sepay Webhook] Missing amount or content field in request body");
      return res.status(400).json({ message: "Missing required transaction fields" });
    }

    const numericAmount = Number(finalAmount);
    if (isNaN(numericAmount) || numericAmount < 2000) {
      logger.warn(`[Sepay Webhook] Invalid transfer amount: ${finalAmount}. Must be >= 2000 VND`);
      return res.status(400).json({ message: "Transfer amount must be at least 2000 VND" });
    }

    // Extract 24-character hex string (MongoDB ObjectId) from content
    const match = String(finalContent).match(/[0-9a-fA-F]{24}/);
    if (!match) {
      logger.warn(`[Sepay Webhook] No valid User MongoDB ID found in content: "${finalContent}"`);
      return res.status(400).json({ message: "No valid user identifier found in transaction description" });
    }

    const userId = match[0];
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`[Sepay Webhook] User with ID ${userId} not found in database`);
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isPremium) {
      logger.info(`[Sepay Webhook] User ${user.name} (${userId}) is already Premium. Safe return.`);
      return res.status(200).json({ success: true, message: "User is already premium" });
    }

    // Upgrade user to Premium
    user.isPremium = true;
    await user.save();

    logger.info(`[Sepay Webhook] SUCCESS! User ${user.name} (${userId}) upgraded to Premium successfully.`);

    return res.status(200).json({
      success: true,
      message: `User ${user.name} upgraded to Premium successfully`,
    });
  } catch (err: any) {
    logger.error(`[Sepay Webhook] CRITICAL Error: ${err.message}`, { stack: err.stack });
    return res.status(500).json({ message: "Internal server error" });
  }
}
