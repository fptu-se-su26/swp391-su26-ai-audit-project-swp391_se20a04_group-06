// Import hook useState từ thư viện React để quản lý trạng thái chỉ số hình ảnh đang hiển thị
import { useState } from "react";

// Định nghĩa và export component ImageSlider nhận vào đối tượng sản phẩm product làm prop
export function ImageSlider({ product }) {
  // Khởi tạo state idx lưu trữ chỉ số ảnh hiện tại đang được chọn (mặc định bắt đầu từ 0)
  const [idx, setIdx] = useState(0);
  // Lấy danh sách ảnh từ đối tượng product, nếu không tồn tại thì mặc định là một mảng rỗng
  const images = product.images || [];
  // Xác định số lượng phần tử ảnh: ưu tiên mảng images, tiếp đến imgCount và mặc định là 1 nếu không có thông tin
  const n = images.length || product.imgCount || 1;
  // Danh sách các màu nền ngẫu nhiên dùng để tạo gradient cho ảnh placeholder dự phòng
  const bgs = ["#0B4F6C", "#1A7FA0", "#0097A7", "#2D7D46", "#8B5E3C"];

  return (
    <div
      // Khung chứa toàn bộ slider với hiệu ứng nền tối
      style={{
        position: "relative", // Đặt thuộc tính relative làm gốc định vị cho các phần tử con tuyệt đối
        borderRadius: 12, // Bo tròn các góc ngoài 12px
        overflow: "hidden", // Ẩn đi phần hình ảnh hoặc nền tràn ra ngoài viền bo góc
        userSelect: "none", // Ngăn chặn người dùng bôi đen văn bản hoặc kéo thả hình ảnh
        background: "#0f172a", // Cải tiến: Nền tối "Theater Mode" cao cấp để lấp đầy phần khoảng trống thừa xung quanh ảnh
        height: 300, // Chiều cao cố định của khung slider
        display: "flex", // Sử dụng flexbox để căn chỉnh nội dung bên trong
        alignItems: "center", // Căn giữa theo chiều dọc
        justifyContent: "center", // Căn giữa theo chiều ngang
      }}
    >
      {/* Nếu ảnh ở vị trí hiện tại idx tồn tại thì render thẻ img, nếu không có ảnh thì render placeholder */}
      {images[idx] ? (
        <img
          // Đường dẫn URL của ảnh đang được chọn hiển thị
          src={images[idx].url}
          // Mô tả thay thế của ảnh bằng tên sản phẩm phục vụ SEO và hỗ trợ đọc màn hình
          alt={product.name}
          style={{
            maxWidth: "100%", // Chiều rộng tối đa bằng 100% kích thước khung chứa
            maxHeight: "100%", // Chiều cao tối đa bằng 100% kích thước khung chứa
            objectFit: "contain", // Cải tiến: Thu nhỏ vừa vặn trong khung để hiển thị đầy đủ 100% hình ảnh không bị méo/cắt xén
            display: "block", // Thiết lập hiển thị block để loại bỏ khoảng cách dòng dư thừa phía dưới
          }}
        />
      ) : (
        <div
          // Giao diện placeholder dự phòng với nền gradient luân phiên
          style={{
            // Tạo nền chuyển sắc gradient chéo 135 độ chuyển giao giữa hai màu ngẫu nhiên trong mảng bgs dựa trên chỉ số idx
            background: `linear-gradient(135deg, ${bgs[idx % bgs.length]}, ${bgs[(idx + 1) % bgs.length]})`,
            height: "100%", // Chiều cao lấp đầy 100% khung slider
            width: "100%", // Chiều rộng lấp đầy 100% khung slider
            display: "flex", // Sử dụng flexbox
            alignItems: "center", // Căn giữa icon và chữ theo chiều dọc
            justifyContent: "center", // Căn giữa theo chiều ngang
            flexDirection: "column", // Sắp xếp các phần tử con theo chiều dọc
            gap: 8, // Khoảng cách giữa biểu tượng và dòng chữ số thứ tự ảnh
          }}
        >
          {/* Biểu tượng con cá lớn đại diện cho hàng hải sản */}
          <span style={{ fontSize: 96 }}>🐟</span>
          {/* Dòng chữ hiển thị thứ tự ảnh placeholder */}
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            Ảnh {idx + 1}/{n}
          </span>
        </div>
      )}

      {/* Hiển thị các nút điều hướng chuyển ảnh nếu tổng số lượng ảnh lớn hơn 1 */}
      {n > 1 && (
        <>
          {/* Nút điều hướng quay lại ảnh trước đó (Sang trái) */}
          <button
            // Bắt sự kiện click để chuyển ảnh về trước
            onClick={(e) => {
              // Ngăn cản sự kiện click lan truyền ra ngoài kích hoạt hành vi của component cha
              e.stopPropagation();
              // Lùi chỉ số idx đi 1, cộng thêm n và chia lấy dư để quay về cuối mảng khi lùi vượt quá index 0
              setIdx((idx - 1 + n) % n);
            }}
            // Thiết lập style cho nút lùi ảnh
            style={{
              position: "absolute", // Định vị tuyệt đối so với khung cha
              left: 12, // Nằm cách mép trái khung chứa 12px
              top: "50%", // Căn lề trên 50%
              transform: "translateY(-50%)", // Dịch chuyển ngược lên 50% chiều cao của chính nó để căn giữa hoàn hảo
              background: "rgba(0,0,0,0.5)", // Nền tối bán trong suốt 50% giúp dễ nhìn trên mọi nền ảnh
              color: "#fff", // Màu chữ/biểu tượng trắng
              border: "none", // Không vẽ viền nút mặc định
              borderRadius: "50%", // Bo tròn tuyệt đối tạo nút hình tròn
              width: 36, // Chiều rộng nút 36px
              height: 36, // Chiều cao nút 36px
              cursor: "pointer", // Biến đổi con trỏ chuột thành pointer khi người dùng hover
              fontSize: 20, // Cỡ chữ của dấu mũi tên
              lineHeight: 1, // Đảm bảo dòng cao bằng 1 để ký tự mũi tên nằm chính giữa nút
              zIndex: 10, // Thiết lập z-index để nút luôn nằm đè lên trên ảnh sản phẩm
            }}
          >
            ‹
          </button>
          {/* Nút điều hướng tiến tới ảnh tiếp theo (Sang phải) */}
          <button
            // Bắt sự kiện click để chuyển sang ảnh kế tiếp
            onClick={(e) => {
              // Ngăn cản sự kiện click lan truyền lên component cha
              e.stopPropagation();
              // Tiến chỉ số idx thêm 1 đơn vị, chia lấy dư cho n để quay về 0 khi tiến vượt quá độ dài mảng
              setIdx((idx + 1) % n);
            }}
            // Thiết lập style cho nút tiến ảnh
            style={{
              position: "absolute", // Định vị tuyệt đối so với khung cha
              right: 12, // Nằm cách mép phải khung chứa 12px
              top: "50%", // Căn lề trên 50%
              transform: "translateY(-50%)", // Dịch chuyển ngược lên 50% chiều cao nút để căn giữa hoàn hảo
              background: "rgba(0,0,0,0.5)", // Nền tối bán trong suốt 50%
              color: "#fff", // Màu chữ trắng
              border: "none", // Không vẽ viền nút mặc định
              borderRadius: "50%", // Bo tròn tuyệt đối tạo nút hình tròn
              width: 36, // Chiều rộng nút 36px
              height: 36, // Chiều cao nút 36px
              cursor: "pointer", // Đổi con trỏ chuột thành hình bàn tay chỉ vào
              fontSize: 20, // Kỡ chữ dấu mũi tên tiến
              lineHeight: 1, // Chiều cao dòng bằng 1 giúp căn chỉnh ký tự chuẩn
              zIndex: 10, // Z-index cao để hiển thị nổi đè lên trên ảnh
            }}
          >
            ›
          </button>
          {/* Khu vực chứa các chấm tròn chỉ báo vị trí ảnh (dots indicator) ở phía dưới */}
          <div
            style={{
              position: "absolute", // Định vị tuyệt đối so với khung chứa slider
              bottom: 12, // Khoảng cách từ đáy khung slider lên là 12px
              left: "50%", // Căn lề trái 50%
              transform: "translateX(-50%)", // Dịch chuyển ngược sang trái 50% chiều rộng chính nó để căn giữa ngang hoàn chỉnh
              display: "flex", // Sử dụng flexbox để xếp các dấu chấm nằm ngang
              gap: 6, // Khoảng cách giữa các chấm tròn là 6px
              zIndex: 10, // Nổi đè lên ảnh
            }}
          >
            {/* Tạo một mảng rỗng có n phần tử để duyệt và sinh ra số chấm tròn tương ứng với số lượng ảnh */}
            {Array.from({ length: n }).map((_, i) => (
              <div
                // Thiết lập key định danh duy nhất cho từng chấm tròn chỉ báo
                key={i}
                // Bắt sự kiện click để nhảy nhanh đến ảnh ở vị trí index tương ứng
                onClick={(e) => {
                  // Ngăn cản sự kiện click lan truyền ra ngoài
                  e.stopPropagation();
                  // Cập nhật chỉ số idx hiển thị ảnh bằng chỉ số i của chấm tròn vừa click
                  setIdx(i);
                }}
                // Thiết lập style cho từng chấm tròn chỉ báo
                style={{
                  width: 8, // Chiều rộng chấm tròn 8px
                  height: 8, // Chiều cao chấm tròn 8px
                  borderRadius: "50%", // Thiết lập bo tròn tuyệt đối để tạo hình tròn
                  cursor: "pointer", // Đổi con trỏ chuột thành pointer khi hover
                  // Nếu chấm chỉ báo trùng với chỉ số ảnh đang hiển thị thì tô màu trắng sáng, ngược lại tô màu trắng mờ
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        </>
      )}
      {/* Huy hiệu hiển thị tổng số lượng ảnh ở góc trên bên phải */}
      <div
        style={{
          position: "absolute", // Định vị tuyệt đối so với khung chứa slider
          top: 12, // Cách mép trên khung slider 12px
          right: 12, // Cách mép phải khung slider 12px
          background: "rgba(0,0,0,0.55)", // Nền đen mờ 55% giúp hiển thị rõ trên các ảnh sáng màu
          color: "#fff", // Màu chữ trắng
          fontSize: 11, // Cỡ chữ nhỏ 11px
          padding: "3px 8px", // Khoảng đệm 3px dọc và 8px ngang
          borderRadius: 4, // Bo tròn nhẹ góc 4px
          zIndex: 10, // Thiết lập z-index để nổi bật hơn ảnh
        }}
      >
        📸 {n}
      </div>
    </div>
  );
}
