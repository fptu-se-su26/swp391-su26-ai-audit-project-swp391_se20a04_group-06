// Nhập các React Hooks cần thiết để quản lý state, vòng đời component và memoize hàm (useCallback)
import { useState, useEffect, useCallback } from "react";
// Nhập hook điều hướng trang từ react-router-dom
import { useNavigate } from "react-router-dom";
// Nhập mã màu sắc và phong cách giao diện chung của hệ thống
import { C } from "../utils/theme";
// Nhập đối tượng gọi API (axios/fetch wrapper) đã được cấu hình sẵn
import { api } from "../services/api";
// Nhập các hàm tiện ích định dạng tiền tệ và hiển thị nhãn badge nhỏ (pill)
import { fmt, pill } from "../utils/format";
// Nhập component huy hiệu đếm ngược độ tươi của hải sản dựa vào thời điểm đánh bắt
import { CountdownBadge } from "../components/ProductCard";
// Nhập component tab quản lý hộp thư thoại nhắn tin trò chuyện
import { InboxTab } from "../components/InboxTab";
// Nhập hook lấy thông tin tài khoản đăng nhập hiện tại từ Auth Context
import { useAuth } from "../context/AuthContext";
// Nhập hook hiển thị các thông báo nhanh (toast notification) lên UI
import { useToast } from "../context/ToastContext";

// Hàm nén ảnh bằng phần cứng Canvas trình duyệt để giảm dung lượng file trước khi tải lên Cloudinary
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    // Đọc file ảnh dưới dạng đường dẫn URL Base64
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Khởi tạo một phần tử canvas ảo không hiển thị lên màn hình
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000; // Chiều rộng tối đa cho phép của ảnh sau nén
        let width = img.width;
        let height = img.height;

        // Tính toán tỷ lệ chiều cao tương ứng nếu ảnh vượt quá chiều rộng tối đa
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // Vẽ lại ảnh lên canvas theo kích thước mới đã thu nhỏ
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất canvas ra định dạng Blob nhị phân dạng JPEG với chất lượng nén 85%
        canvas.toBlob(
          (blob) => {
            // Trả về đối tượng File mới chứa dữ liệu ảnh đã nén để gửi lên server
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.85,
        );
      };
    };
  });
};

