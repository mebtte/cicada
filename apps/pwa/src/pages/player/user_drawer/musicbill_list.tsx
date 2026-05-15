import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { MdOutlineMusicNote } from 'react-icons/md';
import Empty from '@/components/empty';
import { CSSProperties } from 'react';
import { t } from '@/i18n';
import getResizedImage from '@/server/asset/get_resized_image';
import { UserDetail } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

type MusicbillType = UserDetail['musicbillList'][0];
const COVER_SHADOW = CSSVariable.COLOR_CONTROL_NEUTRAL;
const Root = styled.div`
  padding: 16px 12px calc(22px + env(safe-area-inset-bottom, 0));

  font-size: 0;

  > .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
  }
`;
const Style = styled.button`
  width: 100%;
  min-width: 0;
  padding: 8px 8px 11px;

  display: block;

  appearance: none;
  border: 2px solid rgb(229 229 229);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 0 rgb(210 210 210);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms;

  > .cover-box {
    position: relative;
    overflow: hidden;
    box-sizing: border-box;

    border: 2px solid ${COVER_SHADOW};
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 3px 0 ${COVER_SHADOW};

    > .cover {
      display: block;
    }

    > .music-count {
      position: absolute;
      left: 8px;
      bottom: 8px;
      max-width: calc(100% - 16px);

      padding: 5px 8px 6px;

      display: flex;
      align-items: center;
      gap: 5px;

      color: rgb(88 88 88);
      font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      font-weight: 800;
      line-height: 1;
      background: #fff;
      border: 2px solid rgb(229 229 229);
      border-radius: 10px;
      box-shadow: 0 2px 0 rgb(210 210 210);

      > .count {
        ${ellipsis}
      }
    }
  }

  > .name {
    margin: 10px 4px 0;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.25;
    color: rgb(50 50 50);
    ${ellipsis}
  }

  &:hover {
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 3px;
  }
`;
const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  return (
    <Style
      type="button"
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, {
          id: musicbill.id,
        })
      }
    >
      <div className="cover-box">
        <Cover
          className="cover"
          src={getResizedImage({ url: musicbill.cover, size: 400 })}
          size="100%"
          shape={Shape.SQUARE}
        />
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
        <div className="grid">
          {musicbillList.map((musicbill) => (
            <Musicbill key={musicbill.id} musicbill={musicbill} />
          ))}
        </div>
      </Root>
    );
  }
  return <Empty style={emptyStyle} description={t('no_public_musicbill')} />;
}

export default MusicbillList;
