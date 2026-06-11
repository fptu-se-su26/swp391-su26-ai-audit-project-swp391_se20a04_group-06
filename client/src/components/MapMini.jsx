import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { C } from "../utils/theme";

/* ─── Haversine (copy logic từ backend/src/utils/haversine.ts) ─── */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const boatIcon = L.divIcon({
  className: "custom-boat-icon",
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer; transform: translate(-4px, -4px);">🚢</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const portIcon = L.divIcon({
  className: "custom-port-icon",
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer; transform: translate(-4px, -4px);">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const userIcon = L.divIcon({
  className: "custom-user-icon",
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); cursor: pointer; transform: translate(-4px, -4px);">🧍</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function ChangeBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds[0] && bounds[1]) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, bounds]);
  return null;
}

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Leaflet Map Error caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { lat, lng } = this.props;
      return (
        <div
          style={{
            padding: "24px 16px",
            background: "#fef2f2",
            border: "1.5px solid #fca5a5",
            borderRadius: 12,
            textAlign: "center",
            color: "#991b1b",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            Bản đồ tạm thời gặp sự cố hiển thị
          </div>
          <p style={{ fontSize: 12, color: "#7f1d1d", margin: "0 0 14px 0" }}>
            Trình duyệt hoặc thư viện bản đồ không khởi chạy được. Bạn vẫn có
            thể xem trực tiếp vị trí trên Google Maps.
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "#dc2626",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(220,38,38,0.25)",
            }}
          >
            🗺️ Xem trên Google Maps
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}

export function MapMini(props) {
  return (
    <MapErrorBoundary lat={props.lat} lng={props.lng}>
      <MapMiniContent {...props} />
    </MapErrorBoundary>
  );
}

function MapMiniContent({ lat, lng, catchLat, catchLng, productName }) {
  // 🌟 KHẮC PHỤC: Lazy State Initialization — Khởi tạo giá trị ban đầu chuẩn xác để tránh gọi setState đồng bộ
  const [geoState, setGeoState] = useState(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return "error";
    }
    return "loading";
  });

  const [distance, setDistance] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  const sellerLat = parseFloat(lat);
  const sellerLng = parseFloat(lng);
  const hasCatchLoc = catchLat && catchLng;

  useEffect(() => {
    // Nếu trình duyệt không hỗ trợ, state đã khởi tạo thẳng là "error", chỉ cần thoát ra
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    // Không cần gọi setGeoState("loading") đồng bộ tại đây nữa!

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserCoords({ lat: uLat, lng: uLng });
        const km = haversineKm(uLat, uLng, sellerLat, sellerLng);
        setDistance(km);
        setGeoState("ok"); // Cập nhật bất đồng bộ an toàn
      },
      () => setGeoState("denied"), // Cập nhật bất đồng bộ an toàn
      { timeout: 8000, maximumAge: 60000 },
    );
  }, [sellerLat, sellerLng]);

  const distLabel =
    distance !== null
      ? distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`
      : null;

  const isNear = distance !== null && distance <= 20;

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${sellerLng - 0.05},${sellerLat - 0.05},${sellerLng + 0.05},${sellerLat + 0.05}` +
    `&layer=mapnik&marker=${sellerLat},${sellerLng}`;

  // Tinh toán bounds bản đồ hành trình kéo lưới
  const bounds = React.useMemo(() => {
    if (!hasCatchLoc) return null;
    const list = [
      [sellerLat, sellerLng],
      [parseFloat(catchLat), parseFloat(catchLng)],
    ];
    if (userCoords?.lat && userCoords?.lng) {
      list.push([userCoords.lat, userCoords.lng]);
    }
    return list;
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
      {/* Header tiêu đề */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
          {hasCatchLoc
            ? "🗺️ Hành trình đánh bắt & giao hàng"
            : "📍 Vị trí người bán"}
        </span>
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

      {/* Banner khoảng cách nổi bật */}
      {geoState === "ok" && distLabel && (
        <div
          style={{
            background: isNear ? "#f0fdf4" : "#fffbeb",
            borderBottom: `2px solid ${isNear ? "#86efac" : "#fcd34d"}`,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Icon tròn */}
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

          {/* Số khoảng cách to */}
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

          {/* Tag trạng thái */}
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

      {/* Bản đồ */}
      {hasCatchLoc ? (
        <div style={{ width: "100%", height: 350, position: "relative" }}>
          <MapContainer
            bounds={bounds}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <ChangeBounds bounds={bounds} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Vị trí người dùng */}
            {userCoords && (
              <Marker
                position={[userCoords.lat, userCoords.lng]}
                icon={userIcon}
              >
                <Popup>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>
                    🧍 Vị trí hiện tại của bạn
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Cảng của người bán */}
            <Marker position={[sellerLat, sellerLng]} icon={portIcon}>
              <Popup>
                <div style={{ fontSize: 12 }}>
                  ⚓ <strong>Cảng neo đậu/Kho bán:</strong>
                  <br />
                  Mẻ hàng sẽ cập cảng tại đây để giao cho bạn.
                </div>
              </Popup>
            </Marker>

            {/* Ngư trường kéo lưới */}
            <Marker
              position={[parseFloat(catchLat), parseFloat(catchLng)]}
              icon={boatIcon}
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

            {/* Đường nét đứt hành trình kéo lưới */}
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
