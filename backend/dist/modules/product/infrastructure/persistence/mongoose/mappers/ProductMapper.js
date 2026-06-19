"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductMapper = void 0;
// Import thực thể Domain Product để sử dụng kiểu dữ liệu Product ở tầng Domain
const Product_1 = require("../../../../domain/entities/Product");
// Import đối tượng giá trị GPSCoordinates để biểu diễn dữ liệu tọa độ địa lý dạng kinh vĩ độ
const GPSCoordinates_1 = require("../../../../domain/value-objects/GPSCoordinates");
// Import thư viện mongoose để thực hiện chuyển đổi kiểu dữ liệu ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Định nghĩa lớp ProductMapper dùng để ánh xạ (map) dữ liệu giữa Domain Model và Database Document
class ProductMapper {
    // Phương thức tĩnh chuyển đổi dữ liệu từ Mongoose Document sang Domain Product Entity
    static toDomain(mongooseDoc) {
        // Khai báo biến lưu trữ tọa độ GPS hiện tại (có thể không xác định)
        let location;
        // Kiểm tra xem tài liệu Mongoose có chứa thông tin tọa độ hiện tại hợp lệ hay không
        if (mongooseDoc.location && mongooseDoc.location.coordinates) {
            // Khởi tạo đối tượng GPSCoordinates từ tọa độ GeoJSON [kinh độ, vĩ độ]
            location = GPSCoordinates_1.GPSCoordinates.create(
            // Vĩ độ nằm ở chỉ mục thứ 1 trong mảng coordinates của GeoJSON
            mongooseDoc.location.coordinates[1], 
            // Kinh độ nằm ở chỉ mục thứ 0 trong mảng coordinates của GeoJSON
            mongooseDoc.location.coordinates[0]);
        }
        // Khai báo biến lưu trữ tọa độ GPS nơi đánh bắt hải sản (có thể không xác định)
        let catchLocation;
        // Kiểm tra xem tài liệu Mongoose có chứa thông tin tọa độ nơi đánh bắt hợp lệ hay không
        if (mongooseDoc.catchLocation && mongooseDoc.catchLocation.coordinates) {
            // Khởi tạo đối tượng GPSCoordinates từ tọa độ đánh bắt GeoJSON [kinh độ, vĩ độ]
            catchLocation = GPSCoordinates_1.GPSCoordinates.create(
            // Vĩ độ nằm ở chỉ mục thứ 1 trong mảng coordinates của GeoJSON
            mongooseDoc.catchLocation.coordinates[1], 
            // Kinh độ nằm ở chỉ mục thứ 0 trong mảng coordinates của GeoJSON
            mongooseDoc.catchLocation.coordinates[0]);
        }
        // Trả về thực thể Domain Product mới được ánh xạ từ các thuộc tính của Mongoose Document
        return new Product_1.Product({
            // Chuyển mã ID của người bán từ dạng ObjectId sang kiểu chuỗi (string)
            sellerId: mongooseDoc.sellerId.toString(),
            // Ánh xạ loại sản phẩm (Tươi sống hoặc đồ khô)
            type: mongooseDoc.type,
            // Ánh xạ danh mục sản phẩm
            category: mongooseDoc.category,
            // Ánh xạ tên sản phẩm
            name: mongooseDoc.name,
            // Ánh xạ mô tả sản phẩm (nếu rỗng thì mặc định là chuỗi rỗng)
            description: mongooseDoc.description || "",
            // Ánh xạ giá bán của sản phẩm
            price: mongooseDoc.price,
            // Ánh xạ hình thức bán hàng (sỉ hay lẻ)
            salesType: mongooseDoc.salesType,
            // Ánh xạ tổng khối lượng mẻ sản phẩm
            totalWeight: mongooseDoc.totalWeight,
            // Ánh xạ khối lượng sản phẩm còn lại trong kho
            remainingWeight: mongooseDoc.remainingWeight,
            // Ép kiểu trạng thái sản phẩm từ Mongoose sang enum tương ứng ở Domain
            status: mongooseDoc.status,
            // Gán đối tượng GPSCoordinates tọa độ hiện tại của sản phẩm
            location,
            // Gán đối tượng GPSCoordinates tọa độ nơi đánh bắt hải sản
            catchLocation,
            // Ánh xạ mốc thời gian đánh bắt hải sản
            catchTime: mongooseDoc.catchTime,
            // Ánh xạ nguồn gốc xuất xứ của hải sản
            origin: mongooseDoc.origin,
            // Ánh xạ hạn sử dụng của sản phẩm
            expiryDate: mongooseDoc.expiryDate,
            // Ánh xạ danh sách hình ảnh sản phẩm (mặc định là mảng rỗng nếu không tồn tại)
            images: mongooseDoc.images || [],
            // Ánh xạ mốc thời gian đẩy bài gần nhất
            bumpedAt: mongooseDoc.bumpedAt,
            // Ánh xạ mốc thời gian sản phẩm được tạo
            createdAt: mongooseDoc.createdAt,
            // Ánh xạ lượt xem của sản phẩm
            viewCount: mongooseDoc.viewCount,
        }, 
        // Chuyển đổi mã định danh của tài liệu Mongoose từ ObjectId sang chuỗi làm ID thực thể Domain
        mongooseDoc._id.toString());
    }
    // Phương thức tĩnh chuyển đổi từ Domain Product Entity sang đối tượng dữ liệu MongoDB (Persistence Object)
    static toPersistence(domainEntity) {
        // Lấy ra toàn bộ thuộc tính props của thực thể Domain Product
        const props = domainEntity.toProps();
        // Tạo đối tượng persistence cơ bản để lưu trữ vào MongoDB
        const persistenceObj = {
            // Chuyển đổi ID của người bán sang kiểu dữ liệu ObjectId của Mongoose/MongoDB
            sellerId: new mongoose_1.default.Types.ObjectId(props.sellerId),
            // Thiết lập loại sản phẩm (Tươi sống/Đồ khô)
            type: props.type,
            // Thiết lập danh mục sản phẩm
            category: props.category,
            // Thiết lập tên sản phẩm
            name: props.name,
            // Thiết lập mô tả chi tiết sản phẩm
            description: props.description,
            // Thiết lập giá bán sản phẩm
            price: props.price,
            // Thiết lập hình thức bán (sỉ/lẻ)
            salesType: props.salesType,
            // Thiết lập tổng khối lượng mẻ hàng
            totalWeight: props.totalWeight,
            // Thiết lập khối lượng sản phẩm còn lại
            remainingWeight: props.remainingWeight,
            // Thiết lập trạng thái sản phẩm
            status: props.status,
            // Thiết lập danh sách hình ảnh sản phẩm
            images: props.images,
            // Thiết lập lượt xem sản phẩm
            viewCount: props.viewCount,
            // Thiết lập thời điểm đẩy bài viết gần nhất
            bumpedAt: props.bumpedAt,
        };
        // Nếu thực thể Domain có thông tin vị trí tọa độ hiện tại
        if (props.location) {
            // Chuyển đổi tọa độ GPS hiện tại sang định dạng Point GeoJSON [kinh độ, vĩ độ] lưu trữ trong MongoDB
            persistenceObj.location = {
                type: "Point",
                coordinates: [props.location.longitude, props.location.latitude],
            };
        }
        // Nếu thực thể Domain có thông tin tọa độ nơi đánh bắt hải sản
        if (props.catchLocation) {
            // Chuyển đổi tọa độ đánh bắt sang định dạng Point GeoJSON [kinh độ, vĩ độ] lưu trữ trong MongoDB
            persistenceObj.catchLocation = {
                type: "Point",
                coordinates: [props.catchLocation.longitude, props.catchLocation.latitude],
            };
        }
        // Nếu thực thể Domain có thời điểm đánh bắt hải sản, gán giá trị đó cho trường catchTime trong DB
        if (props.catchTime) {
            persistenceObj.catchTime = props.catchTime;
        }
        // Nếu thực thể Domain có nguồn gốc xuất xứ, gán giá trị đó cho trường origin trong DB
        if (props.origin) {
            persistenceObj.origin = props.origin;
        }
        // Nếu thực thể Domain có hạn sử dụng, gán giá trị đó cho trường expiryDate trong DB
        if (props.expiryDate) {
            persistenceObj.expiryDate = props.expiryDate;
        }
        // Trả về đối tượng persistence hoàn chỉnh sẵn sàng để lưu xuống MongoDB
        return persistenceObj;
    }
}
exports.ProductMapper = ProductMapper;
