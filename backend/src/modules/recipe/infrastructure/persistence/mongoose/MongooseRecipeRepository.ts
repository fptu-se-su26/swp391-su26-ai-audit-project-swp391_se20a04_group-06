// Import interface IRecipeRepository để triển khai hợp đồng truy xuất dữ liệu công thức của tầng Domain
import { IRecipeRepository } from "../../../domain/repositories/IRecipeRepository";
// Import thực thể Domain Recipe để sử dụng kiểu dữ liệu Recipe ở tầng Domain
import { Recipe as DomainRecipe } from "../../../domain/entities/Recipe";
// Import model Mongoose Recipe từ thư mục models để truy vấn dữ liệu MongoDB
import { Recipe as MongooseRecipe } from "../../../../../models/Recipe";
// Import bộ chuyển đổi RecipeMapper để chuyển đổi qua lại giữa Domain Model và Database Document
import { RecipeMapper } from "./mappers/RecipeMapper";
// Import thư viện mongoose để thực hiện kiểm tra định dạng kiểu dữ liệu ObjectId
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
    // Kiểm tra xem ID truyền vào có phải là một ObjectId hợp lệ trong MongoDB hay không
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    // Thực hiện truy vấn MongoDB để tìm tài liệu công thức theo ID và tự động nạp (populate) thông tin tác giả
    const doc = await MongooseRecipe.findById(id).populate(
      "authorId",
      "name avatar isVerified role"
    );
    // Nếu không tìm thấy tài liệu công thức, trả về null
    if (!doc) return null;

    // Sử dụng RecipeMapper để chuyển đổi tài liệu DB vừa tìm được sang thực thể Domain Recipe
    return RecipeMapper.toDomain(doc);
  }

  /**
   * Lưu hoặc cập nhật công thức nấu ăn vào Database.
   * Hỗ trợ cập nhật (update) nếu Recipe đã có ID, ngược lại tạo mới (save).
   */
  async save(recipe: DomainRecipe): Promise<void> {
    // Chuyển đổi thực thể Domain Recipe sang dạng đối tượng thuần phù hợp để lưu trữ MongoDB
    const persistenceData = RecipeMapper.toPersistence(recipe);
    
    // Nếu công thức đã có ID và ID đó là một ObjectId hợp lệ trong MongoDB
    if (recipe.id && mongoose.Types.ObjectId.isValid(recipe.id)) {
      // Thực hiện cập nhật tài liệu công thức trong DB, nếu chưa có thì chèn mới (upsert)
      await MongooseRecipe.findByIdAndUpdate(
        recipe.id,
        { $set: persistenceData },
        { upsert: true, new: true }
      );
    } else {
      // Trường hợp tạo mới công thức nấu ăn hoàn toàn
      const doc = new MongooseRecipe(persistenceData);
      // Thực hiện lưu tài liệu mới vào cơ sở dữ liệu MongoDB
      await doc.save();
      // Gán lại mã ID tự sinh từ MongoDB vào thực thể Domain Recipe
      (recipe as any)._id = doc._id.toString();
    }
  }

  /**
   * Xóa công thức nấu ăn khỏi cơ sở dữ liệu.
   */
  async delete(recipe: DomainRecipe): Promise<void> {
    // Nếu công thức có ID và ID đó là một ObjectId hợp lệ trong MongoDB
    if (recipe.id && mongoose.Types.ObjectId.isValid(recipe.id)) {
      // Tiến hành xóa tài liệu công thức khỏi MongoDB
      await MongooseRecipe.findByIdAndDelete(recipe.id);
    }
  }
}

