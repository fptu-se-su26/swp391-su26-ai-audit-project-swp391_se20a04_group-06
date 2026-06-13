import { ValueObject } from "../../../../shared/domain/ValueObject";

export interface PriceHistoryProps {
  oldPrice: number;
  newPrice: number;
  changedAt: Date;
}

export class PriceHistory extends ValueObject<PriceHistoryProps> {
  constructor(props: PriceHistoryProps) {
    super(props);
  }

  get oldPrice() { return this.props.oldPrice; }
  get newPrice() { return this.props.newPrice; }
  get changedAt() { return this.props.changedAt; }
}
