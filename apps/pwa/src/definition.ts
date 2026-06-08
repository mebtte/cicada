declare global {
  const __DEFINE__:
    | {
        VERSION: string;
        BUILD_TIME: string;
      }
    | undefined;
}

/**
 * vite-plugin-pwa 1.x 的 dev SW 加载路径不会应用用户在 vite.config 里的 `define`
 * (process.env.NODE_ENV 因 Vite 内置仍会替换). 为避免 dev SW 评估时 ReferenceError,
 * 这里对 __DEFINE__ / process.env.WITH_SW 做 typeof 守卫, 缺失时回退到 dev 默认值.
 */
const fallback = { VERSION: 'dev', BUILD_TIME: new Date().toISOString() };
const source =
  typeof __DEFINE__ !== 'undefined' && __DEFINE__ ? __DEFINE__ : fallback;

let withSwValue: string | undefined;
try {
  // 生产构建里 Vite 把 `process.env.WITH_SW` 字面替换成 "true"/"false";
  // dev SW 里替换不会发生, 直接访问 `process` 会 ReferenceError, 由 catch 兜底.
  withSwValue = process.env.WITH_SW;
} catch {
  withSwValue = undefined;
}

const definition = {
  ...source,
  BUILD_TIME: new Date(source.BUILD_TIME),
  WITH_SW: withSwValue,

  DEVELOPMENT: process.env.NODE_ENV === 'development',
};

export default definition;
