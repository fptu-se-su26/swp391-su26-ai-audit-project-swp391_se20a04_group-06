/**
 * ============================================================
 * FILE: AuthContext.jsx
 * ============================================================
 *
 * 🎯 MỤC ĐÍCH:
 * File này xây dựng "hệ thống nhận dạng người dùng" dùng chung
 * cho toàn bộ ứng dụng — bất kỳ component nào cũng có thể hỏi:
 *   "Người dùng hiện tại là ai? Họ đã đăng nhập chưa?"
 * mà KHÔNG cần truyền dữ liệu qua từng cấp component một.
 *
 * ─────────────────────────────────────────────────────────────
 * 🐛 VẤN ĐỀ MÀ CONTEXT GIẢI QUYẾT — "PROP DRILLING":
 * ─────────────────────────────────────────────────────────────
 *
 * Giả sử thông tin user được lưu ở App.jsx (gốc cây component).
 * Component cần dùng nó là Avatar.jsx nằm rất sâu bên trong.
 *
 * KHÔNG CÓ Context (Prop Drilling — truyền tay qua từng tầng):
 *
 *   App.jsx          (có user) → truyền prop "user" xuống
 *     └─ Layout.jsx            → nhận rồi truyền tiếp (không dùng)
 *          └─ Sidebar.jsx      → nhận rồi truyền tiếp (không dùng)
 *               └─ Avatar.jsx  → mới thật sự dùng "user"
 *
 *   Vấn đề: Layout và Sidebar buộc phải nhận prop "user" dù
 *   chúng không cần → code rối, dễ sai, khó bảo trì.
 *
 * CÓ Context (Teleport — lấy thẳng từ nguồn):
 *
 *   App.jsx ──────────────────────────────────────────────────┐
 *     └─ Layout.jsx  (không cần biết user)                    │ AuthContext
 *          └─ Sidebar.jsx  (không cần biết user)              │ (kho chứa)
 *               └─ Avatar.jsx ─────────────────── useAuth() ──┘
 *
 *   Avatar.jsx tự lấy thẳng từ Context, không ai phải truyền tay.
 *
 * 💡 HÌNH DUNG DỄ HIỂU:
 * Context giống như WIFI trong văn phòng — thông tin phát ra từ
 * một điểm trung tâm (router), bất kỳ thiết bị nào trong phạm vi
 * đều tự kết nối và lấy dữ liệu mà không cần "cắm dây" qua nhau.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// PHẦN 1: IMPORT
// ─────────────────────────────────────────────────────────────

/**
 * createContext: Hàm tạo ra một "kho chứa dữ liệu dùng chung".
 * Hãy nghĩ nó như việc xây một cái kệ đựng đồ trong văn phòng —
 * ai cũng có thể đến lấy, không cần hỏi qua trung gian.
 *
 * useContext: Hook để component "đến kệ đó và lấy đồ".
 * Component chỉ cần biết tên kệ (AuthContext), không cần biết
 * kệ đó ở tầng mấy hay ai đặt đồ vào đó.
 */
import { createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────
// PHẦN 2: KHỞI TẠO CONTEXT
// ─────────────────────────────────────────────────────────────

/**
 * AuthContext — "Kho chứa thông tin xác thực" dùng chung toàn app.
 *
 * createContext(null) nhận vào GIÁ TRỊ MẶC ĐỊNH — giá trị sẽ được
 * trả về nếu component gọi useContext(AuthContext) mà KHÔNG có
 * Provider nào bao bọc bên ngoài nó.
 *
 * TẠI SAO ĐẶT MẶC ĐỊNH LÀ null CHỨ KHÔNG PHẢI {} HAY { user: null }?
 *
 * Vì chúng ta muốn cố tình để giá trị "thiếu" → để hàm useAuth()
 * bên dưới có thể phát hiện ra và ném lỗi cảnh báo developer.
 *
 * Nếu đặt mặc định là {} (object rỗng):
 *   useContext trả về {}  → !{} là false → không ném lỗi
 *   → Developer quên bọc Provider → app chạy nhưng user luôn undefined
 *   → Bug âm thầm, rất khó tìm ra nguyên nhân 😱
 *
 * Nếu đặt mặc định là null:
 *   useContext trả về null → !null là true → ném lỗi ngay lập tức
 *   → Developer thấy lỗi rõ ràng, biết cách sửa ngay 🎯
 *
 * Đây là kỹ thuật "Fail Fast" — thà báo lỗi sớm còn hơn âm thầm sai.
 *
 * export: Xuất AuthContext để dùng ở 2 nơi:
 *   1. AuthProvider.jsx → dùng AuthContext.Provider để "phát" dữ liệu
 *   2. Bất kỳ đâu cần dùng useContext(AuthContext) trực tiếp (hiếm)
 */
export const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────
// PHẦN 3: CUSTOM HOOK useAuth
// ─────────────────────────────────────────────────────────────

/**
 * Custom Hook: useAuth
 *
 * ĐÂY LÀ CÁCH CÁC COMPONENT LẤY THÔNG TIN ĐĂNG NHẬP.
 *
 * CÁCH DÙNG trong component:
 *   const { user, login, logout } = useAuth();
 *
 *   if (user) {
 *     return <p>Xin chào, {user.name}!</p>;
 *   }
 *   return <p>Bạn chưa đăng nhập.</p>;
 *
 * TẠI SAO DÙNG CUSTOM HOOK THAY VÌ GỌI TRỰC TIẾP useContext?
 *
 * Cách KHÔNG dùng custom hook (dài dòng, dễ quên kiểm tra):
 *   // Trong mỗi component phải viết lại 3 dòng này:
 *   import { useContext } from "react";
 *   import { AuthContext } from "../context/AuthContext";
 *   const ctx = useContext(AuthContext); // quên kiểm tra null → bug
 *
 * Cách DÙNG custom hook (ngắn gọn, an toàn):
 *   // Chỉ cần 1 dòng, kiểm tra null đã có sẵn bên trong:
 *   import { useAuth } from "../context/AuthContext";
 *   const { user } = useAuth(); // an toàn, có lỗi rõ ràng nếu sai
 *
 * Custom hook giúp: ít code lặp, ít lỗi, dễ đọc hơn.
 */
export function useAuth() {
  // ── BƯỚC 1: Lấy giá trị từ Context ───────────────────────
  /**
   * useContext(AuthContext) tìm kiếm component Provider gần nhất
   * trong cây component bao quanh component đang gọi hook này,
   * và lấy giá trị mà Provider đó đang "phát ra".
   *
   * LUỒNG DỮ LIỆU ĐẦY ĐỦ (để hiểu bức tranh toàn cảnh):
   *
   * 1. AuthProvider.jsx (không trong file này) làm nhiệm vụ:
   *    - Quản lý state: const [user, setUser] = useState(null)
   *    - Xử lý login/logout: cập nhật state user
   *    - "Phát" dữ liệu ra ngoài:
   *      <AuthContext.Provider value={{ user, login, logout }}>
   *        {children}
   *      </AuthContext.Provider>
   *
   * 2. App.jsx bọc toàn bộ ứng dụng bằng AuthProvider:
   *    <AuthProvider>
   *      <Router>...</Router>
   *    </AuthProvider>
   *
   * 3. Bất kỳ component nào gọi useAuth() sẽ nhận được
   *    { user, login, logout } mà AuthProvider đang phát.
   *
   * Biến "ctx" nhận về:
   *   - { user, login, logout } nếu component nằm trong AuthProvider ✅
   *   - null nếu component nằm ngoài AuthProvider (lỗi) ❌
   */
  const ctx = useContext(AuthContext);

  // ── BƯỚC 2: Bảo vệ — kiểm tra trước khi dùng ─────────────
  /**
   * GUARD CLAUSE (Câu lệnh bảo vệ):
   * Kiểm tra ngay đầu hàm, nếu điều kiện không thoả thì thoát sớm.
   * Pattern này giúp code dễ đọc hơn — không cần else, không lồng nhau.
   *
   * !ctx sẽ là true khi ctx là: null, undefined, 0, "", false
   * Trong trường hợp này: ctx = null (giá trị mặc định của createContext)
   * → tức là không có AuthProvider bao bọc bên ngoài component đang gọi.
   *
   * throw new Error(...):
   * Ném ra một lỗi có tên và thông điệp rõ ràng.
   * Khác với console.error (chỉ in ra console, app vẫn chạy tiếp),
   * throw sẽ DỪNG HẲN việc thực thi và hiển thị lỗi đỏ trên màn hình
   * → Developer KHÔNG THỂ bỏ qua, buộc phải sửa ngay.
   *
   * THÔNG ĐIỆP LỖI TỐT nên chỉ rõ:
   *   1. Cái gì bị sai: "useAuth phải được dùng bên trong <AuthProvider>"
   *   2. Cách sửa ngay lập tức (ẩn trong thông điệp): bọc thêm AuthProvider
   *
   * VÍ DỤ THỰC TẾ KHI GẶP LỖI NÀY:
   *
   *   ❌ SAI — ProfilePage nằm ngoài AuthProvider:
   *   ReactDOM.render(
   *     <ProfilePage />,   ← useAuth() bên trong → ctx = null → LỖI
   *     document.getElementById("root")
   *   );
   *
   *   ✅ ĐÚNG — ProfilePage được bọc bởi AuthProvider:
   *   ReactDOM.render(
   *     <AuthProvider>     ← phát ra { user, login, logout }
   *       <ProfilePage />  ← useAuth() → ctx = { user, login, logout } → OK
   *     </AuthProvider>,
   *     document.getElementById("root")
   *   );
   */
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }

  // ── BƯỚC 3: Trả về dữ liệu xác thực ─────────────────────
  /**
   * Tại thời điểm này, chúng ta đã chắc chắn ctx KHÔNG phải null.
   * Trả về object ctx — thường chứa các giá trị như:
   *
   * {
   *   user: {              // Thông tin người dùng đang đăng nhập
   *     id: "abc123",      //   ID duy nhất
   *     name: "Nguyễn Văn A",
   *     email: "a@example.com",
   *     avatar: "https://...",
   *     role: "admin"      //   Phân quyền: admin / user / guest
   *   },                   // null nếu chưa đăng nhập
   *
   *   isLoading: false,    // true khi đang kiểm tra session lần đầu
   *                        // (tránh flash màn hình login khi F5)
   *
   *   login: async (email, password) => { ... },  // Hàm đăng nhập
   *   logout: async () => { ... },                // Hàm đăng xuất
   *   updateProfile: async (data) => { ... },     // Hàm cập nhật hồ sơ
   * }
   *
   * Cách component sử dụng (destructuring):
   *   const { user, login, logout, isLoading } = useAuth();
   *
   *   // Kiểm tra quyền truy cập:
   *   if (!user) return <Navigate to="/login" />;
   *   if (user.role !== "admin") return <Navigate to="/403" />;
   */
  return ctx;
}
