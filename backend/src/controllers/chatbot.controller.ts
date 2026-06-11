import { Request, Response } from "express";
import Groq from "groq-sdk";
import { logger } from "../utils/logger";

const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

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

export async function askChatbot(req: Request, res: Response) {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ message: "Nội dung tin nhắn không được để trống." });
    }

    if (!groq) {
        logger.warn("[ChatbotAI] GROQ_API_KEY chưa được cấu hình.");
        return res.status(503).json({ message: "Hệ thống AI đang bảo trì." });
    }

    try {
        // Chuyển đổi history từ Gemini format → OpenAI format (Groq dùng OpenAI format)
        const cleanedHistory: { role: "user" | "assistant"; content: string }[] =
            Array.isArray(history)
                ? history
                    .filter((m: any) => m?.role && m?.parts?.[0]?.text)
                    .map((m: any) => ({
                        role: m.role === "model" ? "assistant" : "user",
                        content: m.parts[0].text,
                    }))
                : [];

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 25_000)
        );

        const completionPromise = groq.chat.completions.create({
            model: "llama-3.1-8b-instant", // Free, rất nhanh
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                ...cleanedHistory,
                { role: "user", content: message.trim() },
            ],
            max_tokens: 1024,
            temperature: 0.7,
        });

        const completion = await Promise.race([completionPromise, timeoutPromise]);
        const replyText = completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể trả lời lúc này.";

        return res.json({ reply: replyText });

    } catch (err: any) {
        logger.error(`[ChatbotAI Error] ${err.message}`);

        if (err.message === "timeout") {
            return res.status(503).json({ message: "AI đang bận, vui lòng thử lại sau." });
        }
        if (err.status === 429) {
            return res.status(429).json({ message: "Hệ thống đang quá tải. Vui lòng thử lại sau." });
        }

        return res.status(500).json({ message: "Trợ lý AI tạm thời không khả dụng." });
    }
}