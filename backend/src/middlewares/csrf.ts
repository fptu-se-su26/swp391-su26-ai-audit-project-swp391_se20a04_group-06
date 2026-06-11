import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { safeCompare } from "../utils/security";

const CSRF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function generateCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.cookies.csrfToken) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrfToken", token, {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: CSRF_MAX_AGE_MS,
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies.csrfToken;
  }
  next();
}

export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  const clientToken = req.headers["x-csrf-token"] as string;
  const serverToken = req.cookies.csrfToken;

  if (!clientToken || !serverToken || !safeCompare(clientToken, serverToken)) {
    return res.status(403).json({ message: "CSRF token không hợp lệ" });
  }
  next();
}

export function rotateCsrfToken(res: Response): string {
  const newToken = crypto.randomBytes(32).toString("hex");
  res.cookie("csrfToken", newToken, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: CSRF_MAX_AGE_MS,
  });
  return newToken;
}
