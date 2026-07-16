// Import lớp thực thể Entity làm cơ sở để kế thừa
import { Entity } from "../../../../../backend/src/shared/domain/Entity";
// Import lớp đối tượng giá trị ValueObject làm cơ sở để kế thừa
import { ValueObject } from "../../../../../backend/src/shared/domain/ValueObject";
// Import lớp gốc AggregateRoot làm cơ sở để kiểm thử các sự kiện miền
import { AggregateRoot } from "../../../../../backend/src/shared/domain/AggregateRoot";
// Import giao diện IDomainEvent làm khuôn mẫu định nghĩa sự kiện miền
import { IDomainEvent } from "../../../../../backend/src/shared/domain/events/DomainEvent";
// Import lớp quản lý sự kiện miền DomainEvents để điều phối các sự kiện trong kiểm thử
import { DomainEvents } from "../../../../../backend/src/shared/domain/events/DomainEvents";

// 1. Mock classes phục vụ viết test
// Định nghĩa lớp thuộc tính giả lập MockEntityProps dành cho thực thể
class MockEntityProps {
  // Khai báo thuộc tính name kiểu chuỗi
  name!: string;
}
// Khởi tạo một lớp thực thể giả lập MockEntity kế thừa từ lớp Entity gốc
class MockEntity extends Entity<MockEntityProps> {}

// Định nghĩa giao diện thuộc tính giả lập MockVOProps của Value Object
interface MockVOProps {
  // Thuộc tính tên đường phố
  street: string;
  // Thuộc tính tên thành phố
  city: string;
}
// Khởi tạo một Value Object giả lập MockValueObject kế thừa từ lớp ValueObject gốc
class MockValueObject extends ValueObject<MockVOProps> {
  // Định nghĩa hàm getter để đọc thuộc tính đường phố của Value Object
  get street() { return this.props.street; }
  // Định nghĩa hàm getter để đọc thuộc tính thành phố của Value Object
  get city() { return this.props.city; }
}

// Khởi tạo một sự kiện miền giả lập MockEvent tuân thủ giao diện IDomainEvent
class MockEvent implements IDomainEvent {
  // Khai báo thuộc tính lưu trữ thời điểm phát sinh sự kiện
  public dateTimeOccurred: Date;
  // Hàm khởi tạo nhận vào ID của Aggregate liên đới
  constructor(public aggregateId: string) {
    // Thiết lập thời gian phát sinh là thời điểm hiện tại
    this.dateTimeOccurred = new Date();
  }
  // Định nghĩa hàm để lấy ra ID của Aggregate Root liên quan đến sự kiện
  getAggregateId(): string {
    // Trả về chuỗi ID Aggregate Root
    return this.aggregateId;
  }
}

// Khởi tạo một Aggregate Root giả lập MockAggregate kế thừa từ AggregateRoot gốc
class MockAggregate extends AggregateRoot<{ title: string }> {
  // Định nghĩa hàm kích hoạt hành động phát sinh sự kiện trong Aggregate
  public triggerSomething(): void {
    // Gọi hàm addDomainEvent kế thừa để thêm sự kiện MockEvent mới vào mảng
    this.addDomainEvent(new MockEvent(this.id));
  }
}

// 2. Định nghĩa suites kiểm thử
// Khối describe gom các ca kiểm thử liên quan đến lớp Entity
describe("DDD Shared Kernel - Entity", () => {
  // Ca kiểm thử kiểm tra tự động phát sinh ID ngẫu nhiên UUID
  it("nên tự sinh ID duy nhất dạng UUID nếu không được cung cấp", () => {
    // Khởi tạo thực thể thứ nhất không cung cấp ID
    const entity1 = new MockEntity({ name: "Entity 1" });
    // Khởi tạo thực thể thứ hai không cung cấp ID
    const entity2 = new MockEntity({ name: "Entity 2" });

    // Kỳ vọng thực thể thứ nhất có ID được định nghĩa
    expect(entity1.id).toBeDefined();
    // Kỳ vọng thực thể thứ hai có ID được định nghĩa
    expect(entity2.id).toBeDefined();
    // Kỳ vọng ID của hai thực thể được sinh ngẫu nhiên là hoàn toàn khác biệt nhau
    expect(entity1.id).not.toBe(entity2.id);
  });

  // Ca kiểm thử kiểm tra sử dụng ID cung cấp thủ công từ bên ngoài
  it("nên sử dụng ID tùy chọn được truyền vào qua constructor", () => {
    // Khai báo một chuỗi ID tùy chọn cố định
    const customId = "custom-id-123";
    // Khởi tạo thực thể với ID tùy chọn truyền vào tham số thứ hai
    const entity = new MockEntity({ name: "Entity" }, customId);

    // Kỳ vọng ID của thực thể được gán chính xác bằng ID tùy chọn
    expect(entity.id).toBe(customId);
  });

  // Ca kiểm thử kiểm tra so sánh logic bằng nhau của thực thể dựa trên ID
  it("nên so khớp bằng nhau dựa trên thuộc tính ID thay vì so sánh tham chiếu", () => {
    // Khai báo ID cố định
    const id = "same-id";
    // Khởi tạo thực thể thứ nhất có ID cố định
    const entity1 = new MockEntity({ name: "Name A" }, id);
    // Khởi tạo thực thể thứ hai có cùng ID nhưng khác các thuộc tính khác
    const entity2 = new MockEntity({ name: "Name B" }, id);
    // Khởi tạo thực thể thứ ba có ID hoàn toàn khác
    const entity3 = new MockEntity({ name: "Name A" }, "other-id");

    // Kỳ vọng so sánh thực thể thứ nhất và thứ hai trả về true do cùng ID
    expect(entity1.equals(entity2)).toBe(true);
    // Kỳ vọng so sánh thực thể thứ nhất và thứ ba trả về false do khác ID
    expect(entity1.equals(entity3)).toBe(false);
  });
});

