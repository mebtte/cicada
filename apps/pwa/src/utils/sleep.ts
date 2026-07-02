/**
 * 模拟睡眠
 * @author mebtte<i@mebtte.com>
 */
function sleep(ms: number) {
  return new Promise<void>((resolve) =>
    globalThis.setTimeout(() => resolve(), ms),
  );
}

export default sleep;
