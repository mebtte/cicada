import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdPlayArrow, MdReadMore, MdOutlinePostAdd } from 'react-icons/md';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import { MusicWithSingerAliases } from '../constants';
import e, { EventType } from '../eventemitter';
import MusicBase from './music_base';

const ICON_BUTTON_SIZE = 28;

const LineAfterPart = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

function Music({
  active,
  index,
  music,
  addon,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  active: boolean;
  index: number;
  music: MusicWithSingerAliases;
  addon?: ReactNode;
}) {
  return (
    <MusicBase
      {...props}
      active={active}
      index={index}
      music={music}
      lineAfter={
        <LineAfterPart>
          <IconButton
            size={ICON_BUTTON_SIZE}
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.ACTION_PLAY_MUSIC, { music });
            }}
          >
            <MdPlayArrow />
          </IconButton>
          <IconButton
            size={ICON_BUTTON_SIZE}
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
            size={ICON_BUTTON_SIZE}
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.OPEN_MUSICBILL_MUSIC_DRAWER, {
                music,
              });
            }}
          >
            <MdOutlinePostAdd />
          </IconButton>
        </LineAfterPart>
      }
      addon={addon}
    />
  );
}

export default Music;
