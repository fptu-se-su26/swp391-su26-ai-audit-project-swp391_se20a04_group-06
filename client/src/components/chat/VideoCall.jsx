import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
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

export default function VideoCall({
  currentUser,
  partnerId,
  partnerName,
  productId,
  socket,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteIdRef = useRef(partnerId);
  const queuedCandidatesRef = useRef([]);
  const callingTimeoutRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [isOpen, setIsOpen] = useState(false);
  const [incoming, setIncoming] = useState(null);
  const [error, setError] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const ringtoneRef = useRef(null);

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
        osc1.frequency.value = 480; // Standard ringback tone frequencies
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

      // Play immediately
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
    if (notify && remoteIdRef.current) {
      socket?.emit("end_call", { to: remoteIdRef.current, productId });
    }
    resetCall();
    setIsOpen(false);
  }, [productId, resetCall, socket]);

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

  const createPeer = useCallback((remoteId) => {
    peerRef.current?.close();
    const peer = new RTCPeerConnection(RTC_CONFIG);
    remoteIdRef.current = remoteId;
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit("ice_candidate", { to: remoteId, candidate, productId });
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
  }, [productId, resetCall, socket]);

  const startCall = async () => {
    if (!socket || !partnerId || !productId) return;
    setError("");
    setPhase("calling");
    setIsOpen(true);
    try {
      const stream = await ensureMedia();
      const peer = createPeer(partnerId);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("call_user", {
        to: partnerId,
        offer,
        callerName: currentUser?.name,
        productId,
      });

      callingTimeoutRef.current = setTimeout(() => {
        setError("Người nhận không trả lời.");
        endCall(true);
      }, 30000);
    } catch (callError) {
      setError(callError.message || "Không thể khởi tạo cuộc gọi.");
      resetCall();
    }
  };

  const acceptCall = async () => {
    if (!incoming) return;
    setError("");
    setPhase("connecting");
    try {
      const stream = await ensureMedia();
      const peer = createPeer(incoming.from);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      await peer.setRemoteDescription(incoming.offer);
      await flushCandidates(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer_call", { to: incoming.from, answer, productId });
      setIncoming(null);
    } catch (callError) {
      setError(callError.message || "Không thể chấp nhận cuộc gọi.");
      socket?.emit("reject_call", { to: incoming.from, productId });
      resetCall();
    }
  };

  const rejectCall = () => {
    if (incoming?.from) socket?.emit("reject_call", { to: incoming.from, productId });
    resetCall();
    setIsOpen(false);
  };

  useEffect(() => {
    if (!socket) return undefined;

    const onIncoming = (data) => {
      if (
        String(data.from) !== String(partnerId) ||
        String(data.productId) !== String(productId) ||
        phase !== "idle"
      ) return;
      remoteIdRef.current = data.from;
      setIncoming(data);
      setPhase("incoming");
      setIsOpen(true);
    };
    const onAccepted = async ({ answer, productId: acceptedProductId }) => {
      try {
        if (String(acceptedProductId) !== String(productId)) return;
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
      if (String(candidateProductId) !== String(productId)) return;
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
      if (String(rejectedProductId) !== String(productId)) return;
      resetCall();
      setError("Người nhận đã từ chối cuộc gọi.");
    };
    const onEnded = ({ productId: endedProductId } = {}) => {
      if (String(endedProductId) === String(productId)) {
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
  }, [flushCandidates, partnerId, phase, productId, resetCall, socket]);

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

  return (
    <>
      <button
        aria-label="Gọi video"
        className="video-call-trigger"
        disabled={!socket || phase !== "idle"}
        onClick={startCall}
        title={socket ? "Gọi video" : "Socket chưa kết nối"}
        type="button"
      >
        <Video size={18} /> Gọi video
      </button>

      {(phase !== "idle" || isOpen) && (
        <div className="video-call-overlay" role="dialog" aria-modal="true">
          <section className="video-call-panel">
            <header>
              <div><strong>{incoming?.callerName || partnerName}</strong><span>{phase === "incoming" ? "đang gọi cho bạn" : phase === "calling" ? "Đang đổ chuông..." : phase === "connected" ? "Đã kết nối" : phase === "idle" ? "Cuộc gọi bị gián đoạn" : "Đang kết nối..."}</span></div>
            </header>
            <div className="video-call-stage">
              {phase !== "idle" ? (
                <>
                  <video autoPlay className="video-call-remote" playsInline ref={remoteVideoRef} />
                  <video autoPlay className="video-call-local" muted playsInline ref={localVideoRef} />
                </>
              ) : (
                <div className="video-call-placeholder">
                  <VideoOff size={42} />
                  <p>{error || "Không thể thực hiện cuộc gọi."}</p>
                </div>
              )}
              {phase === "incoming" && <div className="video-call-placeholder"><Video size={42} /><p>Cuộc gọi video đến</p></div>}
            </div>
            {error && <p className="video-call-error">{error}</p>}
            <footer>
              {phase === "incoming" ? (
                <>
                  <button className="video-control is-accept" onClick={acceptCall} type="button"><Phone size={20} /> Chấp nhận</button>
                  <button className="video-control is-end" onClick={rejectCall} type="button"><PhoneOff size={20} /> Từ chối</button>
                </>
              ) : phase === "idle" ? (
                <button className="video-control is-end" onClick={() => setIsOpen(false)} type="button">Đóng</button>
              ) : (
                <>
                  <button className="video-control" onClick={toggleMic} type="button">{micEnabled ? <Mic size={20} /> : <MicOff size={20} />}</button>
                  <button className="video-control" onClick={toggleCamera} type="button">{cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}</button>
                  <button className="video-control is-end" onClick={() => endCall(true)} type="button"><PhoneOff size={20} /> Kết thúc</button>
                </>
              )}
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
