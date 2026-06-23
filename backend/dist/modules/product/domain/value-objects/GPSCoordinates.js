"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPSCoordinates = void 0;
// Import lớp cha ValueObject để định nghĩa đối tượng giá trị (Value Object) trong thiết kế miền Domain
const ValueObject_1 = require("../../../../shared/domain/ValueObject");
// Import ngoại lệ ValidationError để ném ra khi tọa độ địa lý không hợp lệ
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
/**
 * ĐỐI TƯỢNG GIÁ TRỊ: TỌA ĐỘ GPS (GPSCoordinates - Value Object)
 * Đối tượng giá trị không có ID riêng, được so sánh dựa trên giá trị của các thuộc tính cấu thành
 */
class GPSCoordinates extends ValueObject_1.ValueObject {
    // Hàm khởi tạo để private để ngăn ngừa việc tạo đối tượng trực tiếp bằng từ khóa new từ bên ngoài, bắt buộc dùng phương thức tạo tĩnh (Static Factory Method)
    constructor(props) {
        // Gọi constructor của lớp cha để gán thuộc tính props
        super(props);
    }
    /**
     * PHƯƠNG THỨC TẠO TĨNH (STATIC FACTORY METHOD)
     * Kiểm tra điều kiện hợp lệ đầu vào trước khi trả về đối tượng tọa độ hoàn chỉnh
     */
    static create(latitude, longitude) {
        // Kiểm tra vĩ độ có nằm ngoài khoảng giới hạn vật lý toàn cầu [-90, 90] độ hay không
        if (latitude < -90 || latitude > 90) {
            // Ném lỗi nghiệp vụ nếu vĩ độ không hợp lệ
            throw new DomainException_1.ValidationError("Vĩ độ (Latitude) phải nằm trong khoảng [-90, 90]");
        }
        // Kiểm tra kinh độ có nằm ngoài khoảng giới hạn vật lý toàn cầu [-180, 180] độ hay không
        if (longitude < -180 || longitude > 180) {
            // Ném lỗi nghiệp vụ nếu kinh độ không hợp lệ
            throw new DomainException_1.ValidationError("Kinh độ (Longitude) phải nằm trong khoảng [-180, 180]");
        }
        // Trả về đối tượng tọa độ GPS hợp lệ mới tạo
        return new GPSCoordinates({ latitude, longitude });
    }
    // Getters lấy giá trị vĩ độ
    get latitude() { return this.props.latitude; }
    // Getters lấy giá trị kinh độ
    get longitude() { return this.props.longitude; }
}
exports.GPSCoordinates = GPSCoordinates;
