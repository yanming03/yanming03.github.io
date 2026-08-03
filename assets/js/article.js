window.addEventListener('DOMContentLoaded', () => {
  window.renderMathInElement?.(document.body, {
    delimiters: [{ left: '$$', right: '$$', display: true }],
    throwOnError: false
  });
});
