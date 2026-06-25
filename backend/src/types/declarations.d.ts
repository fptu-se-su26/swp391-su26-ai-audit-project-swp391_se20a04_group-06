declare module 'streamifier' {
  import { Readable } from 'stream';
  export function createReadStream(
    buffer: Buffer | string,
    options?: any
  ): Readable;
}
<<<<<<< HEAD
=======

// Mở rộng Request của Express để chứa thông tin user từ JWT
// Tránh phải dùng (req as any).user ở mọi controller
declare namespace Express {
  interface Request {
    user: {
      userId: number;
      role: 'User' | 'Admin';
    };
  }
}
>>>>>>> origin/main
