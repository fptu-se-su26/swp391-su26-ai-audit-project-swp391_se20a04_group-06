import { fillDays, DayData } from "./fillDays";

describe("Unit Test: Tiện ích bù ngày thống kê (fillDays.ts)", () => {
  it("Nên trả về đủ 7 phần tử đại diện cho 7 ngày gần nhất khi mảng đầu vào rỗng", () => {
    const emptyInput: DayData[] = [];
    const result = fillDays(emptyInput);

    expect(result).toHaveLength(7);
    // Tất cả các ngày không có dữ liệu phải có số lượng bằng 0
    result.forEach((day) => {
      expect(day.count).toBe(0);
      expect(day.label).toMatch(/^\d{1,2}\/\d{1,2}$/); // Định dạng dạng DD/MM hoặc D/M
    });
  });

  it("Nên điền đúng số lượng bài đăng vào đúng ngày tương ứng trong danh sách", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Định dạng khóa ngày YYYY-MM-DD
    const formatDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${date}`;
    };

    const mockData: DayData[] = [
      { date: formatDateKey(today), count: 15 },
      { date: formatDateKey(yesterday), count: 8 },
    ];

    const result = fillDays(mockData);

    // Kiểm tra phần tử cuối cùng (Hôm nay)
    const todayResult = result[result.length - 1];
    expect(todayResult.count).toBe(15);
    expect(todayResult.label).toBe(
      `${today.getDate()}/${today.getMonth() + 1}`,
    );

    // Kiểm tra phần tử kế cuối (Hôm qua)
    const yesterdayResult = result[result.length - 2];
    expect(yesterdayResult.count).toBe(8);
    expect(yesterdayResult.label).toBe(
      `${yesterday.getDate()}/${yesterday.getMonth() + 1}`,
    );
  });
});
