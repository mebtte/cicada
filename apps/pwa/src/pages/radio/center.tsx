import styled from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import Spinner from '@/components/spinner';
import { QueueMusic } from '@/pages/player/constants';
import useLyricData from '@/pages/player/lyric_panel/lyric/use_lyric_data';
import { Status as LyricStatus } from '@/pages/player/lyric_panel/lyric/constants';
import Lyric from '@/pages/player/lyric_panel/lyric/lyric';
import Cover from './cover';

// 用 top/bottom 显式定位让歌词容器在视觉上不溢出到底部控制区,
// 否则 100% 高度的歌词滚动区会盖到操作按钮.
const LyricContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
`;
const CoverArea = styled.div`
  ${absoluteFullSize}
  ${flexCenter}
  padding: 24px 24px 0 24px;
`;
const LoadingArea = styled.div`
  ${absoluteFullSize}
  ${flexCenter}
`;

/**
 * 中间区:
 * - 歌词加载中 → 展示 loading, 避免先闪一下封面再切歌词
 * - 拿到歌词 → 展示歌词
 * - 乐曲/暂无歌词/错误 → 展示大封面
 */
function Center({
  queueMusic,
  bottomGap,
}: {
  queueMusic: QueueMusic;
  bottomGap: number;
}) {
  const { data } = useLyricData(queueMusic);
  if (data.status === LyricStatus.LOADING) {
    return (
      <LoadingArea style={{ paddingBottom: bottomGap }}>
        <Spinner />
      </LoadingArea>
    );
  }
  if (data.status === LyricStatus.SUCCESS) {
    return (
      <LyricContainer style={{ bottom: bottomGap }}>
        <Lyric lrcs={data.lrcs} />
      </LyricContainer>
    );
  }
  return (
    <CoverArea style={{ paddingBottom: bottomGap }}>
      <Cover cover={queueMusic.cover} />
    </CoverArea>
  );
}

export default Center;
