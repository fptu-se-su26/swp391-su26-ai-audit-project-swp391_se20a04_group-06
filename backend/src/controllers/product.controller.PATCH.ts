/**
 * product.controller.PATCH.ts
 *
 * Thêm `u.IsVerified AS sellerIsVerified` vào TẤT CẢ queries
 * trả về danh sách/chi tiết sản phẩm để frontend hiện badge.
 *
 * ─── Tìm trong product.controller.ts ───
 *
 * Tìm tất cả dòng có:
 *   u.Name AS sellerName
 *
 * Thêm ngay sau:
 *   u.IsVerified AS sellerIsVerified,
 *
 * Ví dụ trong getProducts():
 *
 *   SELECT
 *     p.ProductID AS id, p.Name AS name, p.Price AS price,
 *     ...
 *     u.Name   AS sellerName,
 *     u.UserID AS sellerId,
 *     u.Phone  AS sellerPhone,
 *     u.IsVerified AS sellerIsVerified    ← THÊM
 *   FROM Product p
 *   JOIN User u ON u.UserID = p.SellerID
 *   ...
 *
 * Áp dụng cho:
 *   - getProducts()     → trang chủ
 *   - getProduct()      → detail page
 *   - getMyProducts()   → dashboard
 *   - searchProducts()  → search
 *   - getSellerProducts() → seller profile
 */

export const PRODUCT_QUERY_PATCH = `
-- Thêm vào SELECT của tất cả product queries:
u.IsVerified AS sellerIsVerified
`;

/**
 * ─── Thêm vào GET /api/users/:id (SellerProfile) ───
 *
 * Nếu chưa có route /users/:id, thêm vào auth.routes.ts hoặc tạo user.routes.ts:
 *
 *   router.get('/users/:id', async (req, res) => {
 *     const id = parseInt(req.params.id);
 *     const [rows] = await pool.query(
 *       `SELECT UserID AS id, Name AS name, Phone AS phone,
 *               IsVerified AS isVerified, CreatedAt AS createdAt
 *        FROM User WHERE UserID = ? AND IsActive = 1`,
 *       [id]
 *     );
 *     if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy' });
 *     return res.json(rows[0]);
 *   });
 */
