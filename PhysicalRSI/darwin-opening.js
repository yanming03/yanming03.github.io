(() => {
  const opening = document.querySelector('.darwin-opening');
  if (!opening) return;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  let pointer;

  function clearLens() {
    cancelAnimationFrame(frame);
    frame = 0;
    pointer = undefined;
    opening.style.setProperty('--lens-radius', '0px');
  }

  function drawLens() {
    frame = 0;
    if (!pointer) return;
    const bounds = opening.getBoundingClientRect();
    const x = pointer.x - bounds.left;
    const y = pointer.y - bounds.top;
    if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) return clearLens();
    opening.style.setProperty('--lens-x', `${x}px`);
    opening.style.setProperty('--lens-y', `${y}px`);
    opening.style.setProperty('--lens-radius', `${Math.min(235, bounds.width * .24)}px`);
  }

  opening.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType === 'touch') return clearLens();
    pointer = { x: event.clientX, y: event.clientY };
    if (!frame) frame = requestAnimationFrame(drawLens);
  });
  opening.addEventListener('pointerleave', clearLens);
  opening.addEventListener('pointercancel', clearLens);
  opening.addEventListener('focusin', clearLens);
  window.addEventListener('blur', clearLens);
  window.addEventListener('scroll', clearLens, { passive: true });
  window.addEventListener('resize', clearLens);
  finePointer.addEventListener('change', clearLens);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearLens(); });

})();
