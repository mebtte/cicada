/**
 * 注册「回到前台」回调, 返回取消函数.
 *
 * 移动端 PWA 进入后台后 JS 会被冻结 (Page Lifecycle frozen), 电话等系统打断
 * 会改变 <audio> 的真实状态而事件不被派发, 导致 UI / mediaSession 滞留在
 * 冻结前. 这里统一捕获三种「恢复可见」时机, 用于以 <audio> 真实状态对账:
 *   - visibilitychange -> visible: 常规切回前台.
 *   - pageshow: bfcache 恢复.
 *   - resume: Page Lifecycle frozen -> resume.
 * @author mebtte<i@mebtte.com>
 */
function onVisible(callback: () => void) {
  const run = () => {
    if (window.document.visibilityState === 'visible') {
      callback();
    }
  };
  window.document.addEventListener('visibilitychange', run);
  window.addEventListener('pageshow', run);
  window.document.addEventListener('resume', run);
  return () => {
    window.document.removeEventListener('visibilitychange', run);
    window.removeEventListener('pageshow', run);
    window.document.removeEventListener('resume', run);
  };
}

export default onVisible;
