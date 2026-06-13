import { ValueObject } from "../../../../shared/domain/ValueObject";
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";

export interface GPSCoordinatesProps {
  latitude: number;
  longitude: number;
}

export class GPSCoordinates extends ValueObject<GPSCoordinatesProps> {
  private constructor(props: GPSCoordinatesProps) {
    super(props);
  }

  public static create(latitude: number, longitude: number): GPSCoordinates {
    if (latitude < -90 || latitude > 90) {
      throw new ValidationError("Vĩ độ (Latitude) phải nằm trong khoảng [-90, 90]");
    }
    if (longitude < -180 || longitude > 180) {
      throw new ValidationError("Kinh độ (Longitude) phải nằm trong khoảng [-180, 180]");
    }
    return new GPSCoordinates({ latitude, longitude });
  }

  get latitude() { return this.props.latitude; }
  get longitude() { return this.props.longitude; }
}
