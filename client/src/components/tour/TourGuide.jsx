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
  const location = useLocation();
  const [activeTourId, setActiveTourId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [skippedMissingSteps, setSkippedMissingSteps] = useState(0);
  const [sessionId, setSessionId] = useState(0);
  const activeConfigRef = useRef(null);
  const targetElementRef = useRef(null);
  const directionRef = useRef(1);
  const lastValidIndexRef = useRef(-1);
  const resolutionTokenRef = useRef(0);

  const saveDoneState = useCallback(() => {
    const config = activeConfigRef.current;
    if (!config) return;
    try {
      window.localStorage.setItem(config.storageKey, "true");
    } catch {
      // localStorage có thể bị chặn trong chế độ riêng tư; tour vẫn đóng bình thường.
    }
  }, []);

  const closeTour = useCallback(
    ({ markDone = false } = {}) => {
      resolutionTokenRef.current += 1;
      if (markDone) saveDoneState();
      activeConfigRef.current = null;
      targetElementRef.current = null;
      setIsOpen(false);
      setActiveTourId(null);
      setSteps([]);
      setTargetRect(null);
      setCurrentStepIndex(0);
    },
    [saveDoneState],
  );

  const openTour = useCallback(
    (config, { manual = false } = {}) => {
      if (!config) return;
      if (!manual) {
        try {
          if (window.localStorage.getItem(config.storageKey) === "true") return;
        } catch {
          // Không chặn tour nếu trình duyệt không cho đọc localStorage.
        }
      }

      resolutionTokenRef.current += 1;
      activeConfigRef.current = config;
      targetElementRef.current = null;
      directionRef.current = 1;
      lastValidIndexRef.current = -1;
      setActiveTourId(config.id);
      setSteps(config.steps);
      setCurrentStepIndex(0);
      setSkippedMissingSteps(0);
      setTargetRect(null);
      setSessionId((current) => current + 1);
      setIsOpen(true);
    },
    [],
  );

  const openTourForCurrentRoute = useCallback(
    ({ manual = false } = {}) => {
      const config = getTourForPathname(location.pathname, { manual });
      openTour(config, { manual });
    },
    [location.pathname, openTour],
  );

  useEffect(() => {
    closeTour();
    const timer = window.setTimeout(() => {
      if (!activeConfigRef.current) {
        openTourForCurrentRoute();
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [closeTour, location.pathname, openTourForCurrentRoute]);

  useEffect(() => {
    const handleStartTour = () => {
      openTourForCurrentRoute({ manual: true });
    };
    window.addEventListener("haisan:start-tour", handleStartTour);
    return () =>
      window.removeEventListener("haisan:start-tour", handleStartTour);
  }, [openTourForCurrentRoute]);

  useEffect(() => {
    const handleAssistantOpened = () => {
      openTour(tourDefinitions.ai);
    };
    window.addEventListener(
      "haisan:ai-assistant-opened",
      handleAssistantOpened,
    );
    return () =>
      window.removeEventListener(
        "haisan:ai-assistant-opened",
        handleAssistantOpened,
      );
  }, [openTour]);

  const updateTargetRect = useCallback((element = targetElementRef.current) => {
    if (!element?.isConnected) return;
    const rect = element.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const left = Math.max(4, rect.left - TARGET_PADDING);
    const top = Math.max(4, rect.top - TARGET_PADDING);
    const right = Math.min(viewportWidth - 4, rect.right + TARGET_PADDING);
    const bottom = Math.min(viewportHeight - 4, rect.bottom + TARGET_PADDING);
    setTargetRect({
      left,
      top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top),
    });
  }, []);

  useEffect(() => {
    if (!isOpen || !steps[currentStepIndex]) return undefined;
    const token = ++resolutionTokenRef.current;
    let cancelled = false;

    const resolveTarget = async () => {
      const currentStep = steps[currentStepIndex];
      setTargetRect(null);
      targetElementRef.current = null;

      const preparationDelay = prepareStep(currentStep);
      if (preparationDelay) await wait(preparationDelay);

      let element = null;
      for (let attempt = 0; attempt < TARGET_RETRIES && !element; attempt += 1) {
        if (cancelled || resolutionTokenRef.current !== token) return;
        element = document.querySelector(currentStep.target);
        if (!element && attempt < TARGET_RETRIES - 1) await wait(180);
      }

      if (cancelled || resolutionTokenRef.current !== token) return;
      if (!element) {
        setSkippedMissingSteps((current) => current + 1);
        const nextIndex = currentStepIndex + directionRef.current;
        if (nextIndex >= 0 && nextIndex < steps.length) {
          setCurrentStepIndex(nextIndex);
          return;
        }
        if (directionRef.current < 0 && lastValidIndexRef.current >= 0) {
          directionRef.current = 1;
          setCurrentStepIndex(lastValidIndexRef.current);
          return;
        }
        closeTour({ markDone: true });
        return;
      }

      targetElementRef.current = element;
      lastValidIndexRef.current = currentStepIndex;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
      updateTargetRect(element);
      window.requestAnimationFrame(() => updateTargetRect(element));
    };

    void resolveTarget();
    return () => {
      cancelled = true;
    };
  }, [
    closeTour,
    currentStepIndex,
    isOpen,
    sessionId,
    steps,
    updateTargetRect,
  ]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const update = () => updateTargetRect();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const observer =
      typeof ResizeObserver !== "undefined" && targetElementRef.current
        ? new ResizeObserver(update)
        : null;
    if (observer && targetElementRef.current) {
      observer.observe(targetElementRef.current);
    }
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer?.disconnect();
    };
  }, [currentStepIndex, isOpen, updateTargetRect]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const interval = window.setInterval(() => {
      updateTargetRect();
    }, 250);
    return () => window.clearInterval(interval);
  }, [isOpen, updateTargetRect]);

  const goNext = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      closeTour({ markDone: true });
      return;
    }
    directionRef.current = 1;
    setCurrentStepIndex((current) => current + 1);
  }, [closeTour, currentStepIndex, steps.length]);

  const goBack = useCallback(() => {
    if (currentStepIndex <= 0) return;
    directionRef.current = -1;
    setCurrentStepIndex((current) => current - 1);
  }, [currentStepIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeTour({ markDone: true });
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTour, goBack, goNext, isOpen]);

  const currentStep = steps[currentStepIndex];
  const tooltipStyle = useMemo(
    () => getTooltipStyle(targetRect),
    [targetRect],
  );

  if (!isOpen || !currentStep || !targetRect) return null;

  return createPortal(
    <div
      className="tour-guide"
      data-active-tour={activeTourId}
      data-skipped-steps={skippedMissingSteps}
    >
      <div className="tour-overlay" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="tour-highlight"
        style={targetRect}
      />
      <section
        aria-labelledby="tour-tooltip-title"
        aria-modal="true"
        className="tour-tooltip"
        role="dialog"
        style={tooltipStyle}
      >
        <header className="tour-tooltip__header">
          <span>
            Bước {currentStepIndex + 1}/{steps.length}
          </span>
          <button
            aria-label="Bỏ qua hướng dẫn"
            onClick={() => closeTour({ markDone: true })}
            type="button"
          >
            <X size={17} />
          </button>
        </header>
        <div className="tour-progress" aria-hidden="true">
          <span
            style={{
              transform: `scaleX(${(currentStepIndex + 1) / steps.length})`,
            }}
          />
        </div>
        <div className="tour-tooltip__content">
          <h2 id="tour-tooltip-title">{currentStep.title}</h2>
          <p>{currentStep.content}</p>
        </div>
        <footer className="tour-tooltip__actions">
          <button
            className="tour-button tour-button--ghost tour-button--skip"
            onClick={() => closeTour({ markDone: true })}
            type="button"
          >
            Bỏ qua
          </button>
          <div>
            <button
              className="tour-button tour-button--ghost"
              disabled={currentStepIndex === 0}
              onClick={goBack}
              type="button"
            >
              <ChevronLeft size={15} /> Quay lại
            </button>
            <button
              className="tour-button tour-button--primary"
              onClick={goNext}
              type="button"
            >
              {currentStepIndex === steps.length - 1 ? (
                "Hoàn tất"
              ) : (
                <>
                  Tiếp theo <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body
  );
}
