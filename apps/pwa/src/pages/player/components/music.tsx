import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdPlayArrow, MdReadMore, MdOutlinePostAdd } from 'react-icons/md';
import Tag, { Type } from '@/components/tag';
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
  addon,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  active: boolean;
  music: MusicWithIndex;
  addon?: ReactNode;
}) {
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
              size={28}
              onClick={(event) => {
                event.stopPropagation();
                return e.emit(EventType.ACTION_PLAY_MUSIC, { music });
              }}
            >
              <MdPlayArrow />
            </IconButton>
            <IconButton
              size={28}
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
              size={28}
              onClick={(event) => {
                event.stopPropagation();
                return e.emit(EventType.OPEN_ADD_MUSIC_TO_MUSICBILL_DRAWER, {
                  music,
                });
              }}
            >
              <MdOutlinePostAdd />
            </IconButton>
          </LineAfterPart>
        </>
      }
      addon={addon}
    />
  );
}

export default Music;
