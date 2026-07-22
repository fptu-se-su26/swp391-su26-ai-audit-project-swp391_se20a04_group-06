import SupportLayout from "../components/SupportLayout";

export default function SafetyPolicy() {
  return (
    <SupportLayout activePath="/safety-policy">
      <h2>Quy chuẩn vệ sinh an toàn thực phẩm</h2>
      <p>
        HaiSan.vn áp dụng các tiêu chuẩn vệ sinh nghiêm ngặt dựa trên quy chuẩn quốc gia về sản xuất và kinh doanh thủy hải sản nhằm bảo vệ sức khỏe người tiêu dùng, duy trì uy tín của thương hiệu hải sản Việt.
      </p>

      <h3>1. Yêu cầu vệ sinh đối với phương tiện đánh bắt & Ngư dân</h3>
      <ul>
        <li><strong>Vệ sinh hầm tàu:</strong> Trước mỗi chuyến biển, hầm bảo quản sản phẩm trên tàu cá phải được khử trùng bằng các chất tẩy rửa chuyên dụng được Bộ Y tế cấp phép, rửa sạch lại bằng nước ngọt hoặc nước biển sạch.</li>
        <li><strong>Nguồn đá bảo quản:</strong> Chỉ sử dụng nước đá được sản xuất từ các cơ sở đạt chuẩn an toàn vệ sinh, không chứa vi khuẩn gây hại hay kim loại nặng.</li>
        <li><strong>Sức khỏe thuyền viên:</strong> Thuyền viên trực tiếp tham gia xử lý hải sản phải đảm bảo sức khỏe, không mắc các bệnh truyền nhiễm, tuân thủ đeo bảo hộ khi phân loại hải sản.</li>
      </ul>

      <h3>2. Tiêu chuẩn nhiệt độ bảo quản tối ưu</h3>
      <p>
        Việc duy trì nhiệt độ bảo quản lạnh liên tục là yếu tố cốt lõi để duy trì chất lượng và hạn chế sự phát triển của vi khuẩn:
      </p>

      <div className="policy-table-wrapper">
        <table className="policy-table">
          <thead>
            <tr>
              <th>Loại sản phẩm</th>
              <th>Phương pháp bảo quản</th>
              <th>Nhiệt độ yêu cầu</th>
              <th>Thời gian tối đa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Hải sản tươi sống (Live)</strong></td>
              <td>Bể sục oxy tuần hoàn liên tục</td>
              <td>15°C - 22°C (tùy loài)</td>
              <td>Theo dõi sức khỏe hàng ngày</td>
            </tr>
            <tr>
              <td><strong>Hải sản ướp đá (Fresh)</strong></td>
              <td>Ủ đá xay nhuyễn tỷ lệ 1 đá : 1 cá</td>
              <td>-1°C đến 2°C</td>
              <td>Tối đa 10 ngày từ lúc đánh bắt</td>
            </tr>
            <tr>
              <td><strong>Hải sản đông lạnh (Frozen)</strong></td>
              <td>Cấp đông nhanh (IQF)</td>
              <td>Dưới -18°C</td>
              <td>12 tháng kể từ ngày đóng gói</td>
            </tr>
            <tr>
              <td><strong>Hải sản khô (Dried)</strong></td>
              <td>Phơi sấy tự nhiên + hút chân không</td>
              <td>Nhiệt độ phòng thoáng mát</td>
              <td>6 tháng kể từ ngày sản xuất</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>3. Quy chuẩn đóng gói & Giao nhận</h3>
      <ul>
        <li><strong>Vật liệu đóng gói:</strong> Bao bì sử dụng là nhựa nguyên sinh PE/PP hoặc khay xốp chuyên dùng cho thực phẩm, cam kết không thôi nhiễm chất độc hại vào hải sản.</li>
        <li><strong>Chuỗi cung ứng lạnh:</strong> Xe giao hàng và thùng chuyên dụng phải được vệ sinh khử khuẩn hàng ngày, nhiệt độ thùng luôn được duy trì ổn định dưới 4°C trong suốt quá trình vận chuyển chặng cuối.</li>
      </ul>
    </SupportLayout>
  );
}
