import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp, Edit3, Plus, Power, Trash2 } from "lucide-react";
import { apiProducts, apiLandingBatches } from "../../services/api";
import { formatCurrency, getMarketplaceStatus, getProductId } from "../../utils/product";
import IconActionButton from "../common/IconActionButton";
import ProductForm from "./ProductForm";
import { formatDateTimeForInput, parseDateTimeForSubmit } from "../shared/DateTimePicker";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { getCategoryLabel, getProductSizeLabel } from "../../utils/labelMaps";



const emptyForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  totalWeight: "",
  remainingWeight: "",
  origin: "",
  type: "Fresh",
  category: "Fish",
  salesType: "Retail",
  catchTime: "",
  expiryDate: "",
  imageFiles: [],   // File[] — chọn từ máy
  images: [],       // string[] — URL ảnh đã lưu (khi edit)
  lat: "",
  lng: "",
  productSize: "MEDIUM",
  batchId: "",      // ID vựa cá liên kết
};


// catchTime → "yyyy-MM-ddTHH:mm" cho datetime-local input
function toDateTimeLocalInput(value) {
  return formatDateTimeForInput(value);
}

// expiryDate → "yyyy-MM-dd" cho input[type=date]
function toDateOnlyInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}


function productToForm(product) {
  const existingImages = (product.images || [])
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean);
  return {
    ...emptyForm,
    ...product,
    id: getProductId(product),
    catchTime: toDateTimeLocalInput(product.catchTime), // "yyyy-MM-ddTHH:mm"
    expiryDate: toDateOnlyInput(product.expiryDate),    // "yyyy-MM-dd"
    images: existingImages,
    imageFiles: [],
    lat: product.lat ?? "",
    lng: product.lng ?? "",
    productSize: product.productSize ?? "MEDIUM",
    batchId: product.batchId ?? "",
  };
}



