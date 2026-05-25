import React, { useState } from 'react';
import { C } from '../utils/theme';
export function ImageSlider({ product }) {
  const [idx, setIdx] = useState(0);
  const images = product.images || [];
  const n = images.length || product.imgCount || 1;
  const bgs = ["#0B4F6C", "#1A7FA0", "#0097A7", "#2D7D46", "#8B5E3C"];

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {images[idx] ? (
        <img
          src={images[idx].url}
          alt={product.name}
          style={{
            width: "100%",
            height: 300,
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            background: `linear-gradient(135deg, ${bgs[idx % bgs.length]}, ${bgs[(idx + 1) % bgs.length]})`,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 96 }}>🐟</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            Ảnh {idx + 1}/{n}
          </span>
        </div>
      )}
      {n > 1 && (
        <>
          <button
            onClick={() => setIdx((idx - 1 + n) % n)}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ‹
          </button>
          <button
            onClick={() => setIdx((idx + 1) % n)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ›
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {Array.from({ length: n }).map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </div>
        </>
      )}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 11,
          padding: "3px 8px",
          borderRadius: 4,
        }}
      >
        📸 {n}
      </div>
    </div>
  );
}