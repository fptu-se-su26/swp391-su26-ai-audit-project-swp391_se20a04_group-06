import { haversineKm, MAX_FRESH_DISTANCE_KM } from "./haversine";

describe("Unit Test: Tiện ích tính khoảng cách GPS (haversine.ts)", () => {
  it("Nên trả về khoảng cách bằng 0 khi hai vị trí trùng nhau", () => {
    const lat = 20.8449;
    const lng = 106.6881;
    const result = haversineKm(lat, lng, lat, lng);
    expect(result).toBe(0);
  });

  it("Nên tính toán khoảng cách tương đối chính xác giữa hai điểm thực tế", () => {
    // Vĩ độ, kinh độ của Đồ Sơn (Hải Phòng) và Trung tâm thành phố Hải Phòng
    const latDoSon = 20.7167;
    const lngDoSon = 106.7833;
    const latHaiphong = 20.8449;
    const lngHaiphong = 106.6881;

    const distance = haversineKm(latDoSon, lngDoSon, latHaiphong, lngHaiphong);

    // Khoảng cách thực tế ước tính khoảng 17.5 km
    expect(distance).toBeGreaterThan(16);
    expect(distance).toBeLessThan(19);
  });

  it("Nên xác nhận giới hạn khoảng cách hải sản tươi là 20km", () => {
    expect(MAX_FRESH_DISTANCE_KM).toBe(20);
  });
});
