import { Entity } from "./Entity";
import { ValueObject } from "./ValueObject";
import { AggregateRoot } from "./AggregateRoot";
import { IDomainEvent } from "./events/DomainEvent";
import { DomainEvents } from "./events/DomainEvents";

// 1. Mock classes phục vụ viết test
class MockEntityProps {
  name!: string;
}
class MockEntity extends Entity<MockEntityProps> {}

interface MockVOProps {
  street: string;
  city: string;
}
class MockValueObject extends ValueObject<MockVOProps> {
  get street() { return this.props.street; }
  get city() { return this.props.city; }
}

class MockEvent implements IDomainEvent {
  public dateTimeOccurred: Date;
  constructor(public aggregateId: string) {
    this.dateTimeOccurred = new Date();
  }
  getAggregateId(): string {
    return this.aggregateId;
  }
}

class MockAggregate extends AggregateRoot<{ title: string }> {
  public triggerSomething(): void {
    this.addDomainEvent(new MockEvent(this.id));
  }
}

// 2. Định nghĩa suites kiểm thử
describe("DDD Shared Kernel - Entity", () => {
  it("nên tự sinh ID duy nhất dạng UUID nếu không được cung cấp", () => {
    const entity1 = new MockEntity({ name: "Entity 1" });
    const entity2 = new MockEntity({ name: "Entity 2" });

    expect(entity1.id).toBeDefined();
    expect(entity2.id).toBeDefined();
    expect(entity1.id).not.toBe(entity2.id);
  });

  it("nên sử dụng ID tùy chọn được truyền vào qua constructor", () => {
    const customId = "custom-id-123";
    const entity = new MockEntity({ name: "Entity" }, customId);

    expect(entity.id).toBe(customId);
  });

  it("nên so khớp bằng nhau dựa trên thuộc tính ID thay vì so sánh tham chiếu", () => {
    const id = "same-id";
    const entity1 = new MockEntity({ name: "Name A" }, id);
    const entity2 = new MockEntity({ name: "Name B" }, id);
    const entity3 = new MockEntity({ name: "Name A" }, "other-id");

    expect(entity1.equals(entity2)).toBe(true);
    expect(entity1.equals(entity3)).toBe(false);
  });
});

describe("DDD Shared Kernel - ValueObject", () => {
  it("nên đóng băng (freeze) thuộc tính của đối tượng sau khi tạo", () => {
    const vo = new MockValueObject({ street: "Main St", city: "Hanoi" });
    
    expect(() => {
      (vo as any).props.street = "New St";
    }).toThrow();
  });

  it("nên so sánh bằng dựa trên thành phần thuộc tính (structural equality)", () => {
    const vo1 = new MockValueObject({ street: "Main St", city: "Hanoi" });
    const vo2 = new MockValueObject({ street: "Main St", city: "Hanoi" });
    const vo3 = new MockValueObject({ street: "Other St", city: "Hanoi" });

    expect(vo1.equals(vo2)).toBe(true);
    expect(vo1.equals(vo3)).toBe(false);
  });
});

describe("DDD Shared Kernel - DomainEvents", () => {
  beforeEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  it("nên đăng ký được handler và kích hoạt nó khi gửi sự kiện", () => {
    let handledCount = 0;
    let eventReceived: MockEvent | null = null;

    DomainEvents.register((event: MockEvent) => {
      handledCount++;
      eventReceived = event;
    }, "MockEvent");

    const aggregate = new MockAggregate({ title: "Aggregate A" });
    aggregate.triggerSomething();

    expect(aggregate.domainEvents.length).toBe(1);

    // Kích hoạt sự kiện
    DomainEvents.dispatchEventsForAggregate(aggregate.id);

    expect(handledCount).toBe(1);
    expect(eventReceived).toBeDefined();
    expect(eventReceived!.getAggregateId()).toBe(aggregate.id);
    expect(aggregate.domainEvents.length).toBe(0); // Đã dọn sạch sau khi gửi
  });
});
