import { recipeService } from "./recipe.service";
import { recipeRepository } from "../repositories/recipe.repository";
import { userRepository } from "../repositories/user.repository";

// Giả lập các dependencies
jest.mock("../repositories/recipe.repository");
jest.mock("../repositories/user.repository");
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Unit Test: Recipe Service (recipe.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockRecipeId = "60c72b2f9b1d8b2bad000002";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Nghiệp vụ create (Tạo công thức món ăn)", () => {
    it("Nên chặn nếu người dùng thường chưa xác minh tài khoản cố tình tạo công thức", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        isVerified: false, // Chưa xác minh
      });

      const recipeData = {
        title: "Canh chua cá mú biển",
        description: "Món canh chua giải nhiệt ngày hè",
        ingredients: ["Cá mú", "Dứa", "Cà chua"],
        instructions: ["Nấu nước canh sôi", "Bỏ cá mú vào đun chín"],
      };

      await expect(
        recipeService.create(mockUserId, "User", recipeData),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          message:
            "Chỉ Admin hoặc ngư dân đã xác minh mới được viết công thức nấu ăn",
        }),
      );
    });

    it("Nên cho phép tạo công thức thành công đối với ngư dân đã được xác minh danh tính", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        isVerified: true, // Đã xác minh
      });

      (recipeRepository.create as jest.Mock).mockResolvedValue({
        _id: mockRecipeId,
      });

      const recipeData = {
        title: "Canh chua cá mú biển",
        description: "Món canh chua giải nhiệt ngày hè",
        ingredients: ["Cá mú", "Dứa", "Cà chua"],
        instructions: ["Nấu nước canh sôi", "Bỏ cá mú vào đun chín"],
      };

      const result = await recipeService.create(mockUserId, "User", recipeData);
      expect(result._id).toBe(mockRecipeId);
    });
  });
});
