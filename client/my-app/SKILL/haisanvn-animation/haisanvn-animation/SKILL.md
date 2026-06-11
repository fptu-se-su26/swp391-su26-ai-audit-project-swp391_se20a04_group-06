---
name: haisanvn-animation
description: Animation guidelines for the HảiSản.vn React/Vite seafood marketplace project. Use this skill EVERY TIME you write any CSS animation, transition, hover effect, keyframe, or interactive motion for this codebase — including ProductCard, Navbar, modals, chat, dashboard tabs, page load effects, skeleton loading, micro-interactions, or any onMouseEnter/onMouseLeave handler. Also triggers when the user asks to "make something smoother", "add animation", "fix janky", "improve hover", or "make it feel better".
---

# HảiSản.vn Animation System

This skill defines the animation rules for the HảiSản.vn React + Vite + CSS Modules codebase. Follow these rules **exactly**. Deviation produces the "bad AI animation" the user wants to avoid.

## 1. Core Principle: GPU Only

**ONLY animate these CSS properties.** Everything else causes layout/paint recalculation = jank:

| ✅ GPU-safe (animate freely) | ❌ NEVER animate |
|---|---|
| `transform` (translate, scale, rotate) | `width`, `height`, `margin`, `padding` |
| `opacity` | `top`, `left`, `right`, `bottom` |
| `filter` (blur, drop-shadow) | `background-color` (use opacity trick instead) |
| `clip-path` | `border`, `font-size`, `color` (except via CSS var) |

```css
/* ❌ WRONG — causes layout recalculation */
.card:hover { height: 320px; margin-top: -4px; }

/* ✅ CORRECT — GPU composited */
.card:hover { transform: translateY(-6px); }
```

## 2. Project Design Tokens

Always use these in animation definitions. Never hardcode values.

```css
/* Timing functions (add to :root in index.css or use inline) */
--ease-spring:  cubic-bezier(0.16, 1, 0.3, 1);   /* bouncy entrance — cards, modals */
--ease-out:     cubic-bezier(0.4, 0, 0.2, 1);    /* standard exit/hover */
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);    /* state transitions */
--ease-snap:    cubic-bezier(0.34, 1.56, 0.64, 1); /* logo, icon pop */

/* Duration tiers */
--dur-instant:  80ms;   /* button press feedback */
--dur-fast:     150ms;  /* hover state changes */
--dur-normal:   220ms;  /* most transitions */
--dur-enter:    350ms;  /* page/card entrances */
--dur-slow:     500ms;  /* stock bars, progress fills */

/* Colors from theme.js */
--ocean: #0B4F6C; --ocean-l: #1A7FA0;
--coral: #E8643A; --ocean-p: #E6F4F9;
```

## 3. The Three Animation Categories

### A) Entry Animations (things appearing on screen)

Use `animation` not `transition`. Always use `both` fill-mode. Stagger with `--card-i` custom property.

```css
/* Standard fade-up entrance — for cards, modals, page sections */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}

/* Usage with stagger */
.card {
  animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--card-i, 0) * 45ms); /* set --card-i in JSX: style={{ "--card-i": index }} */
}

/* Modal/popover slide-down */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.modal { animation: slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* Slide-up from bottom (chat, floating elements) */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### B) Hover/Interaction Transitions (CSS only — NO JS)

**NEVER use onMouseEnter/onMouseLeave to set style properties directly.** Use CSS transitions + class toggles.

```css
/* ❌ WRONG — choppy, blocks main thread */
onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "..."; }}
onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}

/* ✅ CORRECT — CSS does the work */
.card {
  transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(11, 79, 108, 0.12);
}
```

**When you MUST keep JS hover** (e.g., dynamic color from props), use a CSS variable trick:

```jsx
/* Set CSS var via JS, animate via CSS */
<div
  style={{ "--hover-bg": isActive ? C.ocean : "#f1f5f9" }}
  className={styles.item}
/>
/* In CSS: */
/* .item { background: var(--hover-bg, #fff); transition: background 150ms ease; } */
```

### C) State Transitions (tab switches, loading, toggles)

```css
/* Tab underline slide */
.tabIndicator {
  transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1),
              width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Stock/progress bar fill */
.stockFill {
  transform-origin: left;
  transform: scaleX(var(--pct, 0)); /* set --pct in JSX: style={{ "--pct": pct/100 }} */
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Button press feedback */
.btn:active { transform: scale(0.97); transition: transform 80ms ease; }

/* Spinner — use transform not border trick */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--ocean);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
```

## 4. React + CSS Modules Patterns

### Pattern A: CSS Modules (preferred for components)

```css
/* ProductCard.module.css */
.card {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform; /* only when needed for compositing hint */
}
.card:hover { transform: translateY(-6px); }

