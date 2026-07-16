// Import thực thể miền Recipe để tiến hành viết kiểm thử đơn vị
import { Recipe } from "../../../../../../../backend/src/modules/recipe/domain/entities/Recipe";

// Khởi chạy nhóm kiểm thử đơn vị cho thực thể miền Recipe Aggregate Root của module Recipe
describe("Recipe Aggregate Root", () => {
  // Ca test 1: Đảm bảo thực thể ném lỗi ValidationError khi tiêu đề bị trống
  it("nên ném ra lỗi nếu tiêu đề trống", () => {
    // Mong đợi ném lỗi khi cố tình khởi tạo Recipe có tiêu đề rỗng
    expect(() => {
      // Khởi tạo đối tượng Recipe mới
      new Recipe({
        // Gán tiêu đề trống
        title: "",
        // Mô tả hợp lệ
        description: "Mô tả",
        // Mảng nguyên liệu trống
        ingredients: [],
        // Mảng các bước hướng dẫn trống
        instructions: [],
        // Không có ảnh
        imageUrl: null,
        // ID người đăng bài
        authorId: "author-1",
        // Độ khó Medium
        difficulty: "Medium",
        // Thời gian nấu 30 phút
        cookingTime: 30,
        // Khẩu phần cho 2 người
        servings: 2,
        // Thẻ từ khóa trống
        tags: [],
        // Mảng lượt thích trống
        likes: [],
        // Lượt xem ban đầu bằng 0
        viewCount: 0,
      });
      // Mong đợi lỗi ValidationError ném ra khớp đúng thông điệp
    }).toThrow("Tiêu đề không được trống.");
  });

  // Ca test 2: Đảm bảo tính năng Like/Unlike hoạt động chính xác
  it("nên thay đổi trạng thái like chính xác", () => {
    // Khởi tạo thực thể Recipe mẫu hợp lệ
    const recipe = new Recipe({
      // Tiêu đề Gỏi Sứa
      title: "Gỏi Sứa",
      // Mô tả hợp lệ
      description: "Mô tả",
      // Mảng nguyên liệu trống
      ingredients: [],
      // Mảng các bước hướng dẫn trống
      instructions: [],
      // Không có ảnh
      imageUrl: null,
      // ID người đăng bài
      authorId: "author-1",
      // Độ khó Medium
      difficulty: "Medium",
      // Thời gian nấu 30 phút
      cookingTime: 30,
      // Khẩu phần cho 2 người
      servings: 2,
      // Mảng thẻ từ khóa rỗng
      tags: [],
      // Mảng lượt thích trống
      likes: [],
      // Số lượt xem ban đầu bằng 0
      viewCount: 0,
    });

    // Thực hiện like lần đầu với ID người dùng "user-1"
    const liked = recipe.toggleLike("user-1");
    // Mong đợi toggleLike trả về true (thích thành công)
    expect(liked).toBe(true);
    // Mong đợi danh sách thích của thực thể chứa ID "user-1"
    expect(recipe.likes).toContain("user-1");

    // Thực hiện like lần thứ hai (hủy thích) với cùng ID "user-1"
    const unliked = recipe.toggleLike("user-1");
    // Mong đợi toggleLike trả về false (hủy thích thành công)
    expect(unliked).toBe(false);
    // Mong đợi danh sách thích của thực thể không còn chứa ID "user-1" nữa
    expect(recipe.likes).not.toContain("user-1");
  });
});
