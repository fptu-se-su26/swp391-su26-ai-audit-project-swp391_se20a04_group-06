declare module 'streamifier' {
  import { Readable } from 'stream';
  export function createReadStream(
    buffer: Buffer | string,
    options?: any
  ): Readable;
}
