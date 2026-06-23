"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvents = void 0;
// Định nghĩa lớp DomainEvents chịu trách nhiệm đăng ký, gom và phân phối các sự kiện miền
class DomainEvents {
    /**
     * Đánh dấu một Aggregate Root có sự kiện cần được gửi đi (dispatch).
     */
    // Hàm tĩnh đánh dấu aggregate root chờ phân phối
    static markAggregateForDispatch(aggregate) {
        // Tìm kiếm xem aggregate root này đã nằm trong danh sách markedAggregates hay chưa
        const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);
        // Nếu chưa tồn tại trong danh sách chờ
        if (!aggregateFound) {
            // Đẩy aggregate root này vào cuối mảng danh sách chờ phân phối
            this.markedAggregates.push(aggregate);
        }
    }
    /**
     * Kích hoạt toàn bộ sự kiện đã gom nhóm của một Aggregate ID cụ thể, sau đó làm sạch.
     */
    // Hàm tĩnh phân phối tất cả sự kiện miền của một aggregate root cụ thể dựa vào ID
    static dispatchEventsForAggregate(id) {
        // Tìm kiếm aggregate root tương ứng trong danh sách đã đánh dấu chờ
        const aggregate = this.findMarkedAggregateByID(id);
        // Nếu tìm thấy thực thể aggregate root tương ứng
        if (aggregate) {
            // Phân phối toàn bộ các sự kiện miền hiện có của aggregate root này
            this.dispatchAggregateEvents(aggregate);
            // Xóa sạch các sự kiện miền nội bộ của aggregate root để tránh phân phối lặp lại
            aggregate.clearEvents();
            // Loại bỏ aggregate root này ra khỏi danh sách markedAggregates chờ phân phối
            this.removeMarkedAggregate(aggregate);
        }
    }
    /**
     * Đăng ký một hàm xử lý (handler) cho một Class sự kiện cụ thể.
     */
    // Hàm tĩnh đăng ký hàm callback xử lý sự kiện dựa trên tên lớp sự kiện
    static register(
    // Hàm callback xử lý nhận sự kiện làm đối số đầu vào, trả về void hoặc Promise<void>
    callback, 
    // Tên của lớp sự kiện dùng làm khóa ánh xạ
    eventClassName) {
        // Nếu tên lớp sự kiện này chưa từng được đăng ký trong Map
        if (!this.handlersMap.has(eventClassName)) {
            // Thiết lập một mảng trống mới cho khóa này trong Map
            this.handlersMap.set(eventClassName, []);
        }
        // Đẩy hàm callback xử lý vào mảng các handlers tương ứng với khóa tên lớp sự kiện
        this.handlersMap.get(eventClassName).push(callback);
    }
    /**
     * Xóa toàn bộ handler (thường phục vụ cho mục đích kiểm thử).
     */
    // Hàm tĩnh xóa sạch Map đăng ký handlers
    static clearHandlers() {
        // Gọi hàm clear trên Map handlersMap để dọn dẹp sạch sẽ
        this.handlersMap.clear();
    }
    /**
     * Xóa toàn bộ Aggregate đã đánh dấu (thường phục vụ cho mục đích kiểm thử).
     */
    // Hàm tĩnh xóa sạch mảng markedAggregates
    static clearMarkedAggregates() {
        // Gán lại mảng markedAggregates thành một mảng trống rỗng
        this.markedAggregates = [];
    }
    // Hàm tĩnh nội bộ thực hiện phân phối toàn bộ sự kiện của một Aggregate Root cụ thể
    static dispatchAggregateEvents(aggregate) {
        // Duyệt qua từng sự kiện miền hiện có trong aggregate và gọi hàm dispatch để gửi đi
        aggregate.domainEvents.forEach((event) => this.dispatch(event));
    }
    // Hàm tĩnh nội bộ xóa một Aggregate Root ra khỏi danh sách chờ phân phối
    static removeMarkedAggregate(aggregate) {
        // Tìm vị trí chỉ mục (index) của aggregate root trong mảng markedAggregates dựa trên so sánh ID
        const index = this.markedAggregates.findIndex((a) => a.id === aggregate.id);
        // Nếu tìm thấy vị trí chỉ mục hợp lệ (khác -1)
        if (index !== -1) {
            // Thực hiện cắt bỏ 1 phần tử tại vị trí index đó khỏi mảng
            this.markedAggregates.splice(index, 1);
        }
    }
    // Hàm tĩnh nội bộ tìm kiếm một Aggregate Root đã được đánh dấu trong danh sách dựa theo ID
    static findMarkedAggregateByID(id) {
        // Khởi tạo biến found có giá trị ban đầu là null
        let found = null;
        // Duyệt qua từng aggregate root trong mảng markedAggregates
        for (const aggregate of this.markedAggregates) {
            // Nếu ID của aggregate trùng khớp với ID cần tìm kiếm
            if (aggregate.id === id) {
                // Gán aggregate tìm thấy vào biến found
                found = aggregate;
                // Thoát khỏi vòng lặp tìm kiếm ngay lập tức
                break;
            }
        }
        // Trả về đối tượng aggregate root tìm thấy hoặc null nếu không tồn tại
        return found;
    }
    // Hàm tĩnh nội bộ thực thi phân phối một sự kiện miền cụ thể đến các handlers đăng ký tương ứng
    static dispatch(event) {
        // Lấy tên lớp khởi tạo (constructor name) của sự kiện để xác định khóa tìm kiếm handler
        const eventClassName = event.constructor.name;
        // Nếu có đăng ký các handlers tương ứng cho tên lớp sự kiện này trong Map
        if (this.handlersMap.has(eventClassName)) {
            // Trích xuất danh sách các handlers từ Map
            const handlers = this.handlersMap.get(eventClassName);
            // Duyệt qua từng handler để thực thi xử lý sự kiện
            for (const handler of handlers) {
                try {
                    // Thực thi hàm handler truyền vào đối tượng sự kiện miền
                    handler(event);
                }
                catch (err) {
                    // Ghi lại lỗi ra console nếu handler thực thi ném ra ngoại lệ để tránh treo luồng phân phối
                    console.error(`[DomainEvents] Lỗi thực thi handler cho sự kiện ${eventClassName}:`, err);
                }
            }
        }
    }
}
exports.DomainEvents = DomainEvents;
// Khởi tạo Map tĩnh ánh xạ tên lớp sự kiện (event class name) tới danh sách các hàm handler tương ứng
DomainEvents.handlersMap = new Map();
// Khởi tạo mảng tĩnh chứa các Aggregate Root được đánh dấu chờ phân phối sự kiện
DomainEvents.markedAggregates = [];
