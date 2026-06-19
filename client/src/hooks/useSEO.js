/**
 * ============================================================
 *  useSEO.js — Custom Hook quản lý SEO động cho ứng dụng React
 * ============================================================
 *
 * 🧠 SEO (Search Engine Optimization) là gì?
 *    → Là tập hợp các kỹ thuật giúp trang web của bạn xuất hiện
 *      cao hơn trên Google, Facebook, Zalo khi người dùng tìm kiếm.
 *    → Trong HTML thông thường, bạn viết thủ công các thẻ <meta> trong <head>.
 *    → Nhưng trong React (SPA - Single Page Application), trang web
 *      KHÔNG tải lại giữa các trang → cần cập nhật <meta> bằng JavaScript.
 *    → Hook này giải quyết đúng vấn đề đó.
 *
 * 📄 Hook này được dùng ở 3 trang:
 *    1. ProductDetailPage  → SEO cho trang chi tiết sản phẩm hải sản
 *    2. HomePage           → SEO cho trang chủ của chợ
 *    3. SellerProfilePage  → SEO cho trang cá nhân của ngư dân (người bán)
 *
 * 📦 Hook sinh ra 3 nhóm thông tin:
 *    • Thẻ <meta> cơ bản  → Giúp Google hiểu nội dung trang
 *    • Open Graph (OG)    → Hiển thị đẹp khi chia sẻ lên Facebook/Zalo
 *    • JSON-LD            → Dữ liệu có cấu trúc giúp Google hiển thị giá,
 *                           đánh giá, sơ đồ trang ngay trong kết quả tìm kiếm
 */

// ─────────────────────────────────────────────────────────────
// 📌 BƯỚC 1: NHẬP CÁC THỨ CẦN DÙNG
// ─────────────────────────────────────────────────────────────

/**
 * useEffect là một trong những hook quan trọng nhất của React.
 *
 * 🤔 "Effect" ở đây nghĩa là gì?
 *    → Là những việc làm bên ngoài React (side effects), ví dụ:
 *      - Thay đổi tiêu đề tab trình duyệt (document.title)
 *      - Thêm/sửa thẻ <meta> trong <head>
 *      - Gọi API, đặt timer, lắng nghe sự kiện...
 *    → React không tự xử lý những việc này, nên ta dùng useEffect.
 *
 * 🔄 useEffect chạy khi nào?
 *    → Sau mỗi lần component render xong trên màn hình.
 *    → Nếu bạn khai báo [dependencies], nó chỉ chạy lại khi các
 *      giá trị trong mảng đó thay đổi (tối ưu hiệu năng).
 */
import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// 📌 BƯỚC 2: CÁC HẰNG SỐ DÙNG CHUNG (CONSTANTS)
// ─────────────────────────────────────────────────────────────

/**
 * Tên mặc định của website, dùng làm tiêu đề tab khi không có title riêng.
 *
 * 💡 Ví dụ thực tế:
 *    - Trang chủ → tab trình duyệt hiển thị: "Chợ Hải Sản Online | Haisan.vn"
 *    - Trang sản phẩm → "Tôm sú tươi 1kg | Haisan.vn"
 */
const SITE_NAME = "Chợ Hải Sản Online | Haisan.vn";

/**
 * URL gốc (domain) của website.
 *
 * 🔍 Giải thích kỹ đoạn code:
 *    typeof window !== "undefined"
 *    → Kiểm tra xem code đang chạy trên trình duyệt hay server.
 *    → Trong React thuần (Vite/CRA), code luôn chạy trên trình duyệt
 *      nên window luôn tồn tại.
 *    → Nhưng nếu dùng Next.js (SSR - Server Side Rendering), code
 *      được chạy cả trên server Node.js → ở đó không có window!
 *      → Câu điều kiện này ngăn lỗi "window is not defined" trên server.
 *
 * 📌 window.location.origin trả về gì?
 *    → Ví dụ: "https://haisanvn.vn" (lấy từ địa chỉ trình duyệt đang mở)
 */
