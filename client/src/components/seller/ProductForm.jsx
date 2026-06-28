import { LocateFixed, X } from "lucide-react";

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

  const useLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        onChange("lat", String(coords.latitude));
        onChange("lng", String(coords.longitude));
      },
      () => window.alert("Không thể lấy vị trí. Vui lòng nhập tọa độ thủ công."),
    );
  };

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
        <label className="form-field">
          <span>Ngày đánh bắt</span>
          <input onChange={update("catchTime")} type="datetime-local" value={form.catchTime} />
        </label>
        <label className="form-field">
          <span>Hạn sử dụng</span>
          <input onChange={update("expiryDate")} type="date" value={form.expiryDate} />
        </label>
        <label className="form-field form-field--wide">
          <span>URL ảnh (mỗi dòng một ảnh)</span>
          <textarea onChange={update("images")} rows="2" value={form.images} />
        </label>
        <div className="form-field form-field--wide">
          <span>Vị trí người bán {form.type === "Fresh" && "(bắt buộc)"}</span>
          <div className="coordinate-fields">
            <input
              aria-label="Vĩ độ"
              onChange={update("lat")}
              placeholder="Vĩ độ"
              required={form.type === "Fresh"}
              type="number"
              value={form.lat}
            />
            <input
              aria-label="Kinh độ"
              onChange={update("lng")}
              placeholder="Kinh độ"
              required={form.type === "Fresh"}
              type="number"
              value={form.lng}
            />
            <button className="button button--secondary" onClick={useLocation} type="button">
              <LocateFixed size={16} /> Vị trí hiện tại
            </button>
          </div>
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
