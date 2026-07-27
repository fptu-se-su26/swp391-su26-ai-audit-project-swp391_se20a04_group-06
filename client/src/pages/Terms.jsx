import { useState } from "react";
import SupportLayout from "../components/SupportLayout";
import { ChevronDown, ChevronUp } from "lucide-react";
import useSEO from "../hooks/useSEO";

export default function Terms() {
  useSEO("Quy chế hoạt động", "Quy chế hoạt động và chính sách sàn giao dịch HảiSản.vn.");
  const [openSection, setOpenSection] = useState(0);

  const sections = [
    {
      title: "1. Nguyên tắc hoạt động chung",
      content: (
        <div>
          <p>
            HaiSan.vn hoạt động như một cầu nối trực tuyến phi tập trung, hỗ trợ ngư dân bán trực tiếp hải sản đánh bắt được tới người tiêu dùng cuối cùng mà không qua trung gian thương lái thương nghiệp.
          </p>
          <p>
            Tất cả các thành viên tham gia giao dịch trên sàn (bao gồm người mua, ngư dân, chủ vựa) phải tự chịu trách nhiệm về tính trung thực của thông tin cung cấp và tuân thủ các quy định pháp luật hiện hành của Việt Nam.
          </p>
        </div>
      )
    },
    {
      title: "2. Quy định dành cho Ngư dân (Người bán)",
      content: (
        <div>
          <ul>
            <li><strong>Tính chính xác của thông tin:</strong> Ngư dân phải mô tả đúng chủng loại hải sản, tình trạng tươi sống, khối lượng thực tế và cập nhật đầy đủ Nhật ký đi biển (tọa độ đánh bắt, ngày cập bến).</li>
            <li><strong>Chất lượng sản phẩm:</strong> Tuyệt đối không đăng bán hải sản ươn hỏng, hải sản đánh bắt bằng hóa chất độc hại hoặc chất bảo quản cấm.</li>
            <li><strong>Cam kết giao hàng:</strong> Phối hợp đóng gói và chuyển giao cho đơn vị logistics lạnh đúng hẹn để duy trì tối đa độ tươi của thực phẩm.</li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Quyền và nghĩa vụ của Khách hàng (Người mua)",
      content: (
        <div>
          <ul>
            <li><strong>Quyền lợi:</strong> Khách hàng được quyền tra cứu nguồn gốc sản phẩm, trao đổi trực tiếp với ngư dân qua cổng chat, kiểm tra độ tươi ngon của hải sản khi nhận hàng và yêu cầu đổi trả/hoàn tiền theo đúng chính sách chất lượng.</li>
            <li><strong>Trách nhiệm:</strong> Thanh toán đầy đủ giá trị đơn hàng theo thỏa thuận, cung cấp chính xác địa chỉ và thông tin nhận hàng, phản hồi lịch sự trung thực khi đánh giá sản phẩm.</li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Quyền hạn và trách nhiệm của Ban quản trị sàn",
      content: (
        <div>
          <ul>
            <li><strong>Kiểm duyệt thông tin:</strong> Ban quản trị có quyền gỡ bỏ các sản phẩm không rõ nguồn gốc, thông tin sai sự thật hoặc vi phạm quy chuẩn vệ sinh an toàn thực phẩm.</li>
            <li><strong>Giải quyết tranh chấp:</strong> Đóng vai trò trung gian hòa giải, xác thực lỗi từ phía ngư dân hay đơn vị vận chuyển để đưa ra phương án đền bù thỏa đáng cho khách hàng.</li>
            <li><strong>Xử lý vi phạm:</strong> Áp dụng các hình thức xử phạt như hạ sao uy tín, tạm khóa tài khoản hoặc cấm hoạt động vĩnh viễn đối với các tài khoản có hành vi gian lận thương mại.</li>
          </ul>
        </div>
      )
    }
  ];

  const toggleSection = (idx) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  return (
    <SupportLayout activePath="/terms">
      <h2>Quy chế hoạt động sàn giao dịch HaiSan.vn</h2>
      <p>
        Chào mừng bạn đến với sàn giao dịch kết nối trực tiếp ngư dân. Quy chế này quy định rõ quyền lợi, trách nhiệm và nghĩa vụ của các bên khi tham gia hoạt động mua bán trên hệ thống của chúng tôi.
      </p>

      <div className="rules-accordion">
        {sections.map((section, idx) => {
          const isOpen = openSection === idx;
          return (
            <div key={idx} className="rules-item">
              <div className="rules-header" onClick={() => toggleSection(idx)}>
                <span style={{ color: isOpen ? "var(--market-primary)" : "inherit" }}>
                  {section.title}
                </span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {isOpen && <div className="rules-body">{section.content}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "24px", fontSize: "0.85rem", color: "var(--market-muted)", textAlign: "center" }}>
        Quy chế này có hiệu lực chính thức từ ngày 01/01/2026. Ban quản trị có quyền cập nhật quy chế để phù hợp với tình hình thực tế và sẽ thông báo trước 7 ngày tới toàn thể thành viên.
      </div>
    </SupportLayout>
  );
}
