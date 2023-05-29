import Cover from '@/components/cover';
import { CSSProperties, memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdOutlineHelpCenter,
} from 'react-icons/md';
import { RequestStatus } from '@/constants';
import Spinner from '@/components/spinner';
import ellipsis from '@/style/ellipsis';
import notice from '@/utils/notice';
import {
  MusicWithSingerAliases,
  Musicbill as MusicbillType,
} from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const ICON_SIZE = 24;
const Style = styled.div`
  padding: 8px 20px;

  display: flex;
  align-items: center;

  cursor: pointer;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }

  > .icon {
    width: ${ICON_SIZE}px;
    height: ${ICON_SIZE}px;
  }

  > .cover {
    margin: 0 10px 0 15px;
  }

  > .name {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    ${ellipsis}
  }
`;
const checkedStyle: CSSProperties = {
  color: CSSVariable.COLOR_PRIMARY,
};

function Musicbill({
  musicbill,
  music,
}: {
  musicbill: MusicbillType;
  music: MusicWithSingerAliases;
}) {
  const { id, status, musicList } = musicbill;
  return (
    <Style
      onClick={() => {
        if (status === RequestStatus.SUCCESS) {
          if (musicList.find((m) => m.id === music.id)) {
            return playerEventemitter.emit(
              PlayerEventType.REMOVE_MUSIC_FROM_MUSICBILL,
              { musicbill, music },
            );
          }
          return playerEventemitter.emit(
            PlayerEventType.ADD_MUSIC_TO_MUSICBILL,
            {
              musicbill,
              music: music!,
            },
          );
        }
        if (status === RequestStatus.LOADING) {
          return notice.error('请等待乐单加载完毕');
        }
        return playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL_DETAIL, {
          id,
        });
      }}
    >
      {status === RequestStatus.SUCCESS ? (
        musicList.find((m) => m.id === music.id) ? (
          <MdCheckBox className="icon" style={checkedStyle} />
        ) : (
          <MdCheckBoxOutlineBlank className="icon" />
        )
      ) : status === RequestStatus.LOADING ? (
        <Spinner size={ICON_SIZE} />
      ) : (
        <MdOutlineHelpCenter className="icon" />
      )}
      <Cover
        className="cover"
        src={musicbill.cover}
        size={24}
        style={{
          outline: musicbill.public
            ? `2px solid ${CSSVariable.COLOR_PRIMARY}`
            : 'none',
        }}
      />
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default memo(Musicbill);
