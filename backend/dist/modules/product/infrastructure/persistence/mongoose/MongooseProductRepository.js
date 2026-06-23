"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseProductRepository = void 0;
// Import model Mongoose Product từ thư mục models dùng để truy vấn cơ sở dữ liệu MongoDB
const Product_1 = require("../../../../../models/Product");
// Import bộ chuyển đổi ProductMapper để chuyển đổi qua lại giữa Domain Model và Database Document
const ProductMapper_1 = require("./mappers/ProductMapper");
// Import thư viện mongoose để thực hiện kiểm tra định dạng kiểu dữ liệu ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Triển khai lớp MongooseProductRepository thực thi giao diện IProductRepository
class MongooseProductRepository {
    // Tìm kiếm sản phẩm theo mã định danh duy nhất (id)
    async findById(id) {
        // Kiểm tra xem ID truyền vào có phải là một ObjectId hợp lệ trong MongoDB hay không
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return null;
        // Thực hiện truy vấn cơ sở dữ liệu MongoDB để tìm sản phẩm theo ID
        const doc = await Product_1.Product.findById(id);
        // Nếu không tìm thấy sản phẩm hoặc sản phẩm đã bị đánh dấu xóa (Deleted), trả về null
        if (!doc || doc.status === "Deleted")
            return null;
        // Sử dụng Mapper để chuyển đổi tài liệu Mongoose vừa tìm được sang thực thể Domain Product
        return ProductMapper_1.ProductMapper.toDomain(doc);
    }
    // Lưu trữ (tạo mới hoặc cập nhật) thông tin thực thể Domain Product vào cơ sở dữ liệu
    async save(product) {
        // Chuyển đổi thực thể Domain Product sang dạng đối tượng thuần phù hợp để lưu vào MongoDB
        const persistence = ProductMapper_1.ProductMapper.toPersistence(product);
        // Nếu sản phẩm đã có ID và ID đó là một ObjectId hợp lệ trong MongoDB
        if (product.id && mongoose_1.default.Types.ObjectId.isValid(product.id)) {
            // Thực hiện cập nhật tài liệu trong MongoDB theo ID, nếu chưa có thì chèn mới (upsert)
            await Product_1.Product.findByIdAndUpdate(product.id, { $set: persistence }, { upsert: true });
        }
        else {
            // Nếu là sản phẩm mới chưa có ID hợp lệ, tạo một tài liệu Mongoose mới từ dữ liệu persistence
            const doc = new Product_1.Product(persistence);
            // Thực hiện lưu tài liệu mới vào cơ sở dữ liệu MongoDB
            await doc.save();
            // Gán lại ID tự sinh từ MongoDB vào thuộc tính nội bộ của thực thể Domain Product
            product._id = doc._id.toString();
        }
    }
    // Thực hiện xóa mềm sản phẩm bằng cách chuyển trạng thái sang "Deleted"
    async delete(product) {
        // Nếu sản phẩm có ID và ID đó là một ObjectId hợp lệ trong MongoDB
        if (product.id && mongoose_1.default.Types.ObjectId.isValid(product.id)) {
            // Cập nhật trường status của sản phẩm thành "Deleted" trong cơ sở dữ liệu MongoDB
            await Product_1.Product.findByIdAndUpdate(product.id, { $set: { status: "Deleted" } });
        }
    }
}
exports.MongooseProductRepository = MongooseProductRepository;
