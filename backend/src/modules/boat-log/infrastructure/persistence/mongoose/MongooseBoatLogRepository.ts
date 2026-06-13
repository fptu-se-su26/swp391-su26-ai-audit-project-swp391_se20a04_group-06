import { IBoatLogRepository } from "../../../domain/repositories/IBoatLogRepository";
import { BoatLog as DomainBoatLog } from "../../../domain/entities/BoatLog";
import { BoatLog as MongooseBoatLog } from "../../../../../models/BoatLog";
import { BoatLogMapper } from "./mappers/BoatLogMapper";
import mongoose from "mongoose";

/**
 * Adapter thực thi các thao tác cơ sở dữ liệu (Mongoose) cho BoatLog Bounded Context.
 */
export class MongooseBoatLogRepository implements IBoatLogRepository {
  /**
   * Tìm Nhật ký Cabin theo ID.
   */
  async findById(id: string): Promise<DomainBoatLog | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const doc = await MongooseBoatLog.findById(id);
    if (!doc) return null;

    return BoatLogMapper.toDomain(doc);
  }

  /**
   * Lưu hoặc cập nhật Nhật ký Cabin vào MongoDB.
   */
  async save(boatLog: DomainBoatLog): Promise<void> {
    const persistenceData = BoatLogMapper.toPersistence(boatLog);

    if (boatLog.id && mongoose.Types.ObjectId.isValid(boatLog.id)) {
      await MongooseBoatLog.findByIdAndUpdate(
        boatLog.id,
        { $set: persistenceData },
        { upsert: true, new: true }
      );
    } else {
      const doc = new MongooseBoatLog(persistenceData);
      await doc.save();
      (boatLog as any)._id = doc._id.toString();
    }
  }

  /**
   * Xóa Nhật ký Cabin.
   */
  async delete(boatLog: DomainBoatLog): Promise<void> {
    if (boatLog.id && mongoose.Types.ObjectId.isValid(boatLog.id)) {
      await MongooseBoatLog.findByIdAndDelete(boatLog.id);
    }
  }
}
