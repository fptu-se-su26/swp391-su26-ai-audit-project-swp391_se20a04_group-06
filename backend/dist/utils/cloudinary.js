"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicId = extractPublicId;
// Định nghĩa hàm extractPublicId để trích xuất mã định danh hình ảnh public_id từ đường dẫn URL Cloudinary phục vụ việc xóa ảnh
function extractPublicId(url) {
    // Cắt chuỗi URL tại vị trí "/upload/" để lấy phần đường dẫn ảnh phía sau
    const parts = url.split("/upload/");
    // Nếu định dạng URL không chứa cụm từ "/upload/", trả về null biểu thị không hợp lệ
    if (parts.length < 2)
        return null;
    // Lấy phần chuỗi chứa phiên bản (version) và đường dẫn thư mục ảnh ở phía sau
    const pathWithVersion = parts[1];
    // Cắt chuỗi đó ra thành mảng các phần bằng dấu gạch chéo "/"
    const pathParts = pathWithVersion.split("/");
    // Nếu phần tử đầu tiên của mảng là chuỗi phiên bản bắt đầu bằng chữ "v" (ví dụ: v1712345678)
    if (pathParts[0].startsWith("v")) {
        // Thực hiện loại bỏ phần tử phiên bản đó ra khỏi mảng đường dẫn
        pathParts.shift();
    }
    // Ghép các phần tử còn lại của mảng thành chuỗi đường dẫn hoàn chỉnh không chứa phiên bản
    const pathWithoutVersion = pathParts.join("/");
    // Tìm kiếm vị trí dấu chấm cuối cùng để tách phần đuôi mở rộng định dạng ảnh (.png, .jpg)
    const lastDotIndex = pathWithoutVersion.lastIndexOf(".");
    // Nếu không tìm thấy dấu chấm nào, trả về trực tiếp chuỗi đường dẫn không chứa phiên bản
    if (lastDotIndex === -1)
        return pathWithoutVersion;
    // Cắt chuỗi từ vị trí số 0 đến trước dấu chấm cuối cùng để lấy mã định danh public_id sạch sẽ và trả về
    return pathWithoutVersion.substring(0, lastDotIndex);
}
