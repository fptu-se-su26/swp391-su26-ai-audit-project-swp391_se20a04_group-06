/**
 * useSEO.js — Quản lý thẻ meta tags động + Open Graph + cấu trúc dữ liệu JSON-LD
 *
 * Sử dụng tại các trang:
 *   - ProductDetailPage: SEO cho trang chi tiết sản phẩm
 *   - HomePage: SEO cho trang chủ chợ hải sản
 *   - SellerProfilePage: SEO cho trang cá nhân của ngư dân (người bán)
 */
// Nhập hook useEffect từ thư viện React để quản lý các tác vụ ngoài luồng (side effects)
import { useEffect } from "react";

// Tên website mặc định khi không truyền title
const SITE_NAME = "Chợ Hải Sản Online | Haisan.vn";
// URL gốc của trang web (lấy từ window.location hoặc mặc định nếu chạy server-side)
const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://haisanvn.vn";
// Ảnh xem trước mặc định khi chia sẻ link lên mạng xã hội
const DEFAULT_IMG = `${SITE_URL}/hero-ocean.png`;

// Hàm tiện ích để tạo hoặc cập nhật thẻ <meta> trong thẻ <head> của tài liệu HTML
function setMeta(name, content, isProperty = false) {
  // Nếu không có nội dung content thì thoát ra ngay
  if (!content) return;
  // Xác định tên thuộc tính định danh: dùng "property" cho Open Graph (Facebook), ngược lại dùng "name"
  const attr = isProperty ? "property" : "name";
  // Tìm thẻ meta đã tồn tại trong head có thuộc tính khớp
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  // Nếu thẻ meta đó chưa tồn tại
  if (!el) {
    // Khởi tạo thẻ meta mới
    el = document.createElement("meta");
    // Đặt thuộc tính định danh
    el.setAttribute(attr, name);
    // Chèn thẻ meta mới tạo vào cuối thẻ head của tài liệu
    document.head.appendChild(el);
  }
  // Cập nhật giá trị nội dung content cho thẻ meta
  el.setAttribute("content", content);
}

// Hàm tiện ích tạo hoặc cập nhật thẻ liên kết <link> (ví dụ: link canonical)
function setLink(rel, href) {
  // Tìm thẻ link đã tồn tại có rel khớp
  let el = document.querySelector(`link[rel="${rel}"]`);
  // Nếu chưa tồn tại
  if (!el) {
    // Khởi tạo thẻ link mới
    el = document.createElement("link");
    // Đặt thuộc tính rel
    el.setAttribute("rel", rel);
    // Chèn vào thẻ head
    document.head.appendChild(el);
  }
  // Cập nhật đường dẫn href cho thẻ link
  el.setAttribute("href", href);
}

// Hàm tiện ích tạo hoặc cập nhật đoạn mã JSON-LD cấu trúc dữ liệu hỗ trợ công cụ tìm kiếm Google Search Console
function setJsonLd(id, data) {
  // Tìm thẻ script JSON-LD theo ID
  let el = document.getElementById(id);
  // Nếu chưa tồn tại thẻ script này
  if (!el) {
    // Khởi tạo thẻ script mới
    el = document.createElement("script");
    // Thiết lập type là application/ld+json đúng quy chuẩn Google Structured Data
    el.setAttribute("type", "application/ld+json");
    // Gán ID để tìm kiếm cập nhật cho các trang sau
    el.setAttribute("id", id);
    // Chèn thẻ script vào head
    document.head.appendChild(el);
  }
  // Chuyển đổi đối tượng data sang dạng chuỗi JSON và gán vào nội dung thẻ script
  el.textContent = JSON.stringify(data);
}

/**
 * Hook chính useSEO được gọi bên trong các page component của React
 *
 * @param {object} opts các tùy chọn cấu hình SEO
 * @param {string} opts.title tiêu đề trang hiển thị trên tab trình duyệt và OG:title
 * @param {string} opts.description đoạn mô tả ngắn về trang và OG:description
 * @param {string} [opts.image] ảnh xem trước khi chia sẻ link (đã qua Cloudinary tối ưu)
 * @param {string} [opts.url] đường dẫn canonical chuẩn xác của trang
 * @param {object} [opts.product] đối tượng sản phẩm (nếu là trang chi tiết sản phẩm) để xuất JSON-LD Product
 * @param {object} [opts.seller] đối tượng ngư dân (nếu là trang cá nhân ngư dân) để xuất JSON-LD Person
 */
