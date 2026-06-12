import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { animated, useTransition } from 'react-spring';
import ellipsis from '@/style/ellipsis';
import { QueueMusic } from '../constants';
import Performer from '../components/performer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Root = styled.div`
  position: relative;

  flex: 1;
  min-width: 0;
  height: 100%;
`;
const Style = styled(animated.div)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;

  > .top {
    user-select: none;
    line-height: 1.35;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}

    >.name {
      cursor: pointer;
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      font-weight: 800;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};

      &:hover {
        color: #000;
      }
    }

    > .alias {
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    }
  }

  > .performers {
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 700;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}
  }
`;

function Info({ queueMusic }: { queueMusic?: QueueMusic }) {
  // 切歌动画: 模糊渐隐 + 轻微缩放, 比上下滑动更克制
  const transitions = useTransition(queueMusic, {
    from: { opacity: 0, filter: 'blur(8px)', transform: 'scale(0.96)' },
    enter: { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
    leave: { opacity: 0, filter: 'blur(8px)', transform: 'scale(1.04)' },
    config: { tension: 220, friction: 26 },
  });

  return (
    <Root>
      {transitions((style, qm) =>
        qm ? (
          <Style style={style}>
            <div className="top">
              <span
                className="name"
                onClick={() =>
                  playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
                    id: qm.id,
                  })
                }
              >
                {qm.name}
              </span>
              {qm.aliases.length ? (
                <span className="alias">&nbsp;{qm.aliases[0]}</span>
              ) : null}
            </div>
            <div className="performers">
              {qm.performers.map((performer) => (
                <Performer key={performer.id} performer={performer} />
              ))}
            </div>
          </Style>
        ) : null,
      )}
    </Root>
  );
}

export default Info;
