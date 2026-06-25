// Import mô hình Product và kiểu IProduct từ thư mục models/Product để truy vấn cơ sở dữ liệu
import { Product, IProduct } from "../models/Product";
// Import thư viện mongoose để thực hiện kiểm tra tính hợp lệ của ObjectId và các tác vụ khác
import mongoose from "mongoose";

// Xuất ra đối tượng productRepository chứa các phương thức tương tác cơ sở dữ liệu cho sản phẩm
export const productRepository = {
  // Phương thức tìm kiếm sản phẩm bằng ID
  async findById(id: string): Promise<IProduct | null> {
    // Kiểm tra định dạng ID có hợp lệ hay không, nếu không hợp lệ trả về null
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    // Tìm kiếm tài liệu Product dựa theo ID và trả về kết quả
    return Product.findById(id);
  },

  // Phương thức tìm kiếm một sản phẩm dựa trên điều kiện lọc
  async findOne(query: any): Promise<IProduct | null> {
    // Tìm kiếm một tài liệu khớp với điều kiện lọc và trả về kết quả
    return Product.findOne(query);
  },

  // Phương thức kiểm tra xem sản phẩm có tồn tại dựa trên điều kiện lọc hay không
  async exists(query: any): Promise<boolean> {
    // Sử dụng hàm exists để kiểm tra, ép kiểu Boolean để trả về giá trị true/false
    return !!(await Product.exists(query));
  },

  // Phương thức đếm tổng số lượng sản phẩm khớp với bộ lọc
  async countDocuments(filter: any): Promise<number> {
    // Gọi phương thức countDocuments để trả về số bản ghi phù hợp
    return Product.countDocuments(filter);
  },

  // Phương thức tìm kiếm danh sách sản phẩm với các bộ lọc, trường hiển thị và tùy chọn cấu hình
  async find(
    // Bộ lọc điều kiện tìm kiếm
    filter: any,
    // Các trường dữ liệu muốn lấy ra (mặc định lấy hết)
    projection: any = {},
    // Tùy chọn bổ sung như sắp xếp, giới hạn, phân trang (mặc định trống)
    options: any = {},
  ): Promise<IProduct[]> {
    // Thực hiện truy vấn danh sách sản phẩm và trả về kết quả
    return Product.find(filter, projection, options);
  },

  // Phương thức lấy các giá trị duy nhất (không trùng lặp) của một trường dựa theo bộ lọc
  async distinct(field: string, filter: any = {}): Promise<any[]> {
    // Thực hiện truy vấn các giá trị phân biệt của trường dữ liệu tương ứng
    return Product.distinct(field, filter);
  },

  // Phương thức thực hiện truy vấn tổng hợp phức tạp (Aggregation) của Mongoose
  async aggregate(pipeline: any[]): Promise<any[]> {
    // Gọi phương thức aggregate với chuỗi pipeline được truyền vào
    return Product.aggregate(pipeline);
  },

  // Phương thức cập nhật đồng loạt nhiều tài liệu sản phẩm khớp với bộ lọc
  async updateMany(filter: any, update: any): Promise<any> {
    // Thực hiện cập nhật dữ liệu của nhiều bản ghi sản phẩm cùng lúc
    return Product.updateMany(filter, update);
  },

  // Phương thức xóa đồng loạt nhiều tài liệu sản phẩm khớp với bộ lọc
  async deleteMany(filter: any): Promise<any> {
    // Thực hiện xóa nhiều bản ghi sản phẩm cùng lúc dựa trên bộ lọc
    return Product.deleteMany(filter);
  },

  // Phương thức tạo mới một sản phẩm
  async create(data: any): Promise<IProduct> {
    // Khởi tạo một đối tượng Product mới từ dữ liệu được truyền vào
    const product = new Product(data);
    // Lưu tài liệu sản phẩm mới vào cơ sở dữ liệu và trả về kết quả sau khi lưu
    return product.save();
  },

  // Phương thức tìm kiếm sản phẩm theo ID và thực hiện cập nhật
  async findByIdAndUpdate(
    // ID của sản phẩm cần cập nhật
    id: string,
    // Nội dung dữ liệu cần cập nhật
    update: any,
    // Tùy chọn cấu hình, mặc định trả về tài liệu mới sau khi đã cập nhật thành công
    options: any = { new: true },
  ): Promise<IProduct | null> {
    // Kiểm tra tính hợp lệ của định dạng ID, nếu không hợp lệ trả về null
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    // Thực hiện tìm kiếm và cập nhật tài liệu sản phẩm tương ứng
    return Product.findByIdAndUpdate(id, update, options);
  },

  // Phương thức tìm kiếm sản phẩm của một người bán có phân trang
  async findByOwner(sellerId: string, skip: number, limit: number) {
    // Đếm tổng số lượng sản phẩm của người bán này mà trạng thái không phải là "Deleted"
    const total = await this.countDocuments({
      sellerId: sellerId as any,
      status: { $ne: "Deleted" },
    });

    // Truy vấn danh sách sản phẩm của người bán này mà trạng thái không phải là "Deleted"
    const products = await Product.find({
      sellerId: sellerId as any,
      status: { $ne: "Deleted" },
    } as any)
      // Sắp xếp sản phẩm theo thời gian tạo giảm dần (mới nhất lên đầu)
      .sort({ createdAt: -1 })
      // Bỏ qua skip phần tử để phân trang
      .skip(skip)
      // Giới hạn tối đa limit phần tử trên một trang
      .limit(limit);

    // Chuẩn hóa cấu trúc dữ liệu trả về cho danh sách sản phẩm để đồng bộ API
    const data = products.map((p) => ({
      // Ép kiểu ID sang chuỗi văn bản
      id: p._id.toString(),
      // Loại hình sản phẩm (ví dụ: hải sản tươi sống, chế biến...)
      type: p.type,
      // Danh mục của sản phẩm
      category: p.category,
      // Tên sản phẩm
      name: p.name,
      // Giá sản phẩm
      price: p.price,
      // Kiểu bán (ví dụ: theo kg, theo mẻ...)
      salesType: p.salesType,
      // Tổng khối lượng sản phẩm
      totalWeight: p.totalWeight,
      // Khối lượng còn lại sau khi bán
      remainingWeight: p.remainingWeight,
      // Trạng thái hiển thị/bán của sản phẩm
      status: p.status,
      // Thời điểm đánh bắt/thu hoạch sản phẩm
      catchTime: p.catchTime,
      // Nguồn gốc xuất xứ của sản phẩm
      origin: p.origin,
      // Hạn sử dụng sản phẩm
      expiryDate: p.expiryDate,
      // Thời điểm đăng tải sản phẩm lên hệ thống
      createdAt: p.createdAt,
      // Số lượt xem sản phẩm
      viewCount: p.viewCount,
      // Thời điểm sản phẩm được đẩy bài viết để lên đầu trang
      bumpedAt: p.bumpedAt,
      // Ảnh bìa đại diện của sản phẩm (ảnh đầu tiên trong mảng, hoặc null nếu không có)
      coverImg: p.images?.[0] || null,
      // Số lượng ảnh đính kèm của sản phẩm (hoặc 0 nếu không có)
      imgCount: p.images?.length || 0,
    }));

    // Trả về dữ liệu danh sách sản phẩm đã chuẩn hóa cùng tổng số lượng
    return { data, total };
  },

  // Phương thức tìm kiếm một sản phẩm theo bộ lọc và thực hiện cập nhật
  async findOneAndUpdate(filter: any, update: any): Promise<IProduct | null> {
    // Tìm kiếm, cập nhật và trả về tài liệu mới sau khi cập nhật thành công
    return Product.findOneAndUpdate(filter, update, { new: true });
  },
};
