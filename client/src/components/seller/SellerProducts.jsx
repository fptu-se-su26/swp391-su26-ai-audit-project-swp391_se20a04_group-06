import { useState } from "react";
import { Edit3, Plus, Power, Trash2 } from "lucide-react";
import { apiProducts } from "../../services/api";
import { formatCurrency, getProductId } from "../../utils/product";
import ProductForm from "./ProductForm";

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
  images: "",
  lat: "",
  lng: "",
};

function toDateInput(value, includeTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, includeTime ? 16 : 10);
}

function productToForm(product) {
  return {
    ...emptyForm,
    ...product,
    id: getProductId(product),
    catchTime: toDateInput(product.catchTime, true),
    expiryDate: toDateInput(product.expiryDate),
    images: (product.images || [])
      .map((image) => (typeof image === "string" ? image : image.url))
      .filter(Boolean)
      .join("\n"),
    lat: product.lat ?? "",
    lng: product.lng ?? "",
  };
}

export default function SellerProducts({ onUpdateProducts, products }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
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
      catchTime: form.catchTime || null,
      expiryDate: form.expiryDate || undefined,
      images: form.images.split("\n").map((value) => value.trim()).filter(Boolean),
      lat: form.lat === "" ? null : Number(form.lat),
      lng: form.lng === "" ? null : Number(form.lng),
      status: form.status || "Active",
    };

    try {
      if (form.id) {
        await apiProducts.update(form.id, payload);
        onUpdateProducts(
          products.map((product) =>
            getProductId(product) === form.id ? { ...product, ...payload } : product,
          ),
        );
      } else {
        const created = await apiProducts.create(payload);
        const nextProduct = created?.product || created;
        if (nextProduct) onUpdateProducts([nextProduct, ...products]);
      }
      setForm(null);
    } catch (error) {
      window.alert(`Không thể lưu sản phẩm: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product) => {
    const id = getProductId(product);
    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    try {
      await apiProducts.delete(id);
      onUpdateProducts(products.filter((item) => getProductId(item) !== id));
    } catch (error) {
      window.alert(`Không thể xóa sản phẩm: ${error.message}`);
    }
  };

  const toggleStatus = async (product) => {
    const id = getProductId(product);
    const nextStatus = product.status === "Active" ? "Expired" : "Active";
    try {
      await apiProducts.updateStatus(id, nextStatus);
      onUpdateProducts(
        products.map((item) =>
          getProductId(item) === id
            ? { ...item, status: nextStatus }
            : item,
        ),
      );
    } catch (error) {
      window.alert(`Không thể cập nhật trạng thái: ${error.message}`);
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
              {products.map((product) => (
                <tr key={getProductId(product)}>
                  <td>{product.name}</td>
                  <td>{formatCurrency(product.price)} / kg</td>
                  <td>{Number(product.remainingWeight || 0)} / {Number(product.totalWeight || 0)} kg</td>
                  <td>{product.status === "Active" ? "Đang bán" : "Ngừng bán"}</td>
                  <td>
                    <div className="table-actions">
                      <button aria-label="Đổi trạng thái" onClick={() => toggleStatus(product)} type="button"><Power size={16} /></button>
                      <button aria-label="Chỉnh sửa" onClick={() => setForm(productToForm(product))} type="button"><Edit3 size={16} /></button>
                      <button aria-label="Xóa" className="is-danger" onClick={() => remove(product)} type="button"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
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
