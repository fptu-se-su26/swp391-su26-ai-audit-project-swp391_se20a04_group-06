import {
  Edit3,
  Eye,
  Lock,
  PackageOpen,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiLandingBatches } from "../../services/api";
import { useConfirm } from "../../context/ConfirmContext";
import {
  formatLandingDateTime,

  getLandingBatchId,
  getLandingBatchStatus,
} from "../../utils/landingBatch";

export default function SellerLandingBatches() {
  const { confirm, alert } = useConfirm();
  const location = useLocation();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiLandingBatches.getMine({ limit: 100 });
      setBatches(Array.isArray(result) ? result : result?.data || []);
    } catch (error) {
      setNotice(`Lỗi tải dữ liệu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeBatch = async (batch) => {
    const id = getLandingBatchId(batch);
    const ok = await confirm({
      title: "Đóng vựa cá?",
      message: `Bạn có chắc muốn đóng vựa cá "${batch.title}"?`,
      confirmText: "Đóng vựa cá",
      variant: "warning"
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await apiLandingBatches.update(id, { status: "Closed" });
      setNotice("Đã đóng vựa cá.");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyId("");
    }
  };

  const removeBatch = async (batch) => {
    const id = getLandingBatchId(batch);
    const ok = await confirm({
      title: "Ẩn vựa cá?",
      message: `Bạn có chắc muốn ẩn vựa cá "${batch.title}"? Các sản phẩm liên quan sẽ không bị xóa.`,
      confirmText: "Ẩn vựa cá",
      variant: "danger"
    });
    if (!ok) return;
    setBusyId(id);
    try {
      await apiLandingBatches.delete(id);
      setNotice("Đã ẩn vựa cá. Các sản phẩm liên quan vẫn được giữ nguyên.");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusyId("");
    }
  };


  return (
    <div className="seller-landing-batches">
      <header className="page-heading page-heading--compact" data-tour="seller-batch-list-heading">
        <div>
          <span className="eyebrow">LANDING BATCH MANAGEMENT</span>
          <h1>Vựa cá của tôi</h1>
          <p>Quản lý các chuyến hàng mới cập bến và sản phẩm trong từng vựa.</p>
        </div>
        <Link className="button button--primary" data-tour="seller-batch-list-create" to="/seller/landing-batches/new">
          <Plus size={17} /> Tạo vựa cá
        </Link>
      </header>

      {notice && <p className="inline-notice">{notice}</p>}

      {loading ? (
        <div className="page-state">Đang tải danh sách vựa cá...</div>
      ) : batches.length === 0 ? (
        <section className="empty-state landing-batch-empty" data-tour="seller-batch-empty">
          <PackageOpen size={36} />
          <h2>Bạn chưa tạo phiên cập bến nào</h2>
          <p>Tạo vựa cá để gom nhiều loại hải sản vào cùng một chuyến hàng.</p>
          <Link className="button button--primary" to="/seller/landing-batches/new">
            <Plus size={16} /> Tạo vựa cá đầu tiên
          </Link>
        </section>
      ) : (
        <section className="dashboard-panel" data-tour="seller-batch-table">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Vựa cá</th>
                  <th>Sản phẩm</th>
                  <th>Khối lượng</th>
                  <th>Cập bến</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const id = getLandingBatchId(batch);
                  const status = getLandingBatchStatus(batch.status);
                  return (
                    <tr key={id}>
                      <td>
                        <strong>{batch.title}</strong>
                        <small className="table-secondary">{batch.boatName || batch.origin || "Chưa cập nhật nguồn gốc"}</small>
                      </td>
                      <td><PackageOpen size={14} /> {Number(batch.productCount || 0)} loại</td>
                      <td><Scale size={14} /> {Number(batch.remainingWeight || 0)} / {Number(batch.totalWeight || 0)} kg</td>
                      <td>{formatLandingDateTime(batch.landingTime || batch.createdAt)}</td>
                      <td><span className={`batch-status batch-status--${status.key}`}>{status.label}</span></td>
                      <td>
                        <div className="table-actions">
                          <Link aria-label="Xem chi tiết" to={`/landing-batches/${id}`}><Eye size={16} /></Link>
                          <Link aria-label="Sửa vựa cá" to={`/seller/landing-batches/${id}/edit`}><Edit3 size={16} /></Link>
                          {batch.status === "Active" && (
                            <button aria-label="Đóng vựa" disabled={busyId === id} onClick={() => closeBatch(batch)} type="button"><Lock size={16} /></button>
                          )}
                          <button aria-label="Ẩn vựa cá" className="is-danger" disabled={busyId === id} onClick={() => removeBatch(batch)} type="button"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
