import React from "react";
import { useSEO } from "../hooks/useSEO";
import { Link } from "react-router-dom";

export function GuidePage() {
  useSEO({
    title: "Quy Trình Giao Nhận Hải Sản | HảiSản.vn",
    description: "Khám phá hành trình hải sản tươi từ ngư thuyền của ngư dân đến bàn ăn gia đình bạn trong ngày.",
  });

  const steps = [
    {
      num: "01",
      title: "Theo Dõi & Đặt Hàng",
      description: "Xem lịch trình ra khơi của các tàu cá trên trang chủ. Bạn có thể đăng ký đặt trước mẻ cá sắp về hoặc đặt mua trực tiếp các sản phẩm tươi sống đang có sẵn tại cảng.",
      icon: "🚢",
      color: "var(--ocean)"
    },
    {
      num: "02",
      title: "Ngư Dân Đánh Bắt",
      description: "Khi lưới được kéo lên, ngư dân cập nhật thông tin loài cá, trọng lượng và tọa độ đánh bắt (GPS) ngay trên biển thông qua hệ thống định vị của HảiSản.vn.",
      icon: "⚓",
      color: "var(--ocean-l)"
    },
    {
      num: "03",
      title: "Xác Nhận & Sơ Chế",
      description: "Hệ thống tự động thông báo mẻ cá đã cập bến. Ngư dân tiến hành làm sạch, sơ chế cấp tốc và bảo quản lạnh sâu bằng đá xay sinh học để giữ trọn vẹn độ tươi ngon tự nhiên.",
      icon: "❄️",
      color: "var(--coral)"
    },
    {
      num: "04",
      title: "Giao Hàng Siêu Tốc",
      description: "Hải sản đóng trong thùng xốp giữ nhiệt được giao thẳng tới tay bạn trong vòng vài giờ (nội thành). Bạn hoàn toàn kiểm soát được nguồn gốc qua mã QR truy xuất.",
      icon: "🛵",
      color: "var(--ok)"
    }
  ];

  return (
    <div className="page-wrap-lg fade-up">
      {/* Hero section */}
      <div style={{
        textAlign: "center",
        padding: "60px 20px 40px",
        background: "linear-gradient(135deg, var(--ocean-d) 0%, var(--ocean) 100%)",
        borderRadius: "var(--radius-xl)",
        color: "var(--white)",
        marginBottom: "40px",
        boxShadow: "var(--shadow-xl)"
      }}>
        <span style={{
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontSize: "12px",
          fontWeight: "700",
          color: "var(--ocean-p)",
          background: "rgba(255,255,255,0.1)",
          padding: "6px 12px",
          borderRadius: "99px",
          display: "inline-block",
          marginBottom: "16px"
        }}>Hành trình của sự tươi ngon</span>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>
          Quy Trình Từ Biển Khơi Đến Bàn Ăn
        </h1>
        <p style={{ maxWidth: "600px", margin: "0 auto", color: "var(--ocean-p)", opacity: 0.9, fontSize: "16px" }}>
          HảiSản.vn loại bỏ các khâu trung gian để mang sản phẩm trực tiếp từ tàu cá của ngư dân tới tay người tiêu dùng, bảo toàn vị biển tinh khiết nhất.
        </p>
      </div>

      {/* Grid of steps */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "24px",
        marginBottom: "60px"
      }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{
            background: "var(--white)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 24px",
            border: "1px solid var(--border-l)",
            boxShadow: "var(--shadow-sm)",
            position: "relative",
            transition: "var(--transition)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
            e.currentTarget.style.boxShadow = "var(--shadow-lg)";
            e.currentTarget.style.borderColor = step.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            e.currentTarget.style.borderColor = "var(--border-l)";
          }}>
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}>
                <span style={{
                  fontSize: "36px",
                  lineHeight: "1"
                }}>{step.icon}</span>
                <span style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "var(--border)",
                  fontFamily: "monospace"
                }}>{step.num}</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--dark)", marginBottom: "12px" }}>
                {step.title}
              </h3>
              <p style={{ color: "var(--text-2)", fontSize: "14px", lineHeight: "1.6" }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Why choose section */}
      <div style={{
        background: "var(--white)",
        borderRadius: "var(--radius-xl)",
        padding: "40px",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "40px",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--dark)", marginBottom: "20px" }}>
            Cam Kết Chất Lượng Omakase Hải Sản
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "var(--ok)", fontSize: "20px" }}>✓</span>
              <div>
                <strong style={{ display: "block", color: "var(--dark)" }}>Đánh bắt bền vững</strong>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>Chỉ hợp tác với ngư thuyền sử dụng ngư cụ thân thiện với môi trường biển.</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "var(--ok)", fontSize: "20px" }}>✓</span>
              <div>
                <strong style={{ display: "block", color: "var(--dark)" }}>Định vị rõ ràng</strong>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>Tất cả mẻ lưới đều đính kèm bản đồ GPS tọa độ khai thác chi tiết.</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <span style={{ color: "var(--ok)", fontSize: "20px" }}>✓</span>
              <div>
                <strong style={{ display: "block", color: "var(--dark)" }}>Chuỗi cung ứng siêu lạnh</strong>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>Duy trì nhiệt độ đá xay 0-2 độ C suốt quá trình vận chuyển.</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: "var(--ocean-p)",
          padding: "30px",
          borderRadius: "var(--radius-lg)",
          textAlign: "center"
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ocean-d)", marginBottom: "12px" }}>
            Trải nghiệm độ tươi chưa từng có
          </h3>
          <p style={{ color: "var(--ocean)", fontSize: "14px", marginBottom: "24px", lineHeight: "1.6" }}>
            Bạn muốn nhận hải sản định kỳ mỗi tuần hoặc tháng để có bữa ăn dinh dưỡng đầy đủ nhất? Hãy đăng ký gói Hải Sản Định Kỳ của chúng tôi ngay hôm nay.
          </p>
          <Link to="/dinh-ky" style={{
            background: "var(--coral)",
            color: "var(--white)",
            padding: "12px 24px",
            borderRadius: "99px",
            fontWeight: "700",
            textDecoration: "none",
            display: "inline-block",
            boxShadow: "0 4px 10px rgba(232, 100, 58, 0.3)",
            transition: "var(--transition)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
            Khám phá Chợ Định Kỳ
          </Link>
        </div>
      </div>
    </div>
  );
}
