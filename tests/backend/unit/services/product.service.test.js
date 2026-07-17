"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng productService chứa nghiệp vụ logic cần kiểm thử
const product_service_1 = require("../../../../backend/src/services/product.service");
// Import đối tượng productRepository để kiểm tra và giả lập các tương tác cơ sở dữ liệu sản phẩm
const product_repository_1 = require("../../../../backend/src/repositories/product.repository");
// Import đối tượng userRepository để kiểm tra và giả lập các tương tác cơ sở dữ liệu người dùng
const user_repository_1 = require("../../../../backend/src/repositories/user.repository");
// Import thư viện hoặc đối tượng cấu hình kết nối Redis được sử dụng cho bộ nhớ đệm hoặc giới hạn lượt dùng
const redis_1 = require("../../../../backend/src/config/redis");
// Thực hiện giả lập (mock) toàn bộ module productRepository để không gọi trực tiếp vào cơ sở dữ liệu thật
jest.mock("../../../../backend/src/repositories/product.repository");
// Thực hiện giả lập (mock) toàn bộ module userRepository để tránh truy vấn cơ sở dữ liệu người dùng thật
jest.mock("../../../../backend/src/repositories/user.repository");
// Thực hiện giả lập (mock) kết nối Redis và các hàm tương tác với Redis của hệ thống
jest.mock("../../../../backend/src/config/redis", () => ({
    // Trả về một đối tượng giả lập thay thế cho thuộc tính redis được xuất khẩu
    redis: {
        // Giả lập hàm get đọc dữ liệu từ cache Redis
        get: jest.fn(),
        // Giả lập hàm set ghi dữ liệu vào cache Redis
        set: jest.fn(),
        // Giả lập hàm incr để tăng giá trị số đếm lưu trữ trong Redis
        incr: jest.fn(),
        // Giả lập hàm decr để giảm giá trị số đếm lưu trữ trong Redis
        decr: jest.fn(),
        // Giả lập hàm expire thiết lập thời gian hết hạn cho một key trong Redis
        expire: jest.fn(),
        // Giả lập hàm del để xóa một key trong Redis
        del: jest.fn(),
    },
}));
// Thực hiện giả lập dịch vụ badgeService cập nhật danh hiệu người dùng để tránh xử lý logic huy hiệu thực tế
jest.mock("../../../../backend/src/services/badge.service", () => ({
    // Hàm updateUserBadges luôn trả về một mảng rỗng dưới dạng Promise đã giải quyết
    updateUserBadges: jest.fn().mockResolvedValue([]),
}));
// Thực hiện giả lập dịch vụ notificationService thông báo bài đăng để tránh gửi thông báo thực
jest.mock("../../../../backend/src/services/notification.service", () => ({
    // Hàm notifyFollowersNewProduct luôn trả về undefined dưới dạng Promise đã giải quyết thành công
    notifyFollowersNewProduct: jest.fn().mockResolvedValue(undefined),
}));
// Thực hiện giả lập mô hình User của Mongoose để cấu hình các truy vấn tìm kiếm người dùng trong test
jest.mock("../../../../backend/src/models/User", () => {
    // Tạo đối tượng giả lập đại diện cho Model User với các hàm truy vấn thường dùng
    const mUser = {
        // Giả lập hàm find của Mongoose, trả về chính đối tượng hiện tại để cho phép chaining (gọi chuỗi tiếp)
        find: jest.fn().mockReturnThis(),
        // Giả lập hàm lean để tối ưu hóa truy vấn trả về đối tượng Javascript thuần túy thay vì tài liệu Mongoose
        lean: jest.fn().mockResolvedValue([
            // Trả về một phần tử giả lập đại diện cho người bán trong cơ sở dữ liệu
            {
                // ID người dùng giả lập
                _id: "60c72b2f9b1d8b2bad000001",
                // Tên của người dùng giả lập
                name: "Seller A",
                // Trạng thái đã xác minh danh tính
                isVerified: true,
                // Trạng thái là tài khoản Premium
                isPremium: true,
                // Danh sách các danh hiệu/huy hiệu mà người dùng sở hữu
                badges: ["Lão ngư bám biển"],
            }
        ]),
    };
    // Trả về đối tượng đóng gói chứa lớp User giả lập
    return { User: mUser };
});
// Khởi tạo khối describe gom nhóm toàn bộ các ca kiểm thử đơn vị cho dịch vụ Product Service
describe("Unit Test: Nghiệp vụ Product Service (product.service.ts)", () => {
    // Định nghĩa một ID người dùng giả lập cố định dùng chung cho các ca kiểm thử
    const mockUserId = "60c72b2f9b1d8b2bad000001";
    // Định nghĩa một ID sản phẩm giả lập cố định dùng chung cho các ca kiểm thử
    const mockProductId = "60c72b2f9b1d8b2bad000002";
    // Hàm chạy trước mỗi ca kiểm thử đơn lẻ để thiết lập lại môi trường giả lập sạch sẽ
    beforeEach(() => {
        // Xóa sạch lịch sử gọi hàm, số lần gọi và các tham số truyền vào của tất cả các hàm giả lập
        jest.clearAllMocks();
        // Giả lập mặc định cho hàm redis.get trả về null nhằm bỏ qua thời gian trễ hay dữ liệu cache cũ
        redis_1.redis.get.mockResolvedValue(null);
    });
    // Khối gom nhóm kiểm thử cho nghiệp vụ giới hạn số lượng bài đăng sản phẩm hàng ngày của người dùng
    describe("Nghiệp vụ giới hạn đăng bài viết theo ngày", () => {
        // Ca kiểm thử chặn tài khoản thường vượt quá giới hạn 5 bài đăng một ngày
        it("Nên chặn không cho tài khoản thường đăng bài thứ 6 trong ngày", async () => {
            // Thiết lập giả lập hàm tìm kiếm thông tin người dùng thô trả về tài khoản thường (chưa nâng cấp Premium)
            user_repository_1.userRepository.findRawById.mockResolvedValue({
                // ID tài khoản trùng khớp với ID giả lập
                _id: mockUserId,
                // Vai trò người dùng thông thường
                role: "User",
                // Trạng thái chưa đăng ký dịch vụ Premium
                isPremium: false,
            });
            // Thiết lập giả lập cho hàm redis.incr đếm số bài đăng trong ngày trả về giá trị là 6 (vượt giới hạn 5)
            redis_1.redis.incr.mockResolvedValue(6);
            // Định nghĩa dữ liệu sản phẩm mới muốn đăng tải lên hệ thống
            const newProductData = {
                // Loại hải sản tươi sống
                type: "Fresh",
                // Phân loại là Cá
                category: "Fish",
                // Tên mẻ hàng sản phẩm hải sản tươi
                name: "Cá thu Đồ Sơn mẻ mới",
                // Giá bán sản phẩm (VND)
                price: 150000,
                // Khối lượng tổng cộng của mẻ hàng (kg)
                totalWeight: 20,
                // Vĩ độ GPS địa điểm bán
                lat: 20.8449,
                // Kinh độ GPS địa điểm bán
                lng: 106.6881,
            };
            // Kỳ vọng lời gọi tạo sản phẩm mới sẽ bị bác bỏ và ném ra một lỗi xác định
            await expect(
            // Lời gọi thực thi hàm create từ productService với thông tin đầu vào
            product_service_1.productService.create(mockUserId, newProductData)).rejects.toThrow(
            // Kiểm tra đối tượng lỗi ném ra có chứa các thuộc tính mong muốn hay không
            expect.objectContaining({
                // Mã trạng thái lỗi HTTP 403 Forbidden
                status: 403,
                // Nội dung thông điệp báo lỗi chi tiết hiển thị cho người dùng
                message: "Tài khoản thường chỉ được phép đăng tối đa 5 bài viết mỗi ngày. Vui lòng nâng cấp lên Premium để đăng không giới hạn!",
            }));
        });
        // Ca kiểm thử cho phép tài khoản Premium đăng bài không giới hạn số lượng trong ngày
        it("Nên cho phép tài khoản Premium đăng bài không giới hạn số lượng", async () => {
            // Thiết lập giả lập hàm tìm kiếm thông tin người dùng thô trả về tài khoản đã đăng ký gói dịch vụ Premium
            user_repository_1.userRepository.findRawById.mockResolvedValue({
                // ID tài khoản trùng khớp với ID giả lập
                _id: mockUserId,
                // Vai trò người dùng thông thường
                role: "User",
                // Trạng thái đã nâng cấp lên dịch vụ Premium thành công
                isPremium: true,
            });
            // Thiết lập giả lập redis.incr trả về 11 (kể cả đã đăng hơn 10 bài thì Premium vẫn không bị chặn)
            redis_1.redis.incr.mockResolvedValue(11);
            // Khởi tạo dữ liệu sản phẩm giả lập sau khi được lưu thành công vào cơ sở dữ liệu
            const mockSavedProduct = { _id: mockProductId, name: "Cá hồi Sapa" };
            // Thiết lập giả lập hàm tạo sản phẩm mới của productRepository trả về đối tượng sản phẩm vừa lưu
            product_repository_1.productRepository.create.mockResolvedValue(mockSavedProduct);
            // Định nghĩa dữ liệu đầu vào của sản phẩm mới cần tạo cho tài khoản Premium
            const newProductData = {
                // Loại hải sản tươi sống
                type: "Fresh",
                // Phân loại thuộc dòng Cá
                category: "Fish",
                // Tên mẻ hàng hải sản
                name: "Cá hồi Sapa",
                // Đơn giá bán sản phẩm
                price: 350000,
                // Tổng khối lượng mẻ hàng
                totalWeight: 10,
                // Vĩ độ GPS vị trí đăng tải
                lat: 20.8449,
                // Kinh độ GPS vị trí đăng tải
                lng: 106.6881,
            };
            // Thực thi nghiệp vụ tạo bài đăng sản phẩm của productService
            const result = await product_service_1.productService.create(mockUserId, newProductData);
            // Kỳ vọng kết quả trả về khớp chính xác với ID của sản phẩm giả lập vừa tạo
            expect(result).toEqual({ productId: mockProductId });
            // Kiểm tra xem hàm lưu sản phẩm của productRepository đã được gọi hay chưa
            expect(product_repository_1.productRepository.create).toHaveBeenCalled();
        });
    });
    // Khối gom nhóm kiểm thử cho nghiệp vụ đẩy tin hiển thị (Bump) của mẻ hàng hải sản
    describe("Nghiệp vụ đẩy tin mẻ hàng (Bump)", () => {
        // Ca kiểm thử chặn người dùng đẩy tin nếu chưa đủ 24 giờ kể từ lần đẩy trước đó
        it("Nên chặn nếu mẻ hàng được yêu cầu đẩy tin khi chưa đủ 24 giờ kể từ lần đẩy trước", async () => {
            // Tạo một mốc thời gian cách thời điểm hiện tại đúng 12 giờ trước (chưa đủ 24 giờ)
            const past12Hours = new Date(Date.now() - 12 * 60 * 60 * 1000);
            // Thiết lập giả lập hàm tìm kiếm sản phẩm trả về thông tin sản phẩm có thuộc tính bumpedAt vừa tạo
            product_repository_1.productRepository.findById.mockResolvedValue({
                // ID sản phẩm mẻ hàng trùng khớp
                _id: mockProductId,
                // ID người bán sở hữu sản phẩm này
                sellerId: mockUserId,
                // Loại sản phẩm tươi sống
                type: "Fresh",
                // Mốc thời gian đẩy tin gần nhất là 12 tiếng trước
                bumpedAt: past12Hours,
            });
            // Thiết lập giả lập hàm cập nhật mẻ hàng trả về null do bị lỗi hoặc không thực hiện cập nhật
            product_repository_1.productRepository.findOneAndUpdate.mockResolvedValue(null);
            // Kỳ vọng lời gọi hàm đẩy tin bump sẽ ném lỗi 429 do vi phạm giãn cách thời gian đẩy tin
            await expect(
            // Lời gọi thực thi hàm bump từ productService với ID mẻ hàng và ID người bán tương ứng
            product_service_1.productService.bump(mockProductId, mockUserId)).rejects.toThrow(
            // Kiểm tra đối tượng lỗi trả về chứa mã trạng thái 429 và thông báo nhắc nhở đẩy tin lại sau
            expect.objectContaining({
                // Mã lỗi HTTP 429 Too Many Requests
                status: 429,
                // Nội dung thông báo lỗi có chứa chuỗi mô tả thời gian cần chờ đợi tiếp theo
                message: expect.stringContaining("đẩy tin lại sau"),
            }));
        });
        // Ca kiểm thử cho phép đẩy tin thành công khi lần đẩy trước đó đã cách thời điểm hiện tại hơn 24 giờ
        it("Nên cho phép đẩy tin thành công nếu lần đẩy trước đã cách hơn 24 giờ", async () => {
            // Tạo một mốc thời gian cách thời điểm hiện tại đúng 30 giờ trước (đã vượt mốc giãn cách 24 giờ)
            const past30Hours = new Date(Date.now() - 30 * 60 * 60 * 1000);
            // Thiết lập giả lập hàm tìm kiếm sản phẩm theo ID trả về sản phẩm có mốc bumpedAt từ 30 giờ trước
            product_repository_1.productRepository.findById.mockResolvedValue({
                // ID mẻ hàng hải sản
                _id: mockProductId,
                // ID người bán sở hữu mẻ hàng
                sellerId: mockUserId,
                // Loại sản phẩm tươi sống
                type: "Fresh",
                // Mốc thời gian đẩy tin cũ là 30 giờ trước
                bumpedAt: past30Hours,
            });
            // Thiết lập giả lập hàm cập nhật mẻ hàng trả về một đối tượng rỗng biểu thị cập nhật thành công
            product_repository_1.productRepository.findOneAndUpdate.mockResolvedValue({});
            // Kiểm tra lời gọi hàm đẩy tin bump sẽ được thực thi hoàn chỉnh mà không ném ra bất kỳ lỗi nào
            await expect(
            // Gọi dịch vụ đẩy tin của mẻ hàng
            product_service_1.productService.bump(mockProductId, mockUserId)).resolves.not.toThrow();
            // Đảm bảo hàm findOneAndUpdate của repository được gọi với các tham số tương ứng để cập nhật thời gian
            expect(product_repository_1.productRepository.findOneAndUpdate).toHaveBeenCalledWith(
            // Tham số thứ nhất khớp với bất kỳ đối tượng tìm kiếm nào chứa ID sản phẩm
            expect.any(Object), 
            // Tham số thứ hai chứa toán tử $set để cập nhật trường bumpedAt bằng một đối tượng Date mới
            expect.objectContaining({
                $set: expect.objectContaining({ bumpedAt: expect.any(Date) }),
            }));
        });
    });
    // Khối gom nhóm kiểm thử cho nghiệp vụ tìm kiếm và lọc danh sách sản phẩm theo phạm vi địa lý GPS
    describe("Nghiệp vụ truy vấn sản phẩm theo GPS địa lý", () => {
        // Ca kiểm thử áp dụng bộ lọc không gian $geoWithin cho sản phẩm tươi sống (Fresh) khi có tọa độ hợp lệ
        it("Nên áp dụng bộ lọc $geoWithin khi truy vấn sản phẩm loại Fresh với lat và lng hợp lệ", async () => {
            // Giả lập hàm đếm số lượng tài liệu sản phẩm khớp bộ lọc trả về giá trị là 1
            product_repository_1.productRepository.countDocuments.mockResolvedValue(1);
            // Giả lập hàm tìm kiếm danh sách sản phẩm trả về mẻ cá thu Đồ Sơn kèm tọa độ địa lý
            product_repository_1.productRepository.find.mockResolvedValue([
                {
                    // ID mẻ hàng giả lập
                    _id: mockProductId,
                    // ID người bán sở hữu mẻ hàng
                    sellerId: mockUserId,
                    // Loại sản phẩm tươi sống
                    type: "Fresh",
                    // Tên mẻ hàng
                    name: "Cá thu Đồ Sơn",
                    // Vị trí địa lý dạng GeoJSON chứa cặp tọa độ [Kinh độ, Vĩ độ]
                    location: { coordinates: [106.6881, 20.8449] },
                },
            ]);
            // Giả lập hàm tìm kiếm thông tin người dùng của userRepository trả về tên người bán Seller A
            user_repository_1.userRepository.find.mockResolvedValue([
                { _id: mockUserId, name: "Seller A" }
            ]);
            // Gọi nghiệp vụ list của productService để lấy danh sách với tham số định vị GPS
            await product_service_1.productService.list({
                // Loại sản phẩm cần tìm là tươi sống
                type: "Fresh",
                // Vĩ độ tâm điểm tìm kiếm
                lat: "20.8449",
                // Kinh độ tâm điểm tìm kiếm
                lng: "106.6881",
            });
            // Kiểm tra hàm find của productRepository được gọi với bộ lọc tọa độ địa lý hình cầu $centerSphere
            expect(product_repository_1.productRepository.find).toHaveBeenCalledWith(
            // Kỳ vọng đối tượng bộ lọc chứa type = "Fresh" và truy vấn trường location phù hợp GPS
            expect.objectContaining({
                type: "Fresh",
                location: expect.objectContaining({
                    // Sử dụng toán tử $geoWithin để tìm kiếm trong một vùng không gian nhất định
                    $geoWithin: expect.objectContaining({
                        // Sử dụng $centerSphere xác định hình cầu bao quanh bởi tọa độ tâm và bán kính quy đổi
                        $centerSphere: expect.any(Array),
                    }),
                }),
            }), 
            // Bỏ qua kiểm tra chi tiết tham số tùy chọn projection
            expect.any(Object), 
            // Bỏ qua kiểm tra chi tiết tham số tùy chọn phân trang skip/limit
            expect.any(Object));
        });
        // Ca kiểm thử bỏ qua bộ lọc tọa độ địa lý GPS nếu sản phẩm thuộc loại đồ khô (Dried)
        it("Không nên áp dụng bộ lọc GPS nếu loại sản phẩm không phải là Fresh", async () => {
            // Giả lập hàm đếm số lượng sản phẩm trả về 0 bản ghi
            product_repository_1.productRepository.countDocuments.mockResolvedValue(0);
            // Giả lập hàm tìm kiếm sản phẩm trả về một mảng rỗng
            product_repository_1.productRepository.find.mockResolvedValue([]);
            // Giả lập hàm tìm kiếm người dùng trả về một mảng rỗng
            user_repository_1.userRepository.find.mockResolvedValue([]);
            // Gọi nghiệp vụ list của productService để lấy danh sách sản phẩm khô kèm tọa độ
            await product_service_1.productService.list({
                // Lọc loại sản phẩm là đồ khô
                type: "Dried",
                // Vĩ độ GPS
                lat: "20.8449",
                // Kinh độ GPS
                lng: "106.6881",
            });
            // Kiểm tra xem hàm find của productRepository được gọi nhưng KHÔNG chứa bộ lọc location địa lý
            expect(product_repository_1.productRepository.find).toHaveBeenCalledWith(
            // Kỳ vọng bộ lọc tìm kiếm không chứa thuộc tính location
            expect.not.objectContaining({
                location: expect.any(Object),
            }), 
            // Tham số projection bất kỳ
            expect.any(Object), 
            // Tham số phân trang skip/limit bất kỳ
            expect.any(Object));
        });
    });
});
