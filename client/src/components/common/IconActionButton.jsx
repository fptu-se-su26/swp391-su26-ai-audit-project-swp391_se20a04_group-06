import React from "react";

export default function IconActionButton({
  icon,
  label,
  variant = "default",
  onClick,
  disabled = false,
  className = "",
  type = "button",
  ariaLabel,
  ...props
}) {
  const displayLabel = ariaLabel || label;
  const variantClass = variant !== "default" ? ` icon-action-btn--${variant}` : "";

  return (
    <button
      type={type}
      className={`icon-action-btn${variantClass} ${className}`}
      aria-label={displayLabel}
      data-tooltip={label}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {React.cloneElement(icon, { "aria-hidden": "true" })}
    </button>
  );
}
