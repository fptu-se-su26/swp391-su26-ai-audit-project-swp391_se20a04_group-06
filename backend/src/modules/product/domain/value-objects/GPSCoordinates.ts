// Import lớp cha ValueObject để định nghĩa đối tượng giá trị (Value Object) trong thiết kế miền Domain
import { ValueObject } from "../../../../shared/domain/ValueObject";
// Import ngoại lệ ValidationError để ném ra khi tọa độ địa lý không hợp lệ
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";

// Định nghĩa giao diện chứa các thuộc tính của tọa độ GPS (Vĩ độ và Kinh độ)
export interface GPSCoordinatesProps {
  latitude: number;           // Vĩ độ (chỉ số theo chiều dọc của quả địa cầu)
  longitude: number;          // Kinh độ (chỉ số theo chiều ngang của quả địa cầu)
}

/**
 * ĐỐI TƯỢNG GIÁ TRỊ: TỌA ĐỘ GPS (GPSCoordinates - Value Object)
 * Đối tượng giá trị không có ID riêng, được so sánh dựa trên giá trị của các thuộc tính cấu thành
 */
export class GPSCoordinates extends ValueObject<GPSCoordinatesProps> {
  // Hàm khởi tạo để private để ngăn ngừa việc tạo đối tượng trực tiếp bằng từ khóa new từ bên ngoài, bắt buộc dùng phương thức tạo tĩnh (Static Factory Method)
  private constructor(props: GPSCoordinatesProps) {
    // Gọi constructor của lớp cha để gán thuộc tính props
    super(props);
  }

  /**
   * PHƯƠNG THỨC TẠO TĨNH (STATIC FACTORY METHOD)
   * Kiểm tra điều kiện hợp lệ đầu vào trước khi trả về đối tượng tọa độ hoàn chỉnh
   */
  public static create(latitude: number, longitude: number): GPSCoordinates {
    // Kiểm tra vĩ độ có nằm ngoài khoảng giới hạn vật lý toàn cầu [-90, 90] độ hay không
    if (latitude < -90 || latitude > 90) {
      // Ném lỗi nghiệp vụ nếu vĩ độ không hợp lệ
      throw new ValidationError("Vĩ độ (Latitude) phải nằm trong khoảng [-90, 90]");
    }
    // Kiểm tra kinh độ có nằm ngoài khoảng giới hạn vật lý toàn cầu [-180, 180] độ hay không
    if (longitude < -180 || longitude > 180) {
      // Ném lỗi nghiệp vụ nếu kinh độ không hợp lệ
      throw new ValidationError("Kinh độ (Longitude) phải nằm trong khoảng [-180, 180]");
    }
    // Trả về đối tượng tọa độ GPS hợp lệ mới tạo
    return new GPSCoordinates({ latitude, longitude });
  }

  // Getters lấy giá trị vĩ độ
  get latitude() { return this.props.latitude; }
  // Getters lấy giá trị kinh độ
  get longitude() { return this.props.longitude; }
}

