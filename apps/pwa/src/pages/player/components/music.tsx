import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import {
  MdMoreHoriz,
  MdPlayArrow,
  MdReadMore,
  MdOutlinePostAdd,
} from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import Tag, { Type } from '#/components/tag';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import { MusicWithIndex } from '../constants';
import e, { EventType } from '../eventemitter';
import MusicBase from './music_base';

const LineAfterPart = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

function Music({
  active,
  music,
  miniMode,
  addon,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  active: boolean;
  music: MusicWithIndex;
  miniMode: boolean;
  addon?: ReactNode;
}) {
  const openMusicOperatePopup = () =>
    e.emit(EventType.OPEN_MUSIC_OPERATE_POPUP, { music });
  return (
    <MusicBase
      {...props}
      active={active}
      music={music}
      lineAfter={
        <>
          <LineAfterPart>
            {music.hq ? <Tag type={Type.HQ} /> : null}
            {music.ac ? <Tag type={Type.AC} /> : null}
          </LineAfterPart>
          <LineAfterPart>
            <IconButton
              size={ComponentSize.SMALL}
              onClick={(event) => {
                event.stopPropagation();
                return e.emit(EventType.ACTION_PLAY_MUSIC, { music });
              }}
            >
              <MdPlayArrow />
            </IconButton>
            {miniMode ? null : (
              <>
                <IconButton
                  size={ComponentSize.SMALL}
                  onClick={(event) => {
                    event.stopPropagation();
                    return e.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, {
                      music,
                    });
                  }}
                >
                  <MdReadMore />
                </IconButton>
                <IconButton
                  size={ComponentSize.SMALL}
                  onClick={(event) => {
                    event.stopPropagation();
                    return e.emit(EventType.OPEN_MUSICBILL_LIST_DRAWER, {
                      music,
                    });
                  }}
                >
                  <MdOutlinePostAdd />
                </IconButton>
              </>
            )}
            <IconButton
              size={ComponentSize.SMALL}
              onClick={(event) => {
                event.stopPropagation();
                return openMusicOperatePopup();
              }}
            >
              <MdMoreHoriz />
            </IconButton>
          </LineAfterPart>
        </>
      }
      addon={addon}
    />
  );
}

export default Music;
