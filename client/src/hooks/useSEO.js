/**
 * useSEO.js — Dynamic meta tags + Open Graph + JSON-LD structured data
 *
 * Dùng cho:
 *   - ProductDetailPage: SEO per-product
 *   - HomePage: SEO trang chủ chợ
 *   - SellerProfilePage: SEO trang người bán
 */
import { useEffect } from "react";

const SITE_NAME = "Chợ Hải Sản Online | Haisan.vn";
const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://haisanvn.vn";
const DEFAULT_IMG = `${SITE_URL}/hero-ocean.png`;

function setMeta(name, content, isProperty = false) {
  if (!content) return;
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute("id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Hook chính — gọi trong mỗi page component
 *
 * @param {object} opts
 * @param {string} opts.title       - <title> và OG:title
 * @param {string} opts.description - meta description và OG:description
 * @param {string} [opts.image]     - OG:image (Cloudinary URL đã optimize)
 * @param {string} [opts.url]       - canonical URL
 * @param {object} [opts.product]   - nếu là product page, truyền product object → tạo JSON-LD Product
 * @param {object} [opts.seller]    - nếu là seller page → tạo JSON-LD Person
 */
export function useSEO({
  title,
  description,
  image,
  url,
  product,
  seller,
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Haisan.vn` : SITE_NAME;
    const desc =
      description ||
      "Chợ hải sản tươi sống & khô trực tiếp từ ngư dân. Mua tôm, cá, mực tươi giao nhanh 20km.";
    const img = image || DEFAULT_IMG;
    const canonical = url || window.location.href;

    // ── Basic SEO ──────────────────────────────────────────────
    document.title = fullTitle;
    setMeta("description", desc);
    setLink("canonical", canonical);

    // ── Open Graph (Facebook, Zalo OA share) ──────────────────
    setMeta("og:type", product ? "product" : "website", true);
    setMeta("og:site_name", "Haisan.vn", true);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", desc, true);
    setMeta("og:image", img, true);
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "630", true);
    setMeta("og:url", canonical, true);
    setMeta("og:locale", "vi_VN", true);

    // ── Twitter Card ───────────────────────────────────────────
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", img);

    // ── JSON-LD Structured Data ────────────────────────────────
    if (product) {
      const fmt = (price) => parseFloat(price || 0).toFixed(0);
      setJsonLd("jsonld-product", {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || desc,
        image: product.coverImg || img,
        url: canonical,
        offers: {
          "@type": "Offer",
          priceCurrency: "VND",
          price: fmt(product.price),
          availability:
            parseFloat(product.remainingWeight) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Person",
            name: product.sellerName,
          },
        },
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
      setJsonLd("jsonld-product", {
        "@context": "https://schema.org",
        "@type": "Person",
        name: seller.name,
        url: canonical,
      });
    } else {
      // Trang chủ — BreadcrumbList + WebSite
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

    // Cleanup khi unmount
    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, image, url, product, seller]);
}
