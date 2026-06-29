import { animated, useTransition } from '@react-spring/web';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import Spinner from '@/components/spinner';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { QueueMusic } from '../../constants';
import Cover from '../cover';
import { Status } from './constants';
import useLyricData from './use_lyric_data';
import Lyric from './lyric';

// bottomGap: 底部需要让出给控制区的高度, 让歌词/封面/loading 都不会盖到控制条上.
const Container = styled(animated.div)<{ $bottomGap: number }>`
  z-index: 1;

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: ${({ $bottomGap }) => `${$bottomGap}px`};
`;
const LoadingContainer = styled(Container)`
  ${flexCenter}
`;
const CoverContainer = styled(Container)`
  ${flexCenter}
  padding: 24px;
`;
const ErrorContainer = styled(Container)`
  ${flexCenter}
  flex-direction: column;
  gap: 20px;
  padding: 0 40px;

  > .message {
    display: inline-grid;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 18px;
    font-weight: 900;
    line-height: 1.5;
    letter-spacing: 0;
    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};

    > span {
      grid-area: 1 / 1;

      ${upperCaseFirstLetter}
    }

    > .outline {
      color: transparent;
      pointer-events: none;
      -webkit-text-stroke: 3px rgb(255 255 255 / 0.96);
    }
  }
`;

/**
 * 歌词/封面/loading/错误统一展示组件, 播放器和电台共用.
 * - 乐曲 (INSTRUMENTAL) / 无歌词 (EMPTY): 大封面占位
 * - 歌词 LOADING: 居中 spinner
 * - 歌词 ERROR: 错误文案 + 重试按钮
 * - 歌词 SUCCESS: 滚动歌词
 */
function Wrapper({
  queueMusic,
  bottomGap,
}: {
  queueMusic: QueueMusic;
  bottomGap: number;
}) {
  const { data, retry } = useLyricData(queueMusic);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return transitions((style, d) => {
    switch (d.status) {
      case Status.SUCCESS: {
        return (
          <Container style={style} $bottomGap={bottomGap}>
            <Lyric lrcs={d.lrcs} />
          </Container>
        );
      }

      case Status.LOADING: {
        return (
          <LoadingContainer style={style} $bottomGap={bottomGap}>
            <Spinner />
          </LoadingContainer>
        );
      }

      case Status.ERROR: {
        return (
          <ErrorContainer style={style} $bottomGap={bottomGap}>
            <div className="message">
              <span className="outline" aria-hidden>
                {d.error.message}
              </span>
              <span>{d.error.message}</span>
            </div>
            <Button variant="primary" onClick={retry}>
              {t('retry')}
            </Button>
          </ErrorContainer>
        );
      }

      // 乐曲 / 无歌词: 展示大封面
      default: {
        return (
          <CoverContainer style={style} $bottomGap={bottomGap}>
            <Cover cover={queueMusic.cover} />
          </CoverContainer>
        );
      }
    }
  });
}

export default Wrapper;
