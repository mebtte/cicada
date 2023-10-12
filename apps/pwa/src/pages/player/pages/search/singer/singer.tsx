import styled from 'styled-components';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const Style = styled.div`
  font-size: 0;
  cursor: pointer;

  > .name {
    margin-top: 3px;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .alias {
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    ${ellipsis}
  }
`;

function Singer({
  singerId,
  singerName,
  singerAvatar,
  singerAliases,
}: {
  singerId: string;
  singerName: string;
  singerAvatar: string;
  singerAliases?: string[];
}) {
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, {
          id: singerId,
        })
      }
    >
      <Cover src={singerAvatar} size="100%" />
      <div className="name">{singerName}</div>
      {singerAliases?.length ? (
        <div className="alias">{singerAliases[0]}</div>
      ) : null}
    </Style>
  );
}

export default Singer;
