"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recallMessage = recallMessage;
exports.reactMessage = reactMessage;
exports.editMessage = editMessage;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.getConversations = getConversations;
exports.unreadCount = unreadCount;
exports.uploadChatImage = uploadChatImage;
// Import messageService chứa các logic nghiệp vụ về chat/tin nhắn
const message_service_1 = require("../services/message.service");
// Import messageRepository để thực hiện các thao tác truy vấn DB thô cho Tin nhắn
const message_repository_1 = require("../repositories/message.repository");
// Import helpers gửi phản hồi lỗi và phân tích ID
const response_helper_1 = require("../helpers/response.helper");
// Import helper upload ảnh từ buffer lên thư mục chỉ định của Cloudinary
const upload_1 = require("../middlewares/upload");
// Import helper phân tích các tham số phân trang
const pagination_1 = require("../utils/pagination");
// Import Model Mongoose của Tin nhắn
const Message_1 = require("../models/Message");
// Import hàm lấy đối tượng Socket.io Server (IO) để gửi sự kiện realtime
const socket_1 = require("../socket");
/**
 * 1. HÀM THU HỒI TIN NHẮN (RECALL MESSAGE)
 */
async function recallMessage(req, res) {
    // Lấy ID tin nhắn cần thu hồi từ tham số URL (:id)
    const { id } = req.params;
    // Lấy ID của người dùng yêu cầu thu hồi từ token xác thực
    const { userId } = req.user;
    try {
        // Tìm kiếm tin nhắn theo ID trong DB
        const msg = await Message_1.Message.findById(id);
        // Nếu không tìm thấy, trả về lỗi 404
        if (!msg)
            return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
        // Bảo mật: chỉ chính người gửi tin nhắn (senderId) mới có quyền thu hồi tin nhắn của họ
        if (msg.senderId.toString() !== userId) {
            return res
                .status(403)
                .json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
        }
        // Đánh dấu cờ 'isRecalled' thành true đại diện cho tin nhắn đã bị thu hồi
        msg.isRecalled = true;
        // Lưu trạng thái cập nhật vào DB
        await msg.save();
        // Đồng bộ Realtime trạng thái thu hồi cho cả phòng người gửi và người nhận qua Socket.io
        // Phòng (room) được định danh theo định dạng: product_[id_sản_phẩm]_[id_người_dùng]
        (0, socket_1.getIO)()
            .to(`product_${msg.productId}_${msg.senderId}`)
            .emit("message_recalled", { id });
        (0, socket_1.getIO)()
            .to(`product_${msg.productId}_${msg.receiverId}`)
            .emit("message_recalled", { id });
        // Trả về kết quả thành công cho Client
        return res.json({ success: true, message: "Thu hồi thành công" });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * 2. HÀM THẢ CẢM XÚC TIN NHẮN (LIKE, HEART, ANGRY...)
 */
async function reactMessage(req, res) {
    // Lấy ID tin nhắn từ tham số URL (:id)
    const { id } = req.params;
    // Lấy biểu tượng cảm xúc (reaction) gửi lên từ body request
    const { reaction } = req.body;
    try {
        // Tìm kiếm tin nhắn theo ID
        const msg = await Message_1.Message.findById(id);
        if (!msg)
            return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
        // Gán cảm xúc mới hoặc xóa cảm xúc (nếu không truyền gì) bằng cách gán null
        msg.reaction = reaction || null;
        await msg.save();
        // Đồng bộ cảm xúc realtime qua Socket.io tới cả hai phòng chat
        const eventData = { id, reaction: msg.reaction };
        (0, socket_1.getIO)()
            .to(`product_${msg.productId}_${msg.senderId}`)
            .emit("message_reacted", eventData);
        (0, socket_1.getIO)()
            .to(`product_${msg.productId}_${msg.receiverId}`)
            .emit("message_reacted", eventData);
        // Trả về trạng thái phản hồi cảm xúc thành công
        return res.json({ success: true, reaction: msg.reaction });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * 3. HÀM CHỈNH SỬA NỘI DUNG TIN NHẮN (EDIT MESSAGE)
 */
async function editMessage(req, res) {
    // Lấy ID tin nhắn cần chỉnh sửa từ URL (:id)
    const { id } = req.params;
    // Lấy nội dung văn bản (content) mới từ body request
    const { content } = req.body;
    // Lấy ID người dùng thực hiện chỉnh sửa từ token
    const { userId } = req.user;
    try {
        // Tìm kiếm tin nhắn theo ID
        const msg = await Message_1.Message.findById(id);
        if (!msg)
            return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
        // Bảo mật: chỉ người gửi tin nhắn mới được phép chỉnh sửa nội dung tin nhắn đó
        if (msg.senderId.toString() !== userId) {
            return res
                .status(403)
                .json({ message: "Bạn không thể chỉnh sửa tin nhắn của người khác" });
        }
        // Cập nhật nội dung văn bản mới
        msg.content = content;
        // Lưu lại vào DB
        await msg.save();
        // Gửi sự kiện cập nhật nội dung tin nhắn realtime thông qua Socket.io
        const eventData = { id, content };
        (0, socket_1.getIO)()
            .to(`product_${msg.productId}_${msg.senderId}`)
            .emit("message_edited", eventData);
        (0, socket_1.getIO)()
            .to(`product_${msg.productId}_${msg.receiverId}`)
            .emit("message_edited", eventData);
        // Trả về kết quả cập nhật thành công cho Client
        return res.json({ success: true, content });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM TRUY VẤN LỊCH SỬ CHAT CỦA MỘT SẢN PHẨM GIỮA MỘT CẶP NGƯỜI DÙNG (MUA VÀ BÁN)
 */
async function getMessages(req, res) {
    // Lấy ID người dùng hiện tại và vai trò của họ từ token
    const { userId, role } = req.user;
    // Phân tích ID sản phẩm từ URL (:productId)
    const productId = (0, response_helper_1.parseId)(req.params.productId);
    // Lấy ID người mua từ URL Query String (nếu là người bán xem tin nhắn sẽ cần truyền ID người mua)
    const buyerIdStr = req.query.buyerId;
    if (!productId)
        return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    try {
        // Gọi messageService để lấy danh sách tin nhắn giữa các đối tượng liên quan
        const messages = await message_service_1.messageService.getMessages(productId, userId, role, buyerIdStr);
        // Trả về danh sách tin nhắn cho Client
        return res.json(messages);
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM GỬI MỘT TIN NHẮN MỚI
 */
async function sendMessage(req, res) {
    // Lấy ID người gửi tin nhắn (chính là người dùng hiện tại đang login)
    const { userId } = req.user;
    try {
        // Gọi messageService để xử lý lưu tin nhắn mới vào DB và phát Socket realtime
        const newMsg = await message_service_1.messageService.sendMessage(userId, req.body);
        // Trả về trạng thái 201 thành công kèm thông tin ID tin nhắn và vị trí (nếu là tin nhắn chia sẻ GPS)
        return res.status(201).json({
            id: newMsg._id.toString(),
            location: newMsg.location,
            message: "Gửi thành công",
        });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM LẤY DANH SÁCH CÁC CUỘC HỘI THOẠI (CONVERSATIONS) CỦA NGƯỜI DÙNG HIỆN TẠI (HỘP THƯ ĐẾN)
 */
async function getConversations(req, res) {
    // Lấy ID người dùng hiện tại
    const { userId } = req.user;
    // Phân tích các tham số phân trang từ Query (page, limit) với limit tối đa mặc định là 50 cuộc hội thoại
    const { limit, offset } = (0, pagination_1.parsePagination)(req.query.page, req.query.limit, 50);
    try {
        // Gọi messageService lấy danh sách hội thoại có phân trang
        const list = await message_service_1.messageService.getConversations(userId, offset, limit);
        // Trả về danh sách hội thoại
        return res.json(list);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM LẤY TỔNG SỐ TIN NHẮN CHƯA ĐỌC CỦA NGƯỜI DÙNG HIỆN TẠI
 */
async function unreadCount(req, res) {
    // Lấy ID người dùng hiện tại
    const { userId } = req.user;
    try {
        // Đếm số lượng tin nhắn chưa đọc trong DB nơi người nhận là userId
        const count = await message_repository_1.messageRepository.countUnread(userId);
        // Trả về số lượng tin nhắn chưa đọc
        return res.json({ count });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM TẢI ẢNH LÊN CLOUDINARY KHI GỬI ẢNH TRONG KHUNG CHAT (Tải lên tức thời để lấy URL ảnh chèn vào tin nhắn)
 */
async function uploadChatImage(req, res) {
    // Kiểm tra xem Multer đã xử lý và lưu file vào bộ nhớ đệm (req.file) chưa
    if (!req.file)
        return res.status(400).json({ message: "Chưa chọn file ảnh gửi kèm" });
    try {
        // Tải ảnh từ buffer lên Cloudinary trong thư mục chuyên biệt 'chat_images'
        const { url } = await (0, upload_1.uploadToCloudinary)(req.file.buffer, "chat_images");
        // Trả về URL ảnh đã upload trên Cloudinary cho Client
        return res.json({ imageUrl: url });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