const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin // Chạy trên trình duyệt → lấy domain thật
    : "https://haisanvn.vn"; // Chạy trên server → dùng domain cứng (fallback)

/**
 * Ảnh mặc định dùng khi chia sẻ link lên mạng xã hội.
 *
 * 📐 Chuẩn kích thước ảnh OG:
 *    → 1200 x 630 pixel (tỉ lệ ~1.91:1)
 *    → Đây là kích thước chuẩn Facebook/Zalo yêu cầu để hiển thị đẹp.
 *
 * 🖼️ hero-ocean.png là ảnh bìa đại diện của toàn bộ website,
 *    chỉ dùng khi trang không có ảnh riêng (sản phẩm, ngư dân...).
 */
const DEFAULT_IMG = `${SITE_URL}/hero-ocean.png`;
// Kết quả: "https://haisanvn.vn/hero-ocean.png"

// ─────────────────────────────────────────────────────────────
// 📌 BƯỚC 3: CÁC HÀM TIỆN ÍCH (UTILITY FUNCTIONS)
// ─────────────────────────────────────────────────────────────

/**
 * setMeta() — Tạo hoặc cập nhật thẻ <meta> trong <head> của trang.
 *
 * ─────────────────────────────────────────────────────────────
 * 🤔 Tại sao cần hàm này?
 *    → Trong HTML thông thường, bạn viết thẻ meta tĩnh:
 *        <meta name="description" content="Chợ hải sản..." />
 *    → Nhưng React chạy như ứng dụng đơn trang (SPA), <head> không tải lại.
 *    → Ta phải dùng JavaScript để thêm/sửa thẻ meta sau khi trang render.
 * ─────────────────────────────────────────────────────────────
 *
 * @param {string} name      - Tên của thẻ meta, ví dụ: "description", "og:title"
 * @param {string} content   - Nội dung của thẻ meta
 * @param {boolean} isProperty - true nếu là thẻ Open Graph (dùng thuộc tính "property")
 *                               false nếu là thẻ thông thường (dùng thuộc tính "name")
 *
 * 📋 Ví dụ kết quả HTML được tạo ra:
 *    setMeta("description", "Mua tôm tươi...")
 *    → <meta name="description" content="Mua tôm tươi..." />
 *
 *    setMeta("og:title", "Tôm sú 1kg", true)
 *    → <meta property="og:title" content="Tôm sú 1kg" />
 *
 * 📌 Tại sao Open Graph dùng "property" thay vì "name"?
 *    → Đây là quy chuẩn do Facebook định nghĩa (giao thức Open Graph Protocol).
 *    → Các mạng xã hội (FB, Zalo, Telegram) đọc "property" để lấy thông tin chia sẻ.
 */
function setMeta(name, content, isProperty = false) {
  // ⛔ Bảo vệ: Nếu content rỗng/null/undefined → bỏ qua, không làm gì.
  // Tránh tạo thẻ meta trống vô nghĩa trong <head>.
  if (!content) return;

  // Chọn tên thuộc tính định danh phù hợp:
  //   - Open Graph → dùng "property": <meta property="og:title" ...>
  //   - Meta thường → dùng "name":    <meta name="description" ...>
  const attr = isProperty ? "property" : "name";

  /**
   * Tìm xem thẻ meta này đã tồn tại trong <head> chưa.
   *
   * document.querySelector() hoạt động như CSS selector:
   *   `meta[name="description"]`   → tìm: <meta name="description">
   *   `meta[property="og:title"]`  → tìm: <meta property="og:title">
   *
   * 🔑 Tại sao tìm trước rồi mới tạo?
   *    → Tránh tạo trùng lặp nhiều thẻ meta giống nhau.
   *    → Chỉ tạo mới nếu chưa có, còn không thì cập nhật cái cũ.
   */
  let el = document.querySelector(`meta[${attr}="${name}"]`);

  // Nếu thẻ meta chưa tồn tại → tạo mới và gắn vào <head>
  if (!el) {
    el = document.createElement("meta"); // Tạo thẻ <meta> mới trong bộ nhớ
    el.setAttribute(attr, name); // Gán thuộc tính: name="description" hoặc property="og:title"
    document.head.appendChild(el); // Chèn thẻ vào cuối <head> của trang
  }

  // Dù thẻ mới tạo hay đã có sẵn → luôn cập nhật nội dung content mới nhất
  el.setAttribute("content", content);
}

