/**
 * 模拟睡眠
 * @author mebtte<i@mebtte.com>
 */
function sleep(ms: number) {
  return new Promise<void>((resolve) => global.setTimeout(() => resolve(), ms));
}

export default sleep;
