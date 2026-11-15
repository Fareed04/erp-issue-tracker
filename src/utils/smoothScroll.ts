interface ScrollContainerState {
  currentTop: number;
  currentLeft: number;
  targetTop: number;
  targetLeft: number;
  lastAppliedTop: number;
  lastAppliedLeft: number;
  rafId: number | null;
  lastTimestamp: number;
}

const containerStates = new WeakMap<HTMLElement, ScrollContainerState>();
const activeContainers = new Set<HTMLElement>();

// Damping factor per second — tuned for responsive, silky 60/120fps inertia
const SMOOTH_SPEED = 11.5;
const STOP_THRESHOLD = 0.35;

function getLineHeight(el: HTMLElement): number {
  const computed = window.getComputedStyle(el);
  const lineHeight = parseFloat(computed.lineHeight);
  return Number.isFinite(lineHeight) ? lineHeight : 20;
}

function normalizeWheelDelta(
  e: WheelEvent,
  container: HTMLElement
): { deltaX: number; deltaY: number } {
  let deltaX = e.deltaX;
  let deltaY = e.deltaY;

  if (e.deltaMode === 1) {
    // DOM_DELTA_LINE
    const lineHeight = getLineHeight(container) * 1.6;
    deltaX *= lineHeight;
    deltaY *= lineHeight;
  } else if (e.deltaMode === 2) {
    // DOM_DELTA_PAGE
    deltaX *= container.clientWidth * 0.85;
    deltaY *= container.clientHeight * 0.85;
  }

  // Shift + vertical wheel translates to horizontal scroll
  if (e.shiftKey && deltaX === 0 && deltaY !== 0) {
    deltaX = deltaY;
    deltaY = 0;
  }

  return { deltaX, deltaY };
}

function isNativePrecisionTrackpad(e: WheelEvent): boolean {
  if (e.deltaMode !== 0) return false;
  const wheelDeltaY = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
  const wheelDeltaX = (e as WheelEvent & { wheelDeltaX?: number }).wheelDeltaX;

  // Classic mouse wheels typically emit wheelDelta multiples of 120
  if (
    (wheelDeltaY !== undefined && wheelDeltaY !== 0 && wheelDeltaY % 120 === 0) ||
    (wheelDeltaX !== undefined && wheelDeltaX !== 0 && wheelDeltaX % 120 === 0)
  ) {
    return false;
  }

  // High-frequency trackpads emit fractional or small pixel increments
  const isFractional = !Number.isInteger(e.deltaY) || !Number.isInteger(e.deltaX);
  const isSmallStep = Math.abs(e.deltaY) < 28 && Math.abs(e.deltaX) < 28;
  return isFractional || isSmallStep;
}

function canScrollInAxis(
  el: HTMLElement,
  axis: 'x' | 'y',
  delta: number
): { scrollable: boolean; canMove: boolean; contain: boolean } {
  const style = window.getComputedStyle(el);
  const overflow = axis === 'y' ? style.overflowY : style.overflowX;
  const overscroll = axis === 'y' ? style.overscrollBehaviorY : style.overscrollBehaviorX;

  const allowsScroll = overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay';
  if (!allowsScroll) {
    return { scrollable: false, canMove: false, contain: false };
  }

  const maxScroll =
    axis === 'y'
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth;

  if (maxScroll <= 1) {
    return { scrollable: false, canMove: false, contain: false };
  }

  const state = containerStates.get(el);
  const currentPos =
    state && state.rafId !== null
      ? axis === 'y'
        ? state.targetTop
        : state.targetLeft
      : axis === 'y'
        ? el.scrollTop
        : el.scrollLeft;

  const canMove =
    delta < 0 ? currentPos > 0.5 : delta > 0 ? currentPos < maxScroll - 0.5 : false;

  const contain = overscroll === 'contain' || overscroll === 'none';
  return { scrollable: true, canMove, contain };
}

function findScrollTarget(
  startTarget: EventTarget | null,
  deltaX: number,
  deltaY: number
): HTMLElement | null {
  let node = startTarget instanceof HTMLElement ? startTarget : null;

  while (node && node !== document.documentElement) {
    if (node.dataset.nativeScroll !== undefined) {
      return null;
    }

    // Never hijack scrolling inside native multi-select or active inputs if they don't overflow
    if (node.tagName === 'SELECT') {
      return null;
    }

    const checkY =
      Math.abs(deltaY) >= Math.abs(deltaX) && deltaY !== 0
        ? canScrollInAxis(node, 'y', deltaY)
        : { scrollable: false, canMove: false, contain: false };

    const checkX =
      deltaX !== 0
        ? canScrollInAxis(node, 'x', deltaX)
        : { scrollable: false, canMove: false, contain: false };

    if (checkY.canMove || checkX.canMove) {
      return node;
    }

    // Respect overscroll-behavior: contain so modals/columns don't leak scroll to background
    if ((deltaY !== 0 && checkY.scrollable && checkY.contain) || (deltaX !== 0 && checkX.scrollable && checkX.contain)) {
      return null;
    }

    node = node.parentElement;
  }

  // Fallback to document scrolling element if scrollable
  const docEl = document.scrollingElement as HTMLElement | null;
  if (docEl) {
    const checkY = deltaY !== 0 ? canScrollInAxis(docEl, 'y', deltaY) : { canMove: false };
    const checkX = deltaX !== 0 ? canScrollInAxis(docEl, 'x', deltaX) : { canMove: false };
    if (checkY.canMove || checkX.canMove) {
      return docEl;
    }
  }

  return null;
}

