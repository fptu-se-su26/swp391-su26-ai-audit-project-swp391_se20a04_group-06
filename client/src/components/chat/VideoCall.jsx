import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp"
      ],
      username: "openrelay",
      credential: "openrelay"
    }
  ],
};

function getInitials(name) {
  if (!name) return "ND";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function VideoCall({
  currentUser,
  partnerId: propPartnerId,
  partnerName: propPartnerName,
  productId: propProductId,
  socket,
}) {
  const [partnerId, setPartnerId] = useState(propPartnerId || "");
  const [partnerName, setPartnerName] = useState(propPartnerName || "");
  const [productId, setProductId] = useState(propProductId || "");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteIdRef = useRef(propPartnerId || "");
  const queuedCandidatesRef = useRef([]);
  const callingTimeoutRef = useRef(null);
  
  const [phase, setPhase] = useState("idle"); // "idle" | "calling" | "incoming" | "connecting" | "connected"
  const [isOpen, setIsOpen] = useState(false);
  const [incoming, setIncoming] = useState(null);
  const [error, setError] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [callTimer, setCallTimer] = useState(0);
  const ringtoneRef = useRef(null);

  // Sync props to state if provided
  useEffect(() => {
    if (propPartnerId) setPartnerId(propPartnerId);
    if (propPartnerName) setPartnerName(propPartnerName);
    if (propProductId) setProductId(propProductId);
  }, [propPartnerId, propPartnerName, propProductId]);

  const productIdRef = useRef(productId);
  useEffect(() => {
    productIdRef.current = productId;
  }, [productId]);

  // Live Timer for Connected Call
  useEffect(() => {
    let interval = null;
    if (phase === "connected") {
      setCallTimer(0);
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startRingtone = useCallback(() => {
    if (ringtoneRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playRingTone = () => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.value = 480;
        osc2.type = "sine";
        osc2.frequency.value = 620;

        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        osc1.stop(ctx.currentTime + 1.5);
        osc2.stop(ctx.currentTime + 1.5);
      };

      playRingTone();
      const intervalId = setInterval(playRingTone, 3000);
      ringtoneRef.current = { ctx, intervalId };
    } catch (err) {
      console.warn("Failed to initialize ringtone AudioContext:", err);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current.intervalId);
      try {
        void ringtoneRef.current.ctx.close();
      } catch {}
      ringtoneRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === "incoming" || phase === "calling") {
      startRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [phase, startRingtone, stopRingtone]);

  useEffect(() => {
    remoteIdRef.current = partnerId;
  }, [partnerId]);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const resetCall = useCallback(() => {
    if (callingTimeoutRef.current) {
      clearTimeout(callingTimeoutRef.current);
      callingTimeoutRef.current = null;
    }
    peerRef.current?.close();
    peerRef.current = null;
    queuedCandidatesRef.current = [];
    stopMedia();
    setIncoming(null);
    setPhase("idle");
    setMicEnabled(true);
    setCameraEnabled(true);
  }, [stopMedia]);

  const endCall = useCallback((notify = true) => {
    const targetPartnerId = remoteIdRef.current || partnerId;
    const targetProductId = productIdRef.current || productId;
    if (notify && targetPartnerId) {
      socket?.emit("end_call", { to: targetPartnerId, productId: targetProductId });
    }
    resetCall();
    setIsOpen(false);
  }, [productId, partnerId, resetCall, socket]);

  const ensureMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Trình duyệt không hỗ trợ camera/microphone.");
    }
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    }
    return localStreamRef.current;
  }, []);

  const flushCandidates = useCallback(async (peer) => {
    const queued = queuedCandidatesRef.current;
    queuedCandidatesRef.current = [];
    for (const candidate of queued) {
      await peer.addIceCandidate(candidate);
    }
  }, []);

  const createPeer = useCallback((remoteId, targetProductId) => {
    peerRef.current?.close();
    const peer = new RTCPeerConnection(RTC_CONFIG);
    remoteIdRef.current = remoteId;
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit("ice_candidate", { to: remoteId, candidate, productId: targetProductId });
    };
    peer.ontrack = ({ streams }) => {
      if (remoteVideoRef.current && streams[0]) {
        remoteVideoRef.current.srcObject = streams[0];
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") setPhase("connected");
      if (["failed", "closed"].includes(peer.connectionState)) resetCall();
    };
    peerRef.current = peer;
    return peer;
  }, [resetCall, socket]);

  const startCall = useCallback(async (targetPartnerId = partnerId, targetProductId = productId) => {
    if (!socket || !targetPartnerId || !targetProductId) {
      console.warn("[VideoCall] Cannot start call - missing params");
      return;
    }
    remoteIdRef.current = targetPartnerId;
    productIdRef.current = targetProductId;
    setError("");
    setPhase("calling");
    setIsOpen(true);
    try {
      const stream = await ensureMedia();
      const peer = createPeer(targetPartnerId, targetProductId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("call_user", {
        to: targetPartnerId,
        offer,
        callerName: currentUser?.name || "Người mua",
        productId: targetProductId,
      });

      callingTimeoutRef.current = setTimeout(() => {
        setError("Người nhận không trả lời hoặc không trực tuyến.");
        endCall(true);
      }, 30000);
    } catch (callError) {
      setError(callError.message || "Không thể mở camera/micro để gọi.");
      resetCall();
    }
  }, [socket, currentUser, ensureMedia, createPeer, endCall, resetCall, partnerId, productId]);

  const acceptCall = async () => {
    if (!incoming) return;
    setError("");
    setPhase("connecting");
    try {
      const stream = await ensureMedia();
      const peer = createPeer(incoming.from, incoming.productId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      await peer.setRemoteDescription(incoming.offer);
      await flushCandidates(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer_call", { to: incoming.from, answer, productId: incoming.productId });
      setIncoming(null);
    } catch (callError) {
      setError(callError.message || "Không thể chấp nhận cuộc gọi.");
      socket?.emit("reject_call", { to: incoming.from, productId: incoming.productId });
      resetCall();
    }
  };

  const rejectCall = () => {
    if (incoming?.from) socket?.emit("reject_call", { to: incoming.from, productId: incoming.productId });
    resetCall();
    setIsOpen(false);
  };

  // Register window custom event listener for triggering outgoing call globally
  useEffect(() => {
    const handleStartCall = (e) => {
      const { partnerId: pId, partnerName: pName, productId: prodId } = e.detail;
      setPartnerId(pId);
      setPartnerName(pName);
      setProductId(prodId);
      remoteIdRef.current = pId;
      productIdRef.current = prodId;
      void startCall(pId, prodId);
    };
    window.addEventListener("start_video_call", handleStartCall);
    return () => window.removeEventListener("start_video_call", handleStartCall);
  }, [startCall]);

  useEffect(() => {
    if (!socket) return undefined;

    const onIncoming = (data) => {
      if (phase !== "idle") return;
      setPartnerId(data.from);
      setPartnerName(data.callerName || "Ngư dân");
      setProductId(data.productId);
      remoteIdRef.current = data.from;
      productIdRef.current = data.productId;
      setIncoming(data);
      setPhase("incoming");
      setIsOpen(true);
    };
    const onAccepted = async ({ answer, productId: acceptedProductId }) => {
      try {
        if (String(acceptedProductId) !== String(productIdRef.current)) return;
        if (!peerRef.current) return;
        if (callingTimeoutRef.current) {
          clearTimeout(callingTimeoutRef.current);
          callingTimeoutRef.current = null;
        }
        await peerRef.current.setRemoteDescription(answer);
        await flushCandidates(peerRef.current);
        setPhase("connected");
      } catch {
        setError("Không thể hoàn tất kết nối cuộc gọi.");
        resetCall();
      }
    };
    const onCandidate = async ({ candidate, productId: candidateProductId }) => {
      if (String(candidateProductId) !== String(productIdRef.current)) return;
      if (!candidate) return;
      const peer = peerRef.current;
      if (!peer?.remoteDescription) {
        queuedCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        setError("Không thể thêm ICE candidate.");
      }
    };
    const onRejected = ({ productId: rejectedProductId } = {}) => {
      if (String(rejectedProductId) !== String(productIdRef.current)) return;
      resetCall();
      setError("Người nhận đã từ chối cuộc gọi.");
    };
    const onEnded = ({ productId: endedProductId } = {}) => {
      if (String(endedProductId) === String(productIdRef.current)) {
        resetCall();
        setError("Cuộc gọi đã kết thúc.");
      }
    };
    const onError = (err) => {
      setError(err?.message || "Lỗi cuộc gọi từ máy chủ.");
      resetCall();
    };

    socket.on("incoming_call", onIncoming);
    socket.on("call_accepted", onAccepted);
    socket.on("ice_candidate", onCandidate);
    socket.on("call_rejected", onRejected);
    socket.on("call_ended", onEnded);
    socket.on("error", onError);
    return () => {
      socket.off("incoming_call", onIncoming);
      socket.off("call_accepted", onAccepted);
      socket.off("ice_candidate", onCandidate);
      socket.off("call_rejected", onRejected);
      socket.off("call_ended", onEnded);
      socket.off("error", onError);
    };
  }, [flushCandidates, phase, resetCall, socket]);

  useEffect(() => () => {
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const toggleMic = () => {
    const enabled = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = enabled; });
    setMicEnabled(enabled);
  };
  const toggleCamera = () => {
    const enabled = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = enabled; });
    setCameraEnabled(enabled);
  };

  const isGlobal = !propPartnerId;
  const currentDisplayName = incoming?.callerName || partnerName || "Đối phương";

  return (
    <>
      {!isGlobal && (
        <button
          aria-label="Gọi video"
          className="video-call-trigger"
          disabled={!socket || phase !== "idle"}
          onClick={() => void startCall()}
          title={socket ? "Gọi video" : "Socket chưa kết nối"}
          type="button"
        >
          <Video size={18} /> Gọi video
        </button>
      )}

      {(phase !== "idle" || isOpen) && (
        <div className="video-call-overlay" role="dialog" aria-modal="true">
          <section className="video-call-panel" style={{ background: "#0b132b", border: "1px solid #1e293b", width: "min(680px, 94vw)", borderRadius: "24px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
            {/* Call Header */}
            <header style={{ padding: "16px 24px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "1.1rem", color: "#f8fafc" }}>{currentDisplayName}</strong>
                <span style={{ fontSize: "0.85rem", color: phase === "connected" ? "#34d399" : "#94a3b8", fontWeight: "600", marginTop: "2px" }}>
                  {phase === "incoming" && "📲 Cuộc gọi video đến..."}
                  {phase === "calling" && "📞 Đang đổ chuông... Chờ đối phương bắt máy"}
                  {phase === "connecting" && "⌛ Đang kết nối tín hiệu..."}
                  {phase === "connected" && `🟢 Đã kết nối • ${formatTimer(callTimer)}`}
                  {phase === "idle" && (error || "Cuộc gọi đã kết thúc")}
                </span>
              </div>
            </header>

            {/* Video Stage / Calling Animation View */}
            <div className="video-call-stage" style={{ background: "#020617", minHeight: "360px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {/* Active Stream View when Connected */}
              <video 
                autoPlay 
                className="video-call-remote" 
                playsInline 
                ref={remoteVideoRef} 
                style={{ display: phase === "connected" ? "block" : "none", width: "100%", height: "100%", objectFit: "cover" }} 
              />

              <video 
                autoPlay 
                className="video-call-local" 
                muted 
                playsInline 
                ref={localVideoRef} 
                style={{ 
                  display: (phase === "connected" || phase === "calling" || phase === "connecting") ? "block" : "none",
                  position: "absolute", right: "16px", bottom: "16px", width: "140px", height: "105px", borderRadius: "12px", border: "2px solid #38bdf8", objectFit: "cover", zIndex: 10 
                }} 
              />

              {/* Calling / Incoming Avatar Pulsing Interface */}
              {(phase === "calling" || phase === "incoming" || phase === "connecting" || (phase === "idle" && error)) && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", zIndex: 5, padding: "2rem", textAlign: "center" }}>
                  <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
                    {/* Ripple animation ring */}
                    {(phase === "calling" || phase === "incoming") && (
                      <div style={{ position: "absolute", width: "140px", height: "140px", borderRadius: "50%", background: "#0284c7", opacity: 0.2, animation: "ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
                    )}
                    <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, #0284c7, #0d9488)", color: "#fff", display: "grid", placeItems: "center", fontSize: "2rem", fontWeight: "800", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                      {getInitials(currentDisplayName)}
                    </div>
                  </div>

                  <div style={{ color: "#f8fafc" }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "1.25rem", fontWeight: "700" }}>{currentDisplayName}</h3>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
                      {phase === "calling" && "Đang gửi yêu cầu cuộc gọi qua máy chủ..."}
                      {phase === "incoming" && "Muốn thực hiện cuộc gọi trò chuyện trực tiếp với bạn"}
                      {phase === "connecting" && "Đang thông tuyến video WebRTC..."}
                      {phase === "idle" && (error || "Cuộc gọi đã hoàn tất.")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="video-call-error" style={{ margin: 0, padding: "10px 16px", background: "#450a0a", color: "#fca5a5", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>}

            {/* Footer Control Buttons */}
            <footer style={{ padding: "18px 24px", background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "center", gap: "16px" }}>
              {phase === "incoming" ? (
                <>
                  <button 
                    className="video-control is-accept" 
                    onClick={acceptCall} 
                    type="button" 
                    style={{ background: "#16a34a", color: "#fff", padding: "12px 28px", borderRadius: "999px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", fontSize: "0.95rem" }}
                  >
                    <Phone size={20} /> Chấp nhận nghe
                  </button>
                  <button 
                    className="video-control is-end" 
                    onClick={rejectCall} 
                    type="button" 
                    style={{ background: "#dc2626", color: "#fff", padding: "12px 28px", borderRadius: "999px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", fontSize: "0.95rem" }}
                  >
                    <PhoneOff size={20} /> Từ chối
                  </button>
                </>
              ) : phase === "idle" ? (
                <button 
                  className="video-control is-end" 
                  onClick={() => setIsOpen(false)} 
                  type="button" 
                  style={{ background: "#334155", color: "#fff", padding: "10px 24px", borderRadius: "999px", fontWeight: "600", border: "none", cursor: "pointer" }}
                >
                  Đóng giao diện
                </button>
              ) : (
                <>
                  <button 
                    className="video-control" 
                    onClick={toggleMic} 
                    type="button" 
                    style={{ background: micEnabled ? "#334155" : "#ef4444", color: "#fff", width: "48px", height: "48px", borderRadius: "50%", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}
                    title={micEnabled ? "Tắt micro" : "Bật micro"}
                  >
                    {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>

                  <button 
                    className="video-control" 
                    onClick={toggleCamera} 
                    type="button" 
                    style={{ background: cameraEnabled ? "#334155" : "#ef4444", color: "#fff", width: "48px", height: "48px", borderRadius: "50%", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}
                    title={cameraEnabled ? "Tắt camera" : "Bật camera"}
                  >
                    {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button 
                    className="video-control is-end" 
                    onClick={() => endCall(true)} 
                    type="button" 
                    style={{ background: "#dc2626", color: "#fff", padding: "12px 28px", borderRadius: "999px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", fontSize: "0.95rem" }}
                  >
                    <PhoneOff size={20} /> Tắt máy / Hủy gọi
                  </button>
                </>
              )}
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
