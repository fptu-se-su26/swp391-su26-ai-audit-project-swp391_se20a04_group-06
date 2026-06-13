import { IDomainEvent } from "./DomainEvent";
import { AggregateRoot } from "../AggregateRoot";

export class DomainEvents {
  private static handlersMap: Map<string, Function[]> = new Map();
  private static markedAggregates: AggregateRoot<any>[] = [];

  /**
   * Đánh dấu một Aggregate Root có sự kiện cần được gửi đi (dispatch).
   */
  public static markAggregateForDispatch(aggregate: AggregateRoot<any>): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  /**
   * Kích hoạt toàn bộ sự kiện đã gom nhóm của một Aggregate ID cụ thể, sau đó làm sạch.
   */
  public static dispatchEventsForAggregate(id: string): void {
    const aggregate = this.findMarkedAggregateByID(id);

    if (aggregate) {
      this.dispatchAggregateEvents(aggregate);
      aggregate.clearEvents();
      this.removeMarkedAggregate(aggregate);
    }
  }

  /**
   * Đăng ký một hàm xử lý (handler) cho một Class sự kiện cụ thể.
   */
  public static register(
    callback: (event: any) => Promise<void> | void,
    eventClassName: string
  ): void {
    if (!this.handlersMap.has(eventClassName)) {
      this.handlersMap.set(eventClassName, []);
    }
    this.handlersMap.get(eventClassName)!.push(callback);
  }

  /**
   * Xóa toàn bộ handler (thường phục vụ cho mục đích kiểm thử).
   */
  public static clearHandlers(): void {
    this.handlersMap.clear();
  }

  /**
   * Xóa toàn bộ Aggregate đã đánh dấu (thường phục vụ cho mục đích kiểm thử).
   */
  public static clearMarkedAggregates(): void {
    this.markedAggregates = [];
  }

  private static dispatchAggregateEvents(aggregate: AggregateRoot<any>): void {
    aggregate.domainEvents.forEach((event: IDomainEvent) => this.dispatch(event));
  }

  private static removeMarkedAggregate(aggregate: AggregateRoot<any>): void {
    const index = this.markedAggregates.findIndex((a) => a.id === aggregate.id);
    if (index !== -1) {
      this.markedAggregates.splice(index, 1);
    }
  }

  private static findMarkedAggregateByID(id: string): AggregateRoot<any> | null {
    let found: AggregateRoot<any> | null = null;
    for (const aggregate of this.markedAggregates) {
      if (aggregate.id === id) {
        found = aggregate;
        break;
      }
    }
    return found;
  }

  private static dispatch(event: IDomainEvent): void {
    const eventClassName = event.constructor.name;

    if (this.handlersMap.has(eventClassName)) {
      const handlers = this.handlersMap.get(eventClassName)!;
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[DomainEvents] Lỗi thực thi handler cho sự kiện ${eventClassName}:`, err);
        }
      }
    }
  }
}
