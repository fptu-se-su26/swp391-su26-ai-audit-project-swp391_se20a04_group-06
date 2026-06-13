import { Product as DomainProduct } from "../../../../domain/entities/Product";
import { GPSCoordinates } from "../../../../domain/value-objects/GPSCoordinates";
import { PriceHistory } from "../../../../domain/value-objects/PriceHistory";
import { IProduct as MongooseProductDoc } from "../../../../../../models/Product";
import mongoose from "mongoose";

export class ProductMapper {
  public static toDomain(mongooseDoc: MongooseProductDoc): DomainProduct {
    let location: GPSCoordinates | undefined;
    if (mongooseDoc.location && mongooseDoc.location.coordinates) {
      location = GPSCoordinates.create(
        mongooseDoc.location.coordinates[1],
        mongooseDoc.location.coordinates[0]
      );
    }

    let catchLocation: GPSCoordinates | undefined;
    if (mongooseDoc.catchLocation && mongooseDoc.catchLocation.coordinates) {
      catchLocation = GPSCoordinates.create(
        mongooseDoc.catchLocation.coordinates[1],
        mongooseDoc.catchLocation.coordinates[0]
      );
    }

    const priceHistory = (mongooseDoc.priceHistory || []).map(
      (h: any) =>
        new PriceHistory({
          oldPrice: h.oldPrice,
          newPrice: h.newPrice,
          changedAt: h.changedAt,
        })
    );

    return new DomainProduct(
      {
        sellerId: mongooseDoc.sellerId.toString(),
        type: mongooseDoc.type,
        category: mongooseDoc.category,
        name: mongooseDoc.name,
        description: mongooseDoc.description || "",
        price: mongooseDoc.price,
        salesType: mongooseDoc.salesType,
        totalWeight: mongooseDoc.totalWeight,
        remainingWeight: mongooseDoc.remainingWeight,
        status: mongooseDoc.status as any,
        location,
        catchLocation,
        catchTime: mongooseDoc.catchTime,
        origin: mongooseDoc.origin,
        expiryDate: mongooseDoc.expiryDate,
        images: mongooseDoc.images || [],
        priceHistory,
        bumpedAt: mongooseDoc.bumpedAt,
        createdAt: mongooseDoc.createdAt,
        viewCount: mongooseDoc.viewCount,
      },
      mongooseDoc._id.toString()
    );
  }

  public static toPersistence(domainEntity: DomainProduct): any {
    const props = domainEntity.toProps();
    const persistenceObj: any = {
      sellerId: new mongoose.Types.ObjectId(props.sellerId),
      type: props.type,
      category: props.category,
      name: props.name,
      description: props.description,
      price: props.price,
      salesType: props.salesType,
      totalWeight: props.totalWeight,
      remainingWeight: props.remainingWeight,
      status: props.status,
      images: props.images,
      priceHistory: props.priceHistory.map((h) => ({
        oldPrice: h.oldPrice,
        newPrice: h.newPrice,
        changedAt: h.changedAt,
      })),
      viewCount: props.viewCount,
      bumpedAt: props.bumpedAt,
    };

    if (props.location) {
      persistenceObj.location = {
        type: "Point",
        coordinates: [props.location.longitude, props.location.latitude],
      };
    }

    if (props.catchLocation) {
      persistenceObj.catchLocation = {
        type: "Point",
        coordinates: [props.catchLocation.longitude, props.catchLocation.latitude],
      };
    }

    if (props.catchTime) {
      persistenceObj.catchTime = props.catchTime;
    }
    if (props.origin) {
      persistenceObj.origin = props.origin;
    }
    if (props.expiryDate) {
      persistenceObj.expiryDate = props.expiryDate;
    }

    return persistenceObj;
  }
}
