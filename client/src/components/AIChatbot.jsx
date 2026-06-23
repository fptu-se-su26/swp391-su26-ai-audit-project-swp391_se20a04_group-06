// Import các hook React để quản lý trạng thái, hiệu ứng phụ và tham chiếu DOM
import { useState, useEffect, useRef } from "react";
// Import bảng màu theme C và đổ bóng S từ thư mục tiện ích utils/theme
import { C, S } from "../utils/theme";
// Import helper api để thực hiện gửi yêu cầu HTTP tới máy chủ
import { api } from "../services/api";
// Import hook useToast từ ToastContext để hiển thị các thông báo dạng toast
import { useToast } from "../context/ToastContext";

// Định nghĩa và export component AIChatbot để hiển thị nút chat bot AI hỗ trợ người dùng trực tuyến
export function AIChatbot() {
  // Lấy ra hàm hiển thị thông báo toast
  const toast = useToast();
  // Khởi tạo state isOpen quản lý việc ẩn/hiện khung chat bot phóng to
  const [isOpen, setIsOpen] = useState(false);
  // Khởi tạo state messages lưu lịch sử trò chuyện với tin nhắn chào mừng đầu tiên từ AI
  const [messages, setMessages] = useState([
    {
      role: "model", // Vai trò của AI chatbot là model
      text: "Xin chào! Tôi là Trợ lý Hải Sản. Bạn có cần tôi tư vấn cách chọn hải sản tươi ngon hay hướng dẫn sử dụng các chức năng trên Haisan.vn không?",
      // Định dạng giờ gửi tin nhắn hiện tại dạng HH:MM
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  // Khởi tạo state input lưu văn bản người dùng đang nhập vào ô text chat
  const [input, setInput] = useState("");
  // Khởi tạo state loading quản lý trạng thái đang chờ AI trả lời tin nhắn
  const [loading, setLoading] = useState(false);
  // Khởi tạo ref messagesEndRef dùng để tự động cuộn xuống tin nhắn mới nhất
  const messagesEndRef = useRef(null);

  // Hook useEffect tự động cuộn khung chat xuống đáy mỗi khi danh sách tin nhắn thay đổi hoặc khi khung chat được mở lên
  useEffect(() => {
    // Nếu khung chat đang mở, cuộn mượt mà phần tử messagesEndRef vào tầm nhìn
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]); // Phụ thuộc vào thay đổi của mảng messages hoặc trạng thái isOpen

  // Hàm xử lý gửi tin nhắn của người dùng lên AI
  const handleSend = async (e) => {
    // Ngăn chặn hành vi submit mặc định của thẻ form (không tải lại trang web)
    e.preventDefault();
    // Nếu dòng chữ nhập vào trống rỗng hoặc đang trong quá trình tải tin nhắn thì không xử lý
    if (!input.trim() || loading) return;

    // Chuẩn hóa văn bản người dùng nhập vào, loại bỏ khoảng trắng thừa ở hai đầu
    const userText = input.trim();
    // Làm sạch ô nhập liệu trên giao diện
    setInput("");
    // Lấy thời gian hiện tại
    const currentTime = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Tạo mảng danh sách tin nhắn mới cập nhật thêm tin nhắn của người dùng
    const updatedMessages = [
      ...messages,
      { role: "user", text: userText, time: currentTime },
    ];
    // Cập nhật state messages để hiển thị tin nhắn của user ngay lập tức trên UI
    setMessages(updatedMessages);
    // Đặt trạng thái đang tải câu trả lời là true
    setLoading(true);

    try {
      // SỬA TẠI ĐÂY: Sử dụng 'messages' thay vì 'updatedMessages'
      // để lọc bỏ tin nhắn hiện tại ra khỏi lịch sử quá khứ gửi lên API
      // Xây dựng mảng lịch sử hội thoại đúng chuẩn của mô hình Gemini AI
      const chatHistory = messages
        .filter((_, idx) => idx > 0) // Loại bỏ tin nhắn chào mừng mặc định của model
        .map((m) => ({
          role: m.role === "model" ? "model" : "user", // Phân loại vai trò
          parts: [{ text: m.text }], // Khối nội dung tin nhắn
        }));

      // Gửi nội dung tin nhắn mới và lịch sử hội thoại lên API của chatbot trên Backend
      const response = await api("/chatbot", {
        method: "POST", // Phương thức gửi POST
        body: JSON.stringify({ message: userText, history: chatHistory }), // Chuyển đổi dữ liệu JSON
      });

      // Thêm câu trả lời phản hồi từ AI chatbot vào danh sách tin nhắn
      setMessages((prev) => [
        ...prev,
        {
          role: "model", // Vai trò là model (AI)
          text: response.reply, // Nội dung câu trả lời
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      // Hiển thị thông báo lỗi nếu có sự cố mạng hoặc lỗi máy chủ
      toast.error(err.message || "Lỗi kết nối với Trợ lý AI.");
    } finally {
      // Đặt loading về false sau khi xử lý xong (dù lỗi hay thành công)
      setLoading(false);
    }
  };

  return (
    // Div bao bọc chatbot cố định ở góc dưới cùng bên trái màn hình
    <div
      style={{
        position: "fixed", // Cố định vị trí
        bottom: 24, // Cách đáy màn hình 24px
        left: 24, // Cách mép trái màn hình 24px
        zIndex: 9999, // Z-index rất cao để nổi trên cùng
        fontFamily: "inherit", // Kế thừa phông chữ chung
      }}
    >
      {/* Nút bong bóng chat hình tròn thu nhỏ, chỉ hiện khi chưa mở khung chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)} // Click mở khung chat
          // Style inline thiết lập hình dạng bong bóng tròn màu gradient xanh ocean đẹp mắt
          style={{
            width: 56, // Chiều rộng 56px
            height: 56, // Chiều cao 56px
            borderRadius: "50%", // Bo tròn tuyệt đối
            background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`, // Nền chuyển sắc
            color: "#fff", // Màu chữ trắng
            border: "none", // Không viền
            cursor: "pointer", // Con trỏ chuột dạng bàn tay
            boxShadow: "0 8px 24px rgba(11, 79, 108, 0.35)", // Đổ bóng mờ nổi bật
            display: "flex", // Bố cục flex
            alignItems: "center", // Căn giữa dọc
            justifyContent: "center", // Căn giữa ngang
            fontSize: 26, // Kích thước emoji robot
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Hiệu ứng phóng to đàn hồi khi hover
          }}
          // Hover: phóng to nhẹ bong bóng và đẩy lên trên 2px
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.08) translateY(-2px)")
          }
          // Rời chuột: khôi phục kích thước ban đầu
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          🤖
        </button>
      )}

      {/* Khung chứa nội dung chat bot phóng to, hiển thị khi isOpen là true */}
      {isOpen && (
        <div
          style={{
            width: 350, // Chiều rộng khung chat 350px
            height: 470, // Chiều cao khung chat 480px
            background: C.white, // Nền màu trắng
            borderRadius: 10, // Bo tròn viền 16px
            boxShadow: S.xl, // Đổ bóng mờ cực lớn
            display: "flex", // Flexbox dọc
            flexDirection: "column",
            overflow: "hidden", // Ẩn nội dung tràn góc bo tròn
            animation: "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both", // Hoạt ảnh trượt mượt mà khi hiện
          }}
        >
          {/* Thanh tiêu đề Header phía trên khung chat */}
          <div
            style={{
              padding: "4px 6px", // Khoảng đệm header
              // Nền gradient xanh dương ocean
              background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
              color: "#fff", // Chữ trắng
              display: "flex", // Bố cục flex ngang
              justifyContent: "space-between", // Đẩy thông tin sang trái, nút đóng sang phải
              alignItems: "center", // Căn giữa dọc
            }}
          >
            {/* Nhóm avatar robot và trạng thái trực tuyến */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>
                  Trợ Lý AI
                </div>
                <div
                  style={{
                    fontSize: 7,
                    color: "rgba(255,255,255,0.75)", // Màu chữ trắng mờ
                    fontWeight: 500,
                  }}
                >
                  🟢 Trực tuyến 24/7
                </div>
              </div>
            </div>
            {/* Nút đóng khung chat bot */}
            <button
              onClick={() => setIsOpen(false)} // Nhấn đóng khung chat
              style={{
                background: "transparent", // Nền trong suốt
                border: "none", // Không viền
                color: "#fff", // Ký tự màu trắng
                fontSize: 14, // Kích thước chữ
                cursor: "pointer", // Con trỏ chuột pointer
                padding: "2px 6px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Vùng hiển thị nội dung các tin nhắn hội thoại */}
          <div
            style={{
              flex: 1, // Chiếm trọn không gian trống ở giữa
              overflowY: "auto", // Cho phép cuộn dọc tự động
              padding: "16px", // Đệm lề trong 16px
              background: "#F8FAFC", // Nền xám lam dịu nhẹ
              display: "flex", // Bố cục flex dọc
              flexDirection: "column",
              gap: 12, // Khoảng cách giữa các tin nhắn là 12px
            }}
          >
            {/* Lặp qua danh sách tin nhắn để hiển thị */}
            {messages.map((m, idx) => {
              // Kiểm tra xem tin nhắn hiện tại có phải là của AI (model) hay không
              const isAI = m.role === "model";
              return (
                <div
                  key={idx} // Khóa React duy nhất
                  style={{
                    display: "flex",
                    // Căn lề trái nếu là AI, căn lề phải nếu là User gửi
                    justifyContent: isAI ? "flex-start" : "flex-end",
                  }}
                >
                  {/* Hộp chứa văn bản tin nhắn bong bóng */}
                  <div
                    style={{
                      maxWidth: "85%", // Chiều rộng tối đa chiếm 85% khung chat
                      // Màu nền: AI thì nền trắng, User thì nền xanh ocean
                      background: isAI ? C.white : C.ocean,
                      // Màu chữ: AI thì chữ tối C.dark, User thì chữ trắng
                      color: isAI ? C.dark : "#fff",
                      padding: "10px 14px", // Đệm trong bong bóng
                      // Bo góc bất đối xứng: AI bo góc nhọn góc dưới trái, User bo góc nhọn góc dưới phải
                      borderRadius: isAI
                        ? "12px 12px 12px 0px"
                        : "12px 12px 0px 12px",
                      fontSize: 12, // Cỡ chữ tin nhắn 13px
                      lineHeight: 1.5, // Chiều cao dòng
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)", // Đổ bóng mờ cực nhẹ
                      border: isAI ? `1px solid ${C.border}` : "none", // Vẽ viền xám mỏng nếu là bong bóng AI
                      whiteSpace: "pre-line", // Giúp hiển thị xuống dòng của AI mượt hơn và chính xác
                    }}
                  >
                    {/* Nội dung text tin nhắn */}
                    {m.text}
                    {/* Dòng thời gian gửi tin nhắn nhỏ ở góc dưới */}
                    <div
                      style={{
                        fontSize: 9, // Cỡ chữ siêu nhỏ
                        // Màu chữ mờ xám nếu là AI, màu trắng mờ nếu là User gửi
                        color: isAI ? C.muted : "rgba(255,255,255,0.7)",
                        marginTop: 4, // Khoảng cách nhỏ với text phía trên
                        textAlign: "right", // Căn chữ sang phải
                      }}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Hiển thị nhãn đang suy nghĩ khi AI đang xử lý câu trả lời */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: C.white,
                    border: `1px solid ${C.border}`,
                    padding: "10px 16px",
                    borderRadius: "12px 12px 12px 0px",
                    fontSize: 13,
                  }}
                >
                  {/* Biểu tượng vòng xoay spinner nhỏ */}
                  <span
                    className="spinner-border spinner-border-sm"
                    style={{ width: 14, height: 14, marginRight: 6 }}
                  ></span>
                  Trợ lý đang suy nghĩ...
                </div>
              </div>
            )}
            {/* Phần tử trống neo ở cuối danh sách để cuộn màn hình xuống */}
            <div ref={messagesEndRef} />
          </div>

          {/* Khu vực nhập liệu tin nhắn ở dưới đáy khung chat */}
          <form
            onSubmit={handleSend} // Sự kiện submit gửi tin nhắn
            style={{
              padding: "12px", // Đệm lề trong
              background: C.white, // Nền trắng tinh
              borderTop: `1px solid ${C.border}`, // Gạch kẻ ngang chia cách phía trên
              display: "flex", // Bố cục flex ngang
              gap: 8, // Khoảng cách giữa ô input và nút gửi là 8px
            }}
          >
            {/* Ô nhập tin nhắn văn bản */}
            <input
              type="text"
              value={input} // Liên kết với state input
              onChange={(e) => setInput(e.target.value)} // Cập nhật state khi gõ chữ
              placeholder="Hỏi mọi thứ..."
              disabled={loading} // Vô hiệu hóa ô nhập khi đang tải câu trả lời
              style={{
                flex: 1, // Chiếm trọn không gian còn lại
                padding: "8px 12px", // Đệm lề
                borderRadius: 8, // Bo góc viền 8px
                border: `1px solid ${C.border}`, // Viền xám mảnh mặc định
                fontSize: 13, // Cỡ chữ 13px
                outline: "none", // Loại bỏ outline viền mặc định của trình duyệt
                fontFamily: "inherit", // Kế thừa phông chữ
              }}
            />
            {/* Nút bấm gửi tin nhắn */}
            <button
              type="submit" // Submit form
              disabled={!input.trim() || loading} // Vô hiệu hóa nút nếu không nhập chữ hoặc đang tải
              style={{
                background: C.ocean, // Nền màu xanh ocean chủ đạo
                color: "#fff", // Chữ màu trắng
                border: "none", // Không viền
                borderRadius: 8, // Bo góc viền nút 8px
                padding: "8px 16px", // Đệm lề
                // Con trỏ chuột: không được bấm nếu không nhập, ngược lại là pointer
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                fontWeight: 700, // Chữ in đậm
                fontSize: 13, // Cỡ chữ 13px
                opacity: !input.trim() || loading ? 0.6 : 1, // Độ mờ 60% nếu bị disabled, ngược lại sáng rõ
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
