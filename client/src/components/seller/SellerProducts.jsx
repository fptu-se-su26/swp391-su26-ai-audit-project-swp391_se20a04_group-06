import { useState } from "react";
import { Edit3, Plus, Power, Trash2 } from "lucide-react";
import { apiProducts } from "../../services/api";
import { formatCurrency, getMarketplaceStatus, getProductId } from "../../utils/product";
import ProductForm from "./ProductForm";
import { formatDateTimeForInput, parseDateTimeForSubmit } from "../shared/DateTimePicker";
import { useConfirm } from "../../context/ConfirmContext";



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
  };
}



export default function SellerProducts({ onUpdateProducts, products }) {
  const { confirm, alert } = useConfirm();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));


  const refreshProducts = async () => {
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

    try {
      // catchTime: giá trị từ datetime-local input → ISO string
      const catchTime = parseDateTimeForSubmit(form.catchTime);
      // expiryDate: giá trị từ date input "yyyy-MM-dd" → giữ nguyên, backend hiểu
      const expiryDate = form.expiryDate || null;

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        totalWeight: Number(form.totalWeight),
        remainingWeight: Number(form.remainingWeight || form.totalWeight),
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
      };

      if (form.id) {
        await apiProducts.update(form.id, payload);
        await uploadProductImages(form.id, form.imageFiles);
      } else {
        const created = await apiProducts.create(payload);
        const productId = created?.productId || created?.product?.id || created?.product?._id;
        if (!productId) throw new Error("Máy chủ không trả về mã sản phẩm vừa tạo.");
        await uploadProductImages(productId, form.imageFiles);
      }
      await refreshProducts();
      setForm(null);
    } catch (error) {
      await alert({
        title: "Không thể lưu sản phẩm",
        message: error.message,
        variant: "danger"
      });
    } finally {
      setSaving(false);
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
    } catch (error) {
      await alert({
        title: "Lỗi",
        message: `Không thể xóa sản phẩm: ${error.message}`,
        variant: "danger"
      });
    }
  };

  const toggleStatus = async (product) => {
    const id = getProductId(product);
    const nextStatus = product.status === "Active" ? "Expired" : "Active";
    try {
      await apiProducts.updateStatus(id, nextStatus);
      await refreshProducts();
    } catch (error) {
      await alert({
        title: "Lỗi",
        message: `Không thể cập nhật trạng thái: ${error.message}`,
        variant: "danger"
      });
    }
  };


  return (
    <div className="seller-products">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">PRODUCT MANAGEMENT</span>
          <h1>Quản lý sản phẩm</h1>
          <p>Quản lý mẻ hàng đang rao bán trên chợ.</p>
        </div>
        {!form && (
          <button className="button button--primary" onClick={() => setForm(emptyForm)} type="button">
            <Plus size={17} /> Đăng sản phẩm
          </button>
        )}
      </header>

      {form && (
        <ProductForm
          form={form}
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
                    <td>{product.name}</td>
                    <td>{formatCurrency(product.price)} / kg</td>
                    <td>{Number(product.remainingWeight || 0)} / {Number(product.totalWeight || 0)} kg</td>
                    <td>
                      <span className={`status-chip status-chip--${marketplaceStatus.key}`}>
                        {marketplaceStatus.label}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button aria-label="Đổi trạng thái" onClick={() => toggleStatus(product)} type="button"><Power size={16} /></button>
                        <button aria-label="Chỉnh sửa" onClick={() => setForm(productToForm(product))} type="button"><Edit3 size={16} /></button>
                        <button aria-label="Xóa" className="is-danger" onClick={() => remove(product)} type="button"><Trash2 size={16} /></button>
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