function stepAnimation(el: HTMLElement, timestamp: number) {
  const state = containerStates.get(el);
  if (!state || !el.isConnected) {
    activeContainers.delete(el);
    return;
  }

  // Check if user moved scrollbar/touch externally; if so, yield immediately
  if (
    Math.abs(el.scrollTop - state.lastAppliedTop) > 3 ||
    Math.abs(el.scrollLeft - state.lastAppliedLeft) > 3
  ) {
    state.rafId = null;
    activeContainers.delete(el);
    return;
  }

  const dt = Math.min((timestamp - state.lastTimestamp) / 1000, 0.05);
  state.lastTimestamp = timestamp;

  // Frame-rate independent exponential smoothing
  const alpha = 1 - Math.exp(-SMOOTH_SPEED * dt);

  const diffTop = state.targetTop - state.currentTop;
  const diffLeft = state.targetLeft - state.currentLeft;

  const doneY = Math.abs(diffTop) <= STOP_THRESHOLD;
  const doneX = Math.abs(diffLeft) <= STOP_THRESHOLD;

  state.currentTop = doneY ? state.targetTop : state.currentTop + diffTop * alpha;
  state.currentLeft = doneX ? state.targetLeft : state.currentLeft + diffLeft * alpha;

  el.scrollTo({
    top: state.currentTop,
    left: state.currentLeft,
    behavior: 'instant' as ScrollBehavior,
  });

  state.lastAppliedTop = el.scrollTop;
  state.lastAppliedLeft = el.scrollLeft;

  if (doneY && doneX) {
    state.rafId = null;
    activeContainers.delete(el);
    return;
  }

  state.rafId = window.requestAnimationFrame((nextTs) => stepAnimation(el, nextTs));
}

export function initSmoothScrolling(): () => void {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return () => {};
  }

  const handleWheel = (e: WheelEvent) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;

    // Don't interfere with active drag-and-drop operations
    if (document.body.style.cursor === 'grabbing') return;

    // Allow native OS inertia for high-frequency precision trackpads
    if (isNativePrecisionTrackpad(e)) return;

    const initialTarget = e.target instanceof HTMLElement ? e.target : null;
    if (!initialTarget) return;

    // First convert delta using target or fallback line-height
    const rawDelta = normalizeWheelDelta(e, initialTarget);
    const scrollTarget = findScrollTarget(e.target, rawDelta.deltaX, rawDelta.deltaY);
    if (!scrollTarget) return;

    const { deltaX, deltaY } = normalizeWheelDelta(e, scrollTarget);
    if (deltaX === 0 && deltaY === 0) return;

    e.preventDefault();

    const maxTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
    const maxLeft = Math.max(0, scrollTarget.scrollWidth - scrollTarget.clientWidth);

    let state = containerStates.get(scrollTarget);
    if (!state || state.rafId === null) {
      state = {
        currentTop: scrollTarget.scrollTop,
        currentLeft: scrollTarget.scrollLeft,
        targetTop: scrollTarget.scrollTop,
        targetLeft: scrollTarget.scrollLeft,
        lastAppliedTop: scrollTarget.scrollTop,
        lastAppliedLeft: scrollTarget.scrollLeft,
        rafId: null,
        lastTimestamp: performance.now(),
      };
      containerStates.set(scrollTarget, state);
    } else if (
      Math.abs(scrollTarget.scrollTop - state.lastAppliedTop) > 3 ||
      Math.abs(scrollTarget.scrollLeft - state.lastAppliedLeft) > 3
    ) {
      // Sync if scrolled externally mid-animation
      state.currentTop = scrollTarget.scrollTop;
      state.targetTop = scrollTarget.scrollTop;
      state.currentLeft = scrollTarget.scrollLeft;
      state.targetLeft = scrollTarget.scrollLeft;
    }

    state.targetTop = Math.min(maxTop, Math.max(0, state.targetTop + deltaY));
    state.targetLeft = Math.min(maxLeft, Math.max(0, state.targetLeft + deltaX));

    if (state.rafId === null) {
      state.lastTimestamp = performance.now();
      activeContainers.add(scrollTarget);
      state.rafId = window.requestAnimationFrame((ts) => stepAnimation(scrollTarget, ts));
    }
  };

  window.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    window.removeEventListener('wheel', handleWheel);
    activeContainers.forEach((el) => {
      const state = containerStates.get(el);
      if (state?.rafId !== null && state?.rafId !== undefined) {
        window.cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
    });
    activeContainers.clear();
  };
}
