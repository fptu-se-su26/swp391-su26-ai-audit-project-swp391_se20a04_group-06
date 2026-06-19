"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fillDays = fillDays;
// Định nghĩa hàm fillDays để bù đắp các ngày không có dữ liệu thống kê trong vòng 7 ngày qua với count mặc định bằng 0
function fillDays(rows) {
    // Khởi tạo một đối tượng Map Record dùng để tra cứu nhanh số đếm theo chuỗi ngày (YYYY-MM-DD)
    const map = {};
    // Duyệt qua từng dòng dữ liệu đầu vào trong mảng rows
    rows.forEach((r) => {
        // Trích xuất chuỗi định dạng YYYY-MM-DD bằng cách lấy 10 ký tự đầu tiên của chuỗi ngày
        const key = r.date?.toString().slice(0, 10);
        // Nếu khóa key hợp lệ, gán giá trị count tương ứng vào Map tra cứu
        if (key)
            map[key] = r.count;
    });
    // Khởi tạo mảng kết quả rỗng
    const result = [];
    // Duyệt vòng lặp từ 6 lùi về 0 (tương ứng với 7 ngày tính từ 6 ngày trước tới hôm nay)
    for (let i = 6; i >= 0; i--) {
        // Tạo đối tượng Date mới đại diện cho thời điểm hiện tại
        const d = new Date();
        // Thiết lập ngày lùi lại i ngày so với ngày hiện tại
        d.setDate(d.getDate() - i);
        // TỐI ƯU HÓA: Định dạng ngày cục bộ theo múi giờ máy chủ hoạt động, tránh sai lệch từ toISOString()
        // Lấy năm hiện tại của đối tượng ngày
        const year = d.getFullYear();
        // Lấy tháng hiện tại (cộng 1 vì tháng xuất phát từ 0) và tự động thêm số 0 ở đầu nếu độ dài là 1
        const month = String(d.getMonth() + 1).padStart(2, "0");
        // Lấy ngày trong tháng và tự động thêm số 0 ở đầu nếu độ dài nhỏ hơn 2 ký tự
        const dateVal = String(d.getDate()).padStart(2, "0");
        // Ghép các thành phần thành chuỗi khóa định dạng YYYY-MM-DD thống nhất
        const key = `${year}-${month}-${dateVal}`;
        // Đẩy đối tượng nhãn hiển thị và số lượng count vào mảng kết quả
        result.push({
            // Tạo nhãn hiển thị dạng ngày/tháng (ví dụ: 13/6)
            label: `${d.getDate()}/${d.getMonth() + 1}`,
            // Lấy số đếm tương ứng từ Map, nếu ngày này không có dữ liệu thì mặc định trả về số 0
            count: map[key] || 0,
        });
    }
    // Trả về mảng kết quả danh sách thống kê 7 ngày đầy đủ không bị đứt đoạn
    return result;
}
