import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { safeCompare } from "../utils/security";

const CSRF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const csrfCookieOptions = () => ({
  httpOnly: false,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: CSRF_MAX_AGE_MS,
});

/**
 * Double-submit cookie: the browser receives a readable CSRF cookie and must
 * echo the same value in the x-csrf-token header for unsafe requests.
 */
export function generateCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token =
    req.cookies.csrfToken || crypto.randomBytes(32).toString("hex");

  if (!req.cookies.csrfToken) {
    res.cookie("csrfToken", token, csrfCookieOptions());
  }

  req.csrfToken = token;
  next();
}

export function validateCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const clientToken = req.headers["x-csrf-token"] as string | undefined;
  const serverToken = req.cookies.csrfToken as string | undefined;

  if (!clientToken || !serverToken || !safeCompare(clientToken, serverToken)) {
    return res.status(403).json({
      code: "CSRF_INVALID",
      message: "CSRF token không hợp lệ",
    });
  }

  next();
}

export function rotateCsrfToken(res: Response): string {
  const newToken = crypto.randomBytes(32).toString("hex");
  res.cookie("csrfToken", newToken, csrfCookieOptions());
  return newToken;
}
