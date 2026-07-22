import SupportLayout from "../components/SupportLayout";
import { Award, ShieldCheck, RefreshCw, Anchor } from "lucide-react";

export default function QualityGuarantee() {
  const guarantees = [
    {
      icon: <Anchor size={24} />,
      title: "100% Khai thác tự nhiên",
      desc: "Hải sản được đánh bắt trực tiếp từ đại dương, cam kết không chứa chất bảo quản hóa học hay phụ gia độc hại."
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "Minh bạch nguồn gốc",
      desc: "Thông qua Nhật ký biển (Boat Log), khách hàng có thể tra cứu chính xác tàu cá, vùng biển đánh bắt và ngày giờ tàu cập cảng."
    },
    {
      icon: <RefreshCw size={24} />,
      title: "Chính sách Đổi trả 100%",
      desc: "Cam kết hoàn tiền hoặc đổi trả miễn phí trong vòng 2 giờ nếu hải sản nhận được không đúng chất lượng hoặc hư hỏng do vận chuyển."
    },
    {
      icon: <Award size={24} />,
      title: "Kiểm định nghiêm ngặt",
      desc: "Đội ngũ chuyên viên kiểm tra chất lượng hải sản ngay tại bến cảng trước khi đóng gói vận chuyển đến khách hàng."
    }
  ];

  return (
    <SupportLayout activePath="/quality-guarantee">
      <h2>Đảm bảo chất lượng tại HaiSan.vn</h2>
      <p>
        Chúng tôi hiểu rằng chất lượng và độ tươi ngon là yếu tố quyết định của hải sản. HaiSan.vn cam kết xây dựng một chuỗi cung ứng minh bạch, đáng tin cậy từ khoang thuyền của ngư dân tới tận bàn ăn của gia đình bạn.
      </p>

      <div className="qa-grid">
        {guarantees.map((item, idx) => (
          <div key={idx} className="qa-card">
            <div className="qa-card-icon">{item.icon}</div>
            <h4 style={{ color: "var(--color-heading)" }}>{item.title}</h4>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>

      <h3>Quy trình giám sát chất lượng 3 lớp</h3>
      <ol>
        <li>
          <strong>Tại tàu cá (Ngư dân thực hiện):</strong> Hải sản sau khi đánh bắt lập tức được phân loại và cấp đông sâu trong hầm đá lạnh đạt chuẩn nhiệt độ -2°C đến 0°C. Ngư dân cập nhật nhật ký đánh bắt chi tiết.
        </li>
        <li>
          <strong>Tại bến cảng (HaiSan.vn kiểm thử):</strong> Ngay khi tàu cập bến, đội ngũ QA/QC sẽ đo nhiệt độ tâm sản phẩm, đánh giá cảm quan (độ trong của mắt, độ đàn hồi của thịt, màu sắc mang cá) để quyết định phân hạng sản phẩm.
        </li>
        <li>
          <strong>Trong quá trình vận chuyển (Chuỗi cung ứng lạnh):</strong> Sản phẩm được giữ lạnh liên tục trong suốt quãng đường di chuyển bằng thùng chuyên dụng cách nhiệt cao cấp, đảm bảo giữ trọn vẹn vị ngọt thanh tự nhiên.
        </li>
      </ol>

      <div style={{ marginTop: "24px", padding: "16px", background: "rgba(8, 145, 178, 0.08)", borderRadius: "10px", borderLeft: "4px solid var(--market-primary)" }}>
        <strong>Lưu ý nhận hàng:</strong> Khách hàng vui lòng kiểm tra sản phẩm cùng với nhân viên giao hàng. Nếu phát hiện bất kỳ dấu hiệu bất thường nào (mất lạnh, mùi lạ, không đúng loại đặt mua), vui lòng từ chối nhận và báo ngay cho Hotline <strong>0362614906</strong> để được xử lý đền bù lập tức.
      </div>
    </SupportLayout>
  );
}
