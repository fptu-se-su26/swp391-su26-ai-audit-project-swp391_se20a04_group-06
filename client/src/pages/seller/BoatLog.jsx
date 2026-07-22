import { useEffect, useMemo, useState } from "react";
import {
  Anchor,
  Archive,
  ArchiveRestore,
  CalendarDays,
  Eye,
  EyeOff,
  Edit3,
  Link2,
  Loader,
  MapPin,
  PackageOpen,
  Plus,
  Ship,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiBoatLogs, apiProducts } from "../../services/api";
import { formatDate, getProductId } from "../../utils/product";
import ImageUploader from "../../components/shared/ImageUploader";
import DateTimePicker, { formatDateTimeForInput } from "../../components/shared/DateTimePicker";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import IconActionButton from "../../components/common/IconActionButton";




const archivedLogStorageKey = "haisan-archived-boat-logs";

function getArchivedLogIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(archivedLogStorageKey) || "[]"));
  } catch {
    return new Set();
  }
}

export default function BoatLog({ readOnly = false }) {
  const { confirm } = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  const [products, setProducts] = useState([]);
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState([]);   // File[]
  const [existingImages, setExistingImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [boatName, setBoatName] = useState("");
  const [catchArea, setCatchArea] = useState("");
  const [landingTime, setLandingTime] = useState("");
  const [origin, setOrigin] = useState("");
  const [busyBatchId, setBusyBatchId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedIds, setArchivedIds] = useState(getArchivedLogIds);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user && !readOnly) return;
    const userId = user.id || user._id;
    const logRequest = readOnly
      ? apiBoatLogs.getAll({ limit: 50 })
      : apiBoatLogs.getAll({ userId });
    const productRequest = readOnly
      ? apiProducts.getAll({ limit: 100 })
      : apiProducts.getMine();
    Promise.allSettled([
      logRequest,
      productRequest,
    ]).then(([logResult, productResult]) => {
      if (logResult.status === "fulfilled") {
        setLogs(logResult.value?.boatLogs || []);
      }
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.data || data?.products || []);
      }
    });
  }, [readOnly, user]);

  const refreshLogs = async () => {
    if (!user) return;
    const response = await apiBoatLogs.getAll({ userId: user.id || user._id });
    setLogs(response?.boatLogs || []);
  };

  const closeForm = () => {
    setContent("");
    setImageFiles([]);
    setExistingImages([]);
    setEditingId(null);
    setBoatName("");
    setCatchArea("");
    setLandingTime("");
    setOrigin("");
    setFormOpen(false);
  };

  const startCreate = () => {
    setContent("");
    setImageFiles([]);
    setExistingImages([]);
    setEditingId(null);
    setBoatName("");
    setCatchArea("");
    setLandingTime("");
    setOrigin("");
    setFormOpen(true);
  };

  const startEdit = (log) => {
    setContent(log.content || "");
    setImageFiles([]);
    setExistingImages(log.images || []);
    setEditingId(log.id || log._id);
    setBoatName(log.boatName || "");
    setCatchArea(log.catchArea || "");
    setLandingTime(log.landingTime ? formatDateTimeForInput(log.landingTime) : "");

    setOrigin(log.origin || "");
    setFormOpen(true);
  };

  const productsById = useMemo(
    () => new Map(products.map((product) => [String(getProductId(product)), product])),
    [products],
  );
  const visibleLogs = useMemo(
    () => {
      if (readOnly) return logs;
      return logs.filter((log) => {
        const isArchived = archivedIds.has(String(log.id || log._id));
        return showArchived ? isArchived : !isArchived;
      });
    },
    [archivedIds, logs, readOnly, showArchived],
  );

  const saveLog = async (event) => {
    event.preventDefault();
    setSaving(true);
    const toastId = toast.loading(editingId ? "Đang cập nhật nhật ký..." : "Đang đăng nhật ký...");
    try {
      if (content.trim().length === 0) {
        toast.update(toastId, "Nội dung nhật ký cabin không được để trống.", "error");
        setSaving(false);
        return;
      }
      if (content.trim().length > 5000) {
        toast.update(toastId, "Nội dung nhật ký cabin không được vượt quá 5000 ký tự.", "error");
        setSaving(false);
        return;
      }
      if (landingTime && new Date(landingTime) > new Date()) {
        toast.update(toastId, "Thời gian cập bến không thể ở tương lai.", "error");
        setSaving(false);
        return;
      }

      let images = [...existingImages];
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append("images", file));
        const uploadResult = await apiBoatLogs.uploadImages(formData);
        images = [...images, ...(uploadResult?.urls || [])];
      }

      if (images.length > 10) {
        toast.update(toastId, "Chỉ được đăng tối đa 10 hình ảnh cho mỗi nhật ký.", "error");
        setSaving(false);
        return;
      }

      const payload = {
        content: content.trim(),
        images,
        boatName: boatName.trim() || undefined,
        catchArea: catchArea.trim() || undefined,
        landingTime: landingTime ? new Date(landingTime).toISOString() : null,
        origin: origin.trim() || undefined,
      };
      if (editingId) await apiBoatLogs.update(editingId, payload);
      else await apiBoatLogs.create(payload);

      await refreshLogs();
      closeForm();
      toast.update(toastId, editingId ? "Cập nhật nhật ký thành công!" : "Đăng nhật ký thành công!", "success");
    } catch (error) {
      toast.update(toastId, error.message || "Không thể lưu nhật ký.", "error");
    } finally {
      setSaving(false);
    }
  };

  const createLandingBatch = async (log) => {
    const logId = String(log.id || log._id);
    setBusyBatchId(logId);
    const toastId = toast.loading("Đang tạo vựa cá từ nhật ký...");
    try {
      const result = await apiBoatLogs.createLandingBatch(logId);
      await refreshLogs();
      toast.update(toastId, "Tạo vựa cá thành công!", "success");
      navigate(`/seller/landing-batches/${result.id}/edit`);
    } catch (error) {
      toast.update(toastId, error.message || "Không thể tạo vựa cá.", "error");
    } finally {
      setBusyBatchId("");
    }
  };

  const deleteLog = async (log) => {
    const id = String(log.id || log._id);
    const ok = await confirm({
      title: "Xóa nhật ký cabin?",
      message: "Bạn có chắc muốn xóa nhật ký cabin này? Thao tác này không thể hoàn tác.",
      confirmText: "Xóa nhật ký",
      variant: "danger"
    });
    if (!ok) return;
    setDeletingId(id);
    try {
      await apiBoatLogs.delete(id);
      setArchivedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        localStorage.setItem(archivedLogStorageKey, JSON.stringify([...next]));
        return next;
      });
      await refreshLogs();
      toast.success("Đã xóa nhật ký thành công.");
    } catch (error) {
      toast.error(error.message || "Không thể xóa nhật ký.");
    } finally {
      setDeletingId(null);
    }
  };



  const toggleArchive = (log) => {
    const id = String(log.id || log._id);
    setArchivedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(archivedLogStorageKey, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className={`workspace-page boat-log-page${readOnly ? " boat-log-page--readonly" : ""}`}>
      <header className="page-heading page-heading--compact" data-tour="boat-log-heading">
        <div>
          <span className="eyebrow">NHẬT KÝ TRUY XUẤT</span>
          <h1>Nhật ký biển</h1>
          <p>
            {readOnly
              ? "Theo dõi nhật ký chuyến biển và nguồn gốc hải sản từ cộng đồng ngư dân."
              : "Nhật ký chuyến biển và nguồn gốc của các mẻ hải sản."}
          </p>
        </div>
        {!readOnly && (
          <div className="page-heading__actions">
            <button className="button button--secondary" onClick={() => setShowArchived((current) => !current)} type="button">
              {showArchived ? <Eye size={17} /> : <EyeOff size={17} />}
              {showArchived ? "Nhật ký đang hiển thị" : `Đã lưu trữ (${archivedIds.size})`}
            </button>
            <button className="button button--primary" data-tour="boat-log-create" onClick={formOpen ? closeForm : startCreate} type="button">
              <Plus size={17} /> Thêm nhật ký
            </button>
          </div>
        )}
      </header>

      {!readOnly && formOpen && (
        <form className="boat-log-form" onSubmit={saveLog}>

          {/* ── CỘT TRÁI: Nội dung + Ảnh ── */}
          <div className="bl-form__left">
            <label className="form-field bl-form__content-field">
              <span>Nội dung nhật ký <span className="bl-form__required">*</span></span>
              <textarea
                maxLength="5000"
                onChange={(event) => setContent(event.target.value)}
                placeholder="Hôm nay tàu cập bến lúc..., đánh bắt tại..., hải sản gồm..."
                required
                rows="8"
                value={content}
              />
            </label>

            <div className="form-field bl-form__images-field">
              <span>Hình ảnh chuyến biển</span>
              {existingImages.length > 0 && (
                <div className="boat-log-existing-images">
                  {existingImages.map((url) => (
                    <figure key={url}>
                      <img alt="" src={url} />
                      <button
                        aria-label="Bỏ ảnh khỏi nhật ký"
                        onClick={() => setExistingImages((current) => current.filter((item) => item !== url))}
                        type="button"
                      >
                        ×
                      </button>
                    </figure>
                  ))}
                </div>
              )}
              <ImageUploader files={imageFiles} maxFiles={4} onChange={setImageFiles} />
            </div>
          </div>

          {/* ── CỘT PHẢI: Thông tin chuyến đi + Nút ── */}
          <div className="bl-form__right">
            <div className="bl-form__trip-card">
              <h3 className="bl-form__trip-title">
                <Anchor size={16} /> Thông tin chuyến đi
              </h3>

              <label className="form-field">
                <span>Tên tàu</span>
                <input
                  onChange={(event) => setBoatName(event.target.value)}
                  placeholder="VD: Tàu Hải Long 01"
                  value={boatName}
                />
              </label>

              <label className="form-field">
                <span>Khu vực đánh bắt</span>
                <input
                  onChange={(event) => setCatchArea(event.target.value)}
                  placeholder="VD: Vịnh Bắc Bộ, Trường Sa..."
                  value={catchArea}
                />
              </label>

              <DateTimePicker
                id="boatlog-landingTime"
                label="Thời gian cập bến"
                value={landingTime}
                onChange={setLandingTime}
              />

              <label className="form-field">
                <span>Nguồn gốc / Cảng cá</span>
                <input
                  onChange={(event) => setOrigin(event.target.value)}
                  placeholder="VD: Cảng cá Thọ Quang, Đà Nẵng"
                  value={origin}
                />
              </label>

              <p className="bl-form__hint">
                Thông tin chuyến đi giúp người mua truy xuất nguồn gốc hải sản dễ dàng hơn.
              </p>
            </div>

            {/* Nút hành động */}
            <div className="bl-form__actions">
              <button
                className="button button--ghost"
                onClick={closeForm}
                type="button"
              >
                Hủy
              </button>
              <button
                className="button button--primary bl-form__submit"
                disabled={saving}
                type="submit"
              >
                {saving ? <><Loader size={15} className="toast-spinner" /> Đang xử lý...</> : (editingId ? "Cập nhật nhật ký" : "Đăng nhật ký")}
              </button>
            </div>
          </div>

        </form>
      )}




      <div className="boat-log-grid" data-tour="boat-log-grid">
        {visibleLogs.map((log) => {
          const product = productsById.get(String(log.productId || ""));
          const isArchived = archivedIds.has(String(log.id || log._id));
          return (
            <article className={`boat-log-card ${isArchived ? "is-archived" : ""}`} data-tour="boat-log-card" key={log.id || log._id}>
              {log.images?.[0] && <img src={log.images[0]} alt="" loading="lazy" />}
              <div className="boat-log-card__body">
                <header>
                  <span className="boat-log-card__avatar">{(log.userName || "ND").slice(0, 2).toUpperCase()}</span>
                  <div><strong>{log.userName || (readOnly ? "Ngư dân" : user?.name)}</strong><small>{formatDate(log.createdAt)}</small></div>
                  {!readOnly && (
                    <div className="action-button-group">
                      <IconActionButton
                        icon={<Edit3 />}
                        label="Chỉnh sửa"
                        variant="primary"
                        onClick={() => startEdit(log)}
                      />
                      <IconActionButton
                        icon={<Trash2 />}
                        label="Xóa"
                        variant="danger"
                        disabled={deletingId === String(log.id || log._id)}
                        onClick={() => deleteLog(log)}
                      />
                      <IconActionButton
                        icon={isArchived ? <ArchiveRestore /> : <Archive />}
                        label={isArchived ? "Khôi phục" : "Lưu trữ"}
                        variant="warning"
                        onClick={() => toggleArchive(log)}
                      />
                    </div>
                  )}
                </header>
                <p>{log.content}</p>
                <dl data-tour="boat-log-traceability">
                  <div><CalendarDays /><dt>Ngày đánh bắt</dt><dd>{formatDate(log.catchTime || product?.catchTime)}</dd></div>
                  <div><MapPin /><dt>Khu vực đánh bắt</dt><dd>{log.catchArea || "Chưa cập nhật"}</dd></div>
                  <div><Ship /><dt>Tên tàu</dt><dd>{log.boatName || (!readOnly && user?.boatName) || "Chưa cập nhật"}</dd></div>
                  <div><Anchor /><dt>Thời gian cập bến</dt><dd>{log.landingTime ? formatDate(log.landingTime) : "Chưa cập nhật"}</dd></div>
                  <div><Link2 /><dt>Nguồn gốc</dt><dd>{log.origin || "Chưa cập nhật"}</dd></div>
                </dl>
                <div className="boat-log-card__links" data-tour="boat-log-links">
                  {product && (
                    <Link to={`/product/${getProductId(product)}`}>Xem sản phẩm liên kết: {product.name}</Link>
                  )}
                  {log.batchId ? (
                    <Link to={`/landing-batches/${log.batchId}`}>Xem vựa cá liên quan</Link>
                  ) : !readOnly ? (
                    <button
                      className="button button--secondary"
                      disabled={busyBatchId === String(log.id || log._id)}
                      onClick={() => createLandingBatch(log)}
                      type="button"
                    >
                      <PackageOpen size={15} /> Tạo vựa cá từ nhật ký
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
        {visibleLogs.length === 0 && (
          <div className="empty-state" data-tour="boat-log-empty">
            {!readOnly && showArchived
              ? "Chưa có nhật ký được lưu trữ."
              : "Chưa có nhật ký chuyến biển."}
          </div>
        )}
      </div>
    </div>
  );
}
