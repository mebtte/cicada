import styled from 'styled-components';
import Button from '@/components/button';
import { MdPlayArrow, MdReadMore, MdOutlinePostAdd } from 'react-icons/md';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import { MusicWithSingerAliases } from '../constants';
import e, { EventType } from '../eventemitter';
import MusicBase from './music_base';

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
          <Button
            square
            variant="plain"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.ACTION_PLAY_MUSIC, { music });
            }}
          >
            <MdPlayArrow />
          </Button>
          <Button
            square
            variant="plain"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, {
                music,
              });
            }}
          >
            <MdReadMore />
          </Button>
          <Button
            square
            variant="plain"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.OPEN_MUSICBILL_MUSIC_DRAWER, {
                music,
              });
            }}
          >
            <MdOutlinePostAdd />
          </Button>
        </LineAfterPart>
      }
      addon={addon}
    />
  );
}

export default Music;
