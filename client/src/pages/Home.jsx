import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, MessageSquare, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProductGrid from "../components/ProductGrid";
import { apiFishermen, apiProducts, apiRecipes } from "../services/api";
import { formatCurrency, getProductId, getProductImage } from "../utils/product";

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [fishermen, setFishermen] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [favorites, setFavorites] = useState(
    () => new Set(JSON.parse(localStorage.getItem("haisan-favorites") || "[]")),
  );

  useEffect(() => {
    Promise.allSettled([
      apiProducts.getAll(),
      apiFishermen.getAll(),
      apiRecipes.getAll(),
    ]).then(([productResult, fishermanResult, recipeResult]) => {
      if (productResult.status === "fulfilled") {
        const data = productResult.value;
        setProducts(Array.isArray(data) ? data : data?.products || []);
      }
      if (fishermanResult.status === "fulfilled") {
        const data = fishermanResult.value;
        setFishermen(Array.isArray(data) ? data : data?.fishermen || []);
      }
      if (recipeResult.status === "fulfilled") {
        const data = recipeResult.value;
        setRecipes(Array.isArray(data) ? data : data?.recipes || []);
      }
    });
  }, []);

  const activeProducts = useMemo(
    () =>
      products
        .filter((product) => (product.status || "Active") === "Active")
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [products],
  );
  const featuredProduct = activeProducts[slideIndex % Math.max(activeProducts.length, 1)];

  const changeSlide = (direction) => {
    if (activeProducts.length < 2) return;
    setSlideIndex((current) => (current + direction + activeProducts.length) % activeProducts.length);
  };

  const toggleFavorite = (productId) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      localStorage.setItem("haisan-favorites", JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <div className="home-page page-container">
      <section className="market-hero">
        {featuredProduct && (
          <img className="market-hero__background" src={getProductImage(featuredProduct)} alt="" />
        )}
        <div className="market-hero__overlay" />
        {activeProducts.length > 1 && (
          <>
            <button aria-label="Mẻ hàng trước" className="market-hero__arrow is-left" onClick={() => changeSlide(-1)} type="button">
              <ChevronLeft />
            </button>
            <button aria-label="Mẻ hàng tiếp theo" className="market-hero__arrow is-right" onClick={() => changeSlide(1)} type="button">
              <ChevronRight />
            </button>
          </>
        )}
        <div className="market-hero__content">
          <span className="eyebrow">DIRECT SEAFOOD MARKETPLACE</span>
          <h1>Hải sản theo mẻ, theo vị trí, từ người bán thật.</h1>
          <p>
            Khám phá nguồn hàng, kiểm tra độ tươi và trò chuyện trực tiếp với ngư dân.
            Mọi trao đổi mua bán diễn ra trực tiếp giữa hai bên qua tin nhắn.
          </p>
          <div className="market-hero__actions">
            <Link className="button button--primary" to="/marketplace">Khám phá chợ hải sản</Link>
            <Link className="button button--secondary" to="/chat"><MessageSquare size={17} /> Tin nhắn</Link>
          </div>
          {featuredProduct && (
            <button
              className="market-hero__featured"
              onClick={() => navigate(`/product/${getProductId(featuredProduct)}`)}
              type="button"
            >
              <img src={getProductImage(featuredProduct)} alt="" />
              <span>
                <small>MỚI CẬP BẾN</small>
                <strong>{featuredProduct.name}</strong>
                <em>{formatCurrency(featuredProduct.price)} / kg · {featuredProduct.sellerName}</em>
              </span>
            </button>
          )}
        </div>
      </section>

      <section className="home-section">
        <header className="section-heading">
          <div><span className="eyebrow">FRESH LISTINGS</span><h2>Mẻ hàng mới</h2></div>
          <Link to="/marketplace">Xem tất cả</Link>
        </header>
        <ProductGrid
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          products={activeProducts.slice(0, 4)}
        />
      </section>

      <section className="home-section">
        <header className="section-heading">
          <div><span className="eyebrow">SELLER NETWORK</span><h2>Ngư dân nổi bật</h2></div>
        </header>
        <div className="home-seller-grid">
          {fishermen.slice(0, 6).map((seller) => (
            <Link className="home-seller-card" key={seller.id || seller._id} to={`/fisherman/${seller.id || seller._id}`}>
              <span>{(seller.name || "ND").slice(0, 2).toUpperCase()}</span>
              <div>
                <h3>{seller.name} {seller.isVerified && <ShieldCheck size={15} />}</h3>
                <p><MapPin size={13} /> {seller.locationName || "Việt Nam"}</p>
                <small>{seller.followersCount || 0} người theo dõi · {Number(seller.ratingAvg || 0).toFixed(1)} ★</small>
              </div>
            </Link>
          ))}
          {fishermen.length === 0 && <div className="empty-state">Chưa có hồ sơ ngư dân.</div>}
        </div>
      </section>

      <section className="home-section">
        <header className="section-heading">
          <div><span className="eyebrow">SEAFOOD KITCHEN</span><h2>Gợi ý chế biến</h2></div>
        </header>
        <div className="home-recipe-grid">
          {recipes.slice(0, 3).map((recipe) => (
            <article className="home-recipe-card" key={recipe.id || recipe._id}>
              {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} />}
              <div><small>{recipe.difficulty || "Dễ"} · {recipe.cookingTime || 30} phút</small><h3>{recipe.title}</h3><p>{recipe.description}</p></div>
            </article>
          ))}
          {recipes.length === 0 && <div className="empty-state">Chưa có công thức được chia sẻ.</div>}
        </div>
      </section>
    </div>
  );
}
