import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function VideoCallOverlay({
    callState,
    localStream,
    remoteStream,
    onAccept,
    onReject,
    partnerName,
}) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // ─── FIX: Thêm `callState` vào deps ──────────────────────────────────────
    //
    // Vấn đề cũ: setLocalStream() chạy trước khi callState = "connected",
    //   lúc đó <video> chưa mount → localVideoRef.current = null → srcObject không được gán.
    //   Khi callState chuyển sang "connected" và <video> mount, localStream
    //   không thay đổi → useEffect([localStream]) không chạy lại → màn hình đen.
    //
    // Cách sửa: Luôn render <video> trong DOM (dùng display:none/block thay vì unmount)
    //   + thêm callState vào deps để effect chạy lại khi state chuyển sang "connected".

    useEffect(() => {
        const el = localVideoRef.current;
        if (el && localStream) {
            if (el.srcObject !== localStream) {
                el.srcObject = localStream;
            }
            el.play().catch(() => { });
        }
    }, [localStream, callState]); // ← callState là key fix

    useEffect(() => {
        const el = remoteVideoRef.current;
        if (el && remoteStream) {
            if (el.srcObject !== remoteStream) {
                el.srcObject = remoteStream;
            }
            el.play().catch(() => {
                setTimeout(() => el.play().catch(() => { }), 300);
            });
        }
    }, [remoteStream, callState]); // ← callState là key fix

    const overlay = (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.98)",
                zIndex: 999999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "inherit",
            }}
        >
            {/* ─────────────────────────────────────────────────────────────────────
          VIDEO ELEMENTS — Luôn ở trong DOM, chỉ thay đổi display.
          Đây là điều kiện bắt buộc để refs luôn hợp lệ khi streams được gán.
      ───────────────────────────────────────────────────────────────────── */}

            {/* Remote (full screen) — chỉ hiện khi connected */}
            <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: callState === "connected" ? "block" : "none",
                }}
            />

            {/* Local (PiP) — hiện từ lúc "calling" để caller thấy camera mình */}
            <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                    position: "absolute",
                    // Khi connected: PiP góc phải
                    // Khi calling:   preview nhỏ giữa màn hình
                    ...(callState === "connected"
                        ? { top: 24, right: 24, width: 120, height: 160 }
                        : { bottom: 120, right: 24, width: 100, height: 140 }),
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "2px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    zIndex: 10,
                    display: callState === "calling" || callState === "connected" ? "block" : "none",
                }}
            />

            {/* ── Đang gọi đi ── */}
            {callState === "calling" && (
                <div style={{ textAlign: "center", zIndex: 5 }}>
                    <div
                        style={{ fontSize: 64, animation: "pulse 1.5s infinite", marginBottom: 16 }}
                    >
                        📞
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
                        Đang gọi video...
                    </h2>
                    <p
                        style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 4px" }}
                    >
                        Vui lòng chờ <strong>{partnerName}</strong> bắt máy
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
                        Camera của bạn đang bật ở góc phải
                    </p>
                    <button
                        onClick={onReject}
                        style={btnStyle("#EF4444", "0 4px 14px rgba(239,68,68,0.45)", { marginTop: 36 })}
                    >
                        Hủy cuộc gọi
                    </button>
                </div>
            )}

            {/* ── Cuộc gọi đến ── */}
            {callState === "incoming" && (
                <div style={{ textAlign: "center", zIndex: 5 }}>
                    <div
                        style={{ fontSize: 64, animation: "bounce 1s infinite", marginBottom: 16 }}
                    >
                        🔔
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
                        Cuộc gọi video đến
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0 }}>
                        <strong>{partnerName}</strong> đang gọi cho bạn
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            justifyContent: "center",
                            marginTop: 36,
                        }}
                    >
                        <button
                            onClick={onAccept}
                            style={btnStyle("#10B981", "0 4px 14px rgba(16,185,129,0.45)")}
                        >
                            ✅ Trả lời
                        </button>
                        <button
                            onClick={onReject}
                            style={btnStyle("#EF4444", "0 4px 14px rgba(239,68,68,0.45)")}
                        >
                            ❌ Từ chối
                        </button>
                    </div>
                </div>
            )}

            {/* ── Đã kết nối — chỉ render nút kết thúc ── */}
            {callState === "connected" && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 44,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 20,
                    }}
                >
                    <button
                        onClick={onReject}
                        style={btnStyle(
                            "#EF4444",
                            "0 4px 14px rgba(239,68,68,0.45)",
                            {
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                borderRadius: 99,
                                padding: "14px 32px",
                            }
                        )}
                    >
                        <span>🛑</span> Kết thúc cuộc gọi
                    </button>
                </div>
            )}

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
        </div>
    );

    return createPortal(overlay, document.body);
}

// ── Utility style builder ──────────────────────────────────────────────────
function btnStyle(bg, shadow, extra = {}) {
    return {
        padding: "14px 36px",
        background: bg,
        border: "none",
        borderRadius: 14,
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        boxShadow: shadow,
        ...extra,
    };
}