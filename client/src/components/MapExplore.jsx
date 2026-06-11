import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { C } from '../utils/theme';
import { fmt } from '../utils/format';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const boatIcon = L.divIcon({
  className: 'custom-boat-icon',
  html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: pointer; transform: translate(-4px, -4px);">🚢</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export function MapExplore({ products, userLocation, onProductClick }) {
  const center = userLocation?.lat ? [userLocation.lat, userLocation.lng] : [10.762622, 106.660172]; // Default HCMC

  return (
    <div style={{ height: "600px", width: "100%", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <ChangeView center={center} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation?.lat && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({ className: 'custom-icon', html: '<div style="font-size:24px; line-height:1; transform: translate(-5px, -10px);">📍</div>', iconSize: [24, 24] })}>
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}
        
        {products.map(p => {
          if (!p.lat || !p.lng) return null;
          
          const hasCatchLoc = p.catchLat && p.catchLng;
          
          return (
            <React.Fragment key={p.id}>
              {/* Port marker */}
              <Marker position={[p.lat, p.lng]}>
                <Popup>
                  <div style={{ cursor: "pointer", minWidth: 160 }} onClick={() => onProductClick(p)}>
                    {p.coverImg && <img src={p.coverImg} alt={p.name} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ color: C.coral, fontWeight: 700, fontSize: 13 }}>{fmt(p.price)}/kg</div>
                    {hasCatchLoc && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>⚓ Xuất xứ: Kéo lưới ngoài biển khơi</div>}
                    <div style={{ color: C.ocean, fontWeight: 600, fontSize: 12, marginTop: 4, textDecoration: "underline" }}>Xem chi tiết</div>
                  </div>
                </Popup>
              </Marker>

              {/* Catch location marker & path */}
              {hasCatchLoc && (
                <>
                  <Marker position={[p.catchLat, p.catchLng]} icon={boatIcon}>
                    <Popup>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        🚢 Ngư trường đánh bắt mẻ: <strong>{p.name}</strong>
                      </div>
                    </Popup>
                  </Marker>
                  <Polyline 
                    positions={[[p.catchLat, p.catchLng], [p.lat, p.lng]]} 
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
