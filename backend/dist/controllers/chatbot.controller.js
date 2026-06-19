"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askChatbot = askChatbot;
// Import SDK chính thức của Groq để kết nối với các mô hình ngôn ngữ lớn (LLM) như Llama 3
const groq_sdk_1 = __importDefault(require("groq-sdk"));
// Import công cụ ghi log dùng chung
const logger_1 = require("../utils/logger");
// Khởi tạo thực thể Groq AI Client nếu đã cấu hình API Key trong file .env, ngược lại gán bằng null
const groq = process.env.GROQ_API_KEY
    ? new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY })
    : null;
// Lời nhắc hệ thống (System Instructions) - Định nghĩa tính cách, vai trò và phạm vi kiến thức của AI
const SYSTEM_INSTRUCTION = `
Bạn là "Trợ lý Hải Sản" - chuyên gia AI thông thái, thân thiện và nhiệt tình của trang web HảiSản.vn. Nhiệm vụ của bạn là tư vấn cho khách hàng về hải sản và hướng dẫn sử dụng các tính năng trên website HảiSản.vn.

Hành vi và Quy tắc hoạt động của bạn:
1. VỀ PHẠM VI KIẾN THỨC (Chỉ trả lời trong 2 chủ đề này):
   a. Tư vấn hải sản cho người tiêu dùng:
      - Cách chọn hải sản tươi sống chất lượng cao (ví dụ: cá mắt trong suốt, tôm vỏ cứng bóng, cua chắc thịt, mang đỏ...).
      - Cách sơ chế, khử mùi tanh, bảo quản hải sản tươi sống và đồ khô đúng chuẩn.
      - Gợi ý công thức món ăn ngon từ hải sản và cách chế biến chuẩn vị.
   b. Hướng dẫn sử dụng các chức năng của website HảiSản.vn:
      - Đăng tin bán hàng: Tài khoản thường đăng tối đa 5 tin/ngày. Nâng cấp Premium (2.000đ thanh toán qua VietQR) đăng không giới hạn.
      - Tìm kiếm theo GPS: Bật định vị để tìm kiếm hải sản trong bán kính 20km từ vị trí của bạn.
      - Chat & Gọi Video: Nhấn nút "Nhắn tin với ngư dân" tại trang chi tiết sản phẩm để trò chuyện trực tiếp.
      - Đẩy tin (Bump): Đẩy bài đăng lên đầu danh sách sau mỗi 24 giờ để tăng lượt xem.
      - Đánh giá (Review): Chỉ đánh giá được đối tác sau khi hai bên đã phát sinh nhắn tin trao đổi.
      - Báo cáo vi phạm: Dùng nút báo cáo ở trang chi tiết sản phẩm nếu phát hiện tin giả hoặc lừa đảo.

2. CÁCH XỬ LÝ CÂU HỎI NGOÀI PHẠM VI:
   - Nếu người dùng hỏi các chủ đề không liên quan đến hải sản hoặc tính năng của website HảiSản.vn (ví dụ: lập trình, chính trị, toán học, kiến thức phổ thông khác...), hãy lịch sự từ chối bằng mẫu câu: "Xin lỗi bạn, tôi là Trợ lý của HảiSản.vn và chỉ có thể tư vấn các chủ đề về hải sản và hướng dẫn sử dụng website. Bạn có câu hỏi nào liên quan đến hải sản không ạ? 🐟"

3. PHONG CÁCH TRẢ LỜI & ĐỊNH DẠNG:
   - Ngôn ngữ: Tiếng Việt tự nhiên, thân thiện, lịch sự, xưng hô "tôi" - "bạn" hoặc "mình" - "bạn".
   - Định dạng: Sử dụng định dạng Markdown (in đậm, danh sách gạch đầu dòng) để câu trả lời rõ ràng, dễ nhìn.
   - Emoji: Sử dụng các emoji sinh động liên quan đến biển cả (🐟, 🦐, 🦀, 🦑, ⛵) nhưng ở mức độ vừa phải, không lạm dụng.
   - Độ dài: Ngắn gọn, súc tích, đi thẳng vào vấn đề của người dùng.
`;
// HÀM XỬ LÝ YÊU CẦU HỎI ĐÁP CỦA CHATBOT AI
async function askChatbot(req, res) {
    const { message, history } = req.body; // Lấy tin nhắn hiện tại (message) và lịch sử trò chuyện (history) từ body
    // Đảm bảo tin nhắn gửi lên không được để trống
    if (!message || typeof message !== "string" || !message.trim()) {
        return res
            .status(400)
            .json({ message: "Nội dung tin nhắn không được để trống." });
    }
    // Nếu hệ thống chưa được cấu hình API Key cho Groq AI
    if (!groq) {
        logger_1.logger.warn("[ChatbotAI] GROQ_API_KEY chưa được cấu hình.");
        return res.status(503).json({ message: "Hệ thống AI đang bảo trì." }); // Trả về mã lỗi 503 Service Unavailable
    }
    try {
        // Định dạng lại lịch sử trò chuyện (history) nhận được từ Client sang cấu trúc chuẩn của Groq API
        const cleanedHistory = Array.isArray(history)
            ? history
                .filter((m) => m?.role && m?.parts?.[0]?.text) // Lọc bỏ các phần tử lỗi hoặc thiếu dữ liệu
                .map((m) => ({
                // Đổi vai trò từ "model" (Google Gemini format) sang "assistant" (OpenAI/Groq format)
                role: m.role === "model" ? "assistant" : "user",
                content: m.parts[0].text, // Lấy phần nội dung tin nhắn dạng chữ
            }))
            : [];
        // [PHÒNG NGỪA TREO GATEWAY]: Tạo một Promise đếm ngược 15 giây để ngắt kết nối nếu AI xử lý quá lâu
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000));
        // Gửi yêu cầu hỏi đáp tới API của Groq
        const completionPromise = groq.chat.completions.create({
            model: "llama-3.1-8b-instant", // Sử dụng mô hình Llama 3.1 8B tốc độ cao
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION }, // Truyền chỉ thị định hình hành vi AI
                ...cleanedHistory, // Truyền lịch sử hội thoại trước đó
                { role: "user", content: message.trim() }, // Truyền câu hỏi hiện tại của user
            ],
            max_tokens: 1024, // Giới hạn phản hồi tối đa là 1024 tokens
            temperature: 0.7, // Đặt độ sáng tạo là 0.7 để câu trả lời tự nhiên nhưng vẫn trong khuôn khổ
        });
        // Sử dụng Promise.race để chạy song song yêu cầu gọi AI và thời gian đếm ngược timeout. Bên nào về đích trước sẽ được chọn.
        const completion = await Promise.race([completionPromise, timeoutPromise]);
        // Trích xuất văn bản trả lời từ kết quả phản hồi của Groq
        const replyText = completion.choices[0]?.message?.content ||
            "Xin lỗi, tôi không thể trả lời lúc này.";
        return res.json({ reply: replyText }); // Trả kết quả JSON về cho giao diện Client
    }
    catch (err) {
        logger_1.logger.error(`[ChatbotAI Error] ${err.message}`); // Ghi nhận lỗi hệ thống
        // Nếu bị lỗi timeout (AI xử lý quá 15 giây)
        if (err.message === "timeout") {
            return res
                .status(503)
                .json({ message: "AI đang bận, vui lòng thử lại sau." });
        }
        // Nếu vượt quá giới hạn lượt gọi API của Groq (Rate Limit)
        if (err.status === 429) {
            return res
                .status(429)
                .json({ message: "Hệ thống đang quá tải. Vui lòng thử lại sau." });
        }
        return res
            .status(500)
            .json({ message: "Trợ lý AI tạm thời không khả dụng." });
    }
}
