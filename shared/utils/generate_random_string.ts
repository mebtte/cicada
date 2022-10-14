const CHARS = [
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

  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];
export const SIGNS = [
  '!',
  '@',
  '#',
  '$',
  '%',
  '^',
  '&',
  '*',
  '-',
  '_',
  '=',
  '+',
];
const CHARS_WITH_SIGN = [...CHARS, ...SIGNS];

/**
 * Get a random string.
 * @author mebtte<hi@mebtte.com>
 */
function generateRandomString(length = 10, sign = true) {
  const chars = sign ? CHARS_WITH_SIGN : CHARS;
  const charsLength = chars.length;
  const array = new Array(length);
  for (let i = 0; i < length; i += 1) {
    array[i] = chars[Math.floor(charsLength * Math.random())];
  }
  return array.join('');
}

export default generateRandomString;
