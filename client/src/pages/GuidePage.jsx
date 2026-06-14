// Nhập hook useSEO để thiết lập cấu trúc và thông tin metadata phục vụ SEO Google Search
import { useSEO } from "../hooks/useSEO";

// Định nghĩa và xuất component GuidePage hiển thị quy trình giao nhận hải sản sạch
export function GuidePage() {
  // Cấu hình các tiêu đề và mô tả SEO cho trang hướng dẫn
  useSEO({
    title: "Quy Trình Giao Nhận Hải Sản | Haisan.vn",
    description:
      "Khám phá hành trình hải sản tươi từ ngư thuyền của ngư dân đến bàn ăn gia đình bạn trong ngày.",
  });

  // Mảng tĩnh định nghĩa 4 bước chính trong quy trình giao hàng trực tiếp của hệ thống
  const steps = [
    {
      num: "01",
      title: "Theo Dõi & Đặt Hàng",
      description:
        "Xem lịch trình ra khơi của các tàu cá trên trang chủ. Bạn có thể đăng ký đặt trước mẻ cá sắp về hoặc đặt mua trực tiếp các sản phẩm tươi sống đang có sẵn tại cảng.",
      icon: "🚢",
      color: "var(--ocean)", // Màu đại dương chủ đạo
    },
    {
      num: "02",
      title: "Ngư Dân Đánh Bắt",
      description:
        "Khi lưới được kéo lên, ngư dân cập nhật thông tin loài cá, trọng lượng và tọa độ đánh bắt (GPS) ngay trên biển thông qua hệ thống định vị của Haisan.vn.",
      icon: "⚓",
      color: "var(--ocean-l)", // Màu xanh lam nhạt
    },
    {
      num: "03",
      title: "Xác Nhận & Sơ Chế",
      description:
        "Hệ thống tự động thông báo mẻ cá đã cập bến. Ngư dân tiến hành làm sạch, sơ chế cấp tốc và bảo quản lạnh sâu bằng đá xay sinh học để giữ trọn vẹn độ tươi ngon tự nhiên.",
      icon: "❄️",
      color: "var(--coral)", // Màu san hô cam đỏ
    },
    {
      num: "04",
      title: "Giao Hàng Siêu Tốc",
      description:
        "Hải sản đóng trong thùng xốp giữ nhiệt được giao thẳng tới tay bạn trong vòng vài giờ (nội thành). Bạn hoàn toàn kiểm soát được nguồn gốc qua mã QR truy xuất.",
      icon: "🛵",
      color: "var(--ok)", // Màu xanh lá xác nhận thành công
    },
  ];

  return (
    <div className="page-wrap-lg fade-up">
      {/* ── Khối giới thiệu biểu ngữ lớn (Hero Section) ── */}
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px 40px",
          background:
            "linear-gradient(135deg, var(--ocean-d) 0%, var(--ocean) 100%)", // Nền dải màu gradient chéo xanh thẫm
          borderRadius: "var(--radius-xl)",
          color: "var(--white)",
          marginBottom: "40px",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* Nhãn tag nhỏ giới thiệu */}
        <span
          style={{
            textTransform: "uppercase",
            letterSpacing: "2px",
            fontSize: "12px",
            fontWeight: "700",
            color: "var(--ocean-p)",
            background: "rgba(255,255,255,0.1)", // Nền trắng độ mờ đục 10%
            padding: "6px 12px",
            borderRadius: "99px",
            display: "inline-block",
            marginBottom: "16px",
          }}
        >
          Hành trình của sự tươi ngon
        </span>
        
        {/* Tiêu đề chính h1 */}
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "800",
            marginBottom: "16px",
            lineHeight: "1.2",
          }}
        >
          Quy Trình Từ Biển Khơi Đến Bàn Ăn
        </h1>
        
        {/* Mô tả phụ đề */}
        <p
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            color: "var(--ocean-p)",
            opacity: 0.9,
            fontSize: "16px",
          }}
        >
          Haisan.vn loại bỏ các khâu trung gian để mang sản phẩm trực tiếp từ
          tàu cá của ngư dân tới tay người tiêu dùng, bảo toàn vị biển tinh
          khiết nhất.
        </p>
      </div>

      {/* ── Lưới hiển thị các thẻ bước quy trình (Grid of steps) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", // Tự động co giãn số cột theo chiều rộng thiết bị khách
          gap: "24px",
          marginBottom: "60px",
        }}
      >
        {/* Duyệt qua từng bước trong mảng steps để tạo khối thẻ tương ứng */}
        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--white)",
              borderRadius: "var(--radius-lg)",
              padding: "32px 24px",
              border: "1px solid var(--border-l)",
              boxShadow: "var(--shadow-sm)",
              position: "relative",
              transition: "var(--transition)", // Hiệu ứng mượt mà khi hover
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            // Tự động đẩy nhẹ thẻ lên cao, đổ bóng đậm và đổi màu viền sang tông màu bước khi di chuột vào (onMouseEnter)
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              e.currentTarget.style.borderColor = step.color;
            }}
            // Khôi phục lại trạng thái thiết kế ban đầu khi rút chuột ra ngoài (onMouseLeave)
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              e.currentTarget.style.borderColor = "var(--border-l)";
            }}
          >
            <div>
              {/* Phần chứa Icon biểu cảm và Mã số thứ tự bước */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    lineHeight: "1",
                  }}
                >
                  {step.icon}
                </span>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                    color: "var(--border)",
                    fontFamily: "monospace",
                  }}
                >
                  {step.num}
                </span>
              </div>
              
              {/* Tiêu đề bước quy trình */}
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--dark)",
                  marginBottom: "12px",
                }}
              >
                {step.title}
              </h3>
              
              {/* Nội dung diễn giải chi tiết cho bước tương ứng */}
              <p
                style={{
                  color: "var(--text-2)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Khung cam kết chất lượng (Commitment section) ── */}
      <div
        style={{
          background: "var(--white)",
          borderRadius: "var(--radius-xl)",
          padding: "40px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "40px",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "var(--dark)",
              marginBottom: "20px",
            }}
          >
            Cam Kết Chất Lượng Omakase Hải Sản
          </h2>
          
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Cam kết 1: Đánh bắt bền vững */}
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "var(--ok)", fontSize: "20px" }}>✓</span>
              <div>
                <strong style={{ display: "block", color: "var(--dark)" }}>
                  Đánh bắt bền vững
                </strong>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                  Chỉ hợp tác với ngư thuyền sử dụng ngư cụ thân thiện với môi
                  trường biển.
                </span>
              </div>
            </div>
            
            {/* Cam kết 2: Định vị rõ ràng */}
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "var(--ok)", fontSize: "20px" }}>✓</span>
              <div>
                <strong style={{ display: "block", color: "var(--dark)" }}>
                  Định vị rõ ràng
                </strong>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                  Tất cả mẻ lưới đều đính kèm bản đồ GPS tọa độ khai thác chi
                  tiết.
                </span>
              </div>
            </div>
            
            {/* Cam kết 3: Chuỗi lạnh */}
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "var(--ok)", fontSize: "20px" }}>✓</span>
              <div>
                <strong style={{ display: "block", color: "var(--dark)" }}>
                  Chuỗi cung ứng siêu lạnh
                </strong>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                  Duy trì nhiệt độ đá xay 0-2 độ C suốt quá trình vận chuyển.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
