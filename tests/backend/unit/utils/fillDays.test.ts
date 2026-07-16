// Import hàm fillDays và interface DayData từ file tiện ích fillDays cần kiểm thử
import { fillDays, DayData } from "../../../../backend/src/utils/fillDays";

// Khởi tạo khối describe gom các ca kiểm thử cho hàm tiện ích fillDays
describe("Unit Test: Tiện ích bù ngày thống kê (fillDays.ts)", () => {
  // Ca kiểm thử kiểm tra trả về đủ 7 ngày rỗng với số đếm mặc định bằng 0
  it("Nên trả về đủ 7 phần tử đại diện cho 7 ngày gần nhất khi mảng đầu vào rỗng", () => {
    // Khởi tạo mảng dữ liệu đầu vào rỗng
    const emptyInput: DayData[] = [];
    // Gọi thực thi hàm fillDays với mảng đầu vào rỗng
    const result = fillDays(emptyInput);

    // Kỳ vọng kết quả trả về là một mảng có độ dài chính xác bằng 7 phần tử
    expect(result).toHaveLength(7);
    // Duyệt qua từng phần tử ngày kết quả để kiểm tra tính hợp lệ
    result.forEach((day) => {
      // Đảm bảo số lượng đếm mặc định là bằng 0 do không có dữ liệu
      expect(day.count).toBe(0);
      // Kiểm tra nhãn hiển thị khớp định dạng regex ngày/tháng (ví dụ: 13/6 hoặc 03/12)
      expect(day.label).toMatch(/^\d{1,2}\/\d{1,2}$/);
    });
  });

  // Ca kiểm thử kiểm tra gán đúng số lượng tương ứng cho các ngày có dữ liệu đầu vào
  it("Nên điền đúng số lượng bài đăng vào đúng ngày tương ứng trong danh sách", () => {
    // Tạo đối tượng Date cho hôm nay
    const today = new Date();
    // Tạo đối tượng Date cho hôm qua
    const yesterday = new Date();
    // Thiết lập ngày hôm qua lùi lại 1 ngày so với hôm nay
    yesterday.setDate(today.getDate() - 1);

    // Hàm helper nội bộ định dạng khóa ngày YYYY-MM-DD từ đối tượng Date
    const formatDateKey = (d: Date) => {
      // Lấy năm
      const year = d.getFullYear();
      // Lấy tháng và đệm số 0
      const month = String(d.getMonth() + 1).padStart(2, "0");
      // Lấy ngày và đệm số 0
      const date = String(d.getDate()).padStart(2, "0");
      // Trả về chuỗi định dạng ghép
      return `${year}-${month}-${date}`;
    };

    // Khởi tạo mảng dữ liệu giả lập chứa số lượng bài đăng của hôm nay (15) và hôm qua (8)
    const mockData: DayData[] = [
      { date: formatDateKey(today), count: 15 },
      { date: formatDateKey(yesterday), count: 8 },
    ];

    // Thực hiện gọi hàm fillDays để bù ngày cho mảng dữ liệu giả lập
    const result = fillDays(mockData);

    // Kiểm tra phần tử cuối cùng đại diện cho ngày hôm nay
    const todayResult = result[result.length - 1];
    // Kỳ vọng số đếm ngày hôm nay bằng 15
    expect(todayResult.count).toBe(15);
    // Kỳ vọng nhãn hiển thị khớp với ngày/tháng hôm nay
    expect(todayResult.label).toBe(
      `${today.getDate()}/${today.getMonth() + 1}`,
    );

    // Kiểm tra phần tử kế cuối đại diện cho ngày hôm qua
    const yesterdayResult = result[result.length - 2];
    // Kỳ vọng số đếm ngày hôm qua bằng 8
    expect(yesterdayResult.count).toBe(8);
    // Kỳ vọng nhãn hiển thị khớp với ngày/tháng hôm qua
    expect(yesterdayResult.label).toBe(
      `${yesterday.getDate()}/${yesterday.getMonth() + 1}`,
    );
  });
});
