// Import kiểu dữ liệu Request và Response từ Express
import { Request, Response } from "express";
// Import SDK chính thức của Groq để kết nối với các mô hình ngôn ngữ lớn (LLM) như Llama 3
import Groq from "groq-sdk";
// Import công cụ ghi log dùng chung
import { logger } from "../utils/logger";

// Khởi tạo thực thể Groq AI Client nếu đã cấu hình API Key trong file .env, ngược lại gán bằng null
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Lời nhắc hệ thống (System Instructions) - Định nghĩa tính cách, vai trò và phạm vi kiến thức của AI
const SYSTEM_INSTRUCTION = `
Bạn là "Trợ lý hải sản" - trợ lý AI thông thái và thân thiện của trang web HảiSản.vn.
Nhiệm vụ của bạn gồm 2 phần chính:
1. Tư vấn hải sản cho người mua:
   - Cách lựa chọn hải sản tươi ngon (ví dụ: mắt cá trong, mang đỏ, tôm vỏ cứng, cua chắc thịt...).
   - Cách sơ chế, bảo quản hải sản tươi sống và đồ khô.
   - Gợi ý các món ăn ngon từ tôm, cá, mực, cua, sò ốc và cách chế biến chuẩn vị.
2. Hướng dẫn sử dụng các chức năng của website HảiSản.vn:
   - Đăng tin bán hàng: Tài khoản thường tối đa 5 bài/ngày, Premium (2.000đ VietQR) đăng không giới hạn.
   - Tìm kiếm theo GPS: Bật định vị để xem hải sản trong bán kính 20km.
   - Chat & Gọi Video: Nhấn "Nhắn tin với ngư dân" tại trang chi tiết sản phẩm.
   - Đẩy tin (Bump): Đẩy bài lên đầu danh sách sau mỗi 24 giờ.
   - Đánh giá (Review): Chỉ đánh giá được sau khi hai bên đã nhắn tin.
   - Báo cáo vi phạm: Dùng nút báo cáo ở trang chi tiết sản phẩm.
Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, dùng emoji thân thiện. Không trả lời ngoài phạm vi hải sản và website.
`;

// HÀM XỬ LÝ YÊU CẦU HỎI ĐÁP CỦA CHATBOT AI
export async function askChatbot(req: Request, res: Response) {
  const { message, history } = req.body; // Lấy tin nhắn hiện tại (message) và lịch sử trò chuyện (history) từ body

  // Đảm bảo tin nhắn gửi lên không được để trống
  if (!message || typeof message !== "string" || !message.trim()) {
    return res
      .status(400)
      .json({ message: "Nội dung tin nhắn không được để trống." });
  }

  // Nếu hệ thống chưa được cấu hình API Key cho Groq AI
  if (!groq) {
    logger.warn("[ChatbotAI] GROQ_API_KEY chưa được cấu hình.");
    return res.status(503).json({ message: "Hệ thống AI đang bảo trì." }); // Trả về mã lỗi 503 Service Unavailable
  }

  try {
    // Định dạng lại lịch sử trò chuyện (history) nhận được từ Client sang cấu trúc chuẩn của Groq API
    const cleanedHistory: { role: "user" | "assistant"; content: string }[] =
      Array.isArray(history)
        ? history
            .filter((m: any) => m?.role && m?.parts?.[0]?.text) // Lọc bỏ các phần tử lỗi hoặc thiếu dữ liệu
            .map((m: any) => ({
              // Đổi vai trò từ "model" (Google Gemini format) sang "assistant" (OpenAI/Groq format)
              role: m.role === "model" ? "assistant" : "user",
              content: m.parts[0].text, // Lấy phần nội dung tin nhắn dạng chữ
            }))
        : [];

    // [PHÒNG NGỪA TREO GATEWAY]: Tạo một Promise đếm ngược 15 giây để ngắt kết nối nếu AI xử lý quá lâu
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15_000), // Ném lỗi timeout sau 15000ms
    );

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
    const replyText =
      completion.choices[0]?.message?.content ||
      "Xin lỗi, tôi không thể trả lời lúc này.";

    return res.json({ reply: replyText }); // Trả kết quả JSON về cho giao diện Client
  } catch (err: any) {
    logger.error(`[ChatbotAI Error] ${err.message}`); // Ghi nhận lỗi hệ thống

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
