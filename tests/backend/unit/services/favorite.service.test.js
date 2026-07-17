"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng favoriteService cần chạy kiểm thử đơn vị
const favorite_service_1 = require("../../../../backend/src/services/favorite.service");
// Import đối tượng userRepository để giả lập hồ sơ người dùng và các hành vi yêu thích
const user_repository_1 = require("../../../../backend/src/repositories/user.repository");
// Import đối tượng productRepository để giả lập sự tồn tại của sản phẩm hải sản
const product_repository_1 = require("../../../../backend/src/repositories/product.repository");
// Giả lập các dependencies lớp ngoài để tránh kết nối đến database thật khi chạy kiểm thử
jest.mock("../../../../backend/src/repositories/user.repository");
jest.mock("../../../../backend/src/repositories/product.repository");
// Định nghĩa nhóm kiểm thử đơn vị cho Favorite Service
describe("Unit Test: Nghiệp vụ Favorite Service (favorite.service.ts)", () => {
    // Định nghĩa các ID mẫu hợp lệ và không hợp lệ phục vụ kiểm thử
    const mockUserId = "60c72b2f9b1d8b2bad000001";
    const mockProductId = "60c72b2f9b1d8b2bad000002";
    const invalidId = "invalid_id_format";
    // Hàm chạy trước mỗi ca kiểm thử để làm sạch trạng thái giả lập của Jest
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // Nhóm kiểm thử dành cho nghiệp vụ lấy danh sách yêu thích getMyFavorites
    describe("Nghiệp vụ getMyFavorites", () => {
        // Ca kiểm thử 1: Trả về lỗi 404 nếu không tìm thấy người dùng
        it("Nên báo lỗi 404 nếu không tìm thấy thông tin tài khoản người dùng", async () => {
            // Giả lập hàm findFavoritesPopulated trả về giá trị null
            user_repository_1.userRepository.findFavoritesPopulated.mockResolvedValue(null);
            // Kích hoạt hàm kiểm thử và kỳ vọng ném ra lỗi 404 tương ứng
            await expect(favorite_service_1.favoriteService.getMyFavorites(mockUserId)).rejects.toThrow(expect.objectContaining({
                status: 404,
                message: "Không tìm thấy người dùng",
            }));
        });
        // Ca kiểm thử 2: Trả về danh sách mẻ hàng yêu thích đã được định dạng chuẩn hóa thành công
        it("Nên trả về danh sách mẻ hàng yêu thích đã được chuẩn hóa cấu trúc dữ liệu", async () => {
            // Dữ liệu người dùng giả lập đã liên kết thông tin favorites đầy đủ
            const mockPopulatedUser = {
                _id: mockUserId,
                favorites: [
                    {
                        _id: mockProductId,
                        name: "Tôm hùm bông",
                        price: 850000,
                        type: "Fresh",
                        status: "Active",
                        remainingWeight: 10,
                        viewCount: 120,
                        createdAt: new Date(),
                        images: ["tom_hum.png"],
                        sellerId: {
                            name: "Ngư dân Trần Văn Dũng",
                            isVerified: true,
                        },
                    },
                ],
            };
            // Cấu hình hàm mock trả về dữ liệu mẫu trên
            user_repository_1.userRepository.findFavoritesPopulated.mockResolvedValue(mockPopulatedUser);
            // Thực thi hàm lấy danh sách yêu thích
            const result = await favorite_service_1.favoriteService.getMyFavorites(mockUserId);
            // Kỳ vọng danh sách trả về có độ dài bằng 1
            expect(result).toHaveLength(1);
            // Kỳ vọng phần tử đầu tiên chứa đầy đủ các trường thông tin đã chuẩn hóa khớp cấu trúc mong muốn
            expect(result[0]).toEqual(expect.objectContaining({
                id: mockProductId,
                name: "Tôm hùm bông",
                price: 850000,
                sellerName: "Ngư dân Trần Văn Dũng",
                sellerIsVerified: 1,
                coverImg: "tom_hum.png",
            }));
        });
    });
    // Nhóm kiểm thử dành cho nghiệp vụ bật/tắt yêu thích sản phẩm toggleFavorite
    describe("Nghiệp vụ toggleFavorite (Bật/Tắt mẻ hàng yêu thích)", () => {
        // Ca kiểm thử 1: Ném lỗi 400 nếu định dạng ID sản phẩm bị sai
        it("Nên báo lỗi 400 nếu định dạng ID sản phẩm không hợp lệ", async () => {
            // Thực thi hàm và kỳ vọng lỗi 400 được ném ra ngoài
            await expect(favorite_service_1.favoriteService.toggleFavorite(mockUserId, invalidId)).rejects.toThrow(expect.objectContaining({
                status: 400,
                message: "ID không hợp lệ",
            }));
        });
        // Ca kiểm thử 2: Lưu yêu thích thành công nếu sản phẩm hợp lệ và chưa từng yêu thích trước đó
        it("Nên tiến hành thêm vào danh sách yêu thích khi chưa lưu và sản phẩm còn hoạt động", async () => {
            // Giả lập tài khoản tồn tại và danh sách favorites hiện tại đang trống rỗng
            user_repository_1.userRepository.findRawById.mockResolvedValue({
                _id: mockUserId,
                favorites: [],
            });
            // Giả lập sản phẩm có tồn tại và không bị xóa
            product_repository_1.productRepository.exists.mockResolvedValue(true);
            // Gọi hàm bật/tắt yêu thích
            const result = await favorite_service_1.favoriteService.toggleFavorite(mockUserId, mockProductId);
            // Kỳ vọng phản hồi trả về trạng thái favorited bằng true
            expect(result).toEqual({ favorited: true });
            // Đảm bảo userRepository.addFavorite được gọi với đúng tham số
            expect(user_repository_1.userRepository.addFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
        });
        // Ca kiểm thử 3: Báo lỗi 404 nếu sản phẩm không tồn tại hoặc đã bị xóa
        it("Nên báo lỗi 404 nếu sản phẩm không tồn tại hoặc đã bị xóa khi cố gắng lưu", async () => {
            // Giả lập người dùng hợp lệ có mảng yêu thích trống
            user_repository_1.userRepository.findRawById.mockResolvedValue({
                _id: mockUserId,
                favorites: [],
            });
            // Giả lập sản phẩm không tồn tại (exists = false)
            product_repository_1.productRepository.exists.mockResolvedValue(false);
            // Kích hoạt hàm kiểm thử và kỳ vọng nhận về lỗi 404
            await expect(favorite_service_1.favoriteService.toggleFavorite(mockUserId, mockProductId)).rejects.toThrow(expect.objectContaining({
                status: 404,
                message: "Sản phẩm không tồn tại hoặc đã bị xóa",
            }));
        });
        // Ca kiểm thử 4: Xóa sản phẩm khỏi mảng yêu thích nếu sản phẩm đã được lưu trước đó
        it("Nên xóa khỏi danh sách yêu thích nếu sản phẩm đã được lưu từ trước", async () => {
            // Giả lập sản phẩm đã tồn tại sẵn trong danh sách yêu thích của người dùng
            user_repository_1.userRepository.findRawById.mockResolvedValue({
                _id: mockUserId,
                favorites: [mockProductId], // Đã lưu trước đó
            });
            // Thực thi hàm bật/tắt yêu thích
            const result = await favorite_service_1.favoriteService.toggleFavorite(mockUserId, mockProductId);
            // Kỳ vọng kết quả trả về trạng thái favorited là false (hủy yêu thích thành công)
            expect(result).toEqual({ favorited: false });
            // Đảm bảo userRepository.removeFavorite được gọi với đúng tham số để gỡ sản phẩm yêu thích
            expect(user_repository_1.userRepository.removeFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
        });
    });
});
