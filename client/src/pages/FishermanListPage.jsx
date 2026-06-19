// Nhập các hook từ thư viện React để quản lý vòng đời và trạng thái hiển thị
import { useState, useEffect, useRef, useCallback } from "react";
// Nhập hằng số màu sắc giao diện C từ theme utility
import { C } from "../utils/theme";
// Nhập hàm gọi API dùng chung của client
import { api } from "../services/api";
// Nhập hook useSEO để thiết lập các thẻ meta HTML hỗ trợ công cụ tìm kiếm
import { useSEO } from "../hooks/useSEO";
// Nhập component FishermanCard hiển thị thông tin tóm tắt của một ngư dân
import { FishermanCard } from "../components/FishermanCard";

// Định nghĩa số lượng bản ghi của mỗi trang dữ liệu khi phân trang (20 ngư dân mỗi trang)
const PAGE_SIZE = 20;

// Khai báo và xuất component FishermanListPage hiển thị danh sách các ngư dân
export function FishermanListPage() {
  // Sử dụng hook cấu hình SEO cho trang mạng lưới ngư dân
  useSEO({
    title: "Mạng Lưới Ngư Dân Bản Địa | Haisan.vn",
    description:
      "Khám phá cộng đồng ngư dân và tàu cá đánh bắt trực tiếp trên Haisan.vn.",
  });

  // State lưu trữ mảng danh sách ngư dân tải về từ máy chủ
  const [fishermen, setFishermen] = useState([]);
  // State quản lý trạng thái tải dữ liệu ban đầu (loading), mặc định ban đầu là true
  const [loading, setLoading] = useState(true);
  // State quản lý trạng thái đang tải thêm trang tiếp theo khi cuộn chuột (infinite scroll loading)
  const [loadingMore, setLoadingMore] = useState(false);
  // State lưu số trang hiện tại đang hiển thị, mặc định bắt đầu từ trang 1
  const [page, setPage] = useState(1);
  // State đánh dấu xem còn dữ liệu để tải tiếp hay không (hasMore)
  const [hasMore, setHasMore] = useState(true);
  // State lưu tổng số lượng ngư dân phù hợp với bộ lọc hiện thời
  const [total, setTotal] = useState(0);
  // State quản lý chuỗi ký tự nhập vào ô tìm kiếm theo tên ngư dân
  const [search, setSearch] = useState("");
  // State quản lý bộ lọc: Chỉ lấy ngư dân đã được Admin duyệt xác minh tích xanh (onlyVerified)
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Khởi tạo tham chiếu useRef để liên kết với thẻ div neo ở đáy danh sách phục vụ việc cuộn trang
  const sentinelRef = useRef(null);

  // Khởi tạo một đối tượng tham chiếu useRef lưu trữ các trạng thái động mới nhất
  // Việc này giúp tránh lỗi bao đóng (closure stale state) trong các sự kiện bất đồng bộ như cuộn chuột
  const stateRef = useRef({ page, hasMore, loadingMore, loading });

  // Theo dõi và cập nhật lại tham chiếu stateRef bất kỳ khi nào các state liên quan thay đổi giá trị
  useEffect(() => {
    stateRef.current = { page, hasMore, loadingMore, loading };
  }, [page, hasMore, loadingMore, loading]);

  // Định nghĩa hàm buildParams tối ưu hóa tạo chuỗi tham số truy vấn URL query string
  const buildParams = useCallback(
    (pageNum) => {
      // Khởi tạo đối tượng URLSearchParams chứa các tham số cơ bản phân trang
      const p = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      // Nếu có chuỗi tìm kiếm, thiết lập tham số 'search'
      if (search) p.set("search", search);
      // Nếu tích chọn bộ lọc xác minh, thiết lập tham số 'verified' bằng true
      if (onlyVerified) p.set("verified", "true");
      // Trả về chuỗi tham số đã được mã hóa định dạng URL
      return p.toString();
    },
    [search, onlyVerified], // Phụ thuộc vào từ khóa tìm kiếm và bộ lọc tích xanh
  );

  // Định nghĩa hàm fetchPage1 tải lại dữ liệu trang đầu tiên (reset danh sách)
  const fetchPage1 = useCallback(async () => {
    // Bật hiệu ứng tải dữ liệu ban đầu
    setLoading(true);
    // Reset lại số trang hiện hành về trang 1
    setPage(1);
    // Bật cờ cho phép tiếp tục tải trang tiếp theo
    setHasMore(true);
    try {
      // Gửi yêu cầu GET API lấy danh sách ngư dân dựa theo các tham số bộ lọc
      const data = await api(`/fishermen?${buildParams(1)}`);
      // Lấy mảng kết quả từ trường data, nếu rỗng thì dùng mảng trống
      const items = data.data ?? [];
      // Cập nhật lại mảng state fishermen bằng dữ liệu mới tải về
      setFishermen(items);
      // Cập nhật tổng số lượng ngư dân thỏa mãn bộ lọc
      setTotal(data.total ?? 0);
      // Nếu số lượng phần tử trả về bằng PAGE_SIZE thì coi như vẫn còn dữ liệu để tải tiếp ở các trang sau
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      /* Im lặng bỏ qua lỗi nếu có sự cố mạng */
    } finally {
      // Tắt hiệu ứng tải dữ liệu ban đầu
      setLoading(false);
    }
  }, [buildParams]);

  // useEffect thiết lập chức năng trì hoãn tìm kiếm (debounce) khi gõ phím
  useEffect(() => {
    // Nếu có từ khóa tìm kiếm, trì hoãn gọi hàm lấy dữ liệu 350ms, ngược lại chạy lập tức (0ms)
    const t = setTimeout(fetchPage1, search ? 350 : 0);
    // Hàm dọn dẹp (cleanup): Tự động hủy timer trước đó nếu người dùng tiếp tục gõ chữ trước khi hết 350ms
    return () => clearTimeout(t);
  }, [fetchPage1, search]);

  // Định nghĩa hàm fetchMore tải thêm trang dữ liệu tiếp theo khi cuộn chuột đến đáy màn hình
  const fetchMore = useCallback(async () => {
    // Đọc trạng thái mới nhất từ tham chiếu stateRef
    const s = stateRef.current;

    // Nếu đang tải dở trang mới, hoặc đã hết dữ liệu, hoặc đang chạy tải trang đầu thì ngắt không làm gì
    if (s.loadingMore || !s.hasMore || s.loading) return;

    // Bật hiệu ứng tải thêm trang dữ liệu
    setLoadingMore(true);
    // Tính toán số trang kế tiếp cần tải
    const nextPage = s.page + 1;
    try {
      // Khởi tạo các tham số phân trang mới
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (onlyVerified) params.set("verified", "true");

      // Gửi yêu cầu lấy thêm ngư dân trang tiếp theo từ backend
      const data = await api(`/fishermen?${params}`);
      const items = data.data ?? [];

      // Nối tiếp mảng ngư dân cũ với mảng ngư dân vừa tải thêm vào state fishermen
      setFishermen((prev) => [...prev, ...items]);
      // Cập nhật lại số trang hiện tại trong state
      setPage(nextPage);
      // Kiểm tra xem trang vừa tải có đủ kích thước tối đa không để xác định còn dữ liệu hay không
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      /* Bỏ qua lỗi */
    } finally {
      // Tắt trạng thái tải thêm
      setLoadingMore(false);
    }
  }, [search, onlyVerified]);

  // useEffect sử dụng IntersectionObserver API để phát hiện khi thẻ sentinel cuộn vào khung hình hiển thị của trình duyệt
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Nếu thẻ sentinel đi vào vùng hiển thị, tự động gọi hàm tải thêm trang dữ liệu mới
        if (entry.isIntersecting) fetchMore();
      },
      // Đặt rootMargin 200px để chủ động kích hoạt tải thêm trước khi người dùng thực sự chạm tới đáy 200px
      { rootMargin: "200px" },
    );
    // Nếu tham chiếu sentinelRef đang gắn với một thẻ DOM thực tế thì tiến hành quan sát
    if (sentinelRef.current) observer.observe(sentinelRef.current);

    // Cleanup function: Ngắt quan sát và hủy kết nối khi component bị unmount hoặc hàm fetchMore thay đổi
    return () => observer.disconnect();
  }, [fetchMore]);

  return (
    <div
      style={{ maxWidth: 960, margin: "0 auto", padding: "32px 164px 80px" }}
    >
      {/* ── Tiêu đề trang (Header) ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: C.dark,
            marginBottom: 8,
          }}
        >
          Mạng Lưới Ngư Dân
        </h1>
      </div>

      {/* ── Thanh bộ lọc và tìm kiếm (Filter bar) ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Ô nhập từ khóa tìm kiếm */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: C.muted,
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên ngư dân..."
            value={search}
            onChange={(e) => setSearch(e.target.value)} // Cập nhật state tìm kiếm khi gõ chữ
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              background: C.white,
            }}
          />
        </div>
      </div>

      {/* ── Danh sách kết quả hiển thị (List) ── */}
      {loading ? (
        // Hiển thị bộ xương giả lập (Skeleton loaders) khi đang tải trang đầu tiên
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer"
              style={{ height: 80, borderRadius: 14 }}
            />
          ))}
        </div>
      ) : fishermen.length === 0 ? (
        // Hiển thị thông báo nếu không có kết quả tìm kiếm nào phù hợp
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, color: C.dark, marginBottom: 6 }}>
            Không tìm thấy ngư dân
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Thử thay đổi từ khóa tìm kiếm
          </div>
        </div>
      ) : (
        // Vòng lặp kết xuất từng thẻ card đại diện cho một ngư dân trong danh sách
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fishermen.map((f) => (
            <FishermanCard key={f.id} fisherman={f} size="full" />
          ))}
        </div>
      )}

      {/* Thẻ div rỗng dùng làm mốc (sentinel) neo đón điểm cuộn trang */}
      <div ref={sentinelRef} style={{ height: 1, marginTop: 32 }} />

      {/* Hiển thị các khối shimmer loading nhỏ bên dưới khi đang cuộn tải thêm trang tiếp theo */}
      {loadingMore && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 12,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer"
              style={{ height: 80, borderRadius: 14 }}
            />
          ))}
        </div>
      )}

      {/* Hiển thị thông báo báo hiệu đã cuộn xem hết toàn bộ danh sách ngư dân hệ thống */}
      {!hasMore && fishermen.length > PAGE_SIZE && (
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: C.muted,
            marginTop: 28,
            fontWeight: 600,
          }}
        >
          Đã hiển thị tất cả {fishermen.length} ngư dân
        </div>
      )}
    </div>
  );
}