export default function SellerProducts({ onUpdateProducts, products }) {
  const { confirm } = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [batches, setBatches] = useState([]);
  const location = useLocation();

  const fetchBatches = useCallback(() => {
    // Tải danh sách vựa cá của tôi để liên kết
    apiLandingBatches
      .getMine({ status: "Active" })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setBatches(list);
      })
      .catch((err) => console.error("Không thể tải vựa cá để liên kết:", err));
  }, []);

  useEffect(() => {
    fetchBatches();
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("action") === "new") {
      setForm(emptyForm);
    }
  }, [fetchBatches, location.search]);

  const bump = async (product) => {
    const id = getProductId(product);
    try {
      await apiProducts.bump(id);
      await refreshProducts();
      toast.success(`Đã đẩy sản phẩm "${product.name}" lên đầu trang!`);
    } catch (error) {
      toast.error(error.message || "Không thể đẩy bài. Vui lòng thử lại sau 24 giờ.");
    }
  };

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));


  const refreshProducts = async () => {
    if (typeof onUpdateProducts !== "function") return;
    const response = await apiProducts.getMine();
    const nextProducts = Array.isArray(response)
      ? response
      : response?.data || response?.products || [];
    onUpdateProducts(nextProducts);
  };

  const uploadProductImages = async (productId, files) => {
    if (!files?.length) return;
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    await apiProducts.uploadImages(productId, formData);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    let productId = form.id;
    let savedSuccessfully = false;

    try {
      // catchTime: giá trị từ datetime-local input → ISO string
      const catchTime = parseDateTimeForSubmit(form.catchTime);
      // expiryDate: giá trị từ date input "yyyy-MM-dd" → giữ nguyên, backend hiểu
      const expiryDate = form.expiryDate || null;

      const totalWeight = Number(form.totalWeight);
      const remainingWeight = (form.remainingWeight === "" || form.remainingWeight === null || form.remainingWeight === undefined)
        ? totalWeight
        : Number(form.remainingWeight);

      if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
        setSaving(false);
        toast.error("Giá sản phẩm phải lớn hơn 0.");
        return;
      }

      if (isNaN(totalWeight) || totalWeight <= 0) {
        setSaving(false);
        toast.error("Tổng khối lượng phải lớn hơn 0.");
        return;
      }

      if (remainingWeight < 0) {
        setSaving(false);
        toast.error("Khối lượng còn lại không thể nhỏ hơn 0.");
        return;
      }

      if (remainingWeight > totalWeight) {
        setSaving(false);
        toast.error("Khối lượng còn lại không thể lớn hơn tổng khối lượng hải sản.");
        return;
      }

      if (catchTime) {
        const catchDate = new Date(catchTime);
        if (catchDate > new Date()) {
          setSaving(false);
          toast.error("Thời gian đánh bắt không thể ở tương lai.");
          return;
        }
      }

      if (expiryDate) {
        const expDate = new Date(expiryDate);
        if (expDate <= new Date()) {
          setSaving(false);
          toast.error("Hạn sử dụng phải ở tương lai.");
          return;
        }
        if (catchTime) {
          const catchDate = new Date(catchTime);
          if (expDate <= catchDate) {
            setSaving(false);
            toast.error("Hạn sử dụng phải sau thời điểm đánh bắt.");
            return;
          }
        }
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        totalWeight,
        remainingWeight,
        origin: form.origin.trim(),
        type: form.type,
        category: form.category,
        salesType: form.salesType,
        catchTime,
        expiryDate: expiryDate || undefined,
        images: form.images || [],
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
        status: form.status || "Active",
        productSize: form.productSize || "MEDIUM",
        batchId: form.batchId || undefined,
      };

      if (form.id) {
        await apiProducts.update(form.id, payload);
      } else {
        const created = await apiProducts.create(payload);
        productId = created?.productId || created?.product?.id || created?.product?._id;
        if (!productId) throw new Error("Máy chủ không trả về mã sản phẩm vừa tạo.");
      }
      savedSuccessfully = true;
    } catch (error) {
      setSaving(false);
      toast.error(error.message || "Không thể lưu sản phẩm.");
      return;
    }

    if (savedSuccessfully && productId) {
      try {
        if (form.imageFiles && form.imageFiles.length > 0) {
          await uploadProductImages(productId, form.imageFiles);
        }
        await refreshProducts();
        setForm(null);
        toast.success(form.id ? "Cập nhật sản phẩm thành công!" : "Đăng sản phẩm thành công!");
      } catch (uploadError) {
        console.error("Upload image error:", uploadError);
        await refreshProducts();
        toast.error("Sản phẩm đã lưu nhưng ảnh tải lên thất bại. Vui lòng thử tải ảnh lại.");
        if (!form.id) {
          setForm((current) => ({
            ...current,
            id: productId,
            imageFiles: form.imageFiles,
          }));
        }
      } finally {
        setSaving(false);
      }
    }
  };


  const remove = async (product) => {
    const id = getProductId(product);
    const ok = await confirm({
      title: "Xóa sản phẩm?",
      message: `Bạn có chắc muốn xóa "${product.name}"? Thao tác này không thể hoàn tác.`,
      confirmText: "Xóa sản phẩm",
      variant: "danger"
    });
    if (!ok) return;
    try {
      await apiProducts.delete(id);
      await refreshProducts();
      toast.success(`Đã xóa sản phẩm "${product.name}".`);
    } catch (error) {
      toast.error(error.message || "Không thể xóa sản phẩm.");
    }
  };

  const toggleStatus = async (product) => {
    const id = getProductId(product);
    const nextStatus = product.status === "Active" ? "Expired" : "Active";
    try {
      await apiProducts.updateStatus(id, nextStatus);
      await refreshProducts();
      toast.success(`Đã chuyển trạng thái sản phẩm thành ${nextStatus === "Active" ? "Đang bán" : "Hết hạn"}.`);
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật trạng thái.");
    }
  };


  return (
    <div className="seller-products">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">QUẢN LÝ SẢN PHẨM</span>
          <h1>Quản lý sản phẩm</h1>
          <p>Quản lý mẻ hàng đang rao bán trên chợ.</p>
        </div>
        {!form && (
          <button
            className="button button--primary"
            onClick={() => {
              fetchBatches();
              setForm(emptyForm);
            }}
            type="button"
          >
            <Plus size={17} /> Đăng sản phẩm
          </button>
        )}
      </header>

      {form && (
        <ProductForm
          form={form}
          batches={batches}
          onCancel={() => setForm(null)}
          onChange={updateField}
          onSubmit={submit}
          saving={saving}
        />
      )}

      <section className="dashboard-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr><th>Sản phẩm</th><th>Đơn giá</th><th>Còn lại</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const marketplaceStatus = getMarketplaceStatus(product);
                return (
                  <tr key={getProductId(product)}>
                    <td>
                      <div style={{ fontWeight: "700" }}>{product.name}</div>
                      <div className="product-card-badges" style={{ marginTop: "6px", marginBottom: "0" }}>
                        <span className="seafood-type-badge" style={{ fontSize: "10px", padding: "2px 6px" }}>
                          {getCategoryLabel(product.category) || "Hải sản"}
                        </span>
                        {product.productSize && product.productSize !== "Chưa cập nhật" && (
                          <span className="seafood-size-badge" style={{ fontSize: "10px", padding: "2px 6px" }}>
                            {getProductSizeLabel(product.productSize)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{formatCurrency(product.price)} / kg</td>
                    <td>{Number(product.remainingWeight || 0)} / {Number(product.totalWeight || 0)} kg</td>
                    <td>
                      <span className={`status-chip status-chip--${marketplaceStatus.key}`}>
                        {marketplaceStatus.label}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions action-button-group">
                        <IconActionButton
                          icon={<ArrowUp />}
                          label="Đẩy bài"
                          variant="success"
                          onClick={() => bump(product)}
                        />
                        <IconActionButton
                          icon={<Power />}
                          label="Đổi trạng thái"
                          variant="warning"
                          onClick={() => toggleStatus(product)}
                        />
                        <IconActionButton
                          icon={<Edit3 />}
                          label="Chỉnh sửa"
                          variant="primary"
                          onClick={() => {
                            fetchBatches();
                            setForm(productToForm(product));
                          }}
                        />
                        <IconActionButton
                          icon={<Trash2 />}
                          label="Xóa"
                          variant="danger"
                          onClick={() => remove(product)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td className="table-empty" colSpan="5">Bạn chưa đăng sản phẩm nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
