/**
 * 获取随机整数 [min, max)
 * @author mebtte<i@mebtte.com>
 */
function generateRandomInteger(min = 0, max = 1) {
  if (min > max) {
    throw new Error("'min' should be less than 'max'");
  }
  return Math.floor(min + Math.random() * (max - min));
}

export default generateRandomInteger;
