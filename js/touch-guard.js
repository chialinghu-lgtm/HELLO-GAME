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
  // Safari 備援；不攔截 touchend，以免連點按鈕失效。
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, event => {
      if (event.cancelable) event.preventDefault();
    }, { passive: false, capture: true });
  }
})();
