import SupportLayout from "../components/SupportLayout";
import { Search, Compass, MessageSquare, CreditCard, Truck } from "lucide-react";

export default function PurchaseGuide() {
  const steps = [
    {
      number: "1",
      icon: <Search size={20} />,
      title: "Tìm kiếm hải sản mong muốn",
      desc: "Truy cập Chợ hải sản để tìm kiếm theo danh mục (cá, tôm, cua, mực...), mức độ tươi ngon, hoặc theo dõi các vựa cá vừa cập bến từ các đội tàu đánh bắt."
    },
    {
      number: "2",
      icon: <Compass size={20} />,
      title: "Kiểm tra nguồn gốc & Nhật ký biển",
      desc: "Xem thông tin chi tiết sản phẩm, quét mã truy xuất hoặc kiểm tra Nhật ký biển (Boat Log) của ngư dân để biết chính xác tọa độ đánh bắt, ngày cập bến và giấy tờ kiểm định vệ sinh."
    },
    {
      number: "3",
      icon: <MessageSquare size={20} />,
      title: "Trao đổi trực tiếp với ngư dân",
      desc: "Sử dụng tính năng Chat trực tuyến trên sàn để trao đổi thêm với ngư dân về quy cách đóng gói, giá cả hoặc thời gian giao nhận tối ưu nhất cho bạn."
    },
    {
      number: "4",
      icon: <CreditCard size={20} />,
      title: "Thanh toán an toàn",
      desc: "Lựa chọn hình thức thanh toán thuận tiện: Chuyển khoản ngân hàng, thanh toán qua cổng trực tuyến, hoặc Thanh toán khi nhận hàng (COD) sau khi đồng ý thỏa thuận."
    },
    {
      number: "5",
      icon: <Truck size={20} />,
      title: "Nhận hàng & Đánh giá chất lượng",
      desc: "Đơn hàng được vận chuyển thông qua chuỗi cung ứng lạnh chuyên nghiệp. Sau khi nhận và kiểm tra độ tươi, hãy gửi đánh giá và chấm điểm sao để giúp cộng đồng nhận biết ngư dân uy tín."
    }
  ];

  return (
    <SupportLayout activePath="/purchase-guide">
      <h2>Hướng dẫn mua hàng trên HaiSan.vn</h2>
      <p>
        HảiSản.vn là nền tảng kết nối trực tiếp Người mua với Ngư dân đánh bắt xa bờ. Quy trình mua hàng được thiết kế tinh gọn, minh bạch và đảm bảo quyền lợi tốt nhất cho khách hàng.
      </p>

      <h3>Quy trình 5 bước mua hàng đơn giản</h3>
      <div className="guide-steps">
        {steps.map((step) => (
          <div key={step.number} className="guide-step-card">
            <div className="guide-step-number">{step.number}</div>
            <div className="guide-step-content">
              <h4 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 6px 0", color: "var(--color-heading)" }}>
                <span style={{ color: "var(--market-primary)", display: "flex", alignItems: "center" }}>{step.icon}</span>
                {step.title}
              </h4>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h3>Mẹo nhỏ cho người mua</h3>
      <ul>
        <li>Nên ưu tiên chọn sản phẩm từ các ngư dân có nhãn <strong>Đã xác minh (Verified)</strong> và có điểm đánh giá cao trên Bảng xếp hạng.</li>
        <li>Kiểm tra kỹ <strong>Nhật ký đi biển</strong> để biết hải sản được đánh bắt bằng phương pháp gì (câu tay, lưới vây...) nhằm chọn được chất lượng ưng ý nhất.</li>
        <li>Mọi thắc mắc hoặc sự cố về đơn hàng, bạn có thể liên hệ hotline hỗ trợ 24/7 của chúng tôi để được giải quyết nhanh nhất.</li>
      </ul>
    </SupportLayout>
  );
}
