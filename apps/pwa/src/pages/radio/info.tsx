import styled from 'styled-components';
import { animated, useTransition } from 'react-spring';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { QueueMusic } from '@/pages/player/constants';
import { Singer } from '@/features/music/components';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '@/pages/player/eventemitter';

const Root = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  margin: 0 20px;

  text-align: center;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
`;
const Item = styled(animated.div)`
  grid-row: 1;
  grid-column: 1;

  > .name {
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.35;
    letter-spacing: 0;
    overflow-wrap: break-word;

    > .content {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
  }

  > .singers {
    margin-top: 4px;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: 0;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}
  }
`;

function Info({ queueMusic }: { queueMusic: QueueMusic }) {
  const transitions = useTransition(queueMusic, {
    keys: (qm: QueueMusic) => qm.pid,
    from: { opacity: 0, filter: 'blur(8px)', transform: 'scale(0.96)' },
    enter: { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
    leave: { opacity: 0, filter: 'blur(8px)', transform: 'scale(1.04)' },
    config: { tension: 220, friction: 26 },
  });

  return (
    <Root>
      {transitions((style, qm) => (
        <Item style={style}>
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
              <Singer
                key={singer.id}
                singer={singer}
                onOpen={(nextSinger) =>
                  playerEventemitter.emit(PlayerEventType.OPEN_ARTIST_DRAWER, {
                    id: nextSinger.id,
                  })
                }
              />
            ))}
          </div>
        </Item>
      ))}
    </Root>
  );
}

export default Info;
