// Nhập React và các hook useState, useEffect từ thư viện React để quản lý vòng đời và trạng thái component
import React, { useState, useEffect } from "react";
// Nhập các component bản đồ của Leaflet cho React để vẽ bản đồ tương tác
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
// Nhập file stylesheet CSS của Leaflet để hiển thị bản đồ đúng định dạng
import "leaflet/dist/leaflet.css";
// Nhập thư viện Leaflet lõi để tùy biến icon và điều khiển nâng cao
import L from "leaflet";
// Nhập đối tượng chứa mã màu và cấu hình thiết kế (theme) của ứng dụng
import { C } from "../utils/theme";

/* ─── Hàm Haversine tính khoảng cách đường chim bay giữa 2 tọa độ GPS (trả về kilomet) ─── */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Bán kính trung bình của Trái Đất tính bằng Kilomet
  const dLat = (lat2 - lat1) * (Math.PI / 180); // Chuyển độ vĩ sang radian
  const dLng = (lng2 - lng1) * (Math.PI / 180); // Chuyển độ kinh sang radian
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2; // Công thức Haversine tính góc ở tâm
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // Trả về khoảng cách theo km
}

// Khắc phục lỗi hiển thị icon marker mặc định của Leaflet trong React do webpack đóng gói
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  // Sử dụng ảnh marker lấy trực tiếp từ CDN unpkg của Leaflet
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Tạo biểu tượng tàu thuyền (boatIcon) tùy biến bằng HTML DivIcon
const boatIcon = L.divIcon({
  className: "custom-boat-icon", // Class CSS tùy biến
  // Dùng emoji hình con tàu kèm bóng đổ nhẹ và dịch chuyển vị trí trung tâm
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer; transform: translate(-4px, -4px);">🚢</div>',
  iconSize: [28, 28], // Kích thước icon rộng 28px và cao 28px
  iconAnchor: [14, 14], // Điểm neo của icon nằm ở chính giữa (14, 14)
});

// Tạo biểu tượng cảng biển (portIcon) tùy biến bằng HTML DivIcon
const portIcon = L.divIcon({
  className: "custom-port-icon", // Class CSS tùy biến
  // Dùng emoji ghim định vị màu đỏ làm cảng cập bến
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer; transform: translate(-4px, -4px);">📍</div>',
  iconSize: [28, 28], // Kích thước icon
  iconAnchor: [14, 14], // Điểm neo chính giữa
});

// Tạo biểu tượng người dùng (userIcon) tùy biến bằng HTML DivIcon
const userIcon = L.divIcon({
  className: "custom-user-icon", // Class CSS tùy biến
  // Dùng emoji hình người đứng màu vàng làm vị trí hiện tại của khách mua hàng
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); cursor: pointer; transform: translate(-4px, -4px);">🧍</div>',
  iconSize: [26, 26], // Kích thước hơi nhỏ hơn một chút
  iconAnchor: [13, 13], // Điểm neo chính giữa
});

// Component nhỏ ChangeBounds giúp tự động phóng to/thu nhỏ bản đồ vừa khít với các tọa độ marker
function ChangeBounds({ bounds }) {
  const map = useMap(); // Lấy đối tượng map điều khiển Leaflet hiện tại trong MapContainer
  useEffect(() => {
    // Nếu có mảng tọa độ giới hạn hợp lệ
    if (bounds && bounds[0] && bounds[1]) {
      // Phóng map khớp với giới hạn các marker và tạo khoảng đệm đệm xung quanh 40px
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, bounds]); // Chạy lại khi đối tượng map hoặc tọa độ bounds thay đổi
  return null; // Component không hiển thị giao diện HTML nào cả
}

// Lớp bắt lỗi MapErrorBoundary dùng để hiển thị giao diện dự phòng nếu Leaflet gặp lỗi khi vẽ bản đồ
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false }; // Khởi tạo state chưa có lỗi
  }

  // Phương thức tĩnh nhận lỗi và trả về state mới để render giao diện dự phòng
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Phương thức bắt lỗi chi tiết ghi nhận log lỗi vào console
  componentDidCatch(error, errorInfo) {
    console.error("Leaflet Map Error caught by Boundary:", error, errorInfo);
  }

  render() {
    // Nếu xảy ra lỗi render bản đồ
    if (this.state.hasError) {
      const { lat, lng } = this.props;
      return (
        <div
          style={{
            padding: "24px 16px",
            background: "#fef2f2", // Nền đỏ hồng nhạt báo lỗi
            border: "1.5px solid #fca5a5", // Viền đỏ nhạt
            borderRadius: 12,
            textAlign: "center", // Căn giữa chữ
            color: "#991b1b", // Màu chữ đỏ đậm
          }}
        >
          {/* Biểu tượng cảnh báo */}
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          {/* Tiêu đề thông báo sự cố */}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            Bản đồ tạm thời gặp sự cố hiển thị
          </div>
          {/* Mô tả giải pháp thay thế */}
          <p style={{ fontSize: 12, color: "#7f1d1d", margin: "0 0 14px 0" }}>
            Trình duyệt hoặc thư viện bản đồ không khởi chạy được. Bạn vẫn có
            thể xem trực tiếp vị trí trên Google Maps.
          </p>
          {/* Nút click để mở vị trí trực tiếp trên trang Google Maps */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#dc2626", // Nền đỏ
              color: "#fff", // Chữ trắng
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none", // Bỏ gạch chân
              boxShadow: "0 2px 6px rgba(220,38,38,0.25)", // Bóng đổ đỏ nhạt
            }}
          >
            🗺️ Xem trên Google Maps
          </a>
        </div>
      );
    }

    // Nếu không có lỗi thì kết xuất các component con bình thường
    return this.props.children;
  }
}

