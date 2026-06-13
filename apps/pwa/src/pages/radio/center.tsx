import { QueueMusic } from '@/pages/player/constants';
import Lyric from '@/pages/player/lyric_panel/lyric';

/**
 * 中间区: 直接复用播放器歌词面板的展示组件, 保持两边状态机统一.
 * - 乐曲 / 无歌词 → 大封面
 * - 歌词 LOADING → 居中 spinner
 * - 歌词 ERROR → 错误文案 + 重试
 * - 歌词 SUCCESS → 歌词
 */
function Center({
  queueMusic,
  bottomGap,
}: {
  queueMusic: QueueMusic;
  bottomGap: number;
}) {
  return <Lyric queueMusic={queueMusic} bottomGap={bottomGap} />;
}

export default Center;
