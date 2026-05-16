import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { QueueMusic } from '../../constants';
import Singer from '../../components/singer';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

const Style = styled.div`
  margin: 0 20px;

  text-align: center;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};

  > .name {
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.35;
    letter-spacing: 0;
    overflow-wrap: break-word;

    >.content {
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
  return (
    <Style>
      <div className="name">
        <span
          className="content"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
              id: queueMusic.id,
            })
          }
        >
          {queueMusic.name}
        </span>
      </div>
      <div className="singers">
        {queueMusic.singers.map((singer) => (
          <Singer key={singer.id} singer={singer} />
        ))}
      </div>
    </Style>
  );
}

export default Info;