// Component wrapper MapMini để bọc component MapMiniContent bằng MapErrorBoundary
export function MapMini(props) {
  return (
    <MapErrorBoundary lat={props.lat} lng={props.lng}>
      <MapMiniContent {...props} />
    </MapErrorBoundary>
  );
}

// Component chứa logic chính hiển thị bản đồ mini
function MapMiniContent({ lat, lng, catchLat, catchLng, productName }) {
  // Khởi tạo state geoState lưu trạng thái GPS bằng cách kiểm tra sự hỗ trợ của trình duyệt
  const [geoState, setGeoState] = useState(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return "error"; // Không hỗ trợ định vị GPS
    }
    return "loading"; // Đang chờ lấy vị trí
  });

  // State lưu khoảng cách tính toán bằng km giữa người dùng và ngư dân
  const [distance, setDistance] = useState(null);
  // State lưu tọa độ GPS hiện tại của người dùng
  const [userCoords, setUserCoords] = useState(null);

  // Ép kiểu tọa độ của ngư dân/người bán về số thực float
  const sellerLat = parseFloat(lat);
  const sellerLng = parseFloat(lng);
  // Kiểm tra xem sản phẩm này có thông tin tọa độ ngư trường đánh bắt hay không
  const hasCatchLoc = catchLat && catchLng;

  // useEffect để lấy vị trí GPS hiện tại của khách hàng khi mở bản đồ
  useEffect(() => {
    // Nếu trình duyệt hoặc môi trường không hỗ trợ định vị thì thoát luôn
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    // Gọi API của trình duyệt lấy tọa độ GPS hiện tại của người dùng
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        // Lưu tọa độ người dùng vào state
        setUserCoords({ lat: uLat, lng: uLng });
        // Tính toán khoảng cách từ người dùng tới địa chỉ cảng của ngư dân
        const km = haversineKm(uLat, uLng, sellerLat, sellerLng);
        // Lưu khoảng cách tính được vào state
        setDistance(km);
        // Đặt trạng thái định vị thành công
        setGeoState("ok");
      },
      () => setGeoState("denied"), // Nếu người dùng từ chối quyền định vị
      { timeout: 8000, maximumAge: 60000 }, // Cấu hình timeout 8 giây và cache kết quả trong 1 phút
    );
  }, [sellerLat, sellerLng]); // Chạy lại nếu tọa độ ngư dân thay đổi

  // Định dạng nhãn hiển thị khoảng cách (dưới 1km đổi sang mét, trên 1km làm tròn 1 chữ số thập phân km)
  const distLabel =
    distance !== null
      ? distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`
      : null;

  // Xác định khoảng cách có gần hay không (trong phạm vi 20km đổ lại)
  const isNear = distance !== null && distance <= 20;

  // URL nhúng bản đồ OpenStreetMap mặc định nếu không vẽ bằng Leaflet React được
  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${sellerLng - 0.05},${sellerLat - 0.05},${sellerLng + 0.05},${sellerLat + 0.05}` +
    `&layer=mapnik&marker=${sellerLat},${sellerLng}`;

  // Tính toán giới hạn hiển thị của bản đồ chứa tất cả tọa độ bằng hook useMemo để tối ưu hiệu năng
  const bounds = React.useMemo(() => {
    if (!hasCatchLoc) return null; // Nếu không có điểm thả lưới thì không dùng bounds
    const list = [
      [sellerLat, sellerLng], // Tọa độ cảng người bán
      [parseFloat(catchLat), parseFloat(catchLng)], // Tọa độ nơi thả lưới đánh bắt
    ];
    // Nếu có cả tọa độ người dùng thì thêm vào danh sách tính giới hạn hiển thị
    if (userCoords?.lat && userCoords?.lng) {
      list.push([userCoords.lat, userCoords.lng]);
    }
    return list; // Trả về danh sách mảng hai chiều tọa độ giới hạn
  }, [sellerLat, sellerLng, catchLat, catchLng, userCoords, hasCatchLoc]);

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
      }}
    >
      {/* ── Khối Header tiêu đề bản đồ ── */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Tiêu đề chính */}
        <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
          {hasCatchLoc
            ? "🗺️ Hành trình đánh bắt & giao hàng"
            : "📍 Vị trí người bán"}
        </span>
        {/* Hiển thị dòng trạng thái định vị GPS của khách hàng ở góc phải */}
        {geoState === "loading" && (
          <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>
            ⏳ Đang lấy vị trí...
          </span>
        )}
        {geoState === "denied" && (
          <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>
            🚫 Chưa cho phép vị trí
          </span>
        )}
        {geoState === "error" && (
          <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>
            Trình duyệt không hỗ trợ GPS
          </span>
        )}
      </div>

      {/* ── Banner khoảng cách nổi bật (chỉ hiện khi lấy được GPS khách) ── */}
      {geoState === "ok" && distLabel && (
        <div
          style={{
            // Nền xanh lá nếu gần (dưới 20km), nền vàng nếu xa
            background: isNear ? "#f0fdf4" : "#fffbeb",
            borderBottom: `2px solid ${isNear ? "#86efac" : "#fcd34d"}`,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Icon nổi bật đại diện trạng thái khoảng cách */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: isNear ? "#dcfce7" : "#fef9c3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            {isNear ? "📍" : "🗺️"}
          </div>

          {/* Dòng khoảng cách số to đậm */}
          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: isNear ? "#15803d" : "#b45309",
                lineHeight: 1.1,
              }}
            >
              {distLabel}
            </div>
            {/* Nhãn nhỏ mô tả khoảng cách */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isNear ? "#166534" : "#92400e",
                marginTop: 3,
              }}
            >
              từ vị trí của bạn đến người bán
            </div>
          </div>

          {/* Khối thẻ Tag thông tin khuyến cáo vận chuyển */}
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div
              style={{
                display: "inline-block",
                background: isNear ? "#bbf7d0" : "#fde68a",
                color: isNear ? "#14532d" : "#78350f",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {isNear ? "✅ Gần bạn" : "⚠️ Xa bạn"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: isNear ? "#166534" : "#92400e",
                marginTop: 5,
              }}
            >
              {isNear ? "Trong phạm vi 20 km" : "Nên hỏi phí ship trước"}
            </div>
          </div>
        </div>
      )}

      {/* ── Khối vẽ Bản đồ ── */}
      {hasCatchLoc ? (
        /* Trường hợp có ngư trường đánh bắt: vẽ bản đồ tương tác với Leaflet */
        <div style={{ width: "100%", height: 350, position: "relative" }}>
          <MapContainer
            bounds={bounds} // Thiết lập giới hạn camera bản đồ
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false} // Khóa thu phóng bằng lăn chuột để tránh làm phiền khi cuộn trang
          >
            {/* Component con tự động fit màn hình camera khi bounds đổi */}
            <ChangeBounds bounds={bounds} />
            {/* Tải các mảnh bản đồ từ OpenStreetMap */}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Marker hiển thị vị trí khách hàng */}
            {userCoords && (
              <Marker
                position={[userCoords.lat, userCoords.lng]}
                icon={userIcon} // Icon hình người đứng
              >
                <Popup>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>
                    🧍 Vị trí hiện tại của bạn
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Marker hiển thị cảng neo đậu giao nhận của ngư dân */}
            <Marker position={[sellerLat, sellerLng]} icon={portIcon}>
              <Popup>
                <div style={{ fontSize: 12 }}>
                  ⚓ <strong>Cảng neo đậu/Kho bán:</strong>
                  <br />
                  Mẻ hàng sẽ cập cảng tại đây để giao cho bạn.
                </div>
              </Popup>
            </Marker>

            {/* Marker hiển thị vị trí thả lưới ngoài biển khơi của con tàu */}
            <Marker
              position={[parseFloat(catchLat), parseFloat(catchLng)]}
              icon={boatIcon} // Icon hình con tàu thủy
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  🚢 <strong>Điểm thả lưới đánh bắt:</strong>
                  <br />
                  Mẻ <strong>{productName || "hải sản"}</strong> được đánh bắt
                  tại đây ngoài khơi xa!
                </div>
              </Popup>
            </Marker>

            {/* Vẽ đường vẽ nét đứt nối liền giữa Điểm Đánh Bắt và Cảng Neo Đậu thể hiện hành trình của tàu */}
            <Polyline
              positions={[
                [parseFloat(catchLat), parseFloat(catchLng)],
                [sellerLat, sellerLng],
              ]}
              pathOptions={{ color: "#0b4f6c", dashArray: "6, 8", weight: 3 }}
            />
          </MapContainer>
        </div>
      ) : (
        /* Trường hợp chỉ có vị trí người bán (không có ngư trường): vẽ bản đồ iframe OpenStreetMap tĩnh đơn giản */
        <iframe
          src={mapUrl}
          style={{
            width: "100%",
            height: 220,
            border: "none",
            display: "block",
          }}
          title="Vị trí người bán"
        />
      )}
    </div>
  );
}
