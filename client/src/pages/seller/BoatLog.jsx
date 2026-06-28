import { useEffect, useMemo, useState } from "react";
import { Anchor, CalendarDays, Link2, MapPin, Plus, Ship, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiBoatLogs, apiProducts } from "../../services/api";
import { formatDate, getProductId } from "../../utils/product";

export default function BoatLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const userId = user.id || user._id;
    Promise.allSettled([
      apiBoatLogs.getAll({ userId }),
      apiProducts.getAll({ sellerId: userId }),
    ]).then(([logResult, productResult]) => {
      if (logResult.status === "fulfilled") {
        setLogs(logResult.value?.boatLogs || []);
      }
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.products || []);
      }
    });
  }, [user]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [String(getProductId(product)), product])),
    [products],
  );

  const createLog = async (event) => {
    event.preventDefault();
    try {
      const result = await apiBoatLogs.create({
        content: content.trim(),
        images: imageUrls.split("\n").map((value) => value.trim()).filter(Boolean),
      });
      const created = result.boatLog || result;
      if (created) setLogs((current) => [created, ...current]);
      setContent("");
      setImageUrls("");
      setFormOpen(false);
    } catch (error) {
      window.alert(`Không thể đăng Boat Log: ${error.message}`);
    }
  };

  const deleteLog = async (log) => {
    const id = log.id || log._id;
    if (!window.confirm("Xóa nhật ký này?")) return;
    try {
      await apiBoatLogs.delete(id);
      setLogs((current) => current.filter((item) => (item.id || item._id) !== id));
    } catch (error) {
      window.alert(`Không thể xóa Boat Log: ${error.message}`);
    }
  };

  return (
    <div className="workspace-page boat-log-page">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">TRACEABLE SEAFOOD</span>
          <h1>Boat Log</h1>
          <p>Nhật ký chuyến biển và nguồn gốc của các mẻ hải sản.</p>
        </div>
        <button className="button button--primary" onClick={() => setFormOpen((open) => !open)} type="button">
          <Plus size={17} /> Thêm nhật ký
        </button>
      </header>

      <p className="inline-notice inline-notice--warning">
        API Boat Log hiện chỉ lưu nội dung và hình ảnh. Các trường liên kết sản phẩm, tàu,
        khu vực đánh bắt và giờ cập bến sẽ hiển thị khi backend cung cấp dữ liệu tương ứng.
      </p>

      {formOpen && (
        <form className="dashboard-panel boat-log-form" onSubmit={createLog}>
          <label className="form-field">
            <span>Nội dung nhật ký</span>
            <textarea onChange={(event) => setContent(event.target.value)} required rows="4" value={content} />
          </label>
          <label className="form-field">
            <span>URL ảnh (mỗi dòng một ảnh)</span>
            <textarea onChange={(event) => setImageUrls(event.target.value)} rows="2" value={imageUrls} />
          </label>
          <div className="form-actions">
            <button className="button button--ghost" onClick={() => setFormOpen(false)} type="button">Hủy</button>
            <button className="button button--primary" type="submit">Đăng nhật ký</button>
          </div>
        </form>
      )}

      <div className="boat-log-grid">
        {logs.map((log) => {
          const product = productsById.get(String(log.productId || ""));
          return (
            <article className="boat-log-card" key={log.id || log._id}>
              {log.images?.[0] && <img src={log.images[0]} alt="" />}
              <div className="boat-log-card__body">
                <header>
                  <span className="boat-log-card__avatar">{(log.userName || "ND").slice(0, 2).toUpperCase()}</span>
                  <div><strong>{log.userName || user?.name}</strong><small>{formatDate(log.createdAt)}</small></div>
                  <button aria-label="Xóa nhật ký" onClick={() => deleteLog(log)} type="button"><Trash2 size={16} /></button>
                </header>
                <p>{log.content}</p>
                <dl>
                  <div><CalendarDays /><dt>Ngày đánh bắt</dt><dd>{formatDate(log.catchTime || product?.catchTime)}</dd></div>
                  <div><MapPin /><dt>Khu vực đánh bắt</dt><dd>{log.catchArea || product?.origin || "Chưa cập nhật"}</dd></div>
                  <div><Ship /><dt>Tên tàu</dt><dd>{log.boatName || user?.boatName || "Chưa cập nhật"}</dd></div>
                  <div><Anchor /><dt>Thời gian cập bến</dt><dd>{log.landingTime ? formatDate(log.landingTime) : "Chưa cập nhật"}</dd></div>
                  <div><Link2 /><dt>Nguồn gốc</dt><dd>{log.origin || product?.origin || "Chưa cập nhật"}</dd></div>
                </dl>
                {product ? (
                  <Link to={`/product/${getProductId(product)}`}>Xem sản phẩm liên kết: {product.name}</Link>
                ) : (
                  <span className="boat-log-card__unlinked">Chưa có sản phẩm liên kết</span>
                )}
              </div>
            </article>
          );
        })}
        {logs.length === 0 && <div className="empty-state">Chưa có nhật ký chuyến biển.</div>}
      </div>
    </div>
  );
}
