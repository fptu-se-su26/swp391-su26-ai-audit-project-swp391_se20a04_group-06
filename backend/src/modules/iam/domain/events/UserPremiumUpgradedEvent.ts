import { IDomainEvent } from "../../../../shared/domain/events/DomainEvent";

export class UserPremiumUpgradedEvent implements IDomainEvent {
  public dateTimeOccurred: Date;

  constructor(public readonly userId: string) {
    this.dateTimeOccurred = new Date();
  }

  getAggregateId(): string {
    return this.userId;
  }
}
