import { useEffect, useRef } from "react";
import "./InteractiveUnderwaterBackground.css";

const FISH_COLORS = ["#67e8f9", "#5eead4", "#7dd3fc", "#99f6e4", "#38bdf8"];
const DESKTOP_FISH_COUNT = 9;
const MOBILE_FISH_COUNT = 5;
const DESKTOP_BUBBLE_COUNT = 30;
const MOBILE_BUBBLE_COUNT = 15;
const MOBILE_BREAKPOINT = 720;

const randomBetween = (min, max) => min + Math.random() * (max - min);

function createFish(width, height, count) {
  return Array.from({ length: count }, (_, index) => {
    const direction = index % 2 === 0 ? 1 : -1;
    const size = randomBetween(30, 58);
    return {
      x: randomBetween(-size, width + size),
      y: randomBetween(height * 0.11, height * 0.87),
      size,
      direction,
      baseSpeed: randomBetween(0.18, 0.42),
      velocityX: randomBetween(0.18, 0.42) * direction,
      velocityY: 0,
      phase: randomBetween(0, Math.PI * 2),
      color: FISH_COLORS[index % FISH_COLORS.length],
      turnCooldown: 0,
    };
  });
}

function createBubbles(width, height, count) {
  return Array.from({ length: count }, () => ({
    x: randomBetween(12, Math.max(13, width - 12)),
    y: randomBetween(0, height),
    radius: randomBetween(2.5, 7),
    speed: randomBetween(0.22, 0.58),
    drift: randomBetween(0.08, 0.28),
    phase: randomBetween(0, Math.PI * 2),
    velocityX: 0,
  }));
}

