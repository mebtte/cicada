/**
 *
 * @param {Number} s second
 * @return {String} formatted second
 */
function formatSecond(s) {
  const minute = Math.floor(s / 60);
  const second = Math.floor(s % 60);
  return `${minute < 10 ? '0' : ''}${minute}:${
    second < 10 ? '0' : ''
  }${second}`;
}

export default formatSecond;
