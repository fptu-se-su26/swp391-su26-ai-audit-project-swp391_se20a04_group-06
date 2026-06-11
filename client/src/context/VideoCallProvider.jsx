import { useState, useEffect, useRef, useCallback } from "react";
import { VideoCallContext } from "./VideoCallContext"; // Nhập Context từ file vừa tách
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { getSocket } from "../services/socket";
import { VideoCallOverlay } from "../components/VideoCallOverlay";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function VideoCallProvider({ children }) {
  const { user } = useAuth();
  const { error, warn, info } = useToast();
  const currentUserId = user?.id || user?.userId;

  const [callState, setCallState] = useState("idle"); // idle | calling | incoming | connected
  const [partnerId, setPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState("Người dùng");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const tempOfferRef = useRef(null);
  const iceQueueRef = useRef([]);

  const latestStateRef = useRef({ callState, partnerId, localStream });
  useEffect(() => {
    latestStateRef.current = { callState, partnerId, localStream };
  }, [callState, partnerId, localStream]);

  // Giải phóng toàn bộ thiết bị cuộc gọi
  const cleanUpCall = useCallback(() => {
    console.log("[WebRTC] Đang tiến hành dọn dẹp giải phóng thiết bị...");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn("Lỗi đóng kết nối RTC:", e);
      }
    }

    peerConnectionRef.current = null;
    tempOfferRef.current = null;
    iceQueueRef.current = [];

    setLocalStream(null);
    setRemoteStream(null);
    setPartnerId(null);
    setPartnerName("Người dùng");
    setCallState("idle");
  }, []);

  // Tự động gác máy khi đăng xuất tài khoản đột ngột
  useEffect(() => {
    // 🌟 KHẮC PHỤC 1: Chỉ dọn dẹp khi người dùng đăng xuất trong lúc cuộc gọi đang diễn ra (không phải trạng thái idle)
    if (!currentUserId && latestStateRef.current.callState !== "idle") {
      cleanUpCall();
    }
  }, [currentUserId, cleanUpCall]);

  // Thiết lập kết nối Socket lắng nghe cuộc gọi toàn màn hình
  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;

    const handleIncomingCall = ({ from, offer, callerName }) => {
      if (!isMounted) return;
      console.log("[Socket Call] Nhận cuộc gọi đến từ:", callerName);
      setCallState("incoming");
      setPartnerId(from);
      setPartnerName(callerName || "Ngư dân bản địa");
      tempOfferRef.current = offer;
    };

    const handleCallAccepted = async ({ answer }) => {
      if (!isMounted) return;
      console.log("[Socket Call] Đối phương đã chấp nhận bắt máy:", answer);
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(answer);
          setCallState("connected");

          console.log(
            `[WebRTC] Đang đồng bộ ${iceQueueRef.current.length} ứng viên mạng từ hàng đợi...`,
          );
          for (const candidate of iceQueueRef.current) {
            await pc
              .addIceCandidate(new RTCIceCandidate(candidate))
              .catch((e) => {
                console.warn("Lỗi đồng bộ candidate sớm:", e);
              });
          }
          iceQueueRef.current = [];
        }
      } catch (err) {
        console.error("Lỗi thiết lập đàm thoại:", err);
        error("Lỗi đồng bộ kết nối đàm thoại.");
        cleanUpCall();
      }
    };

    const handleNewIceCandidate = async ({ candidate }) => {
      if (!isMounted) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Lỗi gán ICE candidate trực tiếp:", err);
        }
      } else {
        iceQueueRef.current.push(candidate);
      }
    };

    const handleCallEndedByPartner = () => {
      if (!isMounted) return;
      info("Cuộc gọi đã kết thúc.");
      cleanUpCall();
    };

    getSocket()
      .then((socket) => {
        if (!isMounted) return;
        socketRef.current = socket;

        socket.on("incoming_call", handleIncomingCall);
        socket.on("call_accepted", handleCallAccepted);
        socket.on("ice_candidate", handleNewIceCandidate);
        socket.on("call_ended", handleCallEndedByPartner);
      })
      .catch((err) => console.error("Kết nối Socket Call lỗi:", err));

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

  const createPeerConnection = useCallback(
    (targetId) => {
      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice_candidate", {
            to: targetId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(new MediaStream(event.streams[0]));
        } else {
          setRemoteStream((prevStream) => {
            const stream = prevStream ? prevStream : new MediaStream();
            stream.addTrack(event.track);
            return new MediaStream(stream);
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          warn("Kết nối cuộc gọi đã bị ngắt.");
          cleanUpCall();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [cleanUpCall, warn],
  );

  const startCall = async (targetUserId, targetUserName) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Trình duyệt yêu cầu HTTPS bảo mật để sử dụng máy ảnh & micro.",
        );
      }

      setCallState("calling");
      setPartnerId(targetUserId);
      setPartnerName(targetUserName || "Người dùng");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetUserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const offerToSend = {
        type: offer.type,
        sdp: offer.sdp,
      };

      socketRef.current.emit("call_user", {
        to: targetUserId,
        offer: offerToSend,
        callerName: user?.name || "Một người dùng",
      });
    } catch (err) {
      console.error("Khởi động cuộc gọi lỗi:", err);
      error(err.message || "Không thể truy cập camera của bạn.");
      cleanUpCall();
    }
  };

  const acceptCall = async () => {
    const { partnerId: currentPartnerId } = latestStateRef.current;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Trình duyệt yêu cầu HTTPS bảo mật để sử dụng máy ảnh & micro.",
        );
      }

      const offer = tempOfferRef.current;
      if (!offer) {
        throw new Error("Không tìm thấy cấu hình cuộc gọi đến.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(currentPartnerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const answerToSend = {
        type: answer.type,
        sdp: answer.sdp,
      };

      socketRef.current.emit("answer_call", {
        to: currentPartnerId,
        answer: answerToSend,
      });
      setCallState("connected");

      for (const candidate of iceQueueRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => {
          console.warn("Lỗi đồng bộ candidate sớm:", e);
        });
      }
      iceQueueRef.current = [];
    } catch (err) {
      console.error("Chấp nhận cuộc gọi video lỗi:", err);
      error(err.message || "Lỗi đồng bộ kết nối camera.");
      cleanUpCall();
    }
  };

  const endCall = () => {
    const { partnerId: currentPartnerId } = latestStateRef.current;
    if (socketRef.current && currentPartnerId) {
      socketRef.current.emit("end_call", { to: currentPartnerId });
    }
    cleanUpCall();
  };

  return (
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
      {children}
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
