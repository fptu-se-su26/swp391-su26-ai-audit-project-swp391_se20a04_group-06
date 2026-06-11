import { Product, IProduct } from "../models/Product";
import mongoose from "mongoose";

export const productRepository = {
  async findById(id: string): Promise<IProduct | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Product.findById(id);
  },

  async findOne(query: any): Promise<IProduct | null> {
    return Product.findOne(query);
  },

  async exists(query: any): Promise<boolean> {
    return !!(await Product.exists(query));
  },

  async countDocuments(filter: any): Promise<number> {
    return Product.countDocuments(filter);
  },

  async find(
    filter: any,
    projection: any = {},
    options: any = {},
  ): Promise<IProduct[]> {
    return Product.find(filter, projection, options);
  },

  async distinct(field: string, filter: any = {}): Promise<any[]> {
    return Product.distinct(field, filter);
  },

  async aggregate(pipeline: any[]): Promise<any[]> {
    return Product.aggregate(pipeline);
  },

  async updateMany(filter: any, update: any): Promise<any> {
    return Product.updateMany(filter, update);
  },

  async deleteMany(filter: any): Promise<any> {
    return Product.deleteMany(filter);
  },

  async create(data: any): Promise<IProduct> {
    const product = new Product(data);
    return product.save();
  },

  async findByIdAndUpdate(
    id: string,
    update: any,
    options: any = { new: true },
  ): Promise<IProduct | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Product.findByIdAndUpdate(id, update, options);
  },

  async findByOwner(sellerId: string, skip: number, limit: number) {
    const total = await this.countDocuments({
      sellerId: sellerId as any,
      status: { $ne: "Deleted" },
    });

    const products = await Product.find({
      sellerId: sellerId as any,
      status: { $ne: "Deleted" },
    } as any)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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
      coverImg: p.images?.[0] || null,
      imgCount: p.images?.length || 0,
    }));

    return { data, total };
  },

  async findOneAndUpdate(filter: any, update: any): Promise<IProduct | null> {
    return Product.findOneAndUpdate(filter, update, { new: true });
  },
};
