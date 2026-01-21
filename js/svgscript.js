document.querySelectorAll('[data-svg]').forEach(async el => {
  const src = el.getAttribute('data-svg');
  const res = await fetch(src);
  const svgText = await res.text();

  el.innerHTML = svgText;
});