/**
 * setLink() — Tạo hoặc cập nhật thẻ <link> trong <head>.
 *
 * ─────────────────────────────────────────────────────────────
 * 🔗 Link canonical là gì và tại sao quan trọng?
 *    → Đôi khi cùng một nội dung có thể truy cập qua nhiều URL khác nhau:
 *        https://haisanvn.vn/san-pham/tom-su
 *        https://haisanvn.vn/san-pham/tom-su?utm_source=facebook
 *        https://haisanvn.vn/san-pham/tom-su?ref=zalo
 *    → Google có thể coi đây là "nội dung trùng lặp" và phạt điểm SEO.
 *    → Canonical URL nói với Google: "Đây là URL GỐC, hãy index URL này!"
 *        <link rel="canonical" href="https://haisanvn.vn/san-pham/tom-su" />
 * ─────────────────────────────────────────────────────────────
 *
 * @param {string} rel  - Loại quan hệ link, ví dụ: "canonical"
 * @param {string} href - Đường dẫn chuẩn cần đặt
 *
 * 📋 Ví dụ HTML tạo ra:
 *    setLink("canonical", "https://haisanvn.vn/san-pham/tom-su")
 *    → <link rel="canonical" href="https://haisanvn.vn/san-pham/tom-su" />
 */
function setLink(rel, href) {
  // Tìm thẻ link đã tồn tại có cùng rel
  let el = document.querySelector(`link[rel="${rel}"]`);

  // Nếu chưa có → tạo mới và gắn vào <head>
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }

  // Cập nhật đường dẫn mới nhất (dù mới tạo hay đã có)
  el.setAttribute("href", href);
}

/**
 * setJsonLd() — Nhúng dữ liệu có cấu trúc JSON-LD vào trang.
 *
 * ─────────────────────────────────────────────────────────────
 * 🤔 JSON-LD là gì?
 *    → Viết tắt của "JSON for Linked Data".
 *    → Là một đoạn JSON đặc biệt giúp Google "hiểu sâu" hơn về nội dung trang.
 *    → Thay vì Google phải đoán: "Đây có phải trang sản phẩm không?",
 *      JSON-LD nói thẳng: "Đây là Product, giá 150.000 VND, còn hàng."
 *
 * 🌟 Lợi ích thực tế:
 *    → Google có thể hiển thị NGAY trong kết quả tìm kiếm:
 *        ⭐⭐⭐⭐⭐ 4.8 (23 đánh giá)  |  150.000₫  |  Còn hàng
 *    → Gọi là "Rich Snippets" hoặc "Rich Results" — tăng tỉ lệ click lên rất nhiều.
 *
 * 📋 Ví dụ HTML tạo ra:
 *    <script type="application/ld+json" id="jsonld-product">
 *      { "@context": "https://schema.org", "@type": "Product", "name": "Tôm sú" }
 *    </script>
 *
 * ─────────────────────────────────────────────────────────────
 * @param {string} id   - ID duy nhất của thẻ script (để tìm lại khi cần cập nhật)
 * @param {object} data - Đối tượng JavaScript sẽ được chuyển thành JSON
 */
