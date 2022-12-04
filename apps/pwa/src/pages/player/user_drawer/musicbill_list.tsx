import styled from 'styled-components';
import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { MdOutlineMusicNote } from 'react-icons/md';
import Empty from '@/components/empty';
import { CSSProperties } from 'react';
import { UserDetail } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

type MusicbillType = UserDetail['musicbillList'][0];
const Root = styled.div`
  min-height: 100vh;
  padding: 0 10px 10px 10px;

  font-size: 0;
`;
const Style = styled.div`
  display: inline-block;
  width: 50%;
  padding: 10px;

  cursor: pointer;
  transition: 300ms;

  > .cover-box {
    position: relative;

    > .cover {
      display: block;
    }

    > .music-count {
      position: absolute;
      left: 0;
      bottom: 0;

      padding: 3px 8px;

      display: flex;
      align-items: center;
      gap: 5px;

      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      font-size: 12px;
      background-color: rgb(255 255 255 / 0.75);
    }
  }

  > .name {
    margin-top: 3px;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;
const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, {
          id: musicbill.id,
        })
      }
    >
      <div className="cover-box">
        <Cover className="cover" src={musicbill.cover} size="100%" />
        <div className="music-count">
          <MdOutlineMusicNote />
          <div className="count">{musicbill.musicCount}</div>
        </div>
      </div>
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

function MusicbillList({ musicbillList }: { musicbillList: MusicbillType[] }) {
  if (musicbillList.length) {
    return (
      <Root>
        {musicbillList.map((musicbill) => (
          <Musicbill key={musicbill.id} musicbill={musicbill} />
        ))}
      </Root>
    );
  }
  return <Empty style={emptyStyle} description="暂无公开歌单" />;
}

export default MusicbillList;
