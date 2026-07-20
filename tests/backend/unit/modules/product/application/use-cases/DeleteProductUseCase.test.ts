import { DeleteProductUseCase } from "../../../../../../../backend/src/modules/product/application/use-cases/DeleteProductUseCase";
import { IProductRepository } from "../../../../../../../backend/src/modules/product/domain/repositories/IProductRepository";
import { Product } from "../../../../../../../backend/src/modules/product/domain/entities/Product";
import { NotFoundError, UnauthorizedError } from "../../../../../../../backend/src/shared/domain/exceptions/DomainException";
import { cloudinary } from "../../../../../../../backend/src/config/cloudinary";
import { redis } from "../../../../../../../backend/src/config/redis";
import { notificationRepository } from "../../../../../../../backend/src/repositories/notification.repository";
import { reportRepository } from "../../../../../../../backend/src/repositories/report.repository";
import { userRepository } from "../../../../../../../backend/src/repositories/user.repository";
import { updateUserBadges } from "../../../../../../../backend/src/services/badge.service";

// Mock external systems
jest.mock("../../../../../../../backend/src/config/cloudinary", () => ({
  cloudinary: {
    api: {
      delete_resources: jest.fn().mockResolvedValue({}),
    },
  },
}));
jest.mock("../../../../../../../backend/src/config/redis", () => ({
  redis: {
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
  },
}));
jest.mock("../../../../../../../backend/src/repositories/notification.repository", () => ({
  notificationRepository: {
    deleteByProductId: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock("../../../../../../../backend/src/repositories/report.repository", () => ({
  reportRepository: {
    deleteByProductId: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock("../../../../../../../backend/src/repositories/user.repository", () => ({
  userRepository: {
    updateMany: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock("../../../../../../../backend/src/services/badge.service", () => ({
  updateUserBadges: jest.fn().mockResolvedValue({}),
}));

describe("DeleteProductUseCase", () => {
  let productRepository: jest.Mocked<IProductRepository>;
  let useCase: DeleteProductUseCase;
  let mockProduct: jest.Mocked<Product>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProduct = {
      id: "prod-123",
      sellerId: "seller-123",
      type: "Fresh",
      images: [
        "https://res.cloudinary.com/demo/image/upload/v12345/folder/img1.png",
        "https://res.cloudinary.com/demo/image/upload/v12345/folder/img2.png"
      ],
      markAsDeleted: jest.fn(),
      props: { status: "Active" },
    } as unknown as jest.Mocked<Product>;

    productRepository = {
      findById: jest.fn().mockResolvedValue(mockProduct),
      save: jest.fn().mockResolvedValue(mockProduct),
    } as unknown as jest.Mocked<IProductRepository>;

    useCase = new DeleteProductUseCase(productRepository);
  });

  it("should successfully soft delete the product if requested by owner", async () => {
    await useCase.execute("prod-123", "seller-123", "User");

    expect(productRepository.findById).toHaveBeenCalledWith("prod-123");
    expect(mockProduct.markAsDeleted).toHaveBeenCalled();
    expect(productRepository.save).toHaveBeenCalledWith(mockProduct);
    expect(updateUserBadges).toHaveBeenCalledWith("seller-123");
    
    // Cascade deletions
    expect(notificationRepository.deleteByProductId).toHaveBeenCalledWith("prod-123");
    expect(reportRepository.deleteByProductId).toHaveBeenCalledWith("prod-123");
    
    // Targeted pull - verify optimized filter { favorites: productId }
    expect(userRepository.updateMany).toHaveBeenCalledWith(
      { favorites: "prod-123" },
      { $pull: { favorites: "prod-123" } }
    );

    // Redis Cache Invalidation
    expect(redis.del).toHaveBeenCalledWith("product:detail:prod-123");
    expect(redis.incr).toHaveBeenCalledWith("product:list:version:Fresh");

    // Cloudinary resource deletion
    expect(cloudinary.api.delete_resources).toHaveBeenCalled();
  });

  it("should successfully soft delete the product if requested by Admin", async () => {
    await useCase.execute("prod-123", "admin-456", "Admin");

    expect(mockProduct.markAsDeleted).toHaveBeenCalled();
    expect(productRepository.save).toHaveBeenCalledWith(mockProduct);
  });

  it("should throw NotFoundError if product does not exist", async () => {
    productRepository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute("prod-123", "seller-123", "User")).rejects.toThrow(NotFoundError);
    expect(productRepository.save).not.toHaveBeenCalled();
  });

  it("should throw UnauthorizedError if user is not the owner and not an admin", async () => {
    await expect(useCase.execute("prod-123", "buyer-789", "User")).rejects.toThrow(UnauthorizedError);
    expect(productRepository.save).not.toHaveBeenCalled();
    expect(mockProduct.markAsDeleted).not.toHaveBeenCalled();
  });
});