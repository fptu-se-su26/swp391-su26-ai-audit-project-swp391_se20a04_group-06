import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUploader from "../../components/shared/ImageUploader";
import LocationPicker from "../../components/shared/LocationPicker";
import DateTimePicker, { formatDateTimeForInput } from "../../components/shared/DateTimePicker";
import { apiLandingBatches } from "../../services/api";
import LivePreviewShell from "../../components/preview/LivePreviewShell";
import LandingBatchLivePreview from "../../components/preview/LandingBatchLivePreview";


const categories = [
  ["Fish", "Cá"],
  ["Shrimp", "Tôm"],
  ["Squid", "Mực"],
  ["Crab", "Cua, ghẹ"],
  ["Shellfish", "Nhuyễn thể"],
  ["Others", "Khác"],
];

const emptyBatch = {
  title: "",
  description: "",
  boatName: "",
  catchArea: "",
  catchTime: "",
  landingTime: "",
  origin: "",
  lat: "",
  lng: "",
  images: [],
  status: "Active",
};

const emptyProduct = () => ({
  rowId: crypto.randomUUID(),
  name: "",
  category: "Fish",
  type: "Fresh",
  price: "",
  totalWeight: "",
  remainingWeight: "",
  description: "",
  images: [],
});

function toLocalDateTime(value) {
  // Sử dụng formatDateTimeForInput từ DateTimePicker (timezone-aware)
  return formatDateTimeForInput(value);
}


function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

async function uploadFiles(items) {
  const files = items.filter((item) => item instanceof File);
  const savedUrls = items.filter((item) => typeof item === "string");
  if (files.length === 0) return savedUrls;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const result = await apiLandingBatches.uploadImages(formData);
  return [...savedUrls, ...(result?.urls || [])];
}

