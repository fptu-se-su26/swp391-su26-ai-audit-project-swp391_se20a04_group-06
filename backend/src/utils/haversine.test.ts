// Import hàm haversineKm và hằng số MAX_FRESH_DISTANCE_KM từ file tiện ích haversine cần kiểm thử
import { haversineKm, MAX_FRESH_DISTANCE_KM } from "./haversine";

// Khởi tạo khối describe gom các ca kiểm thử cho tiện ích tính khoảng cách GPS Haversine
describe("Unit Test: Tiện ích tính khoảng cách GPS (haversine.ts)", () => {
  // Ca kiểm thử kiểm tra khoảng cách bằng 0 khi hai tọa độ trùng nhau
  it("Nên trả về khoảng cách bằng 0 khi hai vị trí trùng nhau", () => {
    // Khai báo vĩ độ giả lập
    const lat = 20.8449;
    // Khai báo kinh độ giả lập
    const lng = 106.6881;
    // Thực thi tính toán khoảng cách giữa hai điểm trùng tọa độ
    const result = haversineKm(lat, lng, lat, lng);
    // Kỳ vọng kết quả khoảng cách trả về chính xác bằng 0
    expect(result).toBe(0);
  });

  // Ca kiểm thử kiểm tra tính khoảng cách tương đối giữa hai địa điểm thực tế
  it("Nên tính toán khoảng cách tương đối chính xác giữa hai điểm thực tế", () => {
    // Tọa độ GPS Đồ Sơn (Hải Phòng)
    const latDoSon = 20.7167;
    // Kinh độ GPS Đồ Sơn (Hải Phòng)
    const lngDoSon = 106.7833;
    // Tọa độ GPS trung tâm thành phố Hải Phòng
    const latHaiphong = 20.8449;
    // Kinh độ GPS trung tâm thành phố Hải Phòng
    const lngHaiphong = 106.6881;

    // Thực hiện tính khoảng cách giữa Đồ Sơn và thành phố Hải Phòng
    const distance = haversineKm(latDoSon, lngDoSon, latHaiphong, lngHaiphong);

    // Khoảng cách thực tế địa lý ước lượng khoảng 17.5 km
    // Kỳ vọng khoảng cách tính ra lớn hơn 16 km
    expect(distance).toBeGreaterThan(16);
    // Kỳ vọng khoảng cách tính ra nhỏ hơn 19 km
    expect(distance).toBeLessThan(19);
  });

  // Ca kiểm thử xác nhận hằng số cấu hình khoảng cách giới hạn sản phẩm tươi sống
  it("Nên xác nhận giới hạn khoảng cách hải sản tươi là 20km", () => {
    // Kỳ vọng giá trị MAX_FRESH_DISTANCE_KM khớp chính xác với 20 (km)
    expect(MAX_FRESH_DISTANCE_KM).toBe(20);
  });
});
