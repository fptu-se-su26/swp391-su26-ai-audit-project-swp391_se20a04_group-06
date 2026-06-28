"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askChatbot = askChatbot;
// Import SDK chính thức của Groq để kết nối với các mô hình ngôn ngữ lớn (LLM) như Llama 3
const groq_sdk_1 = __importDefault(require("groq-sdk"));
// Import SDK chính thức của Google Generative AI
const generative_ai_1 = require("@google/generative-ai");
// Import công cụ ghi log dùng chung
const logger_1 = require("../utils/logger");
// Khởi tạo thực thể Groq AI Client nếu đã cấu hình API Key trong file .env, ngược lại gán bằng null
const groq = process.env.GROQ_API_KEY
    ? new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY })
    : null;
// Khởi tạo thực thể Google Generative AI Client nếu đã cấu hình API Key trong file .env, ngược lại gán bằng null
const genAI = process.env.GEMINI_API_KEY
    ? new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY)
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
    // Nếu cả hai API đều không được cấu hình
    if (!genAI && !groq) {
        logger_1.logger.warn("[ChatbotAI] Cả GEMINI_API_KEY và GROQ_API_KEY đều chưa được cấu hình.");
        return res.status(503).json({ message: "Hệ thống AI đang bảo trì." }); // Trả về mã lỗi 503 Service Unavailable
    }
    // Nếu có cấu hình Gemini API, ưu tiên dùng Gemini
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: SYSTEM_INSTRUCTION,
            });
            // Chuyển đổi lịch sử trò chuyện (history) sang cấu trúc chuẩn của Gemini
            // { role: "user" | "model", parts: [{ text: string }] }
            const geminiHistory = Array.isArray(history)
                ? history
                    .filter((m) => m?.role && (m?.parts?.[0]?.text || m?.content))
                    .map((m) => {
                    const text = m.parts?.[0]?.text || m.content || "";
                    return {
                        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
                        parts: [{ text }],
                    };
                })
                : [];
            const chat = model.startChat({
                history: geminiHistory,
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: 0.7,
                },
            });
            // Tạo Promise đếm ngược 15 giây để tránh treo gateway
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000));
            const completionPromise = chat.sendMessage(message.trim());
            const result = await Promise.race([completionPromise, timeoutPromise]);
            const response = await result.response;
            const replyText = response.text();
            return res.json({ reply: replyText });
        }
        catch (err) {
            logger_1.logger.error(`[ChatbotAI Gemini Error] ${err.message}`);
            if (!groq) {
                // Nếu không có Groq để dự phòng, trả về lỗi luôn
                if (err.message === "timeout") {
                    return res.status(503).json({ message: "AI đang bận, vui lòng thử lại sau." });
                }
                return res.status(500).json({ message: "Trợ lý AI tạm thời không khả dụng." });
            }
            logger_1.logger.info("[ChatbotAI] Đang chuyển sang sử dụng Groq Llama dự phòng...");
        }
    }
    // Luồng dự phòng / mặc định sử dụng Groq Llama
    if (groq) {
        try {
            const cleanedHistory = Array.isArray(history)
                ? history
                    .filter((m) => m?.role && (m?.parts?.[0]?.text || m?.content))
                    .map((m) => ({
                    role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
                    content: m.parts?.[0]?.text || m.content || "",
                }))
                : [];
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000));
            const completionPromise = groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: SYSTEM_INSTRUCTION },
                    ...cleanedHistory,
                    { role: "user", content: message.trim() },
                ],
                max_tokens: 1024,
                temperature: 0.7,
            });
            const completion = await Promise.race([completionPromise, timeoutPromise]);
            const replyText = completion.choices[0]?.message?.content ||
                "Xin lỗi, tôi không thể trả lời lúc này.";
            return res.json({ reply: replyText });
        }
        catch (err) {
            logger_1.logger.error(`[ChatbotAI Groq Error] ${err.message}`);
            if (err.message === "timeout") {
                return res
                    .status(503)
                    .json({ message: "AI đang bận, vui lòng thử lại sau." });
            }
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
    return res.status(503).json({ message: "Hệ thống AI đang bảo trì." });
}
