import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import { PostAdd, QueueInsert, PlayArrow } from '@/components/icon';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import { t } from '@/i18n';
import { MusicWithArtistAliases } from '../constants';
import e, { EventType } from '../eventemitter';
import { MusicBase } from '@/features/music/components';

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
  music: MusicWithArtistAliases;
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
            className="primary-action"
            square
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              return e.emit(EventType.ACTION_PLAY_MUSIC, { music });
            }}
          >
            <PlayArrow />
          </Button>
          <Tooltip content={t('play_next')}>
            <Button
              square
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                return e.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, {
                  music,
                });
              }}
            >
              <QueueInsert />
            </Button>
          </Tooltip>
          <Tooltip content={t('add_to_musicbill')}>
            <Button
              square
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                return e.emit(EventType.OPEN_MUSICBILL_MUSIC_DRAWER, {
                  music,
                });
              }}
            >
              <PostAdd />
            </Button>
          </Tooltip>
        </LineAfterPart>
      }
      addon={addon}
    />
  );
}

export default Music;
