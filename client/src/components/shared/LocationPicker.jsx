import { useEffect, useState } from "react";
import { Locate, MapPin, X } from "lucide-react";
import { useConfirm } from "../../context/ConfirmContext";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

/**
 * Leaflet/OpenStreetMap location picker.
 * Props:
 *   lat: string | number
 *   lng: string | number
 *   onChange: (lat: string, lng: string) => void
 *   required: boolean
 */
export default function LocationPicker({ lat, lng, onChange, required = false }) {
  const { alert } = useConfirm();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);


  const hasCoords =
    lat &&
    lng &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng));
  const center = hasCoords
    ? [Number(lat), Number(lng)]
    : [16.047, 108.206];

  const handlePick = (newLat, newLng) => {
    onChange(String(newLat.toFixed(6)), String(newLng.toFixed(6)));
  };

  const handleGPS = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        onChange(
          String(coords.latitude.toFixed(6)),
          String(coords.longitude.toFixed(6)),
        );
        setLocating(false);
        setOpen(true);
      },
      async () => {
        await alert({
          title: "Lỗi vị trí",
          message: "Không thể lấy vị trí GPS. Hãy chọn trực tiếp trên bản đồ.",
          variant: "warning"
        });
        setLocating(false);
        setOpen(true);
      },

    );
  };

  const handleClear = () => {
    onChange("", "");
    setOpen(false);
  };

  const buttonStyle = {
    alignItems: "center",
    background: "#0c192c",
    border: "1px solid #263a56",
    borderRadius: 10,
    color: "#9fb0c7",
    cursor: "pointer",
    display: "inline-flex",
    font: "inherit",
    fontSize: "0.84rem",
    fontWeight: 700,
    gap: 7,
    minHeight: 38,
    padding: "8px 12px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          onClick={() => setOpen((value) => !value)}
          style={{
            ...buttonStyle,
            ...(open
              ? {
                  background: "rgba(34, 243, 255, 0.1)",
                  borderColor: "rgba(34, 243, 255, 0.58)",
                  color: "#5ff7ff",
                }
              : {}),
          }}
          type="button"
        >
          <MapPin size={15} />
          {open ? "Ẩn bản đồ" : hasCoords ? "Chỉnh vị trí" : "Chọn trên bản đồ"}
        </button>

        <button
          disabled={locating}
          onClick={handleGPS}
          style={{ ...buttonStyle, opacity: locating ? 0.62 : 1 }}
          type="button"
        >
          <Locate size={15} />
          {locating ? "Đang lấy vị trí..." : "Vị trí GPS"}
        </button>

        {hasCoords && (
          <button
            onClick={handleClear}
            style={{
              ...buttonStyle,
              borderColor: "rgba(251, 113, 133, 0.32)",
              color: "#fda4af",
            }}
            type="button"
          >
            <X size={14} /> Xóa
          </button>
        )}
      </div>

      {hasCoords && (
        <p
          style={{
            alignItems: "center",
            color: "#9fb0c7",
            display: "flex",
            flexWrap: "wrap",
            fontSize: "0.78rem",
            gap: 6,
            margin: 0,
          }}
        >
          <MapPin color="#5ff7ff" size={12} />
          <strong style={{ color: "#5ff7ff" }}>
            {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </strong>
          <span>— nhấn vào bản đồ để thay đổi</span>
        </p>
      )}

      {required && !hasCoords && (
        <p style={{ color: "#fda4af", fontSize: "0.78rem", margin: 0 }}>
          * Vị trí là bắt buộc với hải sản tươi sống
        </p>
      )}

      {open && (
        <div
          style={{
            background: "#0a1525",
            border: "1px solid rgba(34, 243, 255, 0.25)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={center}
            scrollWheelZoom
            style={{ height: 320, width: "100%" }}
            zoom={hasCoords ? 13 : 10}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={center} />
            <MapClickHandler onPick={handlePick} />
            {hasCoords && <Marker position={center} />}
          </MapContainer>
          <p
            style={{
              borderTop: "1px solid #263a56",
              color: "#9fb0c7",
              fontSize: "0.78rem",
              margin: 0,
              padding: "9px 12px",
              textAlign: "center",
            }}
          >
            Nhấn vào bất kỳ điểm nào trên bản đồ để chọn vị trí
          </p>
        </div>
      )}
    </div>
  );
}
