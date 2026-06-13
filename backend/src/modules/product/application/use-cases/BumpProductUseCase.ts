import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
import { redis } from "../../../../config/redis";

export class BumpProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string, userId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError("Không tìm thấy sản phẩm");
    }

    product.bump(userId);
    await this.productRepository.save(product);

    // Xóa cache chi tiết và tăng phiên bản cache danh sách
    await redis.del(`product:detail:${productId}`).catch(() => {});
    await redis.incr(`product:list:version:${product.type}`).catch(() => {});
  }
}
