// Import thư viện React để sử dụng cú pháp JSX và thẻ Fragment gom nhóm phần tử
import React from 'react';
// Import các component bản đồ từ thư viện react-leaflet để hiển thị OpenStreetMap
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
// Import file CSS mặc định của Leaflet để định hình giao diện bản đồ chuẩn xác
import 'leaflet/dist/leaflet.css';
// Import đối tượng Leaflet gốc (L) để thực hiện cấu hình thủ công các icon và thành phần mở rộng
import L from 'leaflet';
// Import đối tượng bảng màu C từ tiện ích giao diện
import { C } from '../utils/theme';
// Import hàm định dạng tiền tệ fmt từ thư mục tiện ích
import { fmt } from '../utils/format';

// Sửa lỗi không hiển thị được biểu tượng marker mặc định của Leaflet khi chạy trong môi trường bundle (Webpack/Vite)
// Loại bỏ phương thức lấy đường dẫn icon mặc định bị lỗi
delete L.Icon.Default.prototype._getIconUrl;
// Cập nhật lại đường dẫn tài nguyên hình ảnh trực tiếp từ CDN chính thức của unpkg
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', // Hình ảnh ghim bản đồ độ nét cao
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', // Hình ảnh ghim bản đồ tiêu chuẩn
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', // Hình ảnh bóng đổ dưới chân ghim
});

// Định nghĩa biểu tượng hình con tàu (🚢) tùy chỉnh bằng HTML divIcon để biểu diễn điểm đánh bắt ngoài khơi
const boatIcon = L.divIcon({
  className: 'custom-boat-icon', // Tên class CSS tùy biến để tạo kiểu
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer; transform: translate(-4px, -4px);">🚢</div>', // Mã HTML render emoji con tàu kèm bóng đổ
  iconSize: [26, 26], // Kích thước hiển thị của icon
  iconAnchor: [13, 13], // Toạ độ tâm neo của biểu tượng nằm chính giữa con tàu
});

// Component con ChangeView có nhiệm vụ lắng nghe thay đổi tọa độ center để tự động di chuyển bản đồ
function ChangeView({ center }) {
  // Lấy tham chiếu đến đối tượng bản đồ Leaflet hiện tại bằng hook useMap
  const map = useMap();
  // Gọi hàm setView để dịch chuyển tâm bản đồ tới vị trí mới và giữ nguyên tỷ lệ zoom
  map.setView(center, map.getZoom());
  // Component này chỉ thực thi side-effect điều khiển bản đồ nên không cần render giao diện UI (trả về null)
  return null;
}

// Định nghĩa và export component chính MapExplore hiển thị bản đồ hành trình hải sản
export function MapExplore({ products, userLocation, onProductClick }) {
  // Tính toán tọa độ tâm bản đồ: Ưu tiên tọa độ hiện tại của người dùng, nếu không có sẽ lấy tọa độ mặc định TP.HCM
  const center = userLocation?.lat ? [userLocation.lat, userLocation.lng] : [10.762622, 106.660172];

  return (
    <div 
      // Khung bao bọc bản đồ với kích thước cố định, bo góc tròn và bóng đổ tạo chiều sâu
      style={{ height: "600px", width: "100%", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
    >
      {/* Khởi tạo thẻ bản đồ MapContainer với tâm bản đồ, mức zoom mặc định và chiếm trọn khung chứa */}
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        {/* Component điều hướng bản đồ theo tâm mới */}
        <ChangeView center={center} />
        {/* Nạp các ô bản đồ địa hình (TileLayer) từ OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Kiểm tra nếu người dùng đã bật định vị thì hiển thị ghim đánh dấu vị trí người dùng trên bản đồ */}
        {userLocation?.lat && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            // Tạo divIcon chứa emoji ghim đỏ để đánh dấu vị trí người dùng
            icon={L.divIcon({ className: 'custom-icon', html: '<div style="font-size:24px; line-height:1; transform: translate(-5px, -10px);">📍</div>', iconSize: [24, 24] })}
          >
            {/* Hộp thoại thông tin nhỏ xuất hiện khi click vào marker vị trí người dùng */}
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}
        
        {/* Duyệt qua danh sách các sản phẩm hải sản để vẽ điểm bán/cảng biển và vị trí đánh bắt */}
        {products.map(p => {
          // Bỏ qua nếu sản phẩm không có tọa độ cửa hàng/đại lý cập cảng
          if (!p.lat || !p.lng) return null;
          
          // Kiểm tra xem sản phẩm này có thông tin toạ độ điểm đánh bắt ngoài khơi hay không
          const hasCatchLoc = p.catchLat && p.catchLng;
          
          return (
            // Trả về Fragment chứa thông tin các marker và nét vẽ liên kết cho mỗi sản phẩm
            <React.Fragment key={p.id}>
              {/* Đánh dấu vị trí đại lý bán hải sản hoặc cảng cá cập bến */}
              <Marker position={[p.lat, p.lng]}>
                {/* Hộp thoại hiển thị thông tin tóm tắt sản phẩm khi nhấn vào ghim cảng */}
                <Popup>
                  <div 
                    style={{ cursor: "pointer", minWidth: 160 }} 
                    // Bắt sự kiện click để chuyển hướng người dùng đến trang chi tiết sản phẩm tương ứng
                    onClick={() => onProductClick(p)}
                  >
                    {/* Render ảnh bìa hải sản nếu có */}
                    {p.coverImg && <img src={p.coverImg} alt={p.name} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                    {/* Tên hải sản */}
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    {/* Giá hải sản được định dạng sang tiền Việt Nam */}
                    <div style={{ color: C.coral, fontWeight: 700, fontSize: 13 }}>{fmt(p.price)}/kg</div>
                    {/* Nếu có điểm đánh bắt thì hiển thị nhãn xuất xứ hải sản đánh bắt xa bờ */}
                    {hasCatchLoc && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>⚓ Xuất xứ: Kéo lưới ngoài biển khơi</div>}
                    {/* Nhãn hướng dẫn click để xem chi tiết sản phẩm */}
                    <div style={{ color: C.ocean, fontWeight: 600, fontSize: 12, marginTop: 4, textDecoration: "underline" }}>Xem chi tiết</div>
                  </div>
                </Popup>
              </Marker>
 
              {/* Nếu sản phẩm này có lưu trữ nguồn gốc toạ độ đánh bắt ngoài biển khơi */}
              {hasCatchLoc && (
                <>
                  {/* Vẽ marker con tàu biểu thị vị trí lưới kéo đánh bắt */}
                  <Marker position={[p.catchLat, p.catchLng]} icon={boatIcon}>
                    {/* Hộp thoại thông tin khi click vào biểu tượng con tàu */}
                    <Popup>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        🚢 Ngư trường đánh bắt mẻ: <strong>{p.name}</strong>
                      </div>
                    </Popup>
                  </Marker>
                  {/* Vẽ đường thẳng liên kết nét đứt thể hiện hành trình di chuyển từ điểm đánh bắt ngoài khơi về cảng cá */}
                  <Polyline 
                    positions={[[p.catchLat, p.catchLng], [p.lat, p.lng]]} 
                    // Thiết lập các thuộc tính giao diện cho đường nối: màu sắc, độ đứt quãng và độ rộng nét vẽ
                    pathOptions={{ color: '#0b4f6c', dashArray: '6, 8', weight: 3 }} 
                  />
                </>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
