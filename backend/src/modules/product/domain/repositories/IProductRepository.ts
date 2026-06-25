// Import thực thể Product để định nghĩa kiểu dữ liệu trả về và đối số truyền vào trong Repository
import { Product } from "../entities/Product";

// Định nghĩa giao diện (interface) IProductRepository quản lý các thao tác dữ liệu với thực thể Product ở tầng nghiệp vụ (Domain)
export interface IProductRepository {
  // Tìm kiếm một sản phẩm theo ID của sản phẩm, trả về một Promise chứa đối tượng Product hoặc null nếu không tìm thấy
  findById(id: string): Promise<Product | null>;
  // Lưu thông tin của một thực thể Product (có thể là tạo mới hoặc cập nhật) vào cơ sở dữ liệu
  save(product: Product): Promise<void>;
  // Xóa bỏ một thực thể Product ra khỏi cơ sở dữ liệu
  delete(product: Product): Promise<void>;
}

