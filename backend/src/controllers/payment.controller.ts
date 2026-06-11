import { Request, Response } from "express";
import { userRepository } from "../repositories/user.repository";
import { PaymentTransaction } from "../models/PaymentTransaction";
import { logger } from "../utils/logger";
import { safeCompare } from "../utils/security";

export async function sepayWebhook(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn("[Sepay Webhook] Missing Authorization header");
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    let token = authHeader;
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7);
    } else if (authHeader.toLowerCase().startsWith("apikey ")) {
      token = authHeader.substring(7);
    }
    token = token.trim();

    const expectedKey = process.env.SEPAY_WEBHOOK_KEY;
    if (!expectedKey) {
      logger.error(
        "[Sepay Webhook] CRITICAL: SEPAY_WEBHOOK_KEY is not configured.",
      );
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    // So sánh an toàn thời gian để ngăn chặn Timing Attack
    if (!safeCompare(token, expectedKey)) {
      logger.warn(`[Sepay Webhook] Unauthorized request. Invalid API Key.`);
      return res.status(401).json({ message: "Invalid API Key" });
    }

    const { id, transferAmount, amount, content, description } = req.body;
    const finalAmount = transferAmount ?? amount;
    const finalContent = content ?? description;
    const gatewayTransactionId = id ? String(id).trim() : null;

    logger.info(
      `[Sepay Webhook] Received transaction check. GatewayID: ${gatewayTransactionId}, Amount: ${finalAmount}, Content: "${finalContent}"`,
    );

    if (!gatewayTransactionId) {
      logger.error(
        "[Sepay Webhook] Rejected: Missing unique gateway transaction ID.",
      );
      return res
        .status(400)
        .json({ message: "Missing gateway transaction ID" });
    }

    if (finalAmount === undefined || finalContent === undefined) {
      logger.warn(
        "[Sepay Webhook] Missing amount or content field in request body",
      );
      return res
        .status(400)
        .json({ message: "Missing required transaction fields" });
    }

    const existingTx = await PaymentTransaction.findOne({
      gatewayTransactionId,
    });
    if (existingTx) {
      logger.warn(
        `[Sepay Webhook] Duplicate transaction detected for GatewayID: ${gatewayTransactionId}. Safe return HTTP 200.`,
      );
      return res
        .status(200)
        .json({ success: true, message: "Transaction already processed" });
    }

    const numericAmount = Number(finalAmount);
    if (isNaN(numericAmount) || numericAmount < 2000) {
      logger.warn(
        `[Sepay Webhook] Invalid transfer amount: ${finalAmount}. Must be >= 2000 VND`,
      );
      return res
        .status(400)
        .json({ message: "Transfer amount must be at least 2000 VND" });
    }

    const match = String(finalContent).match(/[0-9a-fA-F]{24}/);
    if (!match) {
      logger.warn(
        `[Sepay Webhook] No valid User MongoDB ID found in content: "${finalContent}"`,
      );
      return res.status(400).json({
        message: "No valid user identifier found in transaction description",
      });
    }

    const userId = match[0];
    const user = await userRepository.findRawById(userId);
    if (!user) {
      logger.error(
        `[Sepay Webhook] User with ID ${userId} not found in database`,
      );
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isPremium) {
      logger.info(
        `[Sepay Webhook] User ${user.name} (${userId}) is already Premium.`,
      );
      await PaymentTransaction.create({
        gatewayTransactionId,
        userId: user._id as any,
        amount: numericAmount,
        content: finalContent,
      });
      return res
        .status(200)
        .json({ success: true, message: "User is already premium" });
    }

    user.isPremium = true;
    await user.save();

    await PaymentTransaction.create({
      gatewayTransactionId,
      userId: user._id as any,
      amount: numericAmount,
      content: finalContent,
    });

    logger.info(
      `[Sepay Webhook] SUCCESS! User ${user.name} (${userId}) upgraded to Premium. GatewayID: ${gatewayTransactionId}`,
    );

    return res.status(200).json({
      success: true,
      message: `User ${user.name} upgraded to Premium successfully`,
    });
  } catch (err: any) {
    logger.error(`[Sepay Webhook] CRITICAL Error: ${err.message}`, {
      stack: err.stack,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
}
