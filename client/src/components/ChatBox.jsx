// Nhập các hook useState, useEffect, useRef từ thư viện React để quản lý state và DOM references
import { useState, useEffect, useRef } from "react";
// Nhập đối tượng cấu hình màu sắc CSS theme từ thư mục utils
import { C } from "../utils/theme";
// Nhập hàm getSocket từ dịch vụ socket để kết nối real-time
import { getSocket } from "../services/socket";
// Nhập module tiện ích gọi API chung
import { api } from "../services/api";
// Nhập các biểu tượng MessageIcon, XIcon, CheckCircleIcon từ thư mục icons nội bộ
import { MessageIcon, XIcon, CheckCircleIcon } from "./icons/index";
// Nhập hook hiển thị thông báo toast từ ToastContext
import { useToast } from "../context/ToastContext";
// Nhập hook thực hiện cuộc gọi video từ VideoCallContext
import { useVideoCall } from "../context/VideoCallContext";

// Khai báo danh sách các biểu tượng cảm xúc (emoji) để người dùng bày tỏ cảm xúc tin nhắn
const emojis = ["❤️", "😆", "😮", "😢", "😡", "👍"];

// Định nghĩa đối tượng chứa các thuộc tính style dùng chung cho các nút hành động dạng icon
const actionIconBtnStyle = {
  background: "none", // Bỏ nền mặc định
  border: "none", // Bỏ viền mặc định
  cursor: "pointer", // Con trỏ chuột hình bàn tay
  fontSize: 14, // Kích thước chữ 14px
  padding: "4px", // Khoảng đệm 4px
  display: "flex", // Hiển thị dạng flex
  alignItems: "center", // Căn giữa nội dung theo chiều dọc
  justifyContent: "center", // Căn giữa nội dung theo chiều ngang
  borderRadius: "50%", // Bo tròn hoàn toàn
  transition: "background 0.15s", // Hiệu ứng đổi màu nền mượt mà
};

