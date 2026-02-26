export function highlight(el) {
  const rect = el.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute',
    left: `${rect.left + scrollX}px`,
    top: `${rect.top + scrollY}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    backgroundColor: '#ffff77',
    opacity: '0.7',
    zIndex: '10',
    pointerEvents: 'none',
    transition: 'opacity 1s ease',
  });
  document.body.appendChild(overlay);
  // Double rAF ensures initial opacity is painted before the transition starts
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.style.opacity = '0';
  }));
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}
