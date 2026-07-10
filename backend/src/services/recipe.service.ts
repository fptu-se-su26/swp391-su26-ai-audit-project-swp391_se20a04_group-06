// Import đối tượng recipeRepository để thao tác với cơ sở dữ liệu công thức món ăn
import { recipeRepository } from "../repositories/recipe.repository";
// Import đối tượng userRepository để thao tác với cơ sơ dữ liệu người dùng
import { userRepository } from "../repositories/user.repository";
// Import lớp lỗi HttpError dùng để ném ra các lỗi kèm theo mã HTTP phù hợp
import { HttpError } from "../errors/HttpError";
// Import hàm trợ giúp parseId dùng để kiểm tra tính hợp lệ của định dạng ObjectId trong MongoDB
import { parseId } from "../helpers/response.helper";
import { Recipe as RecipeModel } from "../models/Recipe";
import { sanitizeText } from "../utils/security";

// Xuất ra đối tượng recipeService chứa các logic nghiệp vụ liên quan đến công thức món ăn hải sản
export const recipeService = {
  // Nghiệp vụ lấy danh sách công thức món ăn có lọc theo từ khóa, độ khó, thẻ tag, tác giả và phân trang
  async list(query: {
    // Số trang hiện tại truyền lên dưới dạng chuỗi
    page?: string;
    // Số dòng tối đa trên mỗi trang
    limit?: string;
    // Từ khóa tìm kiếm công thức
    search?: string;
    // Lọc theo độ khó (Easy, Medium, Hard)
    difficulty?: string;
    // Lọc theo nhãn/thẻ tag của món ăn
    tag?: string;
    // Lọc theo ID người tạo công thức
    authorId?: string;
  }) {
    // Chuyển đổi số trang từ chuỗi sang số nguyên, mặc định là trang 1
    const page = parseInt(query.page || "1", 10);
    // Chuyển đổi giới hạn số bản ghi từ chuỗi sang số nguyên, mặc định là 12
    const limit = parseInt(query.limit || "12", 10);
    // Tính toán số lượng bản ghi cần bỏ qua dựa theo trang hiện tại và giới hạn mỗi trang
    const skip = (page - 1) * limit;

    // Khởi tạo đối tượng bộ lọc trống để tích lũy các điều kiện truy vấn
    const filter: any = {};
    // Nếu có từ khóa tìm kiếm được cung cấp
    if (query.search) {
      // Áp dụng tìm kiếm văn bản toàn văn ($text) dựa trên từ khóa tìm kiếm đã lập chỉ mục
      filter.$text = { $search: query.search };
    }
    // Nếu có lọc theo độ khó và giá trị truyền vào nằm trong danh sách hợp lệ
    if (
      query.difficulty &&
      ["Easy", "Medium", "Hard"].includes(query.difficulty)
    ) {
      // Gán thuộc tính độ khó vào bộ lọc tìm kiếm
      filter.difficulty = query.difficulty;
    }
    // Lọc theo nhãn/thẻ tag nếu có thẻ tag truyền lên
    if (query.tag) {
      // Tìm công thức có mảng tags chứa giá trị tag này
      filter.tags = query.tag;
    }
    // Lọc theo tác giả nếu truyền ID tác giả hợp lệ dạng ObjectId
    if (query.authorId && parseId(query.authorId)) {
      // Gán ID tác giả vào bộ lọc truy vấn
      filter.authorId = query.authorId;
    }

    // Đánh giá xem có cần sắp xếp kết quả theo điểm số tương đồng của từ khóa tìm kiếm hay không
    const sortByScore = !!query.search;
    // Thực thi gọi hàm findAll từ repository để lấy danh sách công thức và tổng số lượng bản ghi khớp
    const { recipes, total } = await recipeRepository.findAll(
      // Bộ lọc đã tổng hợp
      filter,
      // Vị trí bỏ qua phân trang
      skip,
      // Số dòng tối đa cần lấy
      limit,
      // Cờ sắp xếp theo điểm tương đồng tìm kiếm
      sortByScore,
    );

    // Trả về kết quả danh sách công thức cùng thông tin phân trang đầy đủ
    return {
      // Danh sách công thức món ăn hải sản tìm được
      recipes,
      // Số trang hiện tại
      page,
      // Số giới hạn dòng trên trang
      limit,
      // Tổng số lượng công thức khớp bộ lọc trong cơ sở dữ liệu
      total,
      // Tính toán tổng số trang dựa trên tổng số lượng chia cho giới hạn mỗi trang (làm tròn lên)
      totalPages: Math.ceil(total / limit),
    };
  },

  // Nghiệp vụ lấy chi tiết một công thức món ăn theo ID đồng thời tăng lượt xem
  async getById(id: string) {
    // Gọi hàm tìm kiếm công thức từ repository đồng thời cộng thêm 1 vào trường lượt xem (views)
    const recipe = await recipeRepository.findByIdAndIncrementView(id);
    // Nếu không tìm thấy công thức nào khớp với ID cung cấp, ném ra lỗi 404
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");
    // Trả về dữ liệu chi tiết của công thức món ăn hải sản tìm thấy
    return recipe;
  },

  // Nghiệp vụ tạo mới một công thức nấu ăn hải sản
  async create(userId: string, role: string, data: any) {
    // Truy vấn thông tin tài khoản người dùng tạo công thức từ cơ sở dữ liệu thô
    const user = await userRepository.findRawById(userId);
    // Nếu người dùng không tồn tại trong hệ thống, ném lỗi 404
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    // Chỉ cho phép quản trị viên (Admin) hoặc ngư dân đã được xác minh (isVerified = true) viết công thức
    if (role !== "Admin" && !user.isVerified) {
      // Ném lỗi 403 Forbidden nếu không đủ thẩm quyền truy cập nghiệp vụ
      throw new HttpError(
        403,
        "Chỉ Admin hoặc ngư dân đã xác minh mới được viết công thức nấu ăn",
      );
    }

    // Thực hiện lưu trữ công thức mới vào cơ sở dữ liệu thông qua repository
    return recipeRepository.create({
      // Tiêu đề của công thức món ăn
      title: data.title,
      // Mô tả ngắn về món ăn và công thức
      description: data.description,
      // Chuẩn hóa mảng nguyên liệu: nếu là mảng thì dùng luôn, nếu là chuỗi đơn thì bọc vào mảng
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients
        : [data.ingredients],
      // Chuẩn hóa mảng các bước hướng dẫn nấu ăn tương tự nguyên liệu đầu vào
      instructions: Array.isArray(data.instructions)
        ? data.instructions
        : [data.instructions],
      // Đường dẫn hình ảnh minh họa món ăn, mặc định là null nếu không tải ảnh
      imageUrl: data.imageUrl || null,
      // ID tài khoản của người viết công thức nấu ăn này
      authorId: userId,
      // Mức độ khó của công thức nấu ăn, mặc định là "Medium"
      difficulty: data.difficulty || "Medium",
      // Thời gian nấu nướng ước tính tính bằng phút, mặc định là 30 phút
      cookingTime: data.cookingTime || 30,
      // Số lượng khẩu phần ăn phục vụ tương ứng, mặc định là 2 phần
      servings: data.servings || 2,
      // Danh sách nhãn/thẻ tag đi kèm công thức, mặc định là mảng rỗng nếu không có
      tags: Array.isArray(data.tags) ? data.tags : [],
    });
  },

  // Nghiệp vụ chuyển đổi trạng thái thích/bỏ thích (Like/Unlike) một công thức món ăn
  async toggleLike(recipeId: string, userId: string) {
    // Tìm kiếm thông tin công thức món ăn theo ID
    const recipe = await recipeRepository.findById(recipeId);
    // Nếu không tìm thấy công thức nấu ăn tương ứng trong hệ thống, ném lỗi 404
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");

    // Kiểm tra xem ID người dùng đã nằm trong danh sách mảng những người thích (likes) hay chưa
    const index = recipe.likes.indexOf(userId as any);
    // Khởi tạo trạng thái đã thích thành false
    let liked = false;
    // Khởi tạo biến lưu trữ công thức sau khi được cập nhật
    let updatedRecipe;

    // Nếu người dùng chưa từng nhấn thích công thức này trước đây
    if (index === -1) {
      // Thực hiện thêm ID người dùng vào danh sách mảng thích thông qua repository
      updatedRecipe = await recipeRepository.addLike(recipeId, userId);
      // Gán cờ trạng thái đã thích thành true
      liked = true;
    } else {
      // Ngược lại, nếu đã thích thì thực hiện xóa ID người dùng ra khỏi danh sách mảng thích
      updatedRecipe = await recipeRepository.removeLike(recipeId, userId);
    }

    // Trả về trạng thái thích hiện tại cùng tổng số lượng lượt thích mới nhất
    return { liked, likeCount: updatedRecipe?.likes.length || 0 };
  },

  async addComment(recipeId: string, userId: string, text: string) {
    if (!parseId(recipeId)) {
      throw new HttpError(400, "ID công thức không hợp lệ");
    }
    const user = await userRepository.findRawById(userId);
    if (!user) throw new HttpError(404, "Không tìm thấy người dùng");

    const cleanText = sanitizeText(text, 1000);
    if (!cleanText) throw new HttpError(400, "Bình luận không được để trống");

    const recipe = await RecipeModel.findByIdAndUpdate(
      recipeId,
      {
        $push: {
          comments: {
            userId: user._id,
            userName: user.name,
            userAvatar: user.avatar || null,
            text: cleanText,
          },
        },
      },
      { new: true },
    );
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");
    return recipe.comments;
  },

  // Nghiệp vụ cập nhật thông tin chi tiết một công thức nấu ăn
  async update(recipeId: string, userId: string, role: string, data: any) {
    // Tìm kiếm thông tin công thức theo ID trước khi thực hiện chỉnh sửa
    const recipe = await recipeRepository.findById(recipeId);
    // Ném lỗi 404 nếu không tìm thấy công thức
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");

    // Kiểm tra quyền: Chỉ cho phép quản trị viên hoặc chính tác giả viết bài chỉnh sửa công thức này
    if (role !== "Admin" && recipe.authorId._id.toString() !== userId) {
      // Ném lỗi 403 Forbidden nếu cố tình chỉnh sửa bài viết của người khác
      throw new HttpError(403, "Bạn không có quyền chỉnh sửa công thức này");
    }

    // Khởi tạo đối tượng gom các trường cập nhật mới
    const updates: any = {};
    // Cập nhật tiêu đề nếu có dữ liệu mới truyền lên
    if (data.title) updates.title = data.title;
    // Cập nhật mô tả nếu có mô tả mới
    if (data.description) updates.description = data.description;
    // Cập nhật mảng nguyên liệu nếu có nguyên liệu mới và tiến hành chuẩn hóa mảng
    if (data.ingredients)
      updates.ingredients = Array.isArray(data.ingredients)
        ? data.ingredients
        : [data.ingredients];
    // Cập nhật mảng hướng dẫn nấu nướng nếu có và tiến hành chuẩn hóa mảng
    if (data.instructions)
      updates.instructions = Array.isArray(data.instructions)
        ? data.instructions
        : [data.instructions];
    // Cập nhật hình ảnh minh họa (chấp nhận cả giá trị null để xóa ảnh cũ)
    if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
    // Cập nhật mức độ khó nấu ăn mới
    if (data.difficulty) updates.difficulty = data.difficulty;
    // Cập nhật thời gian nấu mới
    if (data.cookingTime) updates.cookingTime = data.cookingTime;
    // Cập nhật khẩu phần ăn mới
    if (data.servings) updates.servings = data.servings;
    // Cập nhật mảng thẻ nhãn mới và chuẩn hóa định dạng
    if (data.tags) updates.tags = Array.isArray(data.tags) ? data.tags : [];

    // Gọi hàm cập nhật dữ liệu của repository và trả về bản ghi công thức mới sau cập nhật
    return recipeRepository.update(recipeId, updates);
  },

  // Nghiệp vụ xóa công thức nấu ăn khỏi hệ thống
  async delete(recipeId: string, userId: string, role: string) {
    // Tìm kiếm thông tin công thức theo ID trước khi tiến hành xóa bỏ
    const recipe = await recipeRepository.findById(recipeId);
    // Nếu không tồn tại công thức, báo lỗi 404
    if (!recipe) throw new HttpError(404, "Không tìm thấy công thức");

    // Quyền kiểm soát: Chỉ cho phép quản trị viên hoặc chính người tạo ra công thức nấu ăn xóa bài viết này
    if (role !== "Admin" && recipe.authorId._id.toString() !== userId) {
      // Ném lỗi 403 Forbidden biểu thị từ chối quyền thực thi hành động xóa
      throw new HttpError(403, "Bạn không có quyền xóa công thức này");
    }

    // Thực thi lệnh xóa công thức nấu ăn khỏi cơ sở dữ liệu qua repository
    await recipeRepository.delete(recipeId);
  },
};
