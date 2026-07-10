import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

/**
 * ImageUploader — chọn ảnh từ máy, preview, xóa ảnh.
 * Props:
 *   files: File[]            — danh sách file hiện tại
 *   onChange: (files) => void — callback cập nhật
 *   maxFiles: number         — giới hạn số ảnh (default 5)
 */
export default function ImageUploader({ files = [], onChange, maxFiles = 5 }) {
  const inputRef = useRef(null);

  const handleSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const merged = [...files, ...selected].slice(0, maxFiles);
    onChange(merged);
    e.target.value = "";
  };

  const handleRemove = (index) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Previews */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {files.map((file, i) => {
            const url = file instanceof File ? URL.createObjectURL(file) : file;
            return (
              <div
                key={i}
                style={{ position: "relative", width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <img
                  alt=""
                  src={url}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  onClick={() => handleRemove(i)}
                  style={{
                    position: "absolute", top: "3px", right: "3px",
                    background: "rgba(0,0,0,0.65)", border: "none",
                    borderRadius: "50%", width: "20px", height: "20px",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  type="button"
                >
                  <X color="#fff" size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {files.length < maxFiles && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 16px", borderRadius: "9px",
            border: "1.5px dashed rgba(45,212,191,0.4)",
            background: "rgba(45,212,191,0.06)",
            color: "#2dd4bf", cursor: "pointer", fontSize: "13px", fontWeight: 600,
            transition: "all 0.15s",
          }}
          type="button"
        >
          <ImagePlus size={16} />
          Chọn ảnh từ máy ({files.length}/{maxFiles})
        </button>
      )}

      <input
        accept="image/*"
        multiple
        onChange={handleSelect}
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
      />
    </div>
  );
}