// Khối describe gom các ca kiểm thử liên quan đến lớp ValueObject
describe("DDD Shared Kernel - ValueObject", () => {
  // Ca kiểm thử kiểm tra tính bất biến (immutable) bằng cách đóng băng thuộc tính props
  it("nên đóng băng (freeze) thuộc tính của đối tượng sau khi tạo", () => {
    // Khởi tạo một Value Object MockValueObject
    const vo = new MockValueObject({ street: "Main St", city: "Hanoi" });
    
    // Kỳ vọng hành động thay đổi thuộc tính sau khi tạo sẽ ném ra lỗi do đối tượng bị đóng băng
    expect(() => {
      // Ép kiểu sang any và cố tình gán thuộc tính mới
      (vo as any).props.street = "New St";
    }).toThrow();
  });

  // Ca kiểm thử kiểm tra so sánh bằng nhau dựa trên cấu trúc các thuộc tính (structural equality)
  it("nên so sánh bằng dựa trên thành phần thuộc tính (structural equality)", () => {
    // Khởi tạo Value Object thứ nhất
    const vo1 = new MockValueObject({ street: "Main St", city: "Hanoi" });
    // Khởi tạo Value Object thứ hai có cùng giá trị thuộc tính
    const vo2 = new MockValueObject({ street: "Main St", city: "Hanoi" });
    // Khởi tạo Value Object thứ ba có thuộc tính đường phố khác biệt
    const vo3 = new MockValueObject({ street: "Other St", city: "Hanoi" });

    // Kỳ vọng so sánh vo1 và vo2 trả về true do các thuộc tính trùng khớp
    expect(vo1.equals(vo2)).toBe(true);
    // Kỳ vọng so sánh vo1 và vo3 trả về false do thuộc tính street khác nhau
    expect(vo1.equals(vo3)).toBe(false);
  });
});

// Khối describe gom các ca kiểm thử liên quan đến cơ chế DomainEvents
describe("DDD Shared Kernel - DomainEvents", () => {
  // Hàm chạy trước mỗi ca kiểm thử đơn lẻ trong khối này
  beforeEach(() => {
    // Làm sạch toàn bộ danh sách các hàm xử lý handler đã đăng ký trong DomainEvents
    DomainEvents.clearHandlers();
    // Làm sạch toàn bộ danh sách các Aggregate Root được đánh dấu chờ gửi sự kiện
    DomainEvents.clearMarkedAggregates();
  });

  // Ca kiểm thử kiểm tra quy trình đăng ký handler và phân phối sự kiện miền
  it("nên đăng ký được handler và kích hoạt nó khi gửi sự kiện", () => {
    // Khởi tạo biến đếm số lần handler được gọi
    let handledCount = 0;
    // Khởi tạo biến lưu trữ sự kiện nhận được để kiểm tra
    let eventReceived: MockEvent | null = null;

    // Đăng ký một hàm xử lý callback nhận sự kiện MockEvent
    DomainEvents.register((event: MockEvent) => {
      // Tăng biến đếm số lần xử lý lên 1
      handledCount++;
      // Gán sự kiện nhận được vào biến bên ngoài
      eventReceived = event;
    }, "MockEvent");

    // Khởi tạo đối tượng Aggregate Root giả lập MockAggregate
    const aggregate = new MockAggregate({ title: "Aggregate A" });
    // Kích hoạt một hành động nội bộ để phát sinh sự kiện MockEvent trong aggregate
    aggregate.triggerSomething();

    // Kỳ vọng danh sách sự kiện miền bên trong aggregate hiện có đúng 1 sự kiện
    expect(aggregate.domainEvents.length).toBe(1);

    // Kích hoạt phân phối toàn bộ sự kiện cho Aggregate Root cụ thể này theo ID
    DomainEvents.dispatchEventsForAggregate(aggregate.id);

    // Kỳ vọng handler được thực thi đúng 1 lần
    expect(handledCount).toBe(1);
    // Kỳ vọng đã nhận được đối tượng sự kiện MockEvent
    expect(eventReceived).toBeDefined();
    // Kỳ vọng ID liên kết trong sự kiện trùng khớp với ID của Aggregate Root phát sinh
    expect(eventReceived!.getAggregateId()).toBe(aggregate.id);
    // Kỳ vọng danh sách sự kiện miền của aggregate được làm sạch hoàn toàn sau khi gửi
    expect(aggregate.domainEvents.length).toBe(0);
  });
});
