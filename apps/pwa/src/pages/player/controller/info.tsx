import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { animated, useTransition } from 'react-spring';
import ellipsis from '@/style/ellipsis';
import { QueueMusic } from '../constants';
import Singer from '../components/singer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const Root = styled.div`
  position: relative;

  flex: 1;
  min-width: 0;
  height: 100%;

  overflow: hidden;
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

  > .top {
    user-select: none;
    line-height: 1.5;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}

    >.name {
      cursor: pointer;
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
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

  > .singers {
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}
  }
`;

function Info({ queueMusic }: { queueMusic?: QueueMusic }) {
  const transitions = useTransition(queueMusic, {
    from: { transform: 'translateY(100%)', opacity: 0 },
    enter: { transform: 'translateY(0%)', opacity: 1 },
    leave: { transform: 'translateY(-100%)', opacity: 0 },
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
            <div className="singers">
              {qm.singers.map((singer) => (
                <Singer key={singer.id} singer={singer} />
              ))}
            </div>
          </Style>
        ) : null,
      )}
    </Root>
  );
}

export default Info;