function drawFish(context, fish) {
  const scale = fish.size / 72;
  context.save();
  context.translate(fish.x, fish.y);
  context.scale(fish.direction * scale, scale);
  context.globalAlpha = 0.64;
  context.fillStyle = fish.color;

  context.beginPath();
  context.moveTo(-22, 0);
  context.bezierCurveTo(-9, -15, 18, -15, 31, 0);
  context.bezierCurveTo(18, 15, -9, 15, -22, 0);
  context.fill();

  context.globalAlpha = 0.5;
  context.beginPath();
  context.moveTo(-20, 0);
  context.lineTo(-39, -13);
  context.lineTo(-37, 13);
  context.closePath();
  context.fill();

  context.globalAlpha = 0.38;
  context.beginPath();
  context.moveTo(-1, -11);
  context.quadraticCurveTo(8, -22, 15, -10);
  context.closePath();
  context.fill();

  context.globalAlpha = 0.9;
  context.fillStyle = "#e6fffb";
  context.beginPath();
  context.arc(21, -3.5, 2.1, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#0f2940";
  context.beginPath();
  context.arc(21.6, -3.7, 0.85, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBubble(context, bubble) {
  const gradient = context.createRadialGradient(
    bubble.x - bubble.radius * 0.35,
    bubble.y - bubble.radius * 0.35,
    0,
    bubble.x,
    bubble.y,
    bubble.radius,
  );
  gradient.addColorStop(0, "rgba(240, 253, 250, 0.68)");
  gradient.addColorStop(0.42, "rgba(125, 211, 252, 0.12)");
  gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
  context.beginPath();
  context.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = "rgba(186, 230, 253, 0.42)";
  context.lineWidth = 0.8;
  context.stroke();
}

function drawRipple(context, ripple) {
  const progress = Math.min(1, ripple.age / ripple.life);
  const radius = ripple.maxRadius * (1 - Math.pow(1 - progress, 2));
  const alpha = (1 - progress) * ripple.strength;

  context.save();
  context.lineWidth = ripple.kind === "click" ? 1.6 : 1;
  context.strokeStyle = `rgba(125, 211, 252, ${alpha * 0.38})`;
  context.beginPath();
  context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
  context.stroke();

  if (ripple.kind === "click") {
    context.lineWidth = 0.8;
    context.strokeStyle = `rgba(94, 234, 212, ${alpha * 0.22})`;
    context.beginPath();
    context.arc(ripple.x, ripple.y, Math.max(0, radius - 13), 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function isInsideLoginCard(event) {
  return event.target instanceof Element && Boolean(event.target.closest(".auth-card"));
}

export default function InteractiveUnderwaterBackground() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const host = root?.parentElement;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!root || !canvas || !host || !context) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: -1000, y: -1000, active: false, lastSeen: 0 };
    const activeAnimations = new Set();
    const ripples = [];
    let fish = [];
    let bubbles = [];
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frameId = 0;
    let running = false;
    let inViewport = true;
    let pageVisible = !document.hidden;
    let reducedMotion = reducedMotionQuery.matches;
    let previousTime = performance.now();
    let lastHoverRippleTime = 0;
    let lastEnvironmentReaction = 0;

    const trackAnimation = (animation) => {
      if (!animation) return;
      activeAnimations.add(animation);
      animation.addEventListener(
        "finish",
        () => activeAnimations.delete(animation),
        { once: true },
      );
      animation.addEventListener(
        "cancel",
        () => activeAnimations.delete(animation),
        { once: true },
      );
    };

    const reactEnvironment = (strength, normalizedX) => {
      if (reducedMotion || typeof root.animate !== "function") return;
      const horizontalShift = (normalizedX - 0.5) * 22 * strength;
      const lightLayer = root.querySelector(".interactive-underwater__light-rays");
      trackAnimation(
        lightLayer?.animate(
          [
            { transform: "translate3d(0, 0, 0) rotate(0deg)" },
            { transform: `translate3d(${horizontalShift}px, ${5 * strength}px, 0) rotate(${2.2 * strength}deg)` },
            { transform: "translate3d(0, 0, 0) rotate(0deg)" },
          ],
          { duration: 1050, easing: "cubic-bezier(.22,1,.36,1)" },
        ),
      );

      root.querySelectorAll(".interactive-underwater__seaweed span").forEach((blade, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        trackAnimation(
          blade.animate(
            [
              { transform: "rotate(0deg)" },
              { transform: `rotate(${direction * (5 + strength * 7)}deg) skewX(${direction * 2}deg)` },
              { transform: "rotate(0deg)" },
            ],
            {
              duration: 850 + index * 35,
              easing: "cubic-bezier(.22,1,.36,1)",
            },
          ),
        );
      });
    };

    const addRipple = (x, y, kind) => {
      const isClick = kind === "click";
      ripples.push({
        x,
        y,
        age: 0,
        life: isClick ? 1250 : 650,
        maxRadius: isClick ? Math.min(190, Math.max(width, height) * 0.22) : 58,
        strength: isClick ? 1 : 0.42,
        kind,
      });
      if (ripples.length > 10) ripples.splice(0, ripples.length - 10);
    };

    const seedParticles = () => {
      const mobile = width <= MOBILE_BREAKPOINT;
      fish = createFish(width, height, mobile ? MOBILE_FISH_COUNT : DESKTOP_FISH_COUNT);
      bubbles = createBubbles(
        width,
        height,
        mobile ? MOBILE_BUBBLE_COUNT : DESKTOP_BUBBLE_COUNT,
      );
      root.dataset.fishCount = String(fish.length);
      root.dataset.bubbleCount = String(bubbles.length);
    };

    const updateFish = (time, delta) => {
      const pointerIsFresh = pointer.active && time - pointer.lastSeen < 240;
      fish.forEach((item) => {
        item.turnCooldown = Math.max(0, item.turnCooldown - delta);
        const targetVelocity = item.baseSpeed * item.direction;
        item.velocityX += (targetVelocity - item.velocityX) * 0.018 * delta;
        item.velocityY *= Math.pow(0.92, delta);

        if (pointerIsFresh) {
          const dx = item.x - pointer.x;
          const dy = item.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const awareness = Math.max(90, item.size * 2.35);
          if (distance > 0 && distance < awareness) {
            const influence = (1 - distance / awareness) * 0.12 * delta;
            item.velocityX += (dx / distance) * influence;
            item.velocityY += (dy / distance) * influence * 0.72;

            const pointerIsAhead = item.direction * (pointer.x - item.x) > 0;
            if (distance < item.size * 1.25 && pointerIsAhead && item.turnCooldown <= 0) {
              item.direction *= -1;
              item.turnCooldown = 52;
            }
          }
        }

        item.velocityX = Math.max(-0.72, Math.min(0.72, item.velocityX));
        item.velocityY = Math.max(-0.5, Math.min(0.5, item.velocityY));
        item.x += item.velocityX * delta;
        item.y +=
          item.velocityY * delta +
          Math.sin(time * 0.0012 + item.phase) * 0.075 * delta;
        item.y = Math.max(item.size * 0.55, Math.min(height - item.size * 0.55, item.y));

        if (item.direction === 1 && item.x > width + item.size) {
          item.x = -item.size;
          item.y = randomBetween(height * 0.1, height * 0.88);
        } else if (item.direction === -1 && item.x < -item.size) {
          item.x = width + item.size;
          item.y = randomBetween(height * 0.1, height * 0.88);
        }
      });
    };

    const updateBubbles = (time, delta) => {
      bubbles.forEach((bubble) => {
        ripples.forEach((ripple) => {
          const progress = Math.min(1, ripple.age / ripple.life);
          const waveRadius = ripple.maxRadius * (1 - Math.pow(1 - progress, 2));
          const dx = bubble.x - ripple.x;
          const dy = bubble.y - ripple.y;
          const distance = Math.hypot(dx, dy);
          const distanceFromWave = Math.abs(distance - waveRadius);
          if (distanceFromWave < 30 && distance > 0) {
            const waveForce =
              (1 - distanceFromWave / 30) *
              (1 - progress) *
              ripple.strength *
              0.075 *
              delta;
            bubble.velocityX += (dx / distance) * waveForce;
          }
        });

        bubble.velocityX *= Math.pow(0.94, delta);
        bubble.x +=
          bubble.velocityX * delta +
          Math.sin(time * 0.001 + bubble.phase) * bubble.drift * delta;
        bubble.y -= bubble.speed * delta;

        if (bubble.y < -bubble.radius * 2) {
          bubble.y = height + bubble.radius;
          bubble.x = randomBetween(10, Math.max(11, width - 10));
          bubble.velocityX = 0;
        }
        if (bubble.x < -12) bubble.x = width + 10;
        if (bubble.x > width + 12) bubble.x = -10;
      });
    };

    const drawScene = (time, delta, shouldUpdate) => {
      context.clearRect(0, 0, width, height);
      if (shouldUpdate) {
        updateFish(time, delta);
        updateBubbles(time, delta);
        ripples.forEach((ripple) => {
          ripple.age += delta * (1000 / 60);
        });
        for (let index = ripples.length - 1; index >= 0; index -= 1) {
          if (ripples[index].age >= ripples[index].life) ripples.splice(index, 1);
        }
      }

      context.save();
      context.globalCompositeOperation = "source-over";
      bubbles.forEach((bubble) => drawBubble(context, bubble));
      fish.forEach((item) => drawFish(context, item));
      ripples.forEach((ripple) => drawRipple(context, ripple));
      context.restore();
    };

    const render = (time) => {
      if (!running) return;
      const delta = Math.min(2, Math.max(0.2, (time - previousTime) / (1000 / 60)));
      previousTime = time;
      drawScene(time, delta, true);
      frameId = window.requestAnimationFrame(render);
    };

    const syncAnimationState = () => {
      const shouldRun = !reducedMotion && inViewport && pageVisible;
      if (shouldRun && !running) {
        running = true;
        root.dataset.animationState = "running";
        previousTime = performance.now();
        frameId = window.requestAnimationFrame(render);
      } else if (!shouldRun && running) {
        running = false;
        root.dataset.animationState = "paused";
        window.cancelAnimationFrame(frameId);
      }
      if (!shouldRun) drawScene(performance.now(), 0, false);
    };

    const resizeCanvas = () => {
      const bounds = root.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(bounds.width));
      const nextHeight = Math.max(1, Math.round(bounds.height));
      if (nextWidth === width && nextHeight === height && fish.length > 0) return;

      width = nextWidth;
      height = nextHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      ripples.length = 0;
      seedParticles();
      drawScene(performance.now(), 0, false);
    };

    const getLocalPointer = (event) => {
      const bounds = host.getBoundingClientRect();
      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };

    const handlePointerMove = (event) => {
      if (reducedMotion || isInsideLoginCard(event)) {
        pointer.active = false;
        return;
      }

      const position = getLocalPointer(event);
      const now = performance.now();
      pointer.x = position.x;
      pointer.y = position.y;
      pointer.active = true;
      pointer.lastSeen = now;

      if (now - lastHoverRippleTime > 95) {
        addRipple(position.x, position.y, "hover");
        lastHoverRippleTime = now;
      }

      const nearSeaweed =
        position.y > height * 0.65 &&
        (position.x < Math.min(180, width * 0.18) ||
          position.x > width - Math.min(180, width * 0.18));
      if (now - lastEnvironmentReaction > (nearSeaweed ? 260 : 520)) {
        reactEnvironment(nearSeaweed ? 0.58 : 0.25, position.x / width);
        lastEnvironmentReaction = now;
      }
    };

    const handlePointerDown = (event) => {
      if (reducedMotion || isInsideLoginCard(event)) return;
      const position = getLocalPointer(event);
      addRipple(position.x, position.y, "click");
      reactEnvironment(1, position.x / width);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleVisibilityChange = () => {
      pageVisible = !document.hidden;
      syncAnimationState();
    };

    const handleReducedMotionChange = (event) => {
      reducedMotion = event.matches;
      root.dataset.reducedMotion = String(reducedMotion);
      pointer.active = false;
      ripples.length = 0;
      syncAnimationState();
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
        syncAnimationState();
      },
      { threshold: 0.01 },
    );

    root.dataset.reducedMotion = String(reducedMotion);
    resizeCanvas();
    resizeObserver.observe(root);
    intersectionObserver.observe(root);
    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerdown", handlePointerDown, { passive: true });
    host.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    syncAnimationState();

    return () => {
      running = false;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      activeAnimations.forEach((animation) => animation.cancel());
      activeAnimations.clear();
      ripples.length = 0;
      fish = [];
      bubbles = [];
    };
  }, []);

  const seaweedBlades = [82, 118, 96, 132, 72];

  return (
    <div
      aria-hidden="true"
      className="interactive-underwater-background"
      ref={rootRef}
    >
      <canvas className="interactive-underwater__canvas" ref={canvasRef} />
      <div className="interactive-underwater__light-rays">
        <span />
        <span />
        <span />
      </div>
      <div className="interactive-underwater__seaweed interactive-underwater__seaweed--left">
        {seaweedBlades.map((height, index) => (
          <span
            key={`${height}-${index}`}
            style={{
              "--blade-height": `${height}px`,
              "--blade-delay": `${-index * 0.85}s`,
              "--blade-lean": `${index % 2 === 0 ? -5 : 6}deg`,
            }}
          />
        ))}
      </div>
      <div className="interactive-underwater__seaweed interactive-underwater__seaweed--right">
        {seaweedBlades.slice().reverse().map((height, index) => (
          <span
            key={`${height}-${index}`}
            style={{
              "--blade-height": `${Math.round(height * 0.86)}px`,
              "--blade-delay": `${-1.2 - index * 0.75}s`,
              "--blade-lean": `${index % 2 === 0 ? 5 : -6}deg`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
