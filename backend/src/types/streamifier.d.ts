// Khai báo module 'streamifier' cho phép hệ thống nạp thư viện ngoài chuyển đổi Buffer sang dòng dữ liệu (stream)
declare module 'streamifier' {
  // Xuất ra hàm tạo dòng đọc dữ liệu createReadStream nhận đối số buffer kiểu any và tùy chọn options
  export function createReadStream(buffer: any, options?: any): any;
}
