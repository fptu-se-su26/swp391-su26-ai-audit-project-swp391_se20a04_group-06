import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { User as DomainUser } from "../../../domain/entities/User";
import { User as MongooseUser } from "../../../../../models/User";
import { UserMapper } from "./mappers/UserMapper";
import mongoose from "mongoose";

export class MongooseUserRepository implements IUserRepository {
  async findById(id: string): Promise<DomainUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const userDoc = await MongooseUser.findById(id);
    if (!userDoc) return null;
    return UserMapper.toDomain(userDoc);
  }

  async findByEmail(email: string): Promise<DomainUser | null> {
    const userDoc = await MongooseUser.findOne({ email: email.toLowerCase().trim() });
    if (!userDoc) return null;
    return UserMapper.toDomain(userDoc);
  }

  async save(user: DomainUser): Promise<void> {
    const persistence = UserMapper.toPersistence(user);
    if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
      await MongooseUser.findByIdAndUpdate(user.id, { $set: persistence }, { upsert: true });
    } else {
      const newUserDoc = new MongooseUser(persistence);
      await newUserDoc.save();
      (user as any)._id = newUserDoc._id.toString();
    }
  }

  async delete(user: DomainUser): Promise<void> {
    if (user.id && mongoose.Types.ObjectId.isValid(user.id)) {
      await MongooseUser.findByIdAndDelete(user.id);
    }
  }

  async exists(email: string): Promise<boolean> {
    return !!(await MongooseUser.exists({ email: email.toLowerCase().trim() }));
  }
}
