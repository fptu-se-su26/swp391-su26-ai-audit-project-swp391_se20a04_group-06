// Định nghĩa interface IDomainEvent (Sự kiện miền) làm khuôn mẫu chung cho các sự kiện miền trong hệ thống
export interface IDomainEvent {
  // Thời điểm phát sinh sự kiện miền
  dateTimeOccurred: Date;
  // Hàm lấy ID của Aggregate Root liên đới với sự kiện này
  getAggregateId(): string;
}
