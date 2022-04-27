/**
 * Get a random string.
 * @author mebtte<mebtte@gamil.com>
 * @param {String} [length] The length of string, detault `10`.
 * @return {String} A random string.
 */
function getRandomString(length = 10) {
  const randomChars = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
  ];
  const randomCharLength = randomChars.length;
  let string = '';
  for (let i = 0; i < length; i += 1) {
    string += randomChars[Math.floor(randomCharLength * Math.random())];
  }
  return string;
}

export default getRandomString;
