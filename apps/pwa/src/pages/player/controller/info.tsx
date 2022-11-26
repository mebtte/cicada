import styled from 'styled-components';
import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import { animated, useTransition } from 'react-spring';
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

  padding-left: 20px;

  display: flex;
  flex-direction: column;
  justify-content: center;

  > .name {
    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}

    >.content {
      cursor: pointer;

      &:hover {
        color: #000;
      }
    }
  }

  > .singers {
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}
  }
`;

function Info({ queueMusic }: { queueMusic: QueueMusic }) {
  const transitions = useTransition(queueMusic, {
    from: { transform: 'translateY(100%)', opacity: 0 },
    enter: { transform: 'translateY(0%)', opacity: 1 },
    leave: { transform: 'translateY(-100%)', opacity: 0 },
  });

  return (
    <Root>
      {transitions((style, qm) => (
        <Style style={style}>
          <div className="name">
            <span
              className="content"
              onClick={() =>
                playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
                  id: qm.id,
                })
              }
            >
              {qm.name}
            </span>
          </div>
          <div className="singers">
            {qm.singers.map((singer) => (
              <Singer key={singer.id} singer={singer} />
            ))}
          </div>
        </Style>
      ))}
    </Root>
  );
}

export default Info;
