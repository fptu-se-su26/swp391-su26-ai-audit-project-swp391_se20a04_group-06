import { Recipe as DomainRecipe } from "../../../../domain/entities/Recipe";
import { IRecipe as MongooseRecipeDoc } from "../../../../../../models/Recipe";
import mongoose from "mongoose";

/**
 * Lớp RecipeMapper dùng để chuyển đổi dữ liệu qua lại giữa Mongoose Document và Domain Entity.
 * Đảm bảo lõi nghiệp vụ (Domain) không bị phụ thuộc vào cấu trúc schema của Database (Mongoose).
 * Rất quan trọng khi làm việc nhóm vì nó tách biệt ranh giới giữa DB và Logic nghiệp vụ.
 */
export class RecipeMapper {
  /**
   * Ánh xạ từ Mongoose Document lấy từ DB sang Domain Entity giàu nghiệp vụ.
   */
  public static toDomain(mongooseDoc: MongooseRecipeDoc): DomainRecipe {
    // Xử lý an toàn trường hợp authorId được populate thành object hoặc chỉ giữ ObjectId thô
    const authorId = mongooseDoc.authorId && (mongooseDoc.authorId as any)._id
      ? (mongooseDoc.authorId as any)._id.toString()
      : mongooseDoc.authorId.toString();

    // Chuyển đổi mảng likes từ ObjectId thành chuỗi string
    const likes = (mongooseDoc.likes || []).map((id: any) => 
      id._id ? id._id.toString() : id.toString()
    );

    return new DomainRecipe(
      {
        title: mongooseDoc.title,
        description: mongooseDoc.description,
        ingredients: mongooseDoc.ingredients || [],
        instructions: mongooseDoc.instructions || [],
        imageUrl: mongooseDoc.imageUrl,
        authorId,
        difficulty: mongooseDoc.difficulty,
        cookingTime: mongooseDoc.cookingTime,
        servings: mongooseDoc.servings,
        tags: mongooseDoc.tags || [],
        likes,
        viewCount: mongooseDoc.viewCount || 0,
      },
      mongooseDoc._id.toString()
    );
  }

  /**
   * Ánh xạ từ Domain Entity sang Object thô để lưu trữ vào Mongoose Database.
   */
  public static toPersistence(domainEntity: DomainRecipe): any {
    const props = domainEntity.toProps();
    
    return {
      title: props.title,
      description: props.description,
      ingredients: props.ingredients,
      instructions: props.instructions,
      imageUrl: props.imageUrl,
      authorId: new mongoose.Types.ObjectId(props.authorId),
      difficulty: props.difficulty,
      cookingTime: props.cookingTime,
      servings: props.servings,
      tags: props.tags,
      likes: props.likes.map((id) => new mongoose.Types.ObjectId(id)),
      viewCount: props.viewCount,
    };
  }
}
