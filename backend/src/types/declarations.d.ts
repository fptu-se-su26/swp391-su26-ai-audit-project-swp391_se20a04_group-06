import { Readable } from "stream";

declare module "streamifier" {
  export function createReadStream(
    buffer: Buffer | string,
    options?: any,
  ): Readable;
}

// 🌟 Mở rộng thuộc tính Express Request một cách toàn cục (Global)
declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        role: "User" | "Admin";
      };
      csrfToken?: string;
    }
  }
}

export {};