// Component chính ChatBox nhận các prop: product, onClose, user, fullHeight
export function ChatBox({ product, onClose, user, fullHeight = false }) {
  // Lấy hàm toast để gửi thông báo lên màn hình
  const toast = useToast();
  // State lưu danh sách tin nhắn hiện tại trong cuộc hội thoại
  const [msgs, setMsgs] = useState([]);
  // State lưu nội dung văn bản đang nhập trong ô input
  const [input, setInput] = useState("");
  // State quản lý trạng thái đang tải dữ liệu tin nhắn ban đầu từ server
  const [loading, setLoading] = useState(true);
  // State kiểm tra xem ô input nhập liệu có đang được focus hay không
  const [isInputFocused, setIsInputFocused] = useState(false);
  // State quản lý trạng thái đang tải ảnh lên server
  const [uploading, setUploading] = useState(false);
  // State quản lý trạng thái đang định vị và gửi vị trí hiện tại
  const [sendingLocation, setSendingLocation] = useState(false);

  // State lưu ID của tin nhắn đang được rê chuột qua (hover)
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  // State lưu ID của tin nhắn đang mở menu tùy chọn (thu hồi, sửa, forward...)
  const [activeMenuId, setActiveMenuId] = useState(null);
  // State lưu ID của tin nhắn đang hiển thị bảng chọn bày tỏ cảm xúc
  const [activeReactId, setActiveReactionId] = useState(null);
  // State lưu thông tin tin nhắn đang được trả lời (reply)
  const [replyTo, setReplyTo] = useState(null);
  // State lưu thông tin tin nhắn đang được chỉnh sửa (edit)
  const [editingMsg, setEditingMsg] = useState(null);
  // State lưu trữ các cảm xúc đã bày tỏ của từng tin nhắn, có key là ID tin nhắn
  const [msgReactions, setMsgReactions] = useState({});
  // State lưu tập hợp ID các tin nhắn đã bị thu hồi bằng cấu trúc Set
  const [recalledMsgs, setRecalledMsgs] = useState(new Set());

  // Ref trỏ tới phần tử cuối danh sách tin nhắn để tự động cuộn trang (scroll to bottom)
  const endRef = useRef(null);
  // Ref lưu trữ đối tượng socket connection hiện tại
  const socketRef = useRef(null);
  // Ref trỏ tới thẻ input file ẩn dùng để tải ảnh lên
  const fileInputRef = useRef(null);
  // Ref lưu ID của đối phương trong cuộc hội thoại chat
  const otherUserRef = useRef(null);

  // Chuyển đổi ID người dùng hiện tại về dạng chuỗi (string) để so sánh chính xác, tránh lỗi kiểu dữ liệu
  const currentUserId = String(user?.id || user?.userId || "");

  // Lấy ID của người bán từ thông tin sản phẩm
  const productSellerId = product.productSellerId || product.sellerId;
  // Kiểm tra xem người dùng hiện tại có phải là người bán sản phẩm này hay không
  const isSeller = currentUserId === String(productSellerId);
  // Xác định ID người mua: nếu là người bán thì lấy ID đối phương đang chat, ngược lại lấy ID của chính mình
  const buyerId = isSeller
    ? product.otherUserId || product.sellerId
    : currentUserId;

  // Lấy hàm startCall từ context gọi video call
  const { startCall } = useVideoCall();

  // useEffect để tải danh sách tin nhắn cũ từ server khi mở khung chat hoặc thay đổi sản phẩm/người dùng
  useEffect(() => {
    // Nếu thiếu ID người dùng hiện tại hoặc ID người mua thì không thực hiện gọi API
    if (!currentUserId || !buyerId) return;

    // Gửi yêu cầu lấy lịch sử tin nhắn của sản phẩm cụ thể và người mua cụ thể
    api(`/messages/${product.id}?buyerId=${buyerId}`)
      .then((data) => {
        // Ánh xạ dữ liệu trả về từ server sang cấu trúc dữ liệu hiển thị của client
        const mapped = data.map((m) => ({
          id: m.id, // ID của tin nhắn
          senderId: String(m.senderId), // Ép kiểu senderId về dạng chuỗi
          content: m.content, // Nội dung tin nhắn chữ
          imageUrl: m.imageUrl, // Link ảnh đính kèm (nếu có)
          location: m.location, // Đối tượng vị trí (nếu có)
          replyTo: m.replyTo || null, // Đối tượng tin nhắn được trả lời (nếu có)
          // Định dạng thời gian gửi tin nhắn thành định dạng giờ Việt Nam (ví dụ: 14:30)
          time: new Date(m.sentAt).toLocaleTimeString("vi", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          // Kiểm tra xem tin nhắn có phải do chính mình gửi hay không
          isMine: String(m.senderId) === currentUserId,
          isRecalled: m.isRecalled || false, // Trạng thái đã thu hồi hay chưa
          reaction: m.reaction || null, // Cảm xúc đã thả cho tin nhắn
        }));
        // Cập nhật danh sách tin nhắn vào state msgs
        setMsgs(mapped);

        // Khởi tạo trạng thái cảm xúc và danh sách tin nhắn thu hồi từ lịch sử tin nhắn đã lấy
        const initialReactions = {};
        const recalledSet = new Set();
        data.forEach((m) => {
          if (m.reaction) initialReactions[String(m.id)] = m.reaction;
          if (m.isRecalled) recalledSet.add(String(m.id));
        });
        setMsgReactions(initialReactions);
        setRecalledMsgs(recalledSet);

        // Tìm tin nhắn đầu tiên của đối phương để xác định ID của đối phương và lưu vào otherUserRef
        const other = data.find((m) => String(m.senderId) !== currentUserId);
        if (other) otherUserRef.current = String(other.senderId);

        // Phát ra sự kiện đồng bộ số lượng tin nhắn chưa đọc lên toàn ứng dụng
        window.dispatchEvent(new CustomEvent("sync-unread"));
      })
      .catch(() => {}) // Bỏ qua lỗi nếu có lỗi xảy ra
      .finally(() => setLoading(false)); // Tắt trạng thái tải dữ liệu khi hoàn tất
  }, [product.id, currentUserId, buyerId]); // Chạy lại khi product.id, currentUserId, hoặc buyerId thay đổi

  // useEffect để thiết lập kết nối Socket real-time và lắng nghe các sự kiện tin nhắn
  useEffect(() => {
    if (!currentUserId || !buyerId) return;
    let cancelled = false; // Biến cờ đánh dấu nếu component bị unmount trong quá trình chạy async

    // Hàm thông báo cho server biết người dùng tham gia vào phòng chat cụ thể này
    const joinRoom = () => {
      if (socketRef.current) {
        socketRef.current.emit("join_room", { productId: product.id, buyerId });
      }
    };

    // Lấy instance socket và thiết lập lắng nghe sự kiện
    getSocket().then((socket) => {
      if (cancelled) return; // Nếu component đã bị unmount thì bỏ qua
      socketRef.current = socket; // Lưu trữ socket vào ref
      joinRoom(); // Tham gia phòng chat

      // Đăng ký các callback cho các sự kiện socket tương ứng
      socket.on("connect", joinRoom); // Khi kết nối lại, tự động tham gia lại phòng
      socket.on("new_message", handleNewMessage); // Lắng nghe tin nhắn mới

      // Lắng nghe sự kiện một tin nhắn bị đối phương thu hồi
      socket.on("message_recalled", ({ id }) => {
        setRecalledMsgs((prev) => new Set([...prev, String(id)]));
      });

      // Lắng nghe sự kiện một tin nhắn được chỉnh sửa nội dung
      socket.on("message_edited", ({ id, content }) => {
        setMsgs((prev) =>
          prev.map((m) =>
            String(m.id) === String(id) ? { ...m, content } : m,
          ),
        );
      });

      // Lắng nghe sự kiện thả cảm xúc vào tin nhắn
      socket.on("message_reacted", ({ id, reaction }) => {
        setMsgReactions((prev) => ({ ...prev, [String(id)]: reaction }));
      });
    });

    // Hàm xử lý khi nhận được tin nhắn mới từ socket
    function handleNewMessage(msg) {
      // Nếu tin nhắn không thuộc sản phẩm hiện tại đang mở chat thì bỏ qua
      if (msg.productId !== product.id) return;
      
      // Xác định ID người mua của tin nhắn nhận được: nếu người gửi là người bán thì người nhận là người mua, ngược lại người gửi là người mua
      const msgBuyerId =
        String(msg.senderId) === String(productSellerId)
          ? msg.receiverId
          : msg.senderId;
      // Nếu ID người mua của tin nhắn không khớp với phòng chat hiện tại thì bỏ qua
      if (String(msgBuyerId) !== String(buyerId)) return;

      // Nếu người gửi tin nhắn này không phải chính mình thì lưu lại ID của họ vào otherUserRef
      if (String(msg.senderId) !== currentUserId)
        otherUserRef.current = String(msg.senderId);

      // Thêm tin nhắn mới nhận được vào danh sách tin nhắn
      setMsgs((prev) => {
        // Tránh trùng lặp tin nhắn: nếu tin nhắn đã tồn tại trong danh sách thì giữ nguyên
        if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
        return [
          ...prev,
          {
            id: String(msg.id),
            senderId: String(msg.senderId),
            content: msg.content,
            imageUrl: msg.imageUrl,
            location: msg.location,
            replyTo: msg.replyTo || null,
            time: new Date(msg.sentAt).toLocaleTimeString("vi", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMine: String(msg.senderId) === currentUserId,
            isRecalled: false,
            reaction: null,
          },
        ];
      });
    }

    // Cleanup function để gỡ bỏ lắng nghe sự kiện và rời phòng chat khi component hủy hoặc thay đổi tham số
    return () => {
      cancelled = true; // Đánh dấu đã hủy kết nối
      if (socketRef.current) {
        socketRef.current.off("connect", joinRoom);
        socketRef.current.off("new_message", handleNewMessage);
        socketRef.current.off("message_recalled");
        socketRef.current.off("message_edited");
        socketRef.current.off("message_reacted");
        // Gửi tín hiệu rời phòng chat lên server
        socketRef.current.emit("leave_room", {
          productId: product.id,
          buyerId,
        });
      }
    };
  }, [product.id, currentUserId, buyerId, productSellerId]); // Đăng ký dependencies cho useEffect

  // Tự động cuộn danh sách xuống tin nhắn mới nhất mỗi khi mảng tin nhắn msgs thay đổi
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // Hàm lấy ID người nhận tin nhắn (nếu mình là người bán thì gửi cho người kia, ngược lại gửi cho người bán)
  const getReceiverId = () => {
    const sellerId = String(product.sellerId);
    return currentUserId === sellerId ? otherUserRef.current : sellerId;
  };

  // Hàm chính xử lý gửi tin nhắn (hỗ trợ chữ, ảnh, vị trí)
  const send = (txtContent = "", imgUrl = null, locationObj = null) => {
    const finalContent = txtContent.trim();
    // Nếu cả chữ, ảnh và vị trí đều rỗng thì không làm gì cả
    if (!finalContent && !imgUrl && !locationObj) return;

    // Nếu đang trong chế độ chỉnh sửa tin nhắn cũ
    if (editingMsg) {
      // Gọi API PATCH để cập nhật nội dung tin nhắn trên server
      api(`/messages/${editingMsg.id}/edit`, {
        method: "PATCH",
        body: JSON.stringify({ content: finalContent }),
      })
        .then(() => {
          // Cập nhật nội dung tin nhắn mới vào mảng msgs hiển thị tại client
          setMsgs((prev) =>
            prev.map((m) =>
              m.id === editingMsg.id ? { ...m, content: finalContent } : m,
            ),
          );
          setEditingMsg(null); // Tắt chế độ chỉnh sửa
          setInput(""); // Reset ô nhập liệu
          toast.success("Đã chỉnh sửa tin nhắn!"); // Thông báo thành công
        })
        .catch((e) => toast.error(e.message)); // Thông báo nếu lỗi
      return;
    }

    // Lấy ID đối phương nhận tin nhắn
    const receiverId = getReceiverId();
    if (!receiverId) {
      toast.warn("Chưa có người nhận.");
      return;
    }
    // Tạo gói dữ liệu payload gửi đi
    const payload = {
      productId: product.id,
      receiverId,
      content: finalContent || null,
      imageUrl: imgUrl,
      location: locationObj,
      // Đính kèm tin nhắn gốc nếu đây là tin nhắn trả lời (reply)
      replyTo: replyTo
        ? {
            senderId: replyTo.senderId,
            content: replyTo.content || "Hình ảnh/Vị trí",
          }
        : null,
    };

    // Nếu socket đang hoạt động kết nối thì gửi trực tiếp qua socket real-time
    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", payload);
    } else {
      // Nếu socket chưa sẵn sàng, gọi API HTTP POST làm phương án dự phòng
      api("/messages", {
        method: "POST",
        body: JSON.stringify(payload),
      })
        .then((res) => {
          // Thêm tin nhắn mới vào cuối mảng msgs để hiển thị ngay lập tức
          setMsgs((prev) => [
            ...prev,
            {
              id: String(res.id),
              senderId: currentUserId,
              content: finalContent || null,
              imageUrl: imgUrl,
              location: locationObj,
              replyTo: payload.replyTo,
              time: new Date().toLocaleTimeString("vi", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isMine: true,
              isRecalled: false,
              reaction: null,
            },
          ]);
        })
        .catch((e) => toast.error(e.message));
    }
    setInput(""); // Xóa sạch nội dung ô input sau khi gửi
    setReplyTo(null); // Reset trạng thái reply tin nhắn
  };

  // Hàm xử lý các thao tác hành động từ menu tin nhắn (thu hồi, sửa, ghim, report,...)
  const handleMenuAction = (action, msg) => {
    setActiveMenuId(null); // Đóng menu sau khi chọn một hành động
    if (action === "recall") {
      // Gửi yêu cầu PATCH thu hồi tin nhắn lên server
      api(`/messages/${msg.id}/recall`, { method: "PATCH" })
        .then(() => {
          // Thêm ID tin nhắn vào tập hợp tin nhắn đã bị thu hồi
          setRecalledMsgs((prev) => new Set([...prev, String(msg.id)]));
          toast.success("Đã thu hồi tin nhắn.");
        })
        .catch((e) => toast.error(e.message));
    } else if (action === "edit") {
      // Đặt tin nhắn này vào state chỉnh sửa và đổ nội dung cũ lên ô input nhập liệu
      setEditingMsg(msg);
      setInput(msg.content || "");
    } else if (action === "pin") {
      toast.info("Đã ghim tin nhắn này.");
    } else if (action === "forward") {
      toast.success("Đang chuyển tiếp...");
    } else if (action === "report") {
      toast.success("Đã gửi báo cáo.");
    }
  };

  // Hàm xử lý việc thả/bày tỏ cảm xúc (emoji) vào tin nhắn
  const handleSelectReaction = (msgId, emoji) => {
    // Gọi API POST gửi cảm xúc đã chọn lên server
    api(`/messages/${msgId}/react`, {
      method: "POST",
      body: JSON.stringify({ reaction: emoji }),
    })
      .then((res) => {
        // Cập nhật cảm xúc mới vào state msgReactions để cập nhật giao diện
        setMsgReactions((prev) => ({ ...prev, [String(msgId)]: res.reaction }));
        setActiveReactionId(null); // Đóng bảng chọn emoji
      })
      .catch((e) => toast.error(e.message));
  };

  // Hàm xử lý chia sẻ vị trí hiện tại dựa trên định vị Geolocation API của trình duyệt
  const handleSendLocation = () => {
    // Kiểm tra xem trình duyệt có hỗ trợ chia sẻ vị trí không
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị vị trí.");
      return;
    }
    setSendingLocation(true); // Bật trạng thái đang định vị
    // Yêu cầu lấy tọa độ GPS hiện tại
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Gọi API dịch vụ Nominatim để giải ngược tọa độ thành địa chỉ chữ tiếng Việt dễ đọc
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "vi-VN,vi;q=0.9" } },
          );
          const data = await response.json();
          const address = data?.display_name || "Vị trí hiện tại";
          // Gửi tin nhắn chứa thông tin tọa độ và địa chỉ chữ giải nghĩa được
          send("", null, { latitude, longitude, address });
        } catch {
          // Nếu giải ngược địa chỉ thất bại, vẫn gửi tin nhắn đi với tọa độ thô và địa chỉ mặc định
          send("", null, {
            latitude,
            longitude,
            address: "Vị trí được chia sẻ",
          });
        } finally {
          setSendingLocation(false); // Tắt trạng thái đang định vị
        }
      },
      () => {
        setSendingLocation(false); // Tắt trạng thái đang định vị nếu bị người dùng từ chối hoặc lỗi
        toast.error("Không thể lấy vị trí hiện tại.");
      },
      // Cấu hình yêu cầu độ chính xác cao và thời gian chờ tối đa 10 giây
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Hàm xử lý tải ảnh đính kèm lên server khi người dùng chọn file
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return; // Nếu không chọn file thì thôi
    setUploading(true); // Bật trạng thái đang upload ảnh
    try {
      const fd = new FormData();
      fd.append("image", file);
      // Gửi FormData chứa file ảnh lên API upload của tin nhắn
      const res = await api("/messages/upload-image", {
        method: "POST",
        body: fd,
      });
      // Lấy link ảnh từ kết quả trả về và gửi tin nhắn
      send("", res.imageUrl);
    } catch (err) {
      toast.error("Gửi ảnh thất bại: " + err.message);
    } finally {
      setUploading(false); // Tắt trạng thái upload
    }
  };

  // Hàm bắt đầu thực hiện cuộc gọi video cho đối phương
  const handleInitiateCall = () => {
    const targetId = getReceiverId();
    if (!targetId) {
      toast.warn("Không tìm thấy đối phương khả dụng để thực hiện cuộc gọi.");
      return;
    }
    // Kích hoạt cuộc gọi video bằng ID người nhận và tên ngư dân hiển thị
    startCall(targetId, product.sellerName);
  };

  // Thiết lập chiều cao của danh sách chat phụ thuộc vào prop fullHeight
  const chatHeight = fullHeight ? 420 : 250;

  return (
    <div
      style={{
        border: "1.5px solid #eaeaea",
        borderRadius: 12,
        overflow: "hidden",
        background: C.white,
      }}
    >
      {/* ── Khối Header hiển thị thông tin đối phương và sản phẩm ── */}
      <div
        style={{
          background: "#0f172a", // Màu nền tối
          color: "#fff", // Chữ màu trắng
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            
            {/* Tên của đối phương (người bán hoặc người mua tùy vai trò) */}
            <span>{product.sellerName}</span>
            {/* Nếu người bán đã được xác minh danh tính thì hiện dấu tích xanh */}
            {product.sellerIsVerified && (
              <CheckCircleIcon size={12} style={{ color: "#38bdf8" }} />
            )}
          </div>
          {/* Nhãn nhỏ hiển thị tên sản phẩm liên quan */}
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
            Sản phẩm: {product.name}
          </div>
        </div>

        {/* Khối các nút chức năng trong Header (gọi video, đóng chat) */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Nút Gọi video */}
          <button
            onClick={handleInitiateCall}
            style={{
              background: "none",
              border: "none",
              color: "#38bdf8",
              cursor: "pointer",
              fontSize: 14,
              padding: "4px",
            }}
            title="Gọi video"
          >
            📞
          </button>
          {/* Nút đóng khung chat nhanh */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <XIcon size={19} />
            </button>
          )}
        </div>
      </div>

      {/* ── Danh sách các tin nhắn trao đổi ── */}
      <div
        style={{
          height: chatHeight, // Chiều cao linh hoạt tùy chỉnh
          overflowY: "auto", // Cho phép cuộn dọc
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "#f8fafc", // Màu nền xám xanh nhạt
        }}
      >
        {/* Nếu đang trong trạng thái loading thì hiển thị dòng chữ Đang tải */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 12,
              marginTop: 40,
            }}
          >
            Đang tải tin nhắn...
          </div>
        ) : /* Nếu mảng tin nhắn trống thì hiển thị hướng dẫn trò chuyện */
        msgs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 12,
              marginTop: 40,
            }}
          >
            Gửi tin nhắn để bắt đầu cuộc trò chuyện.
          </div>
        ) : (
          /* Duyệt qua từng tin nhắn trong danh sách để kết xuất bong bóng chat tương ứng */
          msgs.map((m) => {
            // Kiểm tra xem tin nhắn hiện tại có thuộc tập hợp tin nhắn đã bị thu hồi hay không
            const isRecalled = recalledMsgs.has(String(m.id));
            // Lấy cảm xúc tương ứng của tin nhắn từ state msgReactions
            const activeReaction = msgReactions[String(m.id)];

            return (
              <div
                key={m.id}
                // Rê chuột vào tin nhắn: hiển thị thanh công cụ tiện ích (emoji, reply, menu)
                onMouseEnter={() => setHoveredMsgId(m.id)}
                // Di chuột ra ngoài tin nhắn: ẩn thanh công cụ tiện ích và các popup của tin nhắn đó
                onMouseLeave={() => {
                  setHoveredMsgId(null);
                  setActiveReactionId(null);
                  setActiveMenuId(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  // Căn lề phải nếu là tin nhắn của chính mình gửi, căn trái nếu là của đối phương gửi
                  justifyContent: m.isMine ? "flex-end" : "flex-start",
                }}
              >
                {/* Ảnh đại diện giả lập của đối phương (chỉ hiển thị bên trái tin nhắn của đối phương) */}
                {!m.isMine && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0b4f6c, #1a7fa0)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(product.sellerName || "?").charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Khung chứa bong bóng tin nhắn và thanh toolbar tương tác khi hover */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    // Nếu là tin nhắn của mình: đảo ngược thứ tự các cột (bong bóng bên phải, toolbar bên trái)
                    flexDirection: m.isMine ? "row-reverse" : "row",
                    maxWidth: "75%",
                  }}
                >
                  {/* Khối Thanh công cụ (bày tỏ cảm xúc, trả lời, menu) hiển thị khi hover chuột */}
                  {hoveredMsgId === m.id && !isRecalled && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: 20,
                        padding: "2px 6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        flexShrink: 0,
                      }}
                    >
                      {/* Tiện ích Thả cảm xúc */}
                      <div style={{ position: "relative" }}>
                        <button
                          // Click sẽ mở hoặc đóng danh sách emoji lựa chọn
                          onClick={() =>
                            setActiveReactionId((v) =>
                              v === m.id ? null : m.id,
                            )
                          }
                          style={actionIconBtnStyle}
                          title="Bày tỏ cảm xúc"
                        >
                          🙂
                        </button>
                        {/* Popup chứa các emoji cho người dùng chọn */}
                        {activeReactId === m.id && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 30,
                              // Căn lề của popup dựa trên vị trí gửi tin nhắn (tránh bị lệch ra ngoài mép khung chat)
                              left: m.isMine ? "auto" : 0,
                              right: m.isMine ? 0 : "auto",
                              background: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 20,
                              padding: "4px 8px",
                              display: "flex",
                              gap: 6,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              zIndex: 20,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {/* Duyệt mảng emoji và xuất các nút */}
                            {emojis.map((emoji) => (
                              <button
                                key={emoji}
                                // Click sẽ thực hiện gửi cảm xúc này lên server
                                onClick={() =>
                                  handleSelectReaction(m.id, emoji)
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  fontSize: 18,
                                  cursor: "pointer",
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tiện ích Trả lời tin nhắn này (Reply) */}
                      <button
                        onClick={() => setReplyTo(m)}
                        style={actionIconBtnStyle}
                        title="Trả lời"
                      >
                        ↩️
                      </button>

                      {/* Tiện ích Xem thêm menu (chỉnh sửa, thu hồi, chuyển tiếp, báo cáo) */}
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() =>
                            setActiveMenuId((v) => (v === m.id ? null : m.id))
                          }
                          style={actionIconBtnStyle}
                          title="Xem thêm"
                        >
                          ⋮
                        </button>
                        {/* Popup menu chi tiết hiển thị */}
                        {activeMenuId === m.id && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 30,
                              left: m.isMine ? "auto" : 0,
                              right: m.isMine ? 0 : "auto",
                              background: "#2d2d2d",
                              borderRadius: 10,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              zIndex: 20,
                              overflow: "hidden",
                              minWidth: 110,
                            }}
                          >
                            {/* Mảng định nghĩa cấu trúc menu hiển thị dựa trên quyền người gửi */}
                            {[
                              { act: "edit", lbl: "Chỉnh sửa", show: m.isMine }, // Chỉ cho phép mình sửa tin của mình
                              { act: "recall", lbl: "Thu hồi", show: m.isMine }, // Chỉ cho phép mình thu hồi tin của mình
                              {
                                act: "forward",
                                lbl: "Chuyển tiếp",
                                show: true,
                              },
                              { act: "pin", lbl: "Ghim", show: true },
                              {
                                act: "report",
                                lbl: "Báo cáo",
                                show: !m.isMine, // Báo cáo tin nhắn của đối phương gửi
                              },
                            ].map((item) => {
                              if (!item.show) return null;
                              return (
                                <button
                                  key={item.act}
                                  // Click sẽ kích hoạt hàm handleMenuAction xử lý nghiệp vụ tương ứng
                                  onClick={() => handleMenuAction(item.act, m)}
                                  style={{
                                    width: "100%",
                                    padding: "7px 14px",
                                    border: "none",
                                    background: "none",
                                    color: "#fff",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    fontSize: 12,
                                  }}
                                >
                                  {item.lbl}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Khối chứa nội dung bong bóng tin nhắn chính */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      // Tin nhắn của mình căn phải, của đối phương căn trái
                      alignItems: m.isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    {/* Phần trích dẫn tin nhắn gốc nếu đây là một phản hồi (reply) */}
                    {m.replyTo && !isRecalled && (
                      <div
                        style={{
                          // Màu sắc trích dẫn tiệp với màu tin nhắn tương ứng
                          background: m.isMine
                            ? "rgba(15,23,42,0.12)"
                            : "#e2e8f0",
                          padding: "4px 10px",
                          // Bo tròn 2 góc trên để tạo sự liên kết với bong bóng phía dưới
                          borderRadius: m.isMine
                            ? "10px 10px 0 0"
                            : "10px 10px 0 0",
                          fontSize: 11,
                          color: "#64748b",
                          fontStyle: "italic",
                          borderBottom: "1px dashed #cbd5e1", // Đường kẻ nét đứt ngăn cách
                          maxWidth: "100%",
                        }}
                      >
                        ↩️{" "}
                        {/* Hiện "Bạn" hoặc tên đối phương gửi tin gốc */}
                        {m.replyTo.senderId === currentUserId
                          ? "Bạn"
                          : product.sellerName}{" "}
                        viết: {m.replyTo.content}
                      </div>
                    )}

                    {/* Khối Bong bóng nội dung chính của tin nhắn */}
                    <div
                      style={{
                        // Màu sắc dựa trên trạng thái bị thu hồi và nguồn gửi tin
                        background: isRecalled
                          ? "#e2e8f0" // Xám mờ nếu đã thu hồi
                          : m.isMine
                            ? "#0f172a" // Đen tối nếu là tin của chính mình
                            : "#ffffff", // Trắng nếu là tin của đối phương
                        color: isRecalled
                          ? "#94a3b8" // Chữ xám nhạt nếu đã thu hồi
                          : m.isMine
                            ? "#ffffff" // Chữ trắng trên nền đen
                            : "#1e293b", // Chữ tối trên nền trắng
                        padding: "9px 13px",
                        // Bo các góc bong bóng tạo nét phân biệt tin gửi/nhận
                        borderRadius: isRecalled
                          ? 10
                          : m.isMine
                            ? m.replyTo
                              ? "0 10px 10px 10px"
                              : "10px 10px 4px 10px" // Góc dưới bên phải nhọn hơn
                            : m.replyTo
                              ? "10px 0 10px 10px"
                              : "10px 10px 10px 4px", // Góc dưới bên trái nhọn hơn
                        fontSize: 13,
                        lineHeight: 1.45,
                        // Thêm bóng đổ nhẹ cho tin nhắn đối phương để làm nổi bật trên nền xám
                        boxShadow: m.isMine
                          ? "none"
                          : "0 1px 3px rgba(0,0,0,0.06)",
                        border:
                          m.isMine || isRecalled ? "none" : "1px solid #f1f5f9",
                        position: "relative",
                        wordBreak: "break-word", // Cho phép ngắt dòng khi từ quá dài
                        maxWidth: "100%",
                      }}
                    >
                      {/* Nếu tin nhắn đã bị thu hồi thì chỉ render dòng thông báo hủy */}
                      {isRecalled ? (
                        <span style={{ fontStyle: "italic" }}>
                          🚫 Tin nhắn đã bị thu hồi
                        </span>
                      ) : (
                        // Trường hợp tin nhắn hiển thị bình thường
                        <>
                          {/* Nội dung chữ (nếu có) */}
                          {m.content && <div>{m.content}</div>}
                          {/* Ảnh đính kèm (nếu có) */}
                          {m.imageUrl && (
                            <img
                              src={m.imageUrl}
                              alt="Ảnh đính kèm"
                              style={{
                                maxWidth: "100%",
                                borderRadius: 8,
                                marginTop: m.content ? 6 : 0, // Tạo khoảng cách nếu có kèm chữ ở trên
                                maxHeight: 180,
                                objectFit: "cover", // Giữ ảnh cân đối trong khung
                                display: "block",
                              }}
                            />
                          )}
                          {/* Bản đồ vị trí được chia sẻ (nếu có) */}
                          {m.location && (
                            <a
                              // Đường link dẫn tới Google Maps chỉ đường tới địa chỉ tọa độ
                              href={`https://www.google.com/maps/dir/?api=1&destination=${m.location.latitude},${m.location.longitude}`}
                              target="_blank" // Mở trong tab mới
                              rel="noopener noreferrer" // Bảo mật tab
                              style={{
                                display: "block",
                                background: m.isMine
                                  ? "rgba(255,255,255,0.12)"
                                  : "#f1f5f9",
                                color: m.isMine ? "#fff" : "#1e293b",
                                padding: "10px",
                                borderRadius: 8,
                                textDecoration: "none",
                                marginTop: m.content || m.imageUrl ? 8 : 0,
                                border: m.isMine
                                  ? "1px solid rgba(255,255,255,0.2)"
                                  : "1px solid #e2e8f0",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  alignItems: "center",
                                }}
                              >
                                {/* Biểu tượng ghim bản đồ của hộp chia sẻ vị trí */}
                                <div
                                  style={{
                                    fontSize: 20,
                                    background: m.isMine
                                      ? "rgba(255,255,255,0.25)"
                                      : "#fff",
                                    borderRadius: "50%",
                                    width: 36,
                                    height: 36,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  📍
                                </div>
                                {/* Phần hiển thị chữ mô tả vị trí và địa chỉ cụ thể */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      fontSize: 13,
                                      marginBottom: 2,
                                    }}
                                  >
                                    {m.isMine
                                      ? "Vị trí của tôi"
                                      : "Vị trí của đối phương"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: m.isMine
                                        ? "rgba(255,255,255,0.8)"
                                        : "#64748b",
                                      // Cắt ngắn địa chỉ bằng dấu ba chấm nếu quá dài
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={m.location.address}
                                  >
                                    {m.location.address || "Nhấn để xem bản đồ"}
                                  </div>
                                </div>
                              </div>
                            </a>
                          )}
                        </>
                      )}

                      {/* Phù hiệu hiển thị cảm xúc đã thả (nếu có) */}
                      {activeReaction && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: -10,
                            // Định vị phù hiệu cảm xúc: nằm bên phải nếu là tin của mình, ngược lại nằm bên trái
                            right: m.isMine ? 4 : "auto",
                            left: m.isMine ? "auto" : 4,
                            background: "#fff",
                            borderRadius: 12,
                            padding: "1px 5px",
                            fontSize: 12,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            zIndex: 5,
                          }}
                        >
                          {activeReaction}
                        </div>
                      )}
                    </div>

                    {/* Dòng thời gian gửi + Trạng thái đã gửi thành công */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                        paddingLeft: m.isMine ? 0 : 4,
                        paddingRight: m.isMine ? 4 : 0,
                      }}
                    >
                      {/* Giờ gửi tin */}
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>
                        {m.time}
                      </span>
                      {/* Nhãn "Đã gửi ✓" màu xanh lá (chỉ hiển thị với tin nhắn của mình) */}
                      {m.isMine && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#22c55e",
                            fontWeight: 600,
                          }}
                        >
                          · Đã gửi ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* Phần tử trống đánh dấu điểm cuối để thực hiện cuộn tự động */}
        <div ref={endRef} />
      </div>

      {/* ── Khối Hiển thị trạng thái đang Trả lời (Reply bar) ── */}
      {replyTo && (
        <div
          style={{
            padding: "8px 12px",
            background: "#f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div>
            Đang trả lời{" "}
            <strong>
              {/* Hiển thị đối tượng trả lời */}
              {replyTo.senderId === currentUserId
                ? "chính mình"
                : product.sellerName}
            </strong>
            :{" "}
            {/* Nội dung trích dẫn rút gọn */}
            <span style={{ color: "#64748b" }}>
              {replyTo.content || "Hình ảnh/Vị trí"}
            </span>
          </div>
          {/* Nút click để hủy trạng thái trả lời tin nhắn */}
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Khối Hiển thị trạng thái đang sửa (Edit bar) ── */}
      {editingMsg && (
        <div
          style={{
            padding: "8px 12px",
            background: "#fffbeb", // Màu nền vàng nhạt
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            borderTop: "1px solid #fef3c7",
          }}
        >
          <div style={{ color: "#b45309" }}>
            Đang chỉnh sửa:{" "}
            <span style={{ fontStyle: "italic" }}>{editingMsg.content}</span>
          </div>
          {/* Nút hủy chế độ chỉnh sửa: xóa nội dung ô nhập và đặt state editingMsg về null */}
          <button
            onClick={() => {
              setEditingMsg(null);
              setInput("");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Thanh nhập liệu tin nhắn ── */}
      <div
        style={{
          padding: "12px",
          display: "flex",
          gap: 8,
          borderTop: "1px solid #f1f5f9",
          background: C.white,
          alignItems: "center",
        }}
      >
        {/* Nút gửi hình ảnh */}
        <button
          // Click sẽ kích hoạt sự kiện click của thẻ input file ẩn
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sendingLocation}
          type="button"
          style={{
            background: "#f1f5f9",
            border: "none",
            borderRadius: 6,
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Gửi ảnh"
        >
          {/* Thay icon khi đang upload ảnh */}
          {uploading ? "⏳" : "📷"}
        </button>
        {/* Thẻ input file bị ẩn dùng để mở hộp chọn file hình ảnh */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        {/* Nút gửi/chia sẻ vị trí GPS */}
        <button
          onClick={handleSendLocation}
          disabled={uploading || sendingLocation}
          type="button"
          style={{
            background: "#f1f5f9",
            border: "none",
            borderRadius: 6,
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Chia sẻ vị trí"
        >
          {/* Thay icon khi đang định vị GPS */}
          {sendingLocation ? "⏳" : "📍"}
        </button>

        {/* Ô input nhập nội dung tin nhắn */}
        <input
          value={input}
          // Cập nhật state input khi gõ
          onChange={(e) => setInput(e.target.value)}
          // Nhấn phím Enter sẽ kích hoạt gửi tin nhắn đi ngay
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          // Đổi viền đậm hơn khi đang trỏ chuột vào ô
          onFocus={() => setIsInputFocused(true)}
          // Đổi lại viền nhạt khi rời ô input
          onBlur={() => setIsInputFocused(false)}
          placeholder={sendingLocation ? "Đang định vị..." : "Nhập tin nhắn..."}
          disabled={sendingLocation} // Vô hiệu hóa khi đang xử lý vị trí
          style={{
            flex: 1,
            // Đổi màu viền dựa theo trạng thái focus
            border: `1.5px solid ${isInputFocused ? "#0f172a" : "#cbd5e1"}`,
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />

        {/* Nút gửi tin nhắn */}
        <button
          onClick={() => send(input)}
          disabled={sendingLocation}
          style={{
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {/* Đổi nhãn nút: Lưu nếu đang sửa tin, Gửi nếu nhắn tin mới */}
          {editingMsg ? "Lưu" : "Gửi"}
        </button>
      </div>
    </div>
  );
}
