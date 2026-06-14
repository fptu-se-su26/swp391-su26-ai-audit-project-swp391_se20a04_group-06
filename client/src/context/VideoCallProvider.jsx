// Nhập các hook useState, useEffect, useRef, useCallback từ React để quản lý state và tối ưu hóa hiệu năng
import { useState, useEffect, useRef, useCallback } from "react";
// Nhập đối tượng VideoCallContext được định nghĩa trước đó
import { VideoCallContext } from "./VideoCallContext"; 
// Nhập hook useAuth để lấy thông tin tài khoản người dùng hiện tại
import { useAuth } from "./AuthContext";
// Nhập hook useToast để hiển thị các thông báo nhanh
import { useToast } from "./ToastContext";
// Nhập hàm getSocket để thiết lập kết nối thời gian thực qua socket
import { getSocket } from "../services/socket";
// Nhập component overlay hiển thị giao diện gọi video call
import { VideoCallOverlay } from "../components/VideoCallOverlay";

// Cấu hình máy chủ ICE (STUN) cho WebRTC để giải quyết NAT và thiết lập kết nối ngang hàng P2P
const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // Máy chủ STUN công cộng miễn phí của Google
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Component Provider chính quản lý luồng dữ liệu và thiết bị cuộc gọi video
export function VideoCallProvider({ children }) {
  // Lấy thông tin người dùng từ AuthContext
  const { user } = useAuth();
  // Lấy ra các hàm hiển thị thông báo (lỗi, cảnh báo, thông tin) từ ToastContext
  const { error, warn, info } = useToast();
  // Lấy ID của người dùng hiện tại
  const currentUserId = user?.id || user?.userId;

  // State lưu trạng thái cuộc gọi hiện tại, mặc định là "idle" (nhàn rỗi)
  // Các trạng thái gồm: "idle" | "calling" (đang gọi đi) | "incoming" (có cuộc gọi đến) | "connected" (đã kết nối đàm thoại)
  const [callState, setCallState] = useState("idle"); 
  // State lưu ID của đối phương trong cuộc gọi
  const [partnerId, setPartnerId] = useState(null);
  // State lưu tên hiển thị của đối phương
  const [partnerName, setPartnerName] = useState("Người dùng");
  // State lưu luồng media local (camera + micro của chính mình)
  const [localStream, setLocalStream] = useState(null);
  // State lưu luồng media remote (camera + micro của đối phương)
  const [remoteStream, setRemoteStream] = useState(null);

  // Ref lưu kết nối socket thời gian thực
  const socketRef = useRef(null);
  // Ref lưu đối tượng RTCPeerConnection đại diện cho kết nối WebRTC ngang hàng
  const peerConnectionRef = useRef(null);
  // Ref lưu luồng media local (giúp tránh việc render lại không cần thiết khi gọi từ trong useEffect)
  const localStreamRef = useRef(null);
  // Ref lưu tạm thông tin Offer SDP cuộc gọi đến để chờ người dùng bấm bắt máy
  const tempOfferRef = useRef(null);
  // Ref lưu hàng đợi các ứng viên ICE candidate mạng nhận được trước khi kết nối WebRTC được thiết lập
  const iceQueueRef = useRef([]);

  // Ref lưu trạng thái state mới nhất để các hàm callback bất đồng bộ luôn đọc đúng giá trị hiện tại
  const latestStateRef = useRef({ callState, partnerId, localStream });
  // Cập nhật giá trị ref mỗi khi các state liên quan thay đổi
  useEffect(() => {
    latestStateRef.current = { callState, partnerId, localStream };
  }, [callState, partnerId, localStream]);

  // Hàm dọn dẹp giải phóng toàn bộ thiết bị phần cứng (camera, micro) và kết nối WebRTC
  const cleanUpCall = useCallback(() => {
    console.log("[WebRTC] Đang tiến hành dọn dẹp giải phóng thiết bị...");

    // Tắt tất cả các track (âm thanh, hình ảnh) của camera và micro của chính mình
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop(); // Ngắt nguồn hoạt động của thiết bị phần cứng tương ứng
      });
      localStreamRef.current = null;
    }

    // Đóng kết nối RTCPeerConnection ngang hàng P2P
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn("Lỗi đóng kết nối RTC:", e);
      }
    }

    // Reset các biến tham chiếu về trạng thái mặc định ban đầu
    peerConnectionRef.current = null;
    tempOfferRef.current = null;
    iceQueueRef.current = [];

    // Reset toàn bộ state hiển thị giao diện về trạng thái ban đầu
    setLocalStream(null);
    setRemoteStream(null);
    setPartnerId(null);
    setPartnerName("Người dùng");
    setCallState("idle");
  }, []);

  // useEffect tự động gác máy cuộc gọi và dọn dẹp nếu người dùng đột ngột đăng xuất tài khoản
  useEffect(() => {
    // Chỉ dọn dẹp khi người dùng đăng xuất trong lúc cuộc gọi đang diễn ra (không phải trạng thái idle)
    if (!currentUserId && latestStateRef.current.callState !== "idle") {
      cleanUpCall();
    }
  }, [currentUserId, cleanUpCall]);

  // useEffect thiết lập kết nối Socket để lắng nghe các sự kiện báo hiệu cuộc gọi (signaling)
  useEffect(() => {
    if (!currentUserId) return; // Nếu chưa đăng nhập thì không lắng nghe socket cuộc gọi
    let isMounted = true; // Biến cờ kiểm soát unmount

    // Callback xử lý khi nhận được tín hiệu cuộc gọi đến từ đối phương
    const handleIncomingCall = ({ from, offer, callerName }) => {
      if (!isMounted) return;
      console.log("[Socket Call] Nhận cuộc gọi đến từ:", callerName);
      setCallState("incoming"); // Đổi trạng thái sang có cuộc gọi đến
      setPartnerId(from); // Lưu ID người gọi tới
      setPartnerName(callerName || "Ngư dân bản địa"); // Lưu tên người gọi
      tempOfferRef.current = offer; // Lưu tạm Offer SDP để xử lý sau khi bấm chấp nhận
    };

    // Callback xử lý khi đối phương đồng ý bắt máy cuộc gọi đi của mình
    const handleCallAccepted = async ({ answer }) => {
      if (!isMounted) return;
      console.log("[Socket Call] Đối phương đã chấp nhận bắt máy:", answer);
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          // Gán Answer SDP nhận được vào cấu hình kết nối WebRTC
          await pc.setRemoteDescription(answer);
          setCallState("connected"); // Đổi trạng thái sang đã kết nối đàm thoại

          console.log(
            `[WebRTC] Đang đồng bộ ${iceQueueRef.current.length} ứng viên mạng từ hàng đợi...`,
          );
          // Đồng bộ các ứng viên ICE candidate nằm trong hàng đợi chờ xử lý
          for (const candidate of iceQueueRef.current) {
            await pc
              .addIceCandidate(new RTCIceCandidate(candidate))
              .catch((e) => {
                console.warn("Lỗi đồng bộ candidate sớm:", e);
              });
          }
          iceQueueRef.current = []; // Làm sạch hàng đợi
        }
      } catch (err) {
        console.error("Lỗi thiết lập đàm thoại:", err);
        error("Lỗi đồng bộ kết nối đàm thoại.");
        cleanUpCall(); // Dọn dẹp kết nối nếu xảy ra lỗi
      }
    };

    // Callback xử lý khi nhận được thông tin ứng viên kết nối mạng ICE candidate từ đối phương
    const handleNewIceCandidate = async ({ candidate }) => {
      if (!isMounted) return;
      const pc = peerConnectionRef.current;
      // Nếu kết nối WebRTC đã được cấu hình remoteDescription thì gán trực tiếp candidate vào kết nối
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Lỗi gán ICE candidate trực tiếp:", err);
        }
      } else {
        // Ngược lại, nếu chưa kết nối xong, đẩy candidate vào hàng đợi để đồng bộ sau
        iceQueueRef.current.push(candidate);
      }
    };

    // Callback xử lý khi đối phương chủ động bấm tắt/từ chối cuộc gọi
    const handleCallEndedByPartner = () => {
      if (!isMounted) return;
      info("Cuộc gọi đã kết thúc."); // Hiển thị thông báo
      cleanUpCall(); // Giải phóng tài nguyên
    };

    // Khởi tạo/Lấy socket kết nối và đăng ký lắng nghe các sự kiện cuộc gọi
    getSocket()
      .then((socket) => {
        if (!isMounted) return;
        socketRef.current = socket;

        // Đăng ký các sự kiện tương ứng
        socket.on("incoming_call", handleIncomingCall);
        socket.on("call_accepted", handleCallAccepted);
        socket.on("ice_candidate", handleNewIceCandidate);
        socket.on("call_ended", handleCallEndedByPartner);
      })
      .catch((err) => console.error("Kết nối Socket Call lỗi:", err));

    // Cleanup: Gỡ bỏ toàn bộ lắng nghe sự kiện khi component unmount
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off("incoming_call", handleIncomingCall);
        socketRef.current.off("call_accepted", handleCallAccepted);
        socketRef.current.off("ice_candidate", handleNewIceCandidate);
        socketRef.current.off("call_ended", handleCallEndedByPartner);
      }
    };
  }, [currentUserId, cleanUpCall, error, info]);

  // Hàm khởi tạo đối tượng RTCPeerConnection cho cuộc gọi video
  const createPeerConnection = useCallback(
    (targetId) => {
      // Khởi tạo Peer Connection với cấu hình STUN servers
      const pc = new RTCPeerConnection(rtcConfig);

      // Lắng nghe sự kiện tìm thấy ứng viên ICE candidate mạng của chính mình
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          // Gửi thông tin ứng viên mạng của mình sang cho đối phương qua socket
          socketRef.current.emit("ice_candidate", {
            to: targetId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Lắng nghe sự kiện nhận được luồng media (track) từ đối phương gửi tới
      pc.ontrack = (event) => {
        // Nếu đối phương truyền nguyên một luồng stream
        if (event.streams && event.streams[0]) {
          // Lưu luồng media nhận được vào state remoteStream để phát lên thẻ video
          setRemoteStream(new MediaStream(event.streams[0]));
        } else {
          // Nếu nhận dạng track lẻ, bổ sung track mới vào stream hiện tại
          setRemoteStream((prevStream) => {
            const stream = prevStream ? prevStream : new MediaStream();
            stream.addTrack(event.track);
            return new MediaStream(stream);
          });
        }
      };

      // Lắng nghe thay đổi trạng thái kết nối WebRTC
      pc.onconnectionstatechange = () => {
        // Nếu kết nối bị mất, thất bại hoặc bị đóng
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          warn("Kết nối cuộc gọi đã bị ngắt.");
          cleanUpCall(); // Tiến hành giải phóng thiết bị
        }
      };

      peerConnectionRef.current = pc; // Lưu tham chiếu đối tượng kết nối
      return pc;
    },
    [cleanUpCall, warn],
  );

  // Hàm bắt đầu thực hiện cuộc gọi đi tới đối phương
  const startCall = async (targetUserId, targetUserName) => {
    try {
      // Kiểm tra sự hỗ trợ của trình duyệt về quyền truy cập Media
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Trình duyệt yêu cầu HTTPS bảo mật để sử dụng máy ảnh & micro.",
        );
      }

      setCallState("calling"); // Đổi trạng thái sang đang gọi đi
      setPartnerId(targetUserId); // Lưu ID đối phương
      setPartnerName(targetUserName || "Người dùng"); // Lưu tên đối phương

      // Yêu cầu quyền truy cập vào camera và micro của chính mình
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream); // Lưu luồng local vào state
      localStreamRef.current = stream; // Lưu vào ref để tiện tắt thiết bị khi hủy

      // Khởi tạo Peer Connection WebRTC
      const pc = createPeerConnection(targetUserId);
      // Gán các track media local của mình vào kết nối WebRTC để truyền đi
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Tạo Offer SDP mô tả cấu hình kết nối WebRTC
      const offer = await pc.createOffer();
      // Thiết lập cấu hình local mô tả cho kết nối
      await pc.setLocalDescription(offer);

      const offerToSend = {
        type: offer.type,
        sdp: offer.sdp,
      };

      // Gửi tín hiệu cuộc gọi (Offer) tới đối phương thông qua Socket
      socketRef.current.emit("call_user", {
        to: targetUserId,
        offer: offerToSend,
        callerName: user?.name || "Một người dùng",
      });
    } catch (err) {
      console.error("Khởi động cuộc gọi lỗi:", err);
      // Hiển thị cảnh báo lỗi cho người dùng biết lý do (thiếu quyền camera, v.v.)
      error(err.message || "Không thể truy cập camera của bạn.");
      cleanUpCall(); // Dọn dẹp giải phóng thiết bị
    }
  };

  // Hàm chấp nhận bắt máy khi có cuộc gọi đến
  const acceptCall = async () => {
    const { partnerId: currentPartnerId } = latestStateRef.current;
    try {
      // Kiểm tra quyền media của trình duyệt
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Trình duyệt yêu cầu HTTPS bảo mật để sử dụng máy ảnh & micro.",
        );
      }

      // Lấy Offer SDP của người gọi đã lưu tạm
      const offer = tempOfferRef.current;
      if (!offer) {
        throw new Error("Không tìm thấy cấu hình cuộc gọi đến.");
      }

      // Yêu cầu quyền truy cập camera/micro của chính mình
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream); // Lưu luồng vào state
      localStreamRef.current = stream;

      // Khởi tạo Peer Connection WebRTC
      const pc = createPeerConnection(currentPartnerId);
      // Gán các track media local của mình vào kết nối để truyền sang đối phương
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Gán cấu hình mô tả của đối phương (Offer) vào kết nối
      await pc.setRemoteDescription(offer);
      // Tạo Answer SDP phản hồi chấp nhận cuộc gọi
      const answer = await pc.createAnswer();
      // Thiết lập cấu hình mô tả local cho kết nối
      await pc.setLocalDescription(answer);

      const answerToSend = {
        type: answer.type,
        sdp: answer.sdp,
      };

      // Gửi tín hiệu Answer phản hồi đồng ý kết nối qua Socket cho người gọi
      socketRef.current.emit("answer_call", {
        to: currentPartnerId,
        answer: answerToSend,
      });
      setCallState("connected"); // Đổi trạng thái sang đã kết nối đàm thoại

      // Đồng bộ các ứng viên ICE candidate mạng đang xếp hàng chờ
      for (const candidate of iceQueueRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => {
          console.warn("Lỗi đồng bộ candidate sớm:", e);
        });
      }
      iceQueueRef.current = []; // Xóa sạch hàng đợi
    } catch (err) {
      console.error("Chấp nhận cuộc gọi video lỗi:", err);
      error(err.message || "Lỗi đồng bộ kết nối camera.");
      cleanUpCall(); // Dọn dẹp giải phóng thiết bị
    }
  };

  // Hàm chủ động tắt cuộc gọi (gác máy)
  const endCall = () => {
    const { partnerId: currentPartnerId } = latestStateRef.current;
    // Nếu socket hoạt động và có thông tin đối phương thì gửi tín hiệu tắt máy cuộc gọi lên server
    if (socketRef.current && currentPartnerId) {
      socketRef.current.emit("end_call", { to: currentPartnerId });
    }
    cleanUpCall(); // Thực hiện dọn dẹp bộ thiết bị local
  };

  return (
    // Cung cấp các trạng thái cuộc gọi và các hàm bắt đầu/kết thúc cuộc gọi cho toàn bộ ứng dụng
    <VideoCallContext.Provider
      value={{
        callState,
        partnerId,
        partnerName,
        startCall,
        acceptCall,
        endCall,
      }}
    >
      {/* Kết xuất các component con */}
      {children}
      {/* Nếu trạng thái cuộc gọi khác idle (đang gọi, có cuộc gọi đến hoặc đã kết nối) thì hiển thị giao diện gọi video call đè lên màn hình */}
      {callState !== "idle" && (
        <VideoCallOverlay
          callState={callState}
          localStream={localStream}
          remoteStream={remoteStream}
          onAccept={acceptCall}
          onReject={endCall}
          partnerName={partnerName}
        />
      )}
    </VideoCallContext.Provider>
  );
}
