import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { ValidationError, ConflictError } from "../../../../shared/domain/exceptions/DomainException";
import { GPSCoordinates } from "../value-objects/GPSCoordinates";
import { PriceHistory } from "../value-objects/PriceHistory";

export interface ProductProps {
  sellerId: string;
  type: "Fresh" | "Dried";
  category: string;
  name: string;
  description: string;
  price: number;
  salesType: "Retail" | "Wholesale";
  totalWeight: number;
  remainingWeight: number;
  status: "Active" | "SoldOut" | "Expired" | "Deleted";
  location?: GPSCoordinates;
  catchLocation?: GPSCoordinates;
  catchTime?: Date;
  origin?: string;
  expiryDate?: Date;
  images: string[];
  priceHistory: PriceHistory[];
  bumpedAt?: Date;
  createdAt?: Date;
  viewCount?: number;
}

export class Product extends AggregateRoot<ProductProps> {
  constructor(props: ProductProps, id?: string) {
    super({
      ...props,
      bumpedAt: props.bumpedAt || new Date(),
      createdAt: props.createdAt || new Date(),
      viewCount: props.viewCount || 0,
    }, id);
    this.validate();
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim() === "") {
      throw new ValidationError("Tên sản phẩm không được trống.");
    }
    if (this.props.price < 0) {
      throw new ValidationError("Giá bán không thể nhỏ hơn 0.");
    }
    if (this.props.totalWeight <= 0) {
      throw new ValidationError("Khối lượng tổng phải lớn hơn 0.");
    }
    if (this.props.remainingWeight < 0) {
      throw new ValidationError("Khối lượng còn lại không thể nhỏ hơn 0.");
    }
    if (this.props.remainingWeight > this.props.totalWeight) {
      throw new ValidationError("Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.");
    }
    if (this.props.type === "Fresh" && !this.props.location) {
      throw new ValidationError("Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!");
    }
  }

  public updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new ValidationError("Giá bán không thể nhỏ hơn 0.");
    }
    if (newPrice !== this.props.price) {
      const oldPrice = this.props.price;
      this.props.price = newPrice;
      this.props.priceHistory.push(new PriceHistory({
        oldPrice,
        newPrice,
        changedAt: new Date()
      }));
    }
  }

  public bump(requestedByUserId: string): void {
    if (this.props.sellerId !== requestedByUserId) {
      throw new ConflictError("Bạn không có quyền đẩy bài đăng này");
    }

    const cooldownPeriodMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    if (now.getTime() - this.props.bumpedAt!.getTime() < cooldownPeriodMs) {
      throw new ConflictError("Sản phẩm này đã được đẩy lên gần đây. Vui lòng đẩy tin lại sau.");
    }

    this.props.bumpedAt = now;
  }

  public updateWeight(totalWeight: number, remainingWeight: number): void {
    if (remainingWeight > totalWeight) {
      throw new ValidationError("Khối lượng còn lại không thể lớn hơn tổng khối lượng của mẻ hàng.");
    }
    this.props.totalWeight = totalWeight;
    this.props.remainingWeight = remainingWeight;
    this.validate();
  }

  public updateProfile(
    name: string,
    description: string,
    category: string,
    salesType: "Retail" | "Wholesale",
    type: "Fresh" | "Dried",
    location?: GPSCoordinates,
    catchLocation?: GPSCoordinates,
    catchTime?: Date,
    origin?: string,
    expiryDate?: Date,
    images?: string[]
  ): void {
    this.props.name = name.trim();
    this.props.description = description;
    this.props.category = category;
    this.props.salesType = salesType;
    this.props.type = type;
    this.props.location = location;
    this.props.catchLocation = catchLocation;
    this.props.catchTime = catchTime;
    this.props.origin = origin;
    this.props.expiryDate = expiryDate;
    if (images !== undefined) {
      this.props.images = images;
    }
    this.validate();
  }

  public incrementViews(): void {
    this.props.viewCount = (this.props.viewCount || 0) + 1;
  }

  public markAsDeleted(): void {
    this.props.status = "Deleted";
  }

  public toProps(): ProductProps & { id: string } {
    return {
      id: this.id,
      sellerId: this.props.sellerId,
      type: this.props.type,
      category: this.props.category,
      name: this.props.name,
      description: this.props.description,
      price: this.props.price,
      salesType: this.props.salesType,
      totalWeight: this.props.totalWeight,
      remainingWeight: this.props.remainingWeight,
      status: this.props.status,
      location: this.props.location,
      catchLocation: this.props.catchLocation,
      catchTime: this.props.catchTime,
      origin: this.props.origin,
      expiryDate: this.props.expiryDate,
      images: this.props.images,
      priceHistory: this.props.priceHistory,
      bumpedAt: this.props.bumpedAt,
      createdAt: this.props.createdAt,
      viewCount: this.props.viewCount,
    };
  }

  // Getters
  get sellerId() { return this.props.sellerId; }
  get type() { return this.props.type; }
  get category() { return this.props.category; }
  get name() { return this.props.name; }
  get description() { return this.props.description; }
  get price() { return this.props.price; }
  get salesType() { return this.props.salesType; }
  get totalWeight() { return this.props.totalWeight; }
  get remainingWeight() { return this.props.remainingWeight; }
  get status() { return this.props.status; }
  get location() { return this.props.location; }
  get catchLocation() { return this.props.catchLocation; }
  get catchTime() { return this.props.catchTime; }
  get origin() { return this.props.origin; }
  get expiryDate() { return this.props.expiryDate; }
  get images() { return this.props.images; }
  get priceHistory() { return this.props.priceHistory; }
  get bumpedAt() { return this.props.bumpedAt; }
  get createdAt() { return this.props.createdAt; }
  get viewCount() { return this.props.viewCount; }
}
