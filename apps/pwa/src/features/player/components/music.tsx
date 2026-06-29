import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import { PostAdd, QueueInsert, PlayArrow } from '@/components/icon';
import { HtmlHTMLAttributes, ReactNode, useContext } from 'react';
import { t } from '@/i18n';
import { MusicWithArtistAliases } from '../constants';
import e, { EventType } from '../eventemitter';
import { MusicBase } from '@/features/music/components';
import Context from '../context';

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
  const { playEnabled, playNextEnabled } = useContext(Context);

  return (
    <MusicBase
      {...props}
      active={active}
      index={index}
      music={music}
      // MusicBase 是跨 feature 的纯展示组件, 播放器场景需要在这里接回抽屉事件。
      onOpenMusic={(music) =>
        e.emit(EventType.OPEN_MUSIC_DRAWER, { id: music.id })
      }
      onOpenArtist={(performer) =>
        e.emit(EventType.OPEN_ARTIST_DRAWER, { id: performer.id })
      }
      lineAfter={
        <LineAfterPart>
          {playEnabled ? (
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
          ) : null}
          {playNextEnabled ? (
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
          ) : null}
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
