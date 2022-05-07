function getOriginalScrollbarWidth() {
  const outter = document.createElement('div');
  outter.style.cssText = `
    visibility: hidden;
    overflow: scroll;
  `;

  const inner = document.createElement('div');
  inner.style.cssText = ``;

  outter.appendChild(inner);
  document.body.appendChild(outter);

  const scrollbarWidth = outter.offsetWidth - inner.offsetWidth;

  outter.remove();

  return scrollbarWidth;
}

export default getOriginalScrollbarWidth;
