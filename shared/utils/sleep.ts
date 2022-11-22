/**
 * 模拟睡眠
 * @author mebtte<hi@mebtte.com>
 */
function sleep(ms: number): Promise<void>;
function sleep<T>(ms: number, data: T): Promise<T>;
function sleep<T>(ms: number, data?: T) {
  return new Promise<T | void>((resolve) =>
    global.setTimeout(() => resolve(data), ms),
  );
}

export default sleep;