function setJsonLd(id, data) {
  // Tìm thẻ script JSON-LD đã tồn tại theo ID
  let el = document.getElementById(id);

  // Nếu chưa có → tạo mới
  if (!el) {
    el = document.createElement("script");
    // type="application/ld+json" là quy chuẩn bắt buộc của Google Schema.org
    el.setAttribute("type", "application/ld+json");
    // Gán ID để lần sau tìm lại cập nhật thay vì tạo thẻ script mới
    el.setAttribute("id", id);
    document.head.appendChild(el);
  }

  /**
   * Chuyển đối tượng JavaScript → chuỗi JSON và đặt làm nội dung thẻ script.
   *
   * JSON.stringify() chuyển:
   *   { name: "Tôm sú", price: 150000 }
   * thành chuỗi:
   *   '{"name":"Tôm sú","price":150000}'
   *
   * ⚠️ Dùng .textContent thay vì .innerHTML để tránh lỗ hổng XSS
   *    (tấn công chèn mã độc vào trang qua nội dung không an toàn).
   */
  el.textContent = JSON.stringify(data);
}

// ─────────────────────────────────────────────────────────────
// 📌 BƯỚC 4: HOOK CHÍNH — useSEO()
// ─────────────────────────────────────────────────────────────

/**
 * useSEO() — Custom Hook quản lý toàn bộ SEO cho một trang React.
 *
 * ─────────────────────────────────────────────────────────────
 * 🤔 Custom Hook là gì?
 *    → Là một hàm JavaScript bình thường, nhưng:
 *        1. Tên BẮT BUỘC bắt đầu bằng "use" (React quy định).
 *        2. Bên trong được gọi các hook khác (useEffect, useState...).
 *    → Custom hook giúp tái sử dụng logic phức tạp ở nhiều component.
 *    → Thay vì viết lại 40 dòng SEO ở mỗi trang, chỉ cần gọi: useSEO({...})
 *
 * ─────────────────────────────────────────────────────────────
 * 📥 THAM SỐ ĐẦU VÀO (props/options):
 *
 * @param {string}  title       - Tiêu đề trang. Ví dụ: "Tôm sú tươi 1kg"
 *                                → Hiện trên tab, kết quả Google, khi chia sẻ Facebook
 *
 * @param {string}  description - Mô tả ngắn (~150 ký tự).
 *                                → Google hiển thị đoạn này dưới tiêu đề trong kết quả tìm kiếm.
 *
 * @param {string}  [image]     - URL ảnh xem trước khi chia sẻ link.
 *                                → Nên dùng ảnh đã qua Cloudinary tối ưu kích thước.
 *                                → Không bắt buộc: sẽ dùng DEFAULT_IMG nếu thiếu.
 *
 * @param {string}  [url]       - URL canonical (URL chuẩn) của trang.
 *                                → Không bắt buộc: mặc định lấy URL trình duyệt hiện tại.
 *
 * @param {object}  [product]   - Truyền vào khi đây là trang chi tiết sản phẩm.
 *                                → Hook sẽ sinh JSON-LD Schema "Product" cho Google.
 *                                → Gồm: name, price, remainingWeight, sellerName, sellerRating...
 *
 * @param {object}  [seller]    - Truyền vào khi đây là trang cá nhân ngư dân.
 *                                → Hook sẽ sinh JSON-LD Schema "Person" cho Google.
 *                                → Gồm: name, url...
 *
 * ─────────────────────────────────────────────────────────────
 * 🚀 Cách dùng thực tế trong component:
 *
 *    // Trang sản phẩm
 *    useSEO({
 *      title: "Tôm sú tươi 1kg - Đà Nẵng",
 *      description: "Tôm sú tươi đánh bắt sáng nay, giao trong 2 giờ",
 *      image: "https://res.cloudinary.com/.../tom-su.jpg",
 *      product: { name: "Tôm sú", price: 150000, remainingWeight: 5 }
 *    });
 *
 *    // Trang chủ
 *    useSEO({
 *      title: "Chợ Hải Sản Online",
 *      description: "Mua hải sản tươi sống từ ngư dân, giao nhanh 20km"
 *    });
 */
