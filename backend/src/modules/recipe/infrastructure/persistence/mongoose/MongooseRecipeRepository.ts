import { IRecipeRepository } from "../../../domain/repositories/IRecipeRepository";
import { Recipe as DomainRecipe } from "../../../domain/entities/Recipe";
import { Recipe as MongooseRecipe } from "../../../../../models/Recipe";
import { RecipeMapper } from "./mappers/RecipeMapper";
import mongoose from "mongoose";

/**
 * Adapter thực thi giao tiếp Database cho phân hệ Recipe.
 * Triển khai interface IRecipeRepository (Port) định nghĩa ở tầng Domain.
 * Đảm bảo các thành viên khác trong nhóm 4 người có thể dễ dàng hiểu cách dữ liệu được lưu trữ.
 */
export class MongooseRecipeRepository implements IRecipeRepository {
  /**
   * Tìm kiếm công thức nấu ăn bằng ID.
   * Có populate thông tin cơ bản của tác giả để đảm bảo tính toàn vẹn thông tin.
   */
  async findById(id: string): Promise<DomainRecipe | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const doc = await MongooseRecipe.findById(id).populate(
      "authorId",
      "name avatar isVerified role"
    );
    if (!doc) return null;

    return RecipeMapper.toDomain(doc);
  }

  /**
   * Lưu hoặc cập nhật công thức nấu ăn vào Database.
   * Hỗ trợ cập nhật (update) nếu Recipe đã có ID, ngược lại tạo mới (save).
   */
  async save(recipe: DomainRecipe): Promise<void> {
    const persistenceData = RecipeMapper.toPersistence(recipe);
    
    if (recipe.id && mongoose.Types.ObjectId.isValid(recipe.id)) {
      await MongooseRecipe.findByIdAndUpdate(
        recipe.id,
        { $set: persistenceData },
        { upsert: true, new: true }
      );
    } else {
      const doc = new MongooseRecipe(persistenceData);
      await doc.save();
      // Gán ID sinh ra từ DB ngược lại cho Entity
      (recipe as any)._id = doc._id.toString();
    }
  }

  /**
   * Xóa công thức nấu ăn khỏi cơ sở dữ liệu.
   */
  async delete(recipe: DomainRecipe): Promise<void> {
    if (recipe.id && mongoose.Types.ObjectId.isValid(recipe.id)) {
      await MongooseRecipe.findByIdAndDelete(recipe.id);
    }
  }
}
