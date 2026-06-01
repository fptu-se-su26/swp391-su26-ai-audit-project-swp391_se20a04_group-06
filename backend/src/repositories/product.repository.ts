// Trong tệp: backend/src/repositories/product.repository.ts

import { Product } from "../models/Product";

export const productRepository = {
  // Cập nhật hàm để nhận thêm hai tham số phân trang skip và limit
  async findByOwner(sellerId: string, skip: number, limit: number) {
    // 1. Tính tổng số bài đăng hoạt động để làm siêu dữ liệu phân trang (metadata)
    const total = await Product.countDocuments({
      sellerId: sellerId as any,
      status: { $ne: "Deleted" }
    } as any);

    // 2. Thực hiện truy vấn MongoDB giới hạn phân đoạn bằng .skip().limit()
    const products = await Product.find({
      sellerId: sellerId as any,
      status: { $ne: "Deleted" }
    } as any)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 3. Ánh xạ cấu hình dữ liệu an toàn tránh lỗi mảng images rỗng
    const data = products.map((p) => ({
      id: p._id.toString(),
      type: p.type,
      category: p.category,
      name: p.name,
      price: p.price,
      salesType: p.salesType,
      totalWeight: p.totalWeight,
      remainingWeight: p.remainingWeight,
      status: p.status,
      catchTime: p.catchTime,
      origin: p.origin,
      expiryDate: p.expiryDate,
      createdAt: p.createdAt,
      viewCount: p.viewCount,
      bumpedAt: p.bumpedAt,
      coverImg: p.images?.[0] || null, // Optional chaining phòng vệ lỗi dữ liệu cũ rỗng
      imgCount: p.images?.length || 0,
    }));

    // Trả về cấu trúc đối tượng khớp với khai báo bóc tách { data, total } ở Controller
    return { data, total };
  }
};