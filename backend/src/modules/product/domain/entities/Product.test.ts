import { Product } from "./Product";
import { GPSCoordinates } from "../value-objects/GPSCoordinates";
import { PriceHistory } from "../value-objects/PriceHistory";

describe("Product Catalog Module - Product Aggregate Root", () => {
  const gpsLocation = GPSCoordinates.create(10.762622, 106.660172);

  it("nên ném ra lỗi nếu sản phẩm Fresh thiếu tọa độ GPS", () => {
    expect(() => {
      new Product({
        sellerId: "seller-123",
        type: "Fresh",
        category: "Fish",
        name: "Cá thu tươi",
        description: "Mô tả cá thu",
        price: 150000,
        salesType: "Retail",
        totalWeight: 10,
        remainingWeight: 10,
        status: "Active",
        images: [],
        priceHistory: [],
      });
    }).toThrow("Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!");
  });

  it("nên ném ra lỗi nếu cân nặng còn lại lớn hơn tổng cân nặng ban đầu", () => {
    expect(() => {
      new Product({
        sellerId: "seller-123",
        type: "Dried",
        category: "Fish",
        name: "Cá khô",
        description: "Mô tả",
        price: 100000,
        salesType: "Retail",
        totalWeight: 10,
        remainingWeight: 12, // Không hợp lệ
        status: "Active",
        images: [],
        priceHistory: [],
      });
    }).toThrow("Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.");
  });

  it("nên cập nhật giá bán và tự động lưu lịch sử biến động giá", () => {
    const product = new Product({
      sellerId: "seller-123",
      type: "Dried",
      category: "Fish",
      name: "Cá khô",
      description: "Mô tả",
      price: 100000,
      salesType: "Retail",
      totalWeight: 10,
      remainingWeight: 10,
      status: "Active",
      images: [],
      priceHistory: [],
    });

    expect(product.price).toBe(100000);
    expect(product.priceHistory.length).toBe(0);

    // Cập nhật giá mới
    product.updatePrice(120000);

    expect(product.price).toBe(120000);
    expect(product.priceHistory.length).toBe(1);
    expect(product.priceHistory[0]).toBeInstanceOf(PriceHistory);
    expect(product.priceHistory[0].oldPrice).toBe(100000);
    expect(product.priceHistory[0].newPrice).toBe(120000);
  });
});
