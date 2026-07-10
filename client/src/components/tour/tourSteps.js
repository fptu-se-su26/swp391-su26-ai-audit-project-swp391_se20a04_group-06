const step = (target, title, content, prepare) => ({
  target,
  title,
  content,
  ...(prepare ? { prepare } : {}),
});

export const tourDefinitions = {
  home: {
    id: "home",
    storageKey: "haisan_home_tour_done",
    steps: [
      step(
        '[data-tour="home-hero"]',
        "Chào mừng đến với HảiSản.vn",
        "Đây là nơi bạn bắt đầu khám phá các mẻ hải sản tươi, ngư dân nổi bật và sản phẩm mới cập bến.",
      ),
      step(
        '[data-tour="home-explore-button"]',
        "Khám phá chợ hải sản",
        "Bấm vào đây để đi đến chợ hải sản và xem các sản phẩm đang được rao bán.",
      ),
      step(
        '[data-tour="home-featured-product"]',
        "Mẻ hàng mới cập bến",
        "Khu vực này hiển thị sản phẩm nổi bật hoặc mới cập nhật. Bạn có thể bấm để xem chi tiết.",
      ),
      step(
        '[data-tour="home-new-products"]',
        "Mẻ hàng mới",
        "Các sản phẩm mới nhất sẽ xuất hiện tại đây. Bạn có thể lưu yêu thích hoặc nhắn người bán.",
      ),
      step(
        '[data-tour="ai-launcher"]',
        "Trợ lý AI",
        "Bạn có thể mở AI Assistant để hỏi cách chọn, bảo quản và chế biến hải sản.",
      ),
    ],
  },
  marketplace: {
    id: "marketplace",
    storageKey: "haisan_marketplace_tour_done",
    steps: [
      step(
        '[data-tour="marketplace-heading"]',
        "Chợ hải sản",
        "Đây là nơi bạn tìm kiếm sản phẩm hải sản hoặc các vựa cá đang mở.",
      ),
      step(
        '[data-tour="marketplace-location-button"]',
        "Tìm theo vị trí",
        "Bấm nút này để dùng vị trí của bạn và xem khoảng cách tới người bán.",
      ),
      step(
        '[data-tour="marketplace-view-tabs"]',
        "Hai cách xem chợ",
        "Bạn có thể xem theo từng sản phẩm hoặc theo vựa cá/phiên cập bến.",
      ),
      step(
        '[data-tour="marketplace-filters"]',
        "Bộ lọc tìm kiếm",
        "Dùng bộ lọc để tìm theo tên hải sản, danh mục, độ tươi hoặc mức giá.",
      ),
      step(
        '[data-tour="product-card"]',
        "Thẻ sản phẩm",
        "Mỗi thẻ hiển thị giá, độ tươi, nguồn gốc, người bán và các nút thao tác.",
      ),
      step(
        '[data-tour="product-favorite-button"]',
        "Lưu yêu thích",
        "Bấm biểu tượng này để lưu sản phẩm bạn quan tâm.",
      ),
      step(
        '[data-tour="product-chat-button"]',
        "Nhắn người bán",
        "Bạn có thể nhắn trực tiếp cho ngư dân để hỏi thêm hoặc thương lượng.",
      ),
      step(
        '[data-tour="landing-batch-card"]',
        "Vựa cá",
        "Khi chuyển sang tab Theo vựa cá, bạn sẽ thấy các phiên cập bến gồm nhiều loại hải sản.",
      ),
    ],
  },
  community: {
    id: "community",
    storageKey: "haisan_community_tour_done",
    steps: [
      step(
        '[data-tour="community-heading"]',
        "Cộng đồng HảiSản.vn",
        "Đây là nơi người mua và ngư dân chia sẻ kinh nghiệm chọn, bảo quản và chế biến hải sản.",
      ),
      step(
        '[data-tour="community-create-post"]',
        "Chia sẻ bài viết",
        "Khi đăng nhập, bạn có thể tạo bài viết mới để chia sẻ kiến thức hoặc đặt câu hỏi cho cộng đồng.",
      ),
      step(
        '[data-tour="community-feed"]',
        "Bảng tin cộng đồng",
        "Các bài viết thật từ cộng đồng sẽ xuất hiện tại đây. Nếu chưa có dữ liệu, trang vẫn sẵn sàng khi có bài mới.",
      ),
      step(
        '[data-tour="community-post-card"]',
        "Nội dung bài viết",
        "Mỗi bài hiển thị tác giả, thời gian, nội dung, hình ảnh và hashtag liên quan.",
      ),
      step(
        '[data-tour="community-post-actions"]',
        "Tương tác với cộng đồng",
        "Bạn có thể thích, xem số bình luận hoặc báo cáo nội dung không phù hợp.",
      ),
      step(
        '[data-tour="community-comment"]',
        "Tham gia thảo luận",
        "Nhập bình luận và gửi để trao đổi trực tiếp dưới bài viết.",
      ),
    ],
  },
  recipes: {
    id: "recipes",
    storageKey: "haisan_recipes_tour_done",
    steps: [
      step(
        '[data-tour="recipes-heading"]',
        "Cẩm nang công thức",
        "Khám phá cách chế biến hải sản được chia sẻ bởi cộng đồng HảiSản.vn.",
      ),
      step(
        '[data-tour="recipes-create"]',
        "Chia sẻ công thức",
        "Khi đăng nhập, bạn có thể đăng công thức của mình cùng nguyên liệu, cách làm và hình ảnh.",
      ),
      step(
        '[data-tour="recipes-grid"]',
        "Danh sách công thức",
        "Công thức thật từ hệ thống được sắp xếp thành các thẻ responsive tại đây.",
      ),
      step(
        '[data-tour="recipe-card"]',
        "Thẻ công thức",
        "Thẻ hiển thị ảnh món ăn, độ khó, thời gian nấu, khẩu phần và lượt thích.",
      ),
      step(
        '[data-tour="recipe-card-details"]',
        "Xem chi tiết món ăn",
        "Bấm vào thẻ để xem đầy đủ nguyên liệu, hướng dẫn và phần bình luận.",
      ),
    ],
  },
  boatLog: {
    id: "boat-log",
    storageKey: "haisan_boat_log_tour_done",
    steps: [
      step(
        '[data-tour="boat-log-heading"]',
        "Nhật ký chuyến biển",
        "Boat Log giúp người mua theo dõi hành trình đánh bắt và nguồn gốc của các mẻ hải sản.",
      ),
      step(
        '[data-tour="boat-log-grid"]',
        "Các chuyến biển gần đây",
        "Nhật ký thật từ ngư dân được hiển thị tại đây. Trang vẫn hoạt động an toàn khi chưa có dữ liệu.",
      ),
      step(
        '[data-tour="boat-log-card"]',
        "Thông tin chuyến biển",
        "Mỗi thẻ ghi lại người đăng, nội dung chuyến đi và hình ảnh thực tế nếu có.",
      ),
      step(
        '[data-tour="boat-log-traceability"]',
        "Truy xuất nguồn gốc",
        "Bạn có thể kiểm tra khu vực đánh bắt, tên tàu, thời gian cập bến và nguồn gốc.",
      ),
      step(
        '[data-tour="boat-log-links"]',
        "Sản phẩm và vựa cá liên quan",
        "Nếu nhật ký đã liên kết dữ liệu, bạn có thể mở sản phẩm hoặc vựa cá tương ứng.",
      ),
      step(
        '[data-tour="boat-log-create"]',
        "Ghi nhật ký mới",
        "Với vai trò người bán, bạn có thể thêm Boat Log mới và dùng nhật ký để tạo vựa cá.",
      ),
    ],
  },
  seller: {
    id: "seller",
    storageKey: "haisan_seller_tour_done",
    steps: [
      step(
        '[data-tour="seller-metrics"]',
        "Tổng quan hoạt động",
        "Khu vực này cho bạn biết lượt xem, tin nhắn, số bài đăng, vựa cá và thông báo.",
      ),
      step(
        '[data-tour="seller-batch-overview"]',
        "Vựa cá của tôi",
        "Đây là nơi quản lý các phiên cập bến và tổng số hải sản đang bán.",
      ),
      step(
        '[data-tour="seller-create-batch"]',
        "Tạo vựa cá",
        "Dùng nút này khi bạn vừa cập bến và có nhiều loại hải sản trong cùng một chuyến.",
      ),
      step(
        '[data-tour="seller-featured-products"]',
        "Sản phẩm nổi bật",
        "Bảng này giúp bạn theo dõi sản phẩm có lượt xem cao và trạng thái hiện tại.",
      ),
    ],
  },
  landingBatchForm: {
    id: "landing-batch-form",
    storageKey: "haisan_landing_batch_form_tour_done",
    steps: [
      step(
        '[data-tour="batch-form-steps"]',
        "Form tạo vựa cá 2 bước",
        "Bước 1 nhập thông tin chung của phiên cập bến, bước 2 thêm các loại hải sản.",
        "batch-general",
      ),
      step(
        '[data-tour="batch-form-general"]',
        "Thông tin chung",
        "Nhập tên vựa cá, tên tàu, khu vực đánh bắt, thời gian cập bến và nguồn gốc.",
        "batch-general",
      ),
      step(
        '[data-tour="batch-form-images"]',
        "Ảnh vựa cá",
        "Bạn có thể tải ảnh chung của vựa cá, ví dụ ảnh cập bến hoặc ảnh tổng thể mẻ hàng.",
        "batch-general",
      ),
      step(
        '[data-tour="batch-form-location"]',
        "Vị trí GPS",
        "Vị trí giúp người mua biết khoảng cách tới nơi bán hoặc khu vực cập bến.",
        "batch-general",
      ),
      step(
        '[data-tour="batch-form-products"]',
        "Các loại hải sản",
        "Ở bước này, bạn thêm từng loại hải sản cùng giá và khối lượng.",
        "batch-products",
      ),
      step(
        '[data-tour="batch-form-add-product"]',
        "Thêm loại hải sản",
        "Bấm để thêm một dòng hải sản mới vào vựa.",
        "batch-products",
      ),
      step(
        '[data-tour="batch-form-save"]',
        "Lưu vựa cá",
        "Sau khi kiểm tra dữ liệu, bấm lưu để tạo phiên cập bến thật.",
        "batch-products",
      ),
    ],
  },
  ai: {
    id: "ai",
    storageKey: "haisan_ai_tour_done",
    steps: [
      step(
        '[data-tour="ai-launcher"]',
        "Mở AI Assistant",
        "Bấm nút này để mở trợ lý AI chuyên tư vấn về hải sản.",
      ),
      step(
        '[data-tour="ai-panel"]',
        "Khung trò chuyện AI",
        "AI có thể hỗ trợ chọn hải sản, bảo quản, chế biến và hướng dẫn sử dụng hệ thống.",
        "open-ai",
      ),
      step(
        '[data-tour="ai-suggested-questions"]',
        "Gợi ý câu hỏi",
        "Bạn có thể bấm nhanh vào các câu hỏi gợi ý để bắt đầu cuộc trò chuyện.",
        "open-ai",
      ),
      step(
        '[data-tour="ai-input"]',
        "Nhập câu hỏi riêng",
        "Bạn cũng có thể tự nhập câu hỏi của mình tại đây.",
        "open-ai",
      ),
      step(
        '[data-tour="ai-send-button"]',
        "Gửi câu hỏi",
        "Bấm để gửi câu hỏi cho AI.",
        "open-ai",
      ),
    ],
  },
};

export function getTourForPathname(pathname, { manual = false } = {}) {
  if (pathname === "/") return tourDefinitions.home;
  if (pathname === "/marketplace") return tourDefinitions.marketplace;
  if (pathname === "/community") return tourDefinitions.community;
  if (pathname === "/recipes") return tourDefinitions.recipes;
  if (pathname === "/boat-log" || pathname === "/seller/boat-log") {
    return tourDefinitions.boatLog;
  }
  if (pathname === "/seller" || pathname === "/seller/statistics") {
    return tourDefinitions.seller;
  }
  if (
    pathname === "/seller/landing-batches/new" ||
    /^\/seller\/landing-batches\/[^/]+\/edit$/.test(pathname)
  ) {
    return tourDefinitions.landingBatchForm;
  }
  return manual ? tourDefinitions.ai : null;
}
