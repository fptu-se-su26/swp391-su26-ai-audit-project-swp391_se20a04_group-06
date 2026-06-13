import { IProductRepository } from "../../../domain/repositories/IProductRepository";
import { Product as DomainProduct } from "../../../domain/entities/Product";
import { Product as MongooseProduct } from "../../../../../models/Product";
import { ProductMapper } from "./mappers/ProductMapper";
import mongoose from "mongoose";

export class MongooseProductRepository implements IProductRepository {
  async findById(id: string): Promise<DomainProduct | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await MongooseProduct.findById(id);
    if (!doc || doc.status === "Deleted") return null;
    return ProductMapper.toDomain(doc);
  }

  async save(product: DomainProduct): Promise<void> {
    const persistence = ProductMapper.toPersistence(product);
    if (product.id && mongoose.Types.ObjectId.isValid(product.id)) {
      await MongooseProduct.findByIdAndUpdate(product.id, { $set: persistence }, { upsert: true });
    } else {
      const doc = new MongooseProduct(persistence);
      await doc.save();
      (product as any)._id = doc._id.toString();
    }
  }

  async delete(product: DomainProduct): Promise<void> {
    if (product.id && mongoose.Types.ObjectId.isValid(product.id)) {
      await MongooseProduct.findByIdAndUpdate(product.id, { $set: { status: "Deleted" } });
    }
  }
}
