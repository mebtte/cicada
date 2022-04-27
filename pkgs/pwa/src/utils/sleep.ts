/**
 * 模拟睡眠
 * @author mebtte<hi@mebtte.com>
 */
function sleep<T>(ms: number, data?: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export default sleep;
