/* 共用課堂觸控防護：保留滑動，不吞掉正常單指點擊。 */
(() => {
  'use strict';
  if (window.__classroomTouchGuard) return;
  window.__classroomTouchGuard = true;
  const style = document.createElement('style');
  style.textContent = `
    html, body, body * { touch-action: pan-x pan-y !important; }
    html { overscroll-behavior: none; }
    body * {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
    input, textarea, select, [contenteditable="true"], [contenteditable="true"] * {
      -webkit-user-select: text;
      user-select: text;
      -webkit-touch-callout: default;
    }
    input, textarea, select { font-size: max(16px, 1em); }
    img { -webkit-user-drag: none; }
  `;
  document.head.appendChild(style);
  const editable = target => target instanceof Element &&
    !!target.closest('input, textarea, select, [contenteditable="true"]');
  document.addEventListener('contextmenu', event => {
    if (!editable(event.target) && event.cancelable) event.preventDefault();
  }, { capture: true });
  document.addEventListener('dragstart', event => {
    if (!editable(event.target) && event.cancelable) event.preventDefault();
  }, { capture: true });
  // iPadOS 的雙擊縮放備援：只處理短距離快速輕點，滑動和輸入不攔截。
  const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIPad) {
    let start = null;
    let lastTap = null;
    let syntheticTarget = null;
    let suppressUntil = 0;
    const reset = () => { start = null; lastTap = null; };
    document.addEventListener('touchstart', event => {
      syntheticTarget = null;
      suppressUntil = 0;
      if (event.touches.length !== 1 || editable(event.target)) { reset(); return; }
      const touch = event.touches[0];
      start = { x: touch.clientX, y: touch.clientY, time: performance.now() };
    }, { passive: true, capture: true });
    document.addEventListener('touchmove', event => {
      if (!start || event.touches.length !== 1) { reset(); return; }
      const touch = event.touches[0];
      if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12) reset();
    }, { passive: true, capture: true });
    document.addEventListener('touchcancel', reset, { passive: true, capture: true });
    document.addEventListener('touchend', event => {
      if (!start || event.touches.length || event.changedTouches.length !== 1) { reset(); return; }
      const touch = event.changedTouches[0];
      const now = performance.now();
      const shortTap = now - start.time < 350 &&
        Math.hypot(touch.clientX - start.x, touch.clientY - start.y) <= 12;
      start = null;
      if (!shortTap || editable(event.target)) { lastTap = null; return; }
      const doubleTap = lastTap && now - lastTap.time < 400 &&
        Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 40;
      lastTap = { time: now, x: touch.clientX, y: touch.clientY };
      if (!doubleTap || !event.cancelable || event.defaultPrevented) return;
      event.preventDefault();
      // 取消 touchend 也會取消瀏覽器產生的 click，補送一次給原遊戲。
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.isConnected && typeof target.click === 'function') {
        syntheticTarget = target;
        suppressUntil = now + 700;
        target.click();
      }
    }, { passive: false });
    document.addEventListener('click', event => {
      // 部分瀏覽器仍產生相容 click；避免同一次觸控重複執行。
      if (event.isTrusted && performance.now() < suppressUntil && syntheticTarget &&
          (event.target === syntheticTarget || syntheticTarget.contains(event.target))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        syntheticTarget = null;
      }
    }, { capture: true });
  }

  // Safari 雙指手勢備援。
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, event => {
      if (event.cancelable) event.preventDefault();
    }, { passive: false, capture: true });
  }
})();