export function useSEO({
  title,
  description,
  image,
  url,
  product,
  seller,
} = {}) {
  // Dấu {} = {} ở cuối: nếu hook được gọi không có tham số, dùng object rỗng làm mặc định
  // → Tránh lỗi "Cannot destructure property 'title' of undefined"

  /**
   * useEffect: Chạy các thao tác DOM (thay đổi <head>) sau khi React render xong.
   *
   * 🔄 Mảng dependencies: [title, description, image, url, product, seller]
   *    → Mỗi khi BẤT KỲ giá trị nào trong mảng này thay đổi,
   *      toàn bộ code bên trong useEffect sẽ chạy lại.
   *    → Ví dụ: User chuyển từ trang sản phẩm A sang B → title thay đổi
   *      → useEffect chạy lại → <meta> được cập nhật cho sản phẩm B.
   *
   * ⚠️ Nếu bỏ mảng dependencies (để trống), useEffect chạy sau MỖI lần render
   *    → Lãng phí tài nguyên, không cần thiết.
   */
  useEffect(() => {
    // ─── 4.1: CHUẨN BỊ GIÁ TRỊ ───────────────────────────────────────

    /**
     * Tạo tiêu đề đầy đủ cho trang.
     *
     * 🎯 Cấu trúc chuẩn SEO: "[Tiêu đề trang] | [Tên website]"
     *    → "Tôm sú tươi 1kg | Haisan.vn"
     *    → Người dùng nhìn vào tab biết ngay đang ở trang nào và thuộc site nào.
     *
     * Toán tử 3 ngôi (ternary): điều_kiện ? giá_trị_nếu_đúng : giá_trị_nếu_sai
     */
    const fullTitle = title ? `${title} | Haisan.vn` : SITE_NAME;

    /**
     * Lấy mô tả trang hoặc dùng mô tả mặc định của toàn site.
     *
     * 💡 Tip viết description SEO tốt:
     *    - Độ dài lý tưởng: 120–160 ký tự
     *    - Chứa từ khóa chính
     *    - Có call-to-action: "Mua ngay", "Giao nhanh 2h"...
     *    - Phải hấp dẫn để người dùng muốn nhấp vào
     */
    const desc =
      description ||
      "Chợ hải sản tươi sống & khô trực tiếp từ ngư dân. Mua tôm, cá, mực tươi giao nhanh 20km.";

    // Lấy ảnh truyền vào, nếu không có thì dùng ảnh mặc định của site
    const img = image || DEFAULT_IMG;

    /**
     * Lấy URL canonical (URL chuẩn) của trang.
     *
     * window.location.href trả về URL đầy đủ hiện tại trong thanh địa chỉ.
     * Ví dụ: "https://haisanvn.vn/san-pham/tom-su?ref=zalo"
     *
     * Nhưng thông thường ta nên truyền URL sạch vào (không có query string):
     * "https://haisanvn.vn/san-pham/tom-su"
     */
    const canonical = url || window.location.href;

    // ─── 4.2: CÁC THẺ META CƠ BẢN (STANDARD META TAGS) ──────────────

    /**
     * document.title: Tiêu đề hiển thị trên tab trình duyệt.
     *
     * 📌 Đây KHÔNG phải thẻ <meta>, đây là thẻ <title> trong <head>.
     *    Kết quả: <title>Tôm sú tươi 1kg | Haisan.vn</title>
     *
     * 🔍 Google dùng thẻ này làm tiêu đề xanh in đậm trong kết quả tìm kiếm.
     */
    document.title = fullTitle;

    /**
     * Meta description: Đoạn mô tả hiển thị dưới tiêu đề trong Google.
     *
     * Kết quả: <meta name="description" content="Chợ hải sản tươi..." />
     *
     * ⚠️ Google không đảm bảo dùng đúng nội dung này, đôi khi tự lấy
     *    từ nội dung trang nếu thấy phù hợp hơn. Nhưng vẫn nên đặt!
     */
    setMeta("description", desc);

    /**
     * Link canonical: Chỉ định URL "chính thức" của trang này.
     *
     * Kết quả: <link rel="canonical" href="https://haisanvn.vn/san-pham/tom-su" />
     *
     * 🛡️ Bảo vệ khỏi bị phạt SEO do duplicate content (nội dung trùng lặp).
     */
    setLink("canonical", canonical);

    // ─── 4.3: OPEN GRAPH TAGS (DÙNG KHI CHIA SẺ LÊN MẠNG XÃ HỘI) ────

    /**
     * 🌐 Open Graph Protocol (OGP) là gì?
     *    → Được Facebook tạo ra năm 2010, nay được hầu hết mạng xã hội hỗ trợ:
     *      Facebook, Zalo, Telegram, LinkedIn, Discord, iMessage...
     *    → Khi bạn paste link vào Facebook, Facebook đọc các thẻ og: này
     *      để tạo preview card đẹp (ảnh, tiêu đề, mô tả).
     *
     * 📋 Cấu trúc HTML tạo ra:
     *    <meta property="og:type"    content="product" />
     *    <meta property="og:title"   content="Tôm sú tươi 1kg | Haisan.vn" />
     *    <meta property="og:image"   content="https://...tom-su.jpg" />
     *    ...
     */

    // og:type — Loại nội dung: "product" cho trang sản phẩm, "website" cho các trang khác
    setMeta("og:type", product ? "product" : "website", true);

    // og:site_name — Tên thương hiệu website (luôn cố định)
    setMeta("og:site_name", "Haisan.vn", true);

    // og:title — Tiêu đề hiển thị trong preview card khi chia sẻ
    setMeta("og:title", fullTitle, true);

    // og:description — Mô tả ngắn trong preview card
    setMeta("og:description", desc, true);

    // og:image — URL ảnh preview (quan trọng: phải là URL tuyệt đối, có https://)
    setMeta("og:image", img, true);

    // og:image:width & height — Kích thước chuẩn Facebook: 1200x630 pixel
    // Giúp Facebook hiển thị ảnh ngay mà không cần tải để đo kích thước
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "630", true);

    // og:url — URL canonical (để Facebook dùng URL đúng khi đếm like/share)
    setMeta("og:url", canonical, true);

    // og:locale — Ngôn ngữ nội dung, "vi_VN" = Tiếng Việt Việt Nam
    setMeta("og:locale", "vi_VN", true);

    // ─── 4.4: TWITTER CARD TAGS ────────────────────────────────────────

    /**
     * 🐦 Twitter Card (nay là X Card):
     *    → Tương tự Open Graph nhưng dành riêng cho Twitter/X.
     *    → "summary_large_image": Hiển thị ảnh to chiếm toàn bộ chiều ngang card.
     *      (Thay vì "summary" chỉ hiển thị ảnh nhỏ góc trái)
     *
     * 📋 HTML tạo ra:
     *    <meta name="twitter:card"        content="summary_large_image" />
     *    <meta name="twitter:title"       content="Tôm sú tươi 1kg | Haisan.vn" />
     *    <meta name="twitter:description" content="..." />
     *    <meta name="twitter:image"       content="https://...tom-su.jpg" />
     */
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", img);

    // ─── 4.5: JSON-LD STRUCTURED DATA (DỮ LIỆU CÓ CẤU TRÚC) ──────────

    /**
     * 🏗️ Schema.org là gì?
     *    → Là từ điển chung mà Google, Bing, Yahoo thống nhất dùng để hiểu web.
     *    → Có hàng trăm "type": Product, Person, WebSite, Recipe, Event, FAQ...
     *    → Khi bạn dùng đúng Schema, Google có thể tạo "Rich Results":
     *
     *    🔍 Ví dụ Rich Result cho sản phẩm:
     *       Tôm sú tươi 1kg - Haisan.vn
     *       ⭐⭐⭐⭐⭐ 4.8 (23 đánh giá) | 150.000₫ | Còn hàng
     *       Chợ hải sản tươi sống từ ngư dân. Giao nhanh 20km...
     *
     * 3 nhánh logic dưới đây tạo 3 loại Schema khác nhau tùy trang:
     */

    if (product) {
      // ── Nhánh 1: Trang chi tiết SẢN PHẨM → Schema "Product" ─────────

      /**
       * parseFloat() + toFixed(0): Làm sạch và format giá tiền.
       *
       * 🔢 Ví dụ:
       *    fmt("150000.5") → "150001"
       *    fmt(null)       → "0"
       *    fmt("abc")      → "0"  (parseFloat("abc") = NaN → 0)
       *    fmt(undefined)  → "0"
       *
       * Tại sao dùng string "0" thay vì số 0?
       * → toFixed() luôn trả về string, nhất quán với yêu cầu của Schema.org.
       */
      const fmt = (price) => parseFloat(price || 0).toFixed(0);

      /**
       * 📦 Schema Product đầy đủ:
       *
       * setJsonLd tạo ra đoạn HTML này trong <head>:
       *
       *   <script type="application/ld+json" id="jsonld-product">
       *   {
       *     "@context": "https://schema.org",
       *     "@type": "Product",
       *     "name": "Tôm sú tươi 1kg",
       *     "description": "Tôm đánh sáng nay...",
       *     "image": "https://.../tom-su.jpg",
       *     "url": "https://haisanvn.vn/san-pham/tom-su",
       *     "offers": {
       *       "@type": "Offer",
       *       "priceCurrency": "VND",
       *       "price": "150000",
       *       "availability": "https://schema.org/InStock",
       *       "seller": { "@type": "Person", "name": "Nguyễn Văn A" }
       *     },
       *     "aggregateRating": {
       *       "@type": "AggregateRating",
       *       "ratingValue": "4.8",
       *       "ratingCount": 23,
       *       "bestRating": "5",
       *       "worstRating": "1"
       *     }
       *   }
       *   </script>
       */
      setJsonLd("jsonld-product", {
        "@context": "https://schema.org", // Khai báo dùng từ điển Schema.org
        "@type": "Product", // Đây là schema kiểu Sản phẩm
        name: product.name, // Tên sản phẩm
        description: product.description || desc, // Mô tả sản phẩm (ưu tiên mô tả riêng)
        image: product.coverImg || img, // Ảnh sản phẩm
        url: canonical, // Đường link sản phẩm

        // "offers" mô tả thông tin bán hàng: giá, tiền tệ, tình trạng kho
        offers: {
          "@type": "Offer",
          priceCurrency: "VND", // VND = Việt Nam Đồng (mã ISO 4217)
          price: fmt(product.price), // Giá bán (dạng string số nguyên)

          /**
           * Trạng thái kho hàng (Availability):
           *    remainingWeight > 0 → "InStock"  (Còn hàng)
           *    remainingWeight = 0 → "OutOfStock" (Hết hàng)
           *
           * Google đọc thông tin này để hiển thị badge "Còn hàng/Hết hàng"
           * ngay trong kết quả tìm kiếm → tăng độ tin cậy với người mua.
           */
          availability:
            parseFloat(product.remainingWeight) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",

          // Thông tin người bán (ngư dân)
          seller: {
            "@type": "Person",
            name: product.sellerName,
          },
        },

        /**
         * Spread operator (...) kết hợp với Conditional (điều kiện):
         *
         * ...(điều_kiện ? { aggregateRating: {...} } : {})
         *
         * → Nếu có đánh giá → thêm trường aggregateRating vào object.
         * → Nếu không có → spread một object rỗng {} (không thêm gì).
         *
         * 🌟 Tại sao chỉ thêm khi có đánh giá?
         *    → Google yêu cầu: nếu khai báo aggregateRating thì
         *      ratingCount PHẢI > 0. Nếu không có đánh giá mà vẫn khai báo
         *      → Google coi là dữ liệu sai → bị phạt.
         */
        ...(product.sellerRating && parseFloat(product.sellerRating) > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: parseFloat(product.sellerRating).toFixed(1), // "4.8"
                ratingCount: product.ratingCount || 1, // Số lượt đánh giá (tối thiểu 1)
                bestRating: "5", // Điểm tối đa
                worstRating: "1", // Điểm tối thiểu
              },
            }
          : {}), // Không thêm gì nếu chưa có đánh giá
      });
    } else if (seller) {
      // ── Nhánh 2: Trang CÁ NHÂN NGƯ DÂN → Schema "Person" ────────────

      /**
       * Schema Person giúp Google hiểu đây là trang hồ sơ cá nhân người bán.
       *
       * Kết quả Google có thể nhận diện:
       *   "Nguyễn Văn A - Ngư dân tại Đà Nẵng"
       *   và hiển thị Knowledge Panel (bảng thông tin bên phải) cho profile nổi tiếng.
       */
      setJsonLd("jsonld-product", {
        "@context": "https://schema.org",
        "@type": "Person",
        name: seller.name, // Tên ngư dân
        url: canonical, // Link trang hồ sơ của họ
      });
    } else {
      // ── Nhánh 3: TRANG CHỦ hoặc trang khác → Schema "WebSite" ───────

      /**
       * Schema WebSite + SearchAction:
       *    → Giúp Google hiểu cấu trúc website của bạn.
       *    → "potentialAction" kiểu SearchAction: Khai báo chức năng tìm kiếm.
       *
       * 🔍 Kết quả trên Google (Sitelinks Searchbox):
       *    ┌────────────────────────────────────────┐
       *    │ Haisan.vn — Chợ Hải Sản Online         │
       *    │ [_________Tìm kiếm trên Haisan.vn_____] │
       *    └────────────────────────────────────────┘
       *    → Google có thể nhúng ô tìm kiếm ngay vào kết quả tìm kiếm!
       *      Người dùng tìm từ ngay trên Google mà không cần vào site.
       *
       * 🔗 target: URL search với placeholder {search_term_string}
       *    → "https://haisanvn.vn/?search=tôm sú"
       *    → "query-input": Google biết tên tham số tìm kiếm là gì.
       */
      setJsonLd("jsonld-product", {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Haisan.vn — Chợ Hải Sản Online",
        url: SITE_URL,
        description: desc,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      });
    }

    // ─── 4.6: CLEANUP FUNCTION ─────────────────────────────────────────

    /**
     * Hàm cleanup (dọn dẹp) — được gọi khi component BỊ HỦY (unmount).
     *
     * 🤔 Khi nào component bị hủy?
     *    → User chuyển sang trang khác (React Router unmount component cũ).
     *    → Component bị xóa khỏi cây DOM vì điều kiện render thay đổi.
     *
     * 🔄 Vòng đời của useEffect:
     *    1. Component mount    → useEffect() chạy → đặt title, meta...
     *    2. Dependencies thay đổi → cleanup() chạy → useEffect() chạy lại
     *    3. Component unmount  → cleanup() chạy → khôi phục title gốc
     *
     * ⚠️ Tại sao chỉ khôi phục title mà không xóa meta?
     *    → Meta tags từ trang mới sẽ ghi đè (overwrite) meta tags cũ → OK.
     *    → Nhưng nếu xóa hết meta rồi tạo lại → có thể bị "nhấp nháy" brief.
     *    → Title thì khác: nếu không reset, tab vẫn giữ title của trang vừa rời đi.
     */
    return () => {
      document.title = SITE_NAME; // Về lại tên mặc định của website
    };

    // Mảng dependencies: useEffect theo dõi 6 giá trị này
    // Chỉ chạy lại khi ít nhất một trong số chúng thay đổi
  }, [title, description, image, url, product, seller]);
}
