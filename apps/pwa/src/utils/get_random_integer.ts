/**
 * 获取随机整数
 * @author mebtte<hi@mebtte.com>
 */
function getRandomInteger(min = 0, max = 1) {
  return Math.floor(min + Math.random() * (max - min));
}

export default getRandomInteger;
