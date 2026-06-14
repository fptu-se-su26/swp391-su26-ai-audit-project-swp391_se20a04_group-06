// Nhập các hook useState và useEffect từ thư viện React để quản lý vòng đời và trạng thái cuộn trang
import { useState, useEffect } from "react";
// Nhập component Link từ react-router-dom để thực hiện các liên kết nội bộ nhanh chóng không load lại trang
import { Link } from "react-router-dom";

// Component chân trang Footer dùng chung hiển thị ở cuối mỗi trang
export function Footer() {
  // State isVisible kiểm soát trạng thái hiển thị của nút "Trở lại đầu trang" (cuộn lên trên)
  const [isVisible, setIsVisible] = useState(false);

  // useEffect đăng ký sự kiện lắng nghe thao tác cuộn chuột (scroll) của trình duyệt
  useEffect(() => {
    // Hàm callback kiểm tra khoảng cách cuộn dọc scrollY của cửa sổ trình duyệt
    const toggleVisibility = () => {
      // Nếu người dùng đã cuộn xuống hơn 300px
      if (window.scrollY > 300) {
        // Hiển thị nút cuộn lên đầu trang
        setIsVisible(true);
      } else {
        // Ngược lại, ẩn nút cuộn đi
        setIsVisible(false);
      }
    };
    // Gắn sự kiện cuộn scroll của window trình duyệt với hàm kiểm tra toggleVisibility
    window.addEventListener("scroll", toggleVisibility);
    // Cleanup: gỡ bỏ sự kiện cuộn chuột khi component bị unmount tránh rò rỉ bộ nhớ
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []); // Chỉ chạy một lần khi component được render lần đầu

  // Hàm xử lý cuộn mượt mà (smooth scroll) lên trên cùng màn hình (tọa độ top 0)
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Cuộn mượt mà thay vì nhảy thẳng lên ngay lập tức
    });
  };

  return (
    // Khung bao ngoài cùng chân trang với các class CSS
    <div
      className="foot_back"
      style={{
        width: "100%",
        // Dải màu gradient nền xanh lá cây đậm lấy cảm hứng từ biển cả và sự tươi sạch
        background: "linear-gradient(to bottom, #0d5f45, #083b2b)",
        backgroundSize: "auto",
        position: "relative",
        clear: "both",
      }}
    >
      {/* Khối thẻ footer chứa nội dung giới thiệu */}
      <footer
        id="footer"
        style={{
          width: "100%",
          maxWidth: "1000px", // Giới hạn chiều rộng tối đa
          margin: "0 auto", // Căn giữa khối
          padding: "80px 24px 60px", // Khoảng đệm trên dưới và hai bên
          textAlign: "center", // Căn giữa văn bản
          color: "#ffffff", // Màu chữ trắng nổi bật trên nền đậm
        }}
      >
        {/* Phần Logo website đặt trong liên kết điều hướng về trang chủ */}
        <p className="logo" style={{ marginBottom: "40px" }}>
          <Link to="/" style={{ display: "inline-block" }}>
            <img
              loading="lazy" // Tải chậm để tăng tốc độ tải trang ban đầu
              src="/logo02.png" // Đường dẫn tới file ảnh logo
              alt="Haisan.vn"
              style={{
                maxHeight: "55px", // Chiều cao tối đa logo
                objectFit: "contain",
                transition: "transform 0.2s", // Hiệu ứng zoom nhẹ mượt mà
              }}
              // Khi di chuột vào: phóng to logo lên 5%
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              // Khi chuột rời đi: phục hồi kích thước logo ban đầu
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1.00)")
              }
            />
          </Link>
        </p>

        {/* Phần chứa danh sách các đường liên kết chữ giới thiệu thông tin */}
        <p
          className="text01"
          style={{
            fontSize: "12px", // Cỡ chữ nhỏ thanh lịch
            lineHeight: "200%", // Giãn dòng 200% để dễ đọc
            margin: "0 auto 40px",
            maxWidth: "800px",
            color: "rgba(255, 255, 255, 0.85)", // Chữ màu trắng mờ nhẹ
          }}
        >
          {/* Liên kết 1: Trang chủ giới thiệu */}
          <Link
            to="/"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Haisan.vn - Hải Sản Tươi Ngon Từ Ngư Dân
          </Link>
          ｜
          {/* Liên kết 2: Giới thiệu dịch vụ */}
          <Link
            to="/quy-trinh"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Giới thiệu dịch vụ thu mua hộ
          </Link>
          ｜
          {/* Liên kết 3: Danh sách ngư thuyền liên kết */}
          <Link
            to="/ngu-dan"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Danh sách ngư thuyền liên kết
          </Link>
          ｜
          {/* Liên kết 4: Bí quyết ẩm thực */}
          <Link
            to="/cong-thuc"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Bí quyết ẩm thực & Mẹo chế biến
          </Link>
          ｜
          {/* Liên kết 5: Quy trình mua hàng */}
          <Link
            to="/quy-trinh"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Quy trình & Hướng dẫn mua hàng
          </Link>
          <br />
          {/* Liên kết 6: Phản hồi khách hàng */}
          <Link
            to="/cong-dong"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Ý kiến phản hồi từ khách hàng
          </Link>
          ｜
          {/* Liên kết 7: Sản phẩm giao hàng hẹn giờ */}
          <Link
            to="/san-pham"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Sản phẩm giao hàng hẹn giờ
          </Link>
          ｜
          {/* Liên kết 8: Sản phẩm hải sản tươi sống mới */}
          <Link
            to="/san-pham"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Hải sản tươi sống mới đánh bắt
          </Link>
          ｜
          {/* Liên kết 9: Đăng ký thành viên */}
          <Link
            to="/dang-nhap"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Đăng ký thành viên miễn phí
          </Link>
          <br />
          {/* Liên kết 10: Trang Profile tài khoản */}
          <Link
            to="/profile"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Thông tin tài khoản
          </Link>
          ｜
          {/* Liên kết 11: Đăng bán mẻ lưới mới dành cho ngư dân */}
          <Link
            to="/dang-bai"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Đăng bài bán mẻ lưới mới
          </Link>
          ｜
          {/* Liên kết 12: Liên hệ hợp tác */}
          <Link
            to="/dang-nhap"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Liên hệ hợp tác & Hỗ trợ ngư dân
          </Link>
          <br />
          {/* Liên kết ngoài: Liên kết sàn giao dịch đối tác */}
          <a
            href="https://yasai-tuuhan.com/"
            target="_blank" // Mở trong tab mới
            rel="noopener noreferrer"
            style={{
              color: "#ffffff",
              textDecoration: "underline",
              margin: "0 6px",
            }}
          >
            Liên kết: Sàn rau củ hữu cơ nông sản Việt
          </a>
        </p>

        {/* Khối Bản quyền Copyright */}
        <p
          className="copy"
          style={{
            marginTop: "20px",
            opacity: 0.8, // Tạo chữ mờ nhẹ
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          © Haisan.vn
        </p>
      </footer>

      {/* ── Nút bay (Floating) cuộn nhanh lên đầu trang (Back to Top) ── */}
      <div
        onClick={scrollToTop} // Click sẽ chạy hàm scrollToTop cuộn mượt mà lên đầu trang
        style={{
          position: "fixed", // Cố định vị trí bay
          bottom: "40px", // Cách đáy 40px
          right: "40px", // Cách lề phải 40px
          cursor: "pointer", // Con trỏ chuột hình bàn tay
          zIndex: 999, // Đảm bảo nổi lên trên các thành phần khác
          // Đặt độ mờ: 1 nếu đang hiển thị, 0 nếu đang ẩn
          opacity: isVisible ? 1 : 0,
          // Sử dụng transform để thu nhỏ và dịch xuống dưới khi ẩn, phóng to bình thường khi hiện
          transform: isVisible
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.8)",
          // Ngăn chặn sự kiện click chuột khi nút đang ẩn
          pointerEvents: isVisible ? "auto" : "none",
          // Sử dụng hàm transition cubic-bezier để tạo hiệu ứng nảy nhẹ (elastic/bounce) cực kỳ premium
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
        // Khi di chuột vào: dịch chuyển nhẹ lên trên 5px và phóng to thêm 8% tạo phản hồi tương tác
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px) scale(1.08)";
        }}
        // Khi chuột rời đi: trả lại tỷ lệ hiển thị bình thường tùy thuộc vào trạng thái isVisible
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isVisible
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.8)";
        }}
      >
        {/* Ảnh đại diện icon nút cuộn lên đầu trang */}
        <img
          src="/pagetop.png"
          alt="Trở lại đầu trang"
          style={{
            width: "50px",
            height: "50px",
            // Thêm bóng đổ mềm mại giúp icon nổi lên trên nền bản đồ hay sản phẩm
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))",
          }}
        />
      </div>
    </div>
  );
}
