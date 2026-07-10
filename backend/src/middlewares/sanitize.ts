import { NextFunction, Request, Response } from "express";
import { sanitizeDeep } from "../utils/security";

export function sanitizeRequestBody(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeDeep(req.body);
  }
  next();
}
