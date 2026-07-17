"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import thực thể Domain Product cần được kiểm thử đơn vị
const Product_1 = require("../../../../../../../backend/src/modules/product/domain/entities/Product");
// Import đối tượng giá trị GPSCoordinates để khởi tạo dữ liệu tọa độ địa lý kiểm thử
const GPSCoordinates_1 = require("../../../../../../../backend/src/modules/product/domain/value-objects/GPSCoordinates");
// Khởi chạy nhóm kiểm thử đơn vị cho thực thể miền Product Aggregate Root thuộc phân hệ Quản lý sản phẩm
describe("Product Catalog Module - Product Aggregate Root", () => {
    // Tạo sẵn một đối tượng tọa độ GPS hợp lệ để sử dụng chung cho các ca kiểm thử
    const gpsLocation = GPSCoordinates_1.GPSCoordinates.create(10.762622, 106.660172);
    // Ca test 1: Đảm bảo ném lỗi ValidationError nếu sản phẩm tươi sống (Fresh) bị thiếu thông số vị trí GPS
    it("nên ném ra lỗi nếu sản phẩm Fresh thiếu tọa độ GPS", () => {
        // Mong đợi ném lỗi khi khởi tạo thực thể tươi sống không truyền GPS
        expect(() => {
            // Khởi tạo thực thể Product mới
            new Product_1.Product({
                // Gán mã người bán
                sellerId: "seller-123",
                // Loại hải sản tươi sống
                type: "Fresh",
                // Danh mục Cá
                category: "Fish",
                // Tên sản phẩm
                name: "Cá thu tươi",
                // Mô tả sản phẩm
                description: "Mô tả cá thu",
                // Giá bán sản phẩm
                price: 150000,
                // Hình thức bán lẻ
                salesType: "Retail",
                // Tổng khối lượng 10kg
                totalWeight: 10,
                // Khối lượng còn lại 10kg
                remainingWeight: 10,
                // Trạng thái đang bán
                status: "Active",
                // Mảng ảnh rỗng
                images: [],
            });
            // Mong đợi lỗiValidationError ném ra khớp đúng câu thông báo nghiệp vụ
        }).toThrow("Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!");
    });
    // Ca test 2: Đảm bảo ném lỗi ValidationError nếu khối lượng còn lại lớn hơn tổng khối lượng ban đầu của mẻ hàng
    it("nên ném ra lỗi nếu cân nặng còn lại lớn hơn tổng cân nặng ban đầu", () => {
        // Mong đợi ném lỗi khi khởi tạo thực thể có số cân còn lại lớn hơn tổng số cân ban đầu
        expect(() => {
            // Khởi tạo thực thể Product mới
            new Product_1.Product({
                // Gán mã người bán
                sellerId: "seller-123",
                // Loại đồ khô (Dried)
                type: "Dried",
                // Danh mục Cá
                category: "Fish",
                // Tên sản phẩm
                name: "Cá khô",
                // Mô tả sản phẩm
                description: "Mô tả",
                // Giá bán
                price: 100000,
                // Hình thức bán lẻ
                salesType: "Retail",
                // Tổng khối lượng ban đầu là 10kg
                totalWeight: 10,
                // Khối lượng còn lại 12kg (Bất hợp lý -> Lỗi)
                remainingWeight: 12,
                // Trạng thái đang bán
                status: "Active",
                // Mảng ảnh rỗng
                images: [],
            });
            // Mong đợi lỗi ValidationError ném ra khớp đúng câu thông báo nghiệp vụ
        }).toThrow("Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.");
    });
    // Ca test 3: Đảm bảo phương thức cập nhật giá bán mới của sản phẩm hoạt động chính xác
    it("nên cập nhật giá bán thành công", () => {
        // Khởi tạo thực thể sản phẩm đồ khô hợp lệ
        const product = new Product_1.Product({
            // Gán mã người bán
            sellerId: "seller-123",
            // Loại đồ khô
            type: "Dried",
            // Danh mục cá
            category: "Fish",
            // Tên cá khô
            name: "Cá khô",
            // Mô tả cá khô
            description: "Mô tả",
            // Giá bán 100.000
            price: 100000,
            // Bán lẻ
            salesType: "Retail",
            // Khối lượng tổng 10kg
            totalWeight: 10,
            // Khối lượng còn lại 10kg
            remainingWeight: 10,
            // Trạng thái đang bán
            status: "Active",
            // Mảng ảnh trống
            images: [],
        });
        // Kỳ vọng giá ban đầu của sản phẩm phải khớp với 100.000
        expect(product.price).toBe(100000);
        // Thực hiện cập nhật giá bán mới của sản phẩm lên 120.000
        product.updatePrice(120000);
        // Kỳ vọng giá mới của sản phẩm lúc này phải khớp với 120.000
        expect(product.price).toBe(120000);
        expect(product.toProps().priceHistory?.map((entry) => entry.price)).toEqual([
            100000,
            120000,
        ]);
    });
});
