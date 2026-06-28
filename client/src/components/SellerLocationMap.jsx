import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export default function SellerLocationMap({ lat, lng, sellerName }) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return <p className="map-unavailable">Người bán chưa công khai vị trí mẻ hàng.</p>;
  }

  return (
    <div className="seller-location-map">
      <MapContainer center={[latitude, longitude]} scrollWheelZoom={false} zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[latitude, longitude]}
          fillColor="#0ea5e9"
          fillOpacity={0.8}
          pathOptions={{ color: "#ffffff", weight: 3 }}
          radius={10}
        >
          <Popup>Vị trí bán hàng của {sellerName || "ngư dân"}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
