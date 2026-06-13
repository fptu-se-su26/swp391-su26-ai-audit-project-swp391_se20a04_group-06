import { User as DomainUser } from "../../../../domain/entities/User";
import { IUser as MongooseUserDoc } from "../../../../../../models/User";
import mongoose from "mongoose";

export class UserMapper {
  public static toDomain(mongooseDoc: MongooseUserDoc): DomainUser {
    return new DomainUser(
      {
        name: mongooseDoc.name,
        email: mongooseDoc.email,
        passwordHash: mongooseDoc.passwordHash,
        role: mongooseDoc.role,
        isActive: mongooseDoc.isActive,
        isVerified: mongooseDoc.isVerified,
        isPremium: !!mongooseDoc.isPremium,
        avatar: mongooseDoc.avatar,
        badges: mongooseDoc.badges || [],
        favorites: (mongooseDoc.favorites || []).map((id: any) => id.toString()),
        following: (mongooseDoc.following || []).map((id: any) => id.toString()),
      },
      mongooseDoc._id.toString()
    );
  }

  public static toPersistence(domainEntity: DomainUser): any {
    const props = domainEntity.toProps();
    return {
      name: props.name,
      email: props.email,
      passwordHash: props.passwordHash,
      role: props.role,
      isActive: props.isActive,
      isVerified: props.isVerified,
      avatar: props.avatar,
      isPremium: props.isPremium,
      badges: props.badges,
      favorites: props.favorites.map((id) => new mongoose.Types.ObjectId(id)),
      following: props.following.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }
}
