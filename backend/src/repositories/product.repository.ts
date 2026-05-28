import { Product } from "../models/Product";

export const productRepository = {
  async findByOwner(sellerId: string) {
    const products = await Product.find({
      sellerId: sellerId as any,
      status: { $ne: "Deleted" }
    } as any).sort({ createdAt: -1 });

    return products.map((p) => ({
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
      coverImg: p.images[0] || null,
      imgCount: p.images.length,
    }));
  }
};
