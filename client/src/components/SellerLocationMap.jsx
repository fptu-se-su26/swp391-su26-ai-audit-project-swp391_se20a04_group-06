import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

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
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>Vị trí bán hàng của {sellerName || "ngư dân"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