.favBtn {
  transition: transform 200ms ease, color 150ms ease;
}
.favBtn:hover { transform: scale(1.12); }

/* Keyframe in module works fine */
.favorited { animation: heartPop 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
@keyframes heartPop {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.35); }
  55%  { transform: scale(0.9); }
  75%  { transform: scale(1.15); }
  100% { transform: scale(1); }
}
```

### Pattern B: Inline styles — allowed ONLY for dynamic values

```jsx
/* OK: value comes from JS state */
<div style={{
  transform: `scaleX(${pct / 100})`,
  transition: "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
  transformOrigin: "left",
}} />

/* OK: animation delay stagger */
<div style={{ "--card-i": index }} className={styles.card} />
```

### Pattern C: className toggle for enter/exit

```jsx
const [visible, setVisible] = useState(false);
// CSS: .panel { opacity: 0; transform: translateY(-8px); transition: all 0.22s ease; }
//      .panel.open { opacity: 1; transform: translateY(0); }
<div className={`${styles.panel} ${visible ? styles.open : ""}`} />
```

## 5. Skeleton / Loading Shimmer

Always use the existing `.skeleton-shimmer` class from `index.css`. Do NOT create new shimmer implementations.

```jsx
/* Reuse existing class */
<div className="skeleton-shimmer" style={{ height: 220, borderRadius: 10 }} />

/* The shimmer already uses GPU-only translateX animation — don't override */
```

## 6. Specific Component Rules

### Modals & Drawers
```css
/* Always: slideDown for top-anchored, slideUp for bottom-anchored */
.modal { animation: slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }
/* Overlay backdrop */
.overlay { animation: fadeIn 0.15s ease both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
```

### Navbar Dropdown
```css
/* Already defined in Navbar.module.css — DO NOT duplicate */
/* Uses: animation: slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) both */
```

### Chat / Floating Elements
```css
/* Use existing slideDown from index.css */
/* animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both */
```

### Notification Bell Badge
```css
/* Pulse for urgency — already in index.css as .pulse-urgent */
/* Use: className="pulse-urgent" — DO NOT rewrite */
```

### VideoCallOverlay
```css
/* Existing: pulse (calling), bounce (incoming) — don't touch */
/* Only add GPU properties if extending */
```

## 7. prefers-reduced-motion (REQUIRED)

Every keyframe animation must be wrapped. Already in `index.css` globally but add per-component too:

```css
@media (prefers-reduced-motion: reduce) {
  .card { animation: none; transition: none; }
  /* Or for subtle: just reduce duration */
  .card { animation-duration: 0.01ms !important; }
}
```

## 8. Anti-Patterns Cheat Sheet

| ❌ Bad pattern | ✅ Fix |
|---|---|
| `onMouseEnter` sets `style.transform` | Use CSS `:hover` + `transition` |
| `onMouseLeave` resets styles | Remove JS, use CSS |
| Animating `height` to show/hide | Use `transform: scaleY()` or `opacity` + `pointer-events` |
| `transition: all 0.3s` | Specify exact properties: `transition: transform 0.3s, opacity 0.2s` |
| New shimmer `@keyframes` | Reuse `.skeleton-shimmer` class |
| `animation: fadeIn 0.3s` without `both` | Always add `both` fill-mode |
| JS `setInterval` for animation | Use CSS `animation` + event listeners |
| Multiple `box-shadow` in hover transition | Pre-declare `box-shadow` on base state |
| `will-change: transform` on everything | Only add when GPU layer is proven necessary |

## 9. Quick Reference: Common Patterns

```css
/* Card hover — universal pattern for this project */
.card {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.card:hover { transform: translateY(-6px); box-shadow: 0 16px 32px rgba(11,79,108,0.10); }

/* Button with press feedback */
.btn { transition: transform 80ms ease, box-shadow 150ms ease; }
.btn:hover { transform: translateY(-1px); }
.btn:active { transform: translateY(0) scale(0.97); }

/* Icon scale pop */
.icon { transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.icon:hover { transform: scale(1.12) rotate(-5deg); }

/* Fade-in for async content */
.loaded { animation: fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }

/* List stagger (set style={{ "--i": index }} on each item) */
.item { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: calc(var(--i, 0) * 50ms); }
```

## 10. Files to Know

- `index.css` — global keyframes: `fadeUp`, `fadeIn`, `slideDown`, `shimmerGPU`, `pulse-danger`, `vtFadeOut/In`
- `ProductCard.module.css` — `cardAppear`, `heartPop`, stock bar animation
- `ProductDetailPage.module.css` — `fadeInUp`, `slideDown`, `modalIn`, `spin`
- `Navbar.module.css` — `slideDown` for dropdown
- `theme.js` → `C` — color tokens
- `VideoCallOverlay.jsx` — `pulse`, `bounce` keyframes

**Before adding any new keyframe**, check if it already exists in one of these files.
