import { X } from "lucide-react";
import ImageUploader from "../shared/ImageUploader";
import LocationPicker from "../shared/LocationPicker";
import DateTimePicker from "../shared/DateTimePicker";
import { useEffect } from "react";


const categories = [
  ["Fish", "Cá"],
  ["Shrimp", "Tôm"],
  ["Squid", "Mực"],
  ["Crab", "Cua, ghẹ"],
  ["Shellfish", "Nhuyễn thể"],
  ["Others", "Khác"],
];

export default function ProductForm({ form, onCancel, onChange, onSubmit, saving }) {
  const update = (field) => (event) => onChange(field, event.target.value);

  useEffect(() => {
    if (!form.id && !form.lat && !form.lng) {
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          onChange("lat", String(coords.latitude.toFixed(6)));
          onChange("lng", String(coords.longitude.toFixed(6)));
        },
        (error) => {
          console.warn("Autofill product GPS location failed:", error);
        }
      );
    }
  }, [form.id]);

  return (
    <form className="product-form dashboard-panel" onSubmit={onSubmit}>
      <header>
        <div>
          <h2>{form.id ? "Chỉnh sửa sản phẩm" : "Đăng mẻ hải sản"}</h2>
          <p>Thông tin nguồn gốc và thời gian đánh bắt giúp người mua ra quyết định.</p>
        </div>
        <button aria-label="Đóng form" className="icon-button" onClick={onCancel} type="button">
          <X size={18} />
        </button>
      </header>

      <div className="form-grid">
        <label className="form-field form-field--wide">
          <span>Tên sản phẩm</span>
          <input onChange={update("name")} required value={form.name} />
        </label>
        <label className="form-field">
          <span>Danh mục</span>
          <select onChange={update("category")} value={form.category}>
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Loại</span>
          <select onChange={update("type")} value={form.type}>
            <option value="Fresh">Tươi sống</option>
            <option value="Dried">Đồ khô</option>
          </select>
        </label>
        <label className="form-field">
          <span>Giá (VND/kg)</span>
          <input min="0" onChange={update("price")} required type="number" value={form.price} />
        </label>
        <label className="form-field">
          <span>Hình thức bán</span>
          <select onChange={update("salesType")} value={form.salesType}>
            <option value="Retail">Bán lẻ</option>
            <option value="Wholesale">Bán sỉ thương lượng</option>
          </select>
        </label>
        <label className="form-field">
          <span>Tổng khối lượng (kg)</span>
          <input min="0" onChange={update("totalWeight")} required type="number" value={form.totalWeight} />
        </label>
        <label className="form-field">
          <span>Khối lượng còn lại (kg)</span>
          <input min="0" onChange={update("remainingWeight")} type="number" value={form.remainingWeight} />
        </label>
        <label className="form-field">
          <span>Nguồn gốc</span>
          <input onChange={update("origin")} required value={form.origin} />
        </label>
        <DateTimePicker
          id="product-catchTime"
          label="Ngày đánh bắt"
          value={form.catchTime}
          onChange={(value) => onChange("catchTime", value)}
        />

        <label className="form-field">
          <span>Hạn sử dụng</span>
          <input
            onChange={update("expiryDate")}
            type="date"
            value={form.expiryDate}
            style={{ colorScheme: "dark" }}
          />
        </label>

        <div className="form-field form-field--wide">
          <span>Kích thước hải sản</span>
          <div className="segmented-control">
            <button
              className={`segmented-button ${form.productSize === "LARGE" ? "is-active" : ""}`}
              onClick={() => onChange("productSize", "LARGE")}
              type="button"
            >
              To
            </button>
            <button
              className={`segmented-button ${(!form.productSize || form.productSize === "MEDIUM") ? "is-active" : ""}`}
              onClick={() => onChange("productSize", "MEDIUM")}
              type="button"
            >
              Trung bình
            </button>
            <button
              className={`segmented-button ${form.productSize === "SMALL" ? "is-active" : ""}`}
              onClick={() => onChange("productSize", "SMALL")}
              type="button"
            >
              Nhỏ
            </button>
          </div>
        </div>


        {/* ── Hình ảnh sản phẩm (cả cũ và mới) ── */}
        <div className="form-field form-field--wide">
          <span>Hình ảnh sản phẩm</span>
          <ImageUploader
            files={[...(form.images || []), ...(form.imageFiles || [])]}
            maxFiles={5}
            onChange={(nextFiles) => {
              const existingImages = nextFiles.filter((item) => typeof item === "string");
              const newFiles = nextFiles.filter((item) => item instanceof File);
              onChange("images", existingImages);
              onChange("imageFiles", newFiles);
            }}
          />
        </div>

        {/* ── Vị trí bản đồ Leaflet ── */}
        <div className="form-field form-field--wide">
          <span>Vị trí người bán {form.type === "Fresh" && "(bắt buộc)"}</span>
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            onChange={(lat, lng) => { onChange("lat", lat); onChange("lng", lng); }}
            required={form.type === "Fresh"}
          />
        </div>

        <label className="form-field form-field--wide">
          <span>Mô tả</span>
          <textarea onChange={update("description")} rows="4" value={form.description} />
        </label>
      </div>

      <footer className="form-actions">
        <button className="button button--ghost" onClick={onCancel} type="button">Hủy</button>
        <button className="button button--primary" disabled={saving} type="submit">
          {saving ? "Đang lưu..." : "Lưu sản phẩm"}
        </button>
      </footer>
    </form>
  );
}
