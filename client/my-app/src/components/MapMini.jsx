import React, { useState, useEffect } from "react";
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

export function MapMini({ lat, lng }) {
  const [geoState, setGeoState] = useState("idle");
  const [distance, setDistance] = useState(null);

  const sellerLat = parseFloat(lat);
  const sellerLng = parseFloat(lng);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(
          pos.coords.latitude,
          pos.coords.longitude,
          sellerLat,
          sellerLng,
        );
        setDistance(km);
        setGeoState("ok");
      },
      () => setGeoState("denied"),
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

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
      }}
    >
      {/* ── Header tiêu đề ── */}
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
          📍 Vị trí người bán
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

      {/* ── Banner khoảng cách nổi bật ── */}
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

      {/* ── Bản đồ ── */}
      <iframe
        src={mapUrl}
        style={{ width: "100%", height: 220, border: "none", display: "block" }}
        title="Vị trí người bán"
      />
    </div>
  );
}
