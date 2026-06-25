// Import interface IProductRepository để triển khai các luật truy xuất dữ liệu sản phẩm của tầng Domain
import { IProductRepository } from "../../../domain/repositories/IProductRepository";
// Import thực thể Domain Product để sử dụng kiểu dữ liệu Product ở tầng Domain
import { Product as DomainProduct } from "../../../domain/entities/Product";
// Import model Mongoose Product từ thư mục models dùng để truy vấn cơ sở dữ liệu MongoDB
import { Product as MongooseProduct } from "../../../../../models/Product";
// Import bộ chuyển đổi ProductMapper để chuyển đổi qua lại giữa Domain Model và Database Document
import { ProductMapper } from "./mappers/ProductMapper";
// Import thư viện mongoose để thực hiện kiểm tra định dạng kiểu dữ liệu ObjectId
import mongoose from "mongoose";

// Triển khai lớp MongooseProductRepository thực thi giao diện IProductRepository
export class MongooseProductRepository implements IProductRepository {
  // Tìm kiếm sản phẩm theo mã định danh duy nhất (id)
  async findById(id: string): Promise<DomainProduct | null> {
    // Kiểm tra xem ID truyền vào có phải là một ObjectId hợp lệ trong MongoDB hay không
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    // Thực hiện truy vấn cơ sở dữ liệu MongoDB để tìm sản phẩm theo ID
    const doc = await MongooseProduct.findById(id);
    // Nếu không tìm thấy sản phẩm hoặc sản phẩm đã bị đánh dấu xóa (Deleted), trả về null
    if (!doc || doc.status === "Deleted") return null;
    // Sử dụng Mapper để chuyển đổi tài liệu Mongoose vừa tìm được sang thực thể Domain Product
    return ProductMapper.toDomain(doc);
  }

  // Lưu trữ (tạo mới hoặc cập nhật) thông tin thực thể Domain Product vào cơ sở dữ liệu
  async save(product: DomainProduct): Promise<void> {
    // Chuyển đổi thực thể Domain Product sang dạng đối tượng thuần phù hợp để lưu vào MongoDB
    const persistence = ProductMapper.toPersistence(product);
    // Nếu sản phẩm đã có ID và ID đó là một ObjectId hợp lệ trong MongoDB
    if (product.id && mongoose.Types.ObjectId.isValid(product.id)) {
      // Thực hiện cập nhật tài liệu trong MongoDB theo ID, nếu chưa có thì chèn mới (upsert)
      await MongooseProduct.findByIdAndUpdate(product.id, { $set: persistence }, { upsert: true });
    } else {
      // Nếu là sản phẩm mới chưa có ID hợp lệ, tạo một tài liệu Mongoose mới từ dữ liệu persistence
      const doc = new MongooseProduct(persistence);
      // Thực hiện lưu tài liệu mới vào cơ sở dữ liệu MongoDB
      await doc.save();
      // Gán lại ID tự sinh từ MongoDB vào thuộc tính nội bộ của thực thể Domain Product
      (product as any)._id = doc._id.toString();
    }
  }

  // Thực hiện xóa mềm sản phẩm bằng cách chuyển trạng thái sang "Deleted"
  async delete(product: DomainProduct): Promise<void> {
    // Nếu sản phẩm có ID và ID đó là một ObjectId hợp lệ trong MongoDB
    if (product.id && mongoose.Types.ObjectId.isValid(product.id)) {
      // Cập nhật trường status của sản phẩm thành "Deleted" trong cơ sở dữ liệu MongoDB
      await MongooseProduct.findByIdAndUpdate(product.id, { $set: { status: "Deleted" } });
    }
  }
}