// ── ConfirmDialog — Hộp thoại xác nhận hành động xóa tùy chỉnh ───────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    // Lớp phủ nền mờ bao toàn bộ màn hình
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onCancel} // Click bên ngoài modal sẽ hủy hành động
    >
      <div
        onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan ra ngoài
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "28px 32px",
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: C.dark,
            marginBottom: 20,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.muted,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: "#DC2626", // Màu đỏ cảnh báo xóa
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditProductModal — Form sửa toàn bộ thông tin chi tiết sản phẩm ───────
function EditProductModal({ product, onSave, onClose, loading }) {
  // Khởi tạo state biểu mẫu chỉnh sửa từ dữ liệu gốc của sản phẩm truyền vào qua Props
  const [form, setForm] = useState({
    name: product.name || "",
    type: product.type || "Fresh",
    price: product.price ?? 0,
    remainingWeight: product.remainingWeight ?? 0,
    status: product.status || "Active",
    // Chuyển đổi định dạng ngày tháng catchTime sang "YYYY-MM-DDTHH:mm" để tương thích với input datetime-local
    catchTime: product.catchTime
      ? new Date(product.catchTime).toISOString().slice(0, 16)
      : "",
  });

  // Hàm helper cập nhật nhanh giá trị của một thuộc tính cụ thể trong state form
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  // Khai báo kiểu phong cách thiết kế dùng chung cho các ô input để đảm bảo tính đồng bộ
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontFamily: "inherit",
    fontSize: 14,
    color: C.dark,
    background: C.white,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: C.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
  const fieldStyle = { marginBottom: 18 };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)", // Lớp phủ nền tối mờ
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.15s ease",
        padding: "16px",
      }}
      onClick={onClose} // Nhấp chuột ra vùng ngoài modal sẽ tự động đóng form
    >
      <div
        onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra vùng ngoài
        style={{
          background: C.white,
          borderRadius: 20,
          padding: "28px 32px",
          maxWidth: 500,
          width: "100%",
          boxShadow: "0 24px 48px rgba(0,0,0,0.22)",
          maxHeight: "90vh", // Giới hạn chiều cao tối đa của form theo màn hình
          overflowY: "auto", // Bật thanh cuộn nếu form quá dài
        }}
      >
        {/* Phần đầu Modal chứa tiêu đề và nút đóng (x) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: C.dark,
              margin: 0,
            }}
          >
            ✏️ Chỉnh sửa sản phẩm
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: C.muted,
              lineHeight: 1,
              padding: "2px 6px",
            }}
          >
            &times;
          </button>
        </div>

        {/* Ô nhập tên sản phẩm */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Tên sản phẩm</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ví dụ: Tôm Thẻ Chân Trắng"
          />
        </div>

        {/* Grid chia làm 2 cột: Loại hải sản và Trạng thái hiển thị */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div>
            <label style={labelStyle}>Loại hải sản</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="Fresh">🐟 Tươi</option>
              <option value="Dry">🌊 Khô</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Trạng thái</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="Active">✅ Đang bán</option>
              <option value="Inactive">⏸️ Tạm ngừng</option>
              <option value="Sold">🎉 Đã bán hết</option>
            </select>
          </div>
        </div>

        {/* Grid chia làm 2 cột: Đơn giá và Trọng lượng còn lại */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div>
            <label style={labelStyle}>Giá bán (₫/kg)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => set("price", parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div>
            <label style={labelStyle}>Còn lại (kg)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="0.5"
              value={form.remainingWeight}
              onChange={(e) =>
                set("remainingWeight", parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {/* Ô nhập Thời gian đánh bắt — chỉ kết xuất (render) khi sản phẩm là hải sản Tươi (Fresh) */}
        {form.type === "Fresh" && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Thời gian đánh bắt</label>
            <input
              style={inputStyle}
              type="datetime-local"
              value={form.catchTime}
              onChange={(e) => set("catchTime", e.target.value)}
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Dùng để hiển thị đếm ngược độ tươi cho người mua.
            </div>
          </div>
        )}

        {/* Đường gạch ngang phân chia thẩm mỹ */}
        <div
          style={{
            height: 1,
            background: C.border,
            margin: "4px 0 20px",
          }}
        />

        {/* Nhóm nút Hủy và Ghi lại thay đổi */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.muted,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Huỷ
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.name.trim()} // Vô hiệu hóa nếu đang tải hoặc tên sản phẩm để trống
            style={{
              flex: 2,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background:
                loading || !form.name.trim()
                  ? "#CBD5E1"
                  : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
              color: "#fff",
              fontWeight: 700,
              cursor: loading || !form.name.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            {loading ? "⏳ Đang lưu…" : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cooldown helpers — Kiểm soát khoảng thời gian đẩy bài viết lên đầu trang ──
// Một bài đăng chỉ được phép "đẩy tin" một lần duy nhất trong vòng 24 giờ (để tránh spam)
const isBumpingOnCooldown = (bumpedAtStr) => {
  if (!bumpedAtStr) return false;
  // Trả về true nếu thời gian từ lúc đẩy lần trước đến nay chưa đủ 24 tiếng (24 * 3600 * 1000 mili giây)
  return Date.now() - new Date(bumpedAtStr).getTime() < 24 * 3600 * 1000;
};

// Tính số giờ còn lại phải chờ để kết thúc cooldown đẩy bài
const getCooldownHours = (bumpedAtStr) => {
  if (!bumpedAtStr) return 0;
  const diffMs = Date.now() - new Date(bumpedAtStr).getTime();
  // Làm tròn lên số giờ còn lại
  return Math.ceil((24 * 3600 * 1000 - diffMs) / 3600000);
};

// ── Main Component DashboardPage ───────────────────────────────────────────
// Trang quản lý trung tâm (Dashboard) dành cho người bán và người mua
export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Quản lý tab giao diện đang mở, mặc định là danh sách sản phẩm đăng bán (listings)
  const [tab, setTab] = useState("listings");
  // Lưu trữ danh sách bài đăng hải sản của người dùng
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  // Lưu trữ tổng số tin nhắn thoại chưa đọc
  const [unread, setUnread] = useState(0);

  // Các state hỗ trợ phân trang cho danh sách sản phẩm
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);
  const [listingsTotal, setListingsTotal] = useState(0);

  // State lưu đối tượng sản phẩm đang được admin chọn chỉnh sửa (khi khác null, Modal sẽ bật)
  const [editProduct, setEditProduct] = useState(null);
  // Đang tải khi gọi API lưu cập nhật thông tin sản phẩm
  const [editLoading, setEditLoading] = useState(false);

  // State lưu ID của sản phẩm đang được đẩy tin (bumping) để hiển thị spinner
  const [bumpingId, setBumpingId] = useState(null);
  // Danh sách các sản phẩm ưa thích của người dùng này
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  // Lưu ID sản phẩm chuẩn bị bị xóa để hiện modal Confirm
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Các state phục vụ tính năng "Nhật ký cabin" (Boat logs) dành cho ngư dân
  const [myLogs, setMyLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  // Nội dung nhật ký nhập vào ô textarea
  const [logContent, setLogContent] = useState("");
  // Mảng chứa các đối tượng File ảnh thực tế được chọn để tải lên
  const [logImages, setLogImages] = useState([]);
  // Mảng chứa các URL ảnh dạng blob cục bộ để hiển thị xem trước trước khi upload
  const [logPreviews, setLogPreviews] = useState([]);
  // Trạng thái chờ trong khi đang nén ảnh và gửi nhật ký cabin lên server
  const [submittingLog, setSubmittingLog] = useState(false);

  // Hàm gọi API lấy danh sách nhật ký boong tàu của chính mình
  const fetchMyLogs = useCallback(() => {
    if (!user) return;
    setLoadingLogs(true);
    // Gửi request lấy nhật ký cabin theo ID người dùng
    api(`/boat-logs?userId=${user.userId || user.id}`)
      .then((res) => setMyLogs(res.boatLogs || []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  }, [user]);

  // Tải lại nhật ký cabin mỗi khi tab được chuyển sang "boatlogs"
  useEffect(() => {
    if (tab === "boatlogs") {
      (async () => {
        await fetchMyLogs();
      })();
    }
  }, [tab, fetchMyLogs]);

  // Xử lý sự kiện khi ngư dân chọn các tệp hình ảnh thực tế đi kèm nhật ký
  const handleLogImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Giới hạn chỉ cho phép tải tối đa 4 hình ảnh minh họa cho mỗi bài nhật ký cabin
    if (files.length + logImages.length > 4) {
      toast.error("Bạn chỉ được tải lên tối đa 4 hình ảnh");
      return;
    }
    setLogImages([...logImages, ...files]);
    // Tạo nhanh URL xem trước dạng blob cục bộ
    const previews = files.map((file) => URL.createObjectURL(file));
    setLogPreviews([...logPreviews, ...previews]);
  };

  // Loại bỏ một ảnh ra khỏi danh sách đính kèm
  const removeLogImage = (idx) => {
    setLogImages(logImages.filter((_, i) => i !== idx));
    setLogPreviews(logPreviews.filter((_, i) => i !== idx));
  };

  // Hàm gửi biểu mẫu đăng bài nhật ký cabin mới
  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!logContent.trim()) return;

    setSubmittingLog(true);
    try {
      let uploadedImageUrls = [];
      // Nếu có đính kèm hình ảnh thì thực hiện quy trình upload lên Cloudinary CDN
      if (logImages.length > 0) {
        // 1. Gọi backend lấy chữ ký bảo mật signature và cấu hình API key Cloudinary
        const sigData = await api("/images/signature");
        // 2. Chạy nén và upload song song tất cả các tệp tin
        uploadedImageUrls = await Promise.all(
          logImages.map(async (file) => {
            // Nén ảnh bằng canvas trước khi upload để tiết kiệm băng thông
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append("file", compressed);
            fd.append("api_key", sigData.apiKey);
            fd.append("timestamp", sigData.timestamp);
            fd.append("signature", sigData.signature);
            fd.append("folder", sigData.folder);

            // Gửi trực tiếp FormData tới API upload của Cloudinary
            const cloudRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              { method: "POST", body: fd },
            );
            if (!cloudRes.ok) throw new Error("Không thể tải ảnh lên CDN");
            const cloudData = await cloudRes.json();
            // Trả về địa chỉ URL bảo mật của ảnh trên CDN
            return cloudData.secure_url;
          }),
        );
      }

      // 3. Gửi nội dung văn bản và mảng link ảnh nhật ký cabin về backend để lưu DB
      await api("/boat-logs", {
        method: "POST",
        body: {
          content: logContent,
          images: uploadedImageUrls,
        },
      });

      toast.success("✅ Đã đăng nhật ký boong tàu mới!");
      // Reset sạch biểu mẫu
      setLogContent("");
      setLogImages([]);
      setLogPreviews([]);
      // Tải lại danh sách nhật ký mới cập nhật
      fetchMyLogs();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmittingLog(false);
    }
  };

  // Xóa một bài viết nhật ký cabin
  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Xóa bài nhật ký này? Thao tác không thể hoàn tác."))
      return;
    try {
      await api(`/boat-logs/${logId}`, { method: "DELETE" });
      toast.success("Đã xóa nhật ký.");
      fetchMyLogs(); // Nạp lại danh sách
    } catch (err) {
      toast.error(err.message || "Không thể xóa nhật ký");
    }
  };

  // Hàm gọi API lấy danh sách các mẻ sản phẩm mà mình đang đăng bán (có phân trang)
  const fetchMyListings = useCallback((pageNo) => {
    setLoadingListings(true);
    api(`/products/my?page=${pageNo}&limit=5`)
      .then((res) => {
        setListings(res.data || []);
        setListingsTotalPages(res.totalPages || 1);
        setListingsTotal(res.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingListings(false));
  }, []);

  // Gọi fetch danh sách sản phẩm mỗi khi tab chuyển sang listings hoặc số trang phân trang thay đổi
  useEffect(() => {
    if (tab === "listings") {
      (async () => {
        await fetchMyListings(listingsPage);
      })();
    }
  }, [tab, listingsPage, fetchMyListings]);

  // useEffect tự động chạy một lần duy nhất khi người dùng mở trang để nạp số tin nhắn chưa đọc và các sản phẩm yêu thích
  useEffect(() => {
    (async () => {
      try {
        const data = await api("/messages/unread-count");
        setUnread(data.count);
      } catch {
        /* Bỏ qua lỗi kết nối */
      }

      try {
        const data = await api("/favorites");
        setFavorites(data);
      } catch {
        /* Bỏ qua lỗi kết nối */
      } finally {
        setFavLoading(false);
      }
    })();
  }, []);

  // Xử lý lưu các thay đổi thông tin sản phẩm sau khi sửa ở Modal form
  const handleSave = async (productId, formData) => {
    setEditLoading(true);
    // Chuẩn hoá kiểu dữ liệu số cho giá tiền và trọng lượng
    const payload = {
      ...formData,
      price: Number(formData.price),
      remainingWeight: Number(formData.remainingWeight),
      // Nếu là đồ khô, thời điểm đánh bắt catchTime để trống sẽ được quy về giá trị null
      catchTime: formData.catchTime || null,
    };

    try {
      // Gửi request PUT cập nhật thông tin sản phẩm
      await api(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      // Cập nhật giá trị mới vào state listings cục bộ ngay lập tức để đồng bộ UI không cần load lại trang
      setListings((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...payload } : p)),
      );
      setEditProduct(null); // Đóng modal
      toast.success("✅ Đã cập nhật thông tin sản phẩm!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Thực hiện xóa mẻ hải sản ra khỏi hệ thống
  const doDelete = async (productId) => {
    setConfirmDelete(null); // Đóng hộp thoại xác nhận
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      toast.success("Đã xoá bài đăng.");
      // Tải lại danh sách mẻ hàng ở trang hiện tại
      fetchMyListings(listingsPage);
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Hàm đẩy tin đăng lên đầu danh sách tìm kiếm (bumping)
  const bumpProduct = async (productId) => {
    setBumpingId(productId);
    try {
      // Gửi yêu cầu POST đẩy tin lên đầu
      const res = await api(`/products/${productId}/bump`, { method: "POST" });
      toast.success(res.message || "Đã đẩy tin lên đầu thành công!");
      // Cập nhật lại thời gian bumpedAt của sản phẩm này thành thời điểm hiện tại để khóa nút đẩy tin
      setListings((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, bumpedAt: new Date().toISOString() } : p,
        ),
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBumpingId(null);
    }
  };

  // Tính số lượng mẻ hàng đang hoạt động (Active) trên giao diện hiện tại
  const activeCount = listings.filter((p) => p.status === "Active").length;
  // Tính tổng trọng lượng hải sản còn lại đang rao bán
  const totalRemaining = listings.reduce(
    (s, p) => s + (p.remainingWeight || 0),
    0,
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
      
      {/* Khởi dựng Hộp thoại xác nhận xóa bài viết */}
      {confirmDelete && (
        <ConfirmDialog
          message="Xoá bài đăng này? Thao tác không thể hoàn tác."
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Khởi dựng Modal Form sửa thông tin sản phẩm */}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          loading={editLoading}
          onSave={(formData) => handleSave(editProduct.id, formData)}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Header chính của trang */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.dark, margin: 0 }}>
          📊 Bảng Điều Khiển — {user?.name}
        </h1>
        {/* Nút bấm liên kết nhanh đến trang Đăng hải sản mới */}
        <button
          onClick={() => navigate("/dang-bai")}
          style={{
            background: `linear-gradient(135deg, ${C.coral} 0%, #D94E21 100%)`,
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
            boxShadow: "0 6px 20px rgba(232, 100, 58, 0.3)",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateY(-1.5px)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          ＋ Đăng hải sản mới
        </button>
      </div>

      {/* Lưới 3 ô thẻ Thống kê tổng quan nhanh */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          [
            "📦",
            activeCount,
            "Hải sản đang rao bán",
            C.ok,
            "rgba(45, 125, 70, 0.1)",
          ],
          [
            "💬",
            unread,
            "Tin nhắn chưa đọc",
            C.coral,
            "rgba(232, 100, 58, 0.1)",
          ],
          [
            "⚖️",
            `${totalRemaining} kg`,
            "Tổng trọng lượng kho",
            C.ocean,
            "rgba(11, 79, 108, 0.1)",
          ],
        ].map(([ico, val, lbl, col]) => (
          <div
            key={lbl}
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${col}`,
              padding: "20px 24px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.01)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>{ico}</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: col,
                lineHeight: 1.1,
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Thanh Tabs chuyển đổi các hạng mục quản lý */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#E2E8F0",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {[
          ["listings", `📦 Bài đã đăng (${listingsTotal})`],
          ["chats", "💬 Tin nhắn trao đổi"],
          ["favorites", `❤️ Mục yêu thích (${favorites.length})`],
          ["boatlogs", "⛵ Nhật ký cabin"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.white : "transparent",
              color: tab === k ? C.ocean : C.muted,
              boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* NỘI DUNG CHI TIẾT TỪNG TAB */}
      
      {/* ── TAB 1: DANH SÁCH BÀI ĐĂNG (LISTINGS) ── */}
      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loadingListings ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: C.muted,
                fontWeight: 500,
              }}
            >
              ⏳ Đang tải kho bài viết của bạn...
            </div>
          ) : listings.length === 0 ? (
            // Nếu không có bài viết nào
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: C.muted,
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
              <div style={{ fontWeight: 700, color: C.dark }}>
                Kho hàng của bạn đang trống rỗng
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Bắt đầu bán hàng cùng Haisan.vn ngay!{" "}
                <button
                  onClick={() => navigate("/dang-bai")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.ocean,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Đăng bài ngay →
                </button>
              </div>
            </div>
          ) : (
            // Lặp danh sách tin đăng sản phẩm
            listings.map((p) => (
              <div
                key={p.id}
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: "20px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: C.dark,
                        marginBottom: 6,
                      }}
                    >
                      {p.name}
                    </div>
                    {/* Các nhãn phân loại nhanh */}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      {pill(
                        p.type === "Fresh" ? "#DBEAFE" : "#FEF3C7",
                        p.type === "Fresh" ? "#1D4ED8" : "#92400E",
                        p.type === "Fresh" ? "Tươi" : "Khô",
                      )}
                      {pill(
                        p.status === "Active" ? C.okL : "#F3F4F6",
                        p.status === "Active" ? C.ok : C.muted,
                        p.status === "Active" ? "Đang bán" : p.status,
                      )}
                    </div>
                    {/* Giá cả và khối lượng tồn kho */}
                    <div style={{ fontSize: 13, color: C.muted }}>
                      Giá:{" "}
                      <strong style={{ color: C.dark }}>
                        {fmt(p.price)}/kg
                      </strong>
                      {" · "}
                      Còn:{" "}
                      <strong
                        style={{
                          color: p.remainingWeight < 5 ? "#DC2626" : C.dark, // Hiển thị màu đỏ nếu số lượng sắp hết (< 5kg)
                        }}
                      >
                        {p.remainingWeight} kg
                      </strong>
                    </div>
                    {/* Huy hiệu đếm ngược độ tươi dành riêng cho đồ Tươi sống */}
                    {p.type === "Fresh" && p.catchTime && (
                      <div style={{ marginTop: 6 }}>
                        <CountdownBadge catchTime={p.catchTime} />
                      </div>
                    )}
                  </div>

                  {/* Cột nhóm nút Hành động trên bài viết */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {/* Nút bấm mở Form Chỉnh sửa thông tin */}
                    <button
                      onClick={() => setEditProduct(p)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.white,
                        color: C.ocean,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                      }}
                    >
                      ✏️ Sửa thông tin
                    </button>

                    {/* Nút Đẩy tin (Bump) — bị vô hiệu hóa nếu đang trong thời hạn cooldown 24h */}
                    <button
                      onClick={() => bumpProduct(p.id)}
                      disabled={
                        bumpingId === p.id || isBumpingOnCooldown(p.bumpedAt)
                      }
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: isBumpingOnCooldown(p.bumpedAt)
                          ? "#64748B" // Nền xám đen nếu đang cooldown
                          : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                        color: "#fff",
                        fontWeight: 700,
                        cursor: isBumpingOnCooldown(p.bumpedAt)
                          ? "not-allowed"
                          : "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        opacity:
                          bumpingId === p.id || isBumpingOnCooldown(p.bumpedAt)
                            ? 0.75
                            : 1,
                      }}
                    >
                      {bumpingId === p.id
                        ? "…"
                        : isBumpingOnCooldown(p.bumpedAt)
                          ? `⏳ Chờ (${getCooldownHours(p.bumpedAt)}h)` // Hiển thị số giờ còn lại phải đợi
                          : "🚀 Đẩy tin"}
                    </button>

                    {/* Nút bấm xóa sản phẩm */}
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "#FEE2E2",
                        color: "#DC2626",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                      }}
                    >
                      🗑️ Xoá
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Phân vùng Thanh Phân Trang */}
          {listingsTotalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 24,
              }}
            >
              {/* Nút bấm lùi lại 1 trang */}
              <button
                disabled={listingsPage === 1}
                onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: listingsPage === 1 ? C.muted : C.ocean,
                  cursor: listingsPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                ‹ Trước
              </button>
              {/* Hiển thị số trang hiện tại / tổng số trang */}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                  alignSelf: "center",
                }}
              >
                Trang {listingsPage} / {listingsTotalPages}
              </span>
              {/* Nút bấm tiến lên 1 trang */}
              <button
                disabled={listingsPage === listingsTotalPages}
                onClick={() =>
                  setListingsPage((p) => Math.min(listingsTotalPages, p + 1))
                }
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color:
                    listingsPage === listingsTotalPages ? C.muted : C.ocean,
                  cursor:
                    listingsPage === listingsTotalPages
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                Sau ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: TIN NHẮN TRAO ĐỔI (CHATS) ── */}
      {/* Nhúng Component InboxTab quản lý liên lạc chat và truyền đối tượng user đăng nhập */}
      {tab === "chats" && <InboxTab user={user} />}

      {/* ── TAB 3: MỤC YÊU THÍCH (FAVORITES) ── */}
      {tab === "favorites" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {favLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              ⏳ Đang tải danh sách yêu thích...
            </div>
          ) : favorites.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: C.muted,
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>❤️</div>
              <div style={{ fontWeight: 700, color: C.dark }}>
                Chưa có sản phẩm yêu thích nào
              </div>
            </div>
          ) : (
            // Lặp danh sách mẻ hàng đã nhấn thích
            favorites.map((p) => (
              <div
                key={p.id}
                style={{
                  background: C.white,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {/* Ảnh thu nhỏ đại diện (Thumbnail) của sản phẩm yêu thích */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    background: C.bg,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {p.coverImg ? (
                    <img
                      src={p.coverImg}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      🐟
                    </div>
                  )}
                </div>
                {/* Thông tin tên và giá */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                    {fmt(p.price)}/kg · Còn {p.remainingWeight} kg
                  </div>
                </div>
                {/* Nút bấm xem chi tiết sản phẩm */}
                <button
                  onClick={() => navigate(`/san-pham/${p.id}`)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    color: C.ocean,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                >
                  Xem →
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 4: NHẬT KÝ CABIN (BOATLOGS) ── */}
      {tab === "boatlogs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Cảnh báo: Chỉ cho phép người dùng đã xác minh (isVerified), Premium (isPremium) hoặc Admin viết nhật ký */}
          {!(user?.isVerified || user?.isPremium || user?.role === "Admin") ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "#FFFBEB",
                border: "1px solid #F59E0B",
                borderRadius: 16,
                color: "#B45309",
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontWeight: 800, margin: "0 0 8px 0" }}>
                Tính năng giới hạn
              </h3>
              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Chức năng đăng Nhật ký Cabin chỉ dành cho chủ tàu cá/ngư thuyền
                đã xác minh danh tính hoặc nâng cấp thành viên. Vui lòng liên hệ
                Admin để hoàn tất xác minh tài khoản của bạn.
              </p>
            </div>
          ) : (
            // ── GIAO DIỆN ĐĂNG NHẬT KÝ VÀ LỊCH SỬ LOGS DÀNH CHO NGƯ DÂN ĐỦ TIÊU CHUẨN ──
            <>
              {/* Form tạo mới bài viết cabin log */}
              <div
                style={{
                  background: C.white,
                  borderRadius: 16,
                  padding: "24px",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                }}
              >
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: C.dark,
                    marginBottom: 14,
                  }}
                >
                  ⛵ Đăng Nhật Ký Cabin mới
                </h3>
                <form
                  onSubmit={handleCreateLog}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* Ô nhập nội dung văn bản */}
                  <textarea
                    rows={4}
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    placeholder="Hôm nay tàu cá của bạn hoạt động ở ngư trường nào? Thời tiết ngoài khơi ra sao? Đánh bắt được những hải sản gì tươi ngon..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 14,
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                    required
                  />

                  {/* Hiển thị mảng ảnh xem trước (Previews) dạng hình vuông nhỏ cạnh nhau */}
                  {logPreviews.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {logPreviews.map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: 72,
                            height: 72,
                            borderRadius: 8,
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={p}
                            alt="Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {/* Nút bấm để gỡ bớt ảnh đã chọn */}
                          <button
                            type="button"
                            onClick={() => removeLogImage(idx)}
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: 16,
                              height: 16,
                              fontSize: 10,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dòng chân form chứa nút đính kèm ảnh và nút Đăng nhật ký */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* Nhãn click kích hoạt chọn tệp tin ẩn */}
                    <label
                      style={{
                        cursor: "pointer",
                        fontSize: 13,
                        color: C.ocean,
                        fontWeight: 700,
                      }}
                    >
                      📷 Đính kèm hình ảnh
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleLogImageChange}
                        style={{ display: "none" }}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={submittingLog || !logContent.trim()}
                      style={{
                        background:
                          submittingLog || !logContent.trim()
                            ? "#CBD5E1"
                            : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                        color: "#fff",
                        border: "none",
                        padding: "8px 24px",
                        borderRadius: 99,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor:
                          submittingLog || !logContent.trim()
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {submittingLog ? "Đang đăng..." : "Đăng nhật ký"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách các bài nhật ký cabin đã đăng trong quá khứ */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: C.muted,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Lịch sử nhật ký boong tàu của bạn
                </h4>
                
                {loadingLogs ? (
                  <div
                    style={{ textAlign: "center", padding: 20, color: C.muted }}
                  >
                    ⏳ Đang tải danh sách nhật ký...
                  </div>
                ) : myLogs.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 30,
                      color: C.muted,
                      background: C.white,
                      borderRadius: 14,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    Chưa đăng bài nhật ký cabin nào.
                  </div>
                ) : (
                  // Lặp danh sách nhật ký boong tàu
                  myLogs.map((log) => (
                    <div
                      key={log._id}
                      style={{
                        background: C.white,
                        borderRadius: 14,
                        padding: "16px 20px",
                        border: `1px solid ${C.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* Định dạng ngày giờ đăng theo ngôn ngữ Tiếng Việt */}
                        <span style={{ fontSize: 11, color: C.muted }}>
                          Đăng lúc{" "}
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </span>
                        {/* Nút bấm xóa bài nhật ký cabin này */}
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#DC2626",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          🗑️ Xóa nhật ký
                        </button>
                      </div>

                      {/* Nội dung chữ của nhật ký, giữ nguyên ký tự xuống dòng nhờ whiteSpace: "pre-line" */}
                      <p
                        style={{
                          fontSize: 13.5,
                          color: C.dark,
                          margin: 0,
                          whiteSpace: "pre-line",
                          lineHeight: 1.5,
                        }}
                      >
                        {log.content}
                      </p>

                      {/* Hiển thị danh sách ảnh đính kèm (nếu có) của bài nhật ký cabin */}
                      {log.images && log.images.length > 0 && (
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {log.images.map((imgUrl, i) => (
                            <img
                              key={i}
                              src={imgUrl}
                              alt="Cabin Log"
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 6,
                                objectFit: "cover",
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