export default function LandingBatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [step, setStep] = useState(1);
  const [batch, setBatch] = useState(emptyBatch);
  const [products, setProducts] = useState(() => (editing ? [] : [emptyProduct()]));
  const [existingProducts, setExistingProducts] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!id) return;
    apiLandingBatches
      .getById(id)
      .then((data) => {
        setBatch({
          ...emptyBatch,
          title: data.title || "",
          description: data.description || "",
          boatName: data.boatName || "",
          catchArea: data.catchArea || "",
          catchTime: toLocalDateTime(data.catchTime),
          landingTime: toLocalDateTime(data.landingTime),
          origin: data.origin || "",
          lat: data.lat ?? "",
          lng: data.lng ?? "",
          images: data.images || [],
          status: data.status || "Active",
        });
        setExistingProducts(data.products || []);
      })
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleTourStep = (event) => {
      const requestedStep = Number(event.detail?.step);
      if (requestedStep === 1 || requestedStep === 2) {
        setStep(requestedStep);
      }
    };
    window.addEventListener("haisan:tour-show-batch-step", handleTourStep);
    return () =>
      window.removeEventListener(
        "haisan:tour-show-batch-step",
        handleTourStep,
      );
  }, []);

  const hasFreshProduct = useMemo(
    () => products.some((product) => product.name.trim() && product.type === "Fresh"),
    [products],
  );

  const updateBatch = (field, value) =>
    setBatch((current) => ({ ...current, [field]: value }));

  const updateProduct = (rowId, field, value) =>
    setProducts((current) =>
      current.map((product) =>
        product.rowId === rowId ? { ...product, [field]: value } : product,
      ),
    );

  const validateBatch = () => {
    if (batch.title.trim().length < 2) {
      throw new Error("Vui lòng nhập tên vựa cá.");
    }
    if (hasFreshProduct && (batch.lat === "" || batch.lng === "")) {
      throw new Error("Vựa có hải sản tươi cần vị trí GPS.");
    }
  };

  const validateProducts = () => {
    const filledRows = products.filter((product) => product.name.trim());
    for (const product of filledRows) {
      if (Number(product.price) <= 0) {
        throw new Error(`Giá của "${product.name}" phải lớn hơn 0.`);
      }
      if (Number(product.totalWeight) <= 0) {
        throw new Error(`Tổng kg của "${product.name}" phải lớn hơn 0.`);
      }
      const remaining = product.remainingWeight === ""
        ? Number(product.totalWeight)
        : Number(product.remainingWeight);
      if (remaining < 0 || remaining > Number(product.totalWeight)) {
        throw new Error(`Khối lượng còn lại của "${product.name}" không hợp lệ.`);
      }
    }
    return filledRows;
  };

  const save = async (event) => {
    event.preventDefault();
    setNotice("");
    setSaving(true);
    try {
      validateBatch();
      const filledRows = validateProducts();
      const batchImages = await uploadFiles(batch.images);
      const payload = {
        title: batch.title.trim(),
        description: batch.description.trim() || null,
        boatName: batch.boatName.trim() || null,
        catchArea: batch.catchArea.trim() || null,
        catchTime: toIso(batch.catchTime),
        landingTime: toIso(batch.landingTime),
        origin: batch.origin.trim() || null,
        lat: batch.lat === "" ? undefined : Number(batch.lat),
        lng: batch.lng === "" ? undefined : Number(batch.lng),
        images: batchImages,
        status: batch.status,
      };

      let batchId = id;
      if (editing) {
        await apiLandingBatches.update(id, payload);
      } else {
        const created = await apiLandingBatches.create(payload);
        batchId = created?.id;
        if (!batchId) throw new Error("Máy chủ không trả về mã vựa cá.");
      }

      if (filledRows.length > 0) {
        const productPayloads = await Promise.all(
          filledRows.map(async (product) => ({
            name: product.name.trim(),
            category: product.category,
            type: product.type,
            price: Number(product.price),
            totalWeight: Number(product.totalWeight),
            remainingWeight:
              product.remainingWeight === ""
                ? Number(product.totalWeight)
                : Number(product.remainingWeight),
            salesType: "Retail",
            description: product.description.trim() || null,
            images: await uploadFiles(product.images),
          })),
        );
        await apiLandingBatches.addProducts(batchId, productPayloads);
      }

      navigate("/seller/landing-batches", {
        replace: true,
        state: {
          notice: editing
            ? "Cập nhật vựa cá thành công."
            : "Tạo vựa cá thành công.",
        },
      });
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-state">Đang tải thông tin vựa cá...</div>;

  return (
    <div className="landing-batch-form-page">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">LANDING BATCH</span>
          <h1>{editing ? "Chỉnh sửa vựa cá" : "Tạo vựa cá"}</h1>
          <p>Gom nhiều loại hải sản thật trong cùng một phiên cập bến.</p>
        </div>
        <button
          className="back-button"
          onClick={() => navigate("/seller/landing-batches")}
          type="button"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </header>

      <div className="landing-batch-steps" aria-label="Các bước tạo vựa cá" data-tour="batch-form-steps">
        <button className={step === 1 ? "is-active" : ""} onClick={() => setStep(1)} type="button">
          <span>1</span> Thông tin chung
        </button>
        <button className={step === 2 ? "is-active" : ""} onClick={() => setStep(2)} type="button">
          <span>2</span> Các loại hải sản
        </button>
      </div>

      {notice && <p className="inline-notice inline-notice--warning">{notice}</p>}

      <div className="split-view-container">
        <form className="dashboard-panel landing-batch-form split-view-container__form" onSubmit={save}>
          {step === 1 ? (
            <div className="form-grid" data-tour="batch-form-general">
              <label className="form-field form-field--wide">
                <span>Tên vựa cá / phiên cập bến *</span>
                <input
                  maxLength="160"
                  onChange={(event) => updateBatch("title", event.target.value)}
                  required
                  value={batch.title}
                />
              </label>
              <label className="form-field">
                <span>Tên tàu</span>
                <input onChange={(event) => updateBatch("boatName", event.target.value)} value={batch.boatName} />
              </label>
              <label className="form-field">
                <span>Khu vực đánh bắt</span>
                <input onChange={(event) => updateBatch("catchArea", event.target.value)} value={batch.catchArea} />
              </label>
              <DateTimePicker
                id="batch-catchTime"
                label="Thời gian đánh bắt"
                value={batch.catchTime}
                onChange={(value) => updateBatch("catchTime", value)}
              />

              <DateTimePicker
                id="batch-landingTime"
                label="Thời gian cập bến"
                value={batch.landingTime}
                onChange={(value) => updateBatch("landingTime", value)}
              />

              <label className="form-field form-field--wide">
                <span>Nguồn gốc</span>
                <input onChange={(event) => updateBatch("origin", event.target.value)} value={batch.origin} />
              </label>
              {editing && (
                <label className="form-field">
                  <span>Trạng thái</span>
                  <select onChange={(event) => updateBatch("status", event.target.value)} value={batch.status}>
                    <option value="Active">Đang bán</option>
                    <option value="Closed">Đã đóng</option>
                  </select>
                </label>
              )}
              <label className="form-field form-field--wide">
                <span>Mô tả</span>
                <textarea onChange={(event) => updateBatch("description", event.target.value)} rows="4" value={batch.description} />
              </label>
              <div className="form-field form-field--wide" data-tour="batch-form-images">
                <span>Ảnh chung của vựa cá</span>
                <ImageUploader
                  files={batch.images}
                  maxFiles={5}
                  onChange={(images) => updateBatch("images", images)}
                />
              </div>
              <div className="form-field form-field--wide" data-tour="batch-form-location">
                <span>Vị trí GPS / địa điểm bán</span>
                <LocationPicker
                  lat={batch.lat}
                  lng={batch.lng}
                  onChange={(lat, lng) =>
                    setBatch((current) => ({ ...current, lat, lng }))
                  }
                  required={hasFreshProduct}
                />
              </div>
            </div>
          ) : (
            <div className="landing-batch-products-editor" data-tour="batch-form-products">
              {existingProducts.length > 0 && (
                <section className="landing-batch-existing-products">
                  <h2>Sản phẩm hiện có ({existingProducts.length})</h2>
                  <p>Sản phẩm cũ vẫn được quản lý tại trang Quản lý sản phẩm.</p>
                  <div>
                    {existingProducts.map((product) => (
                      <span key={product.id || product._id}>{product.name}</span>
                    ))}
                  </div>
                </section>
              )}

              <header>
                <div>
                  <h2>{editing ? "Thêm sản phẩm mới vào vựa" : "Các loại hải sản"}</h2>
                  <p>Chỉ các dòng có tên mới được tạo thành sản phẩm thật.</p>
                </div>
                <button
                  className="button button--secondary"
                  data-tour="batch-form-add-product"
                  onClick={() => setProducts((current) => [...current, emptyProduct()])}
                  type="button"
                >
                  <Plus size={16} /> Thêm loại hải sản
                </button>
              </header>

              {products.map((product, index) => (
                <article className="landing-batch-product-row" key={product.rowId}>
                  <header>
                    <strong>Loại hải sản {index + 1}</strong>
                    <button
                      aria-label="Xóa dòng sản phẩm"
                      onClick={() =>
                        setProducts((current) =>
                          current.filter((item) => item.rowId !== product.rowId),
                        )
                      }
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </header>
                  <div className="form-grid">
                    <label className="form-field form-field--wide">
                      <span>Tên hải sản</span>
                      <input onChange={(event) => updateProduct(product.rowId, "name", event.target.value)} value={product.name} />
                    </label>
                    <label className="form-field">
                      <span>Danh mục</span>
                      <select onChange={(event) => updateProduct(product.rowId, "category", event.target.value)} value={product.category}>
                        {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Loại</span>
                      <select onChange={(event) => updateProduct(product.rowId, "type", event.target.value)} value={product.type}>
                        <option value="Fresh">Tươi sống</option>
                        <option value="Dried">Đồ khô</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Giá/kg</span>
                      <input min="0" onChange={(event) => updateProduct(product.rowId, "price", event.target.value)} type="number" value={product.price} />
                    </label>
                    <label className="form-field">
                      <span>Tổng kg</span>
                      <input min="0" onChange={(event) => updateProduct(product.rowId, "totalWeight", event.target.value)} type="number" value={product.totalWeight} />
                    </label>
                    <label className="form-field">
                      <span>Còn lại kg</span>
                      <input min="0" onChange={(event) => updateProduct(product.rowId, "remainingWeight", event.target.value)} placeholder="Mặc định bằng tổng kg" type="number" value={product.remainingWeight} />
                    </label>
                    <label className="form-field form-field--wide">
                      <span>Mô tả ngắn</span>
                      <textarea onChange={(event) => updateProduct(product.rowId, "description", event.target.value)} rows="2" value={product.description} />
                    </label>
                    <div className="form-field form-field--wide">
                      <span>Ảnh sản phẩm</span>
                      <ImageUploader
                        files={product.images}
                        maxFiles={5}
                        onChange={(images) => updateProduct(product.rowId, "images", images)}
                      />
                    </div>
                  </div>
                </article>
              ))}

              {products.length === 0 && (
                <div className="empty-state">Chưa có dòng sản phẩm mới.</div>
              )}
            </div>
          )}

          <footer className="form-actions landing-batch-form__actions">
            {step === 2 && (
              <button className="button button--ghost" onClick={() => setStep(1)} type="button">
                Quay lại bước 1
              </button>
            )}
            {step === 1 ? (
              <button className="button button--primary" onClick={() => {
                try {
                  validateBatch();
                  setNotice("");
                  setStep(2);
                } catch (error) {
                  setNotice(error.message);
                }
              }} type="button">
                Tiếp tục
              </button>
            ) : (
              <button className="button button--primary" data-tour="batch-form-save" disabled={saving} type="submit">
                <Save size={16} /> {saving ? "Đang lưu..." : "Lưu vựa cá"}
              </button>
            )}
          </footer>
        </form>

        <div className="split-view-container__preview-column">
          <LivePreviewShell title="Xem trước vựa cá" subtext="Giao diện mô phỏng khi đăng vựa" badge="XEM TRƯỚC">
            <LandingBatchLivePreview batch={batch} products={products} />
          </LivePreviewShell>
        </div>
      </div>
    </div>
  );
}