export function useSEO({
  title,
  description,
  image,
  url,
  product,
  seller,
} = {}) {
  // useEffect chạy các lệnh cập nhật thẻ meta mỗi khi một trong các tham số cấu hình SEO thay đổi
  useEffect(() => {
    // Sinh tiêu đề đầy đủ, nối thêm tên website ở phía sau
    const fullTitle = title ? `${title} | Haisan.vn` : SITE_NAME;
    // Lấy mô tả truyền vào hoặc dùng mô tả mặc định của ứng dụng
    const desc =
      description ||
      "Chợ hải sản tươi sống & khô trực tiếp từ ngư dân. Mua tôm, cá, mực tươi giao nhanh 20km.";
    // Lấy ảnh truyền vào hoặc dùng ảnh mặc định
    const img = image || DEFAULT_IMG;
    // Lấy link canonical truyền vào hoặc mặc định là URL hiện tại của trình duyệt
    const canonical = url || window.location.href;

    // ── Thiết lập các thẻ SEO cơ bản ──
    document.title = fullTitle; // Đặt tiêu đề cho tab trình duyệt
    setMeta("description", desc); // Đặt mô tả SEO meta description
    setLink("canonical", canonical); // Đặt đường dẫn canonical chuẩn hóa URL tránh trùng lặp nội dung

    // ── Thiết lập Open Graph hỗ trợ hiển thị đẹp trên Facebook, Zalo, Telegram share ──
    setMeta("og:type", product ? "product" : "website", true); // Loại định dạng chia sẻ (sản phẩm hoặc website)
    setMeta("og:site_name", "Haisan.vn", true); // Tên website chung
    setMeta("og:title", fullTitle, true); // Tiêu đề chia sẻ
    setMeta("og:description", desc, true); // Mô tả chia sẻ
    setMeta("og:image", img, true); // Link ảnh xem trước
    setMeta("og:image:width", "1200", true); // Chiều rộng chuẩn của ảnh chia sẻ
    setMeta("og:image:height", "630", true); // Chiều cao chuẩn của ảnh chia sẻ
    setMeta("og:url", canonical, true); // URL chia sẻ chuẩn hóa
    setMeta("og:locale", "vi_VN", true); // Ngôn ngữ vùng mặc định (tiếng Việt)

    // ── Thiết lập Twitter Cards hỗ trợ hiển thị chia sẻ trên mạng xã hội Twitter (X) ──
    setMeta("twitter:card", "summary_large_image"); // Dạng thẻ hiển thị ảnh lớn
    setMeta("twitter:title", fullTitle); // Tiêu đề Twitter
    setMeta("twitter:description", desc); // Mô tả Twitter
    setMeta("twitter:image", img); // Ảnh xem trước Twitter

    // ── Thiết lập cấu trúc dữ liệu JSON-LD cho công cụ tìm kiếm Google Bot ──
    if (product) {
      // Hàm định dạng giá tiền (làm tròn số nguyên)
      const fmt = (price) => parseFloat(price || 0).toFixed(0);
      // Ghi nhận dữ liệu cấu trúc Schema Product cho Google hiển thị giá và trạng thái kho hàng trên kết quả tìm kiếm
      setJsonLd("jsonld-product", {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || desc,
        image: product.coverImg || img,
        url: canonical,
        offers: {
          "@type": "Offer",
          priceCurrency: "VND", // Đơn vị tiền tệ Việt Nam Đồng
          price: fmt(product.price), // Giá bán sản phẩm
          // Hiển thị trạng thái còn hàng hay hết hàng dựa theo trọng lượng còn lại
          availability:
            parseFloat(product.remainingWeight) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Person",
            name: product.sellerName,
          },
        },
        // Bổ sung điểm số đánh giá AggregateRating nếu ngư dân có sao đánh giá trung bình
        ...(product.sellerRating && parseFloat(product.sellerRating) > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: parseFloat(product.sellerRating).toFixed(1),
                ratingCount: product.ratingCount || 1,
                bestRating: "5",
                worstRating: "1",
              },
            }
          : {}),
      });
    } else if (seller) {
      // Ghi nhận dữ liệu cấu trúc Schema Person cho trang cá nhân người bán ngư dân
      setJsonLd("jsonld-product", {
        "@context": "https://schema.org",
        "@type": "Person",
        name: seller.name,
        url: canonical,
      });
    } else {
      // Ghi nhận cấu trúc dữ liệu Schema WebSite tìm kiếm nhanh cho trang chủ của ứng dụng
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

    // Cleanup: Khôi phục lại tiêu đề gốc của trang web khi component unmount
    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, image, url, product, seller]); // Chạy lại hiệu ứng SEO mỗi khi một trong các dependencies này thay đổi
}
