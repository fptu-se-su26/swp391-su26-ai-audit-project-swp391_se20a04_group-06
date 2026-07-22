import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { getTourForPathname, tourDefinitions } from "./tourSteps";

const TARGET_PADDING = 8;
const TARGET_RETRIES = 6;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function prepareStep(step) {
  if (step.prepare === "open-ai") {
    window.dispatchEvent(new CustomEvent("haisan:open-ai-assistant"));
    return 180;
  }
  if (step.prepare === "batch-general") {
    window.dispatchEvent(
      new CustomEvent("haisan:tour-show-batch-step", {
        detail: { step: 1 },
      }),
    );
    return 120;
  }
  if (step.prepare === "batch-products") {
    window.dispatchEvent(
      new CustomEvent("haisan:tour-show-batch-step", {
        detail: { step: 2 },
      }),
    );
    return 120;
  }
  return 0;
}

function getTooltipStyle(rect) {
  if (!rect) return undefined;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const width = Math.min(390, viewportWidth - 24);
  const estimatedHeight = 250;
  const centeredLeft = rect.left + rect.width / 2 - width / 2;
  const left = Math.min(
    Math.max(12, centeredLeft),
    Math.max(12, viewportWidth - width - 12),
  );
  const below = rect.top + rect.height + 14;
  const top =
    below + estimatedHeight <= viewportHeight - 12
      ? below
      : Math.max(12, rect.top - estimatedHeight - 14);

  return { top, left, width };
}

export default function TourGuide() {
  return null;
}
