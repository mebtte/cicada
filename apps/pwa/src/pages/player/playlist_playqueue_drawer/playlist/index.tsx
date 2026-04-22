import {
  CSSProperties,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import List from 'react-list';
import Button from '@/components_next/button';
import { MdPlayArrow, MdReadMore, MdOutlineClose } from 'react-icons/md';
import { CSSVariable } from '@/global_style';
import Empty from '@/components/empty';
import { flexCenter } from '@/style/flexbox';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { TAB_LIST_HEIGHT } from '../constants';
import Context from '../../context';
import TabContent from '../tab_content';
import MusicBase from '../../components/music_base';
import { QueueMusic } from '../../constants';
import Toolbar from './toolbar';
import { FILTER_HEIGHT } from './constants';
import { filterMusic } from '../../utils';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

const Style = styled(TabContent)`
  > .content {
    ${absoluteFullSize}

    padding-bottom: calc(${FILTER_HEIGHT}px + env(safe-area-inset-bottom, 0));

    &.list {
      overflow: auto;
      ${autoScrollbar}
    }

    &.empty {
      ${flexCenter}
    }
  }
`;
const Operation = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;
const removeStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function Playlist({ style }: { style: unknown }) {
  const listRef = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState('');
  const onKeywordChange = useCallback((k) => setKeyword(k), []);

  const { playlist, playqueue, currentPlayqueuePosition } = useContext(Context);
  const currentMusic = playqueue[currentPlayqueuePosition] as
    | QueueMusic
    | undefined;

  useLayoutEffect(() => {
    window.setTimeout(
      () => listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
      0,
    );
  }, [keyword]);

  const { height: titlebarAreaHeight } = useTitlebarArea();
  const contentStyle: CSSProperties = {
    paddingTop: TAB_LIST_HEIGHT + titlebarAreaHeight,
  };

  const filteredPlaylist = playlist.filter((music) =>
    filterMusic(music, keyword),
  );
  return (
    // @ts-expect-error
    <Style style={style}>
      {filteredPlaylist.length ? (
        <div className="content list" style={contentStyle} ref={listRef}>
          <List
            length={filteredPlaylist.length}
            type="uniform"
            itemRenderer={(index, key) => {
              const music = filteredPlaylist[index];
              return (
                <MusicBase
                  key={key}
                  index={music.index}
                  music={music}
                  active={music.id === currentMusic?.id}
                  lineAfter={
                    <Operation>
                      <Button
                        square
                        variant="plain"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          return playerEventemitter.emit(
                            PlayerEventType.ACTION_PLAY_MUSIC,
                            { music },
                          );
                        }}
                      >
                        <MdPlayArrow />
                      </Button>
                      <Button
                        square
                        variant="plain"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          return playerEventemitter.emit(
                            PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
                            { music },
                          );
                        }}
                      >
                        <MdReadMore />
                      </Button>
                      <Button
                        square
                        variant="plain"
                        size="sm"
                        style={removeStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          return playerEventemitter.emit(
                            PlayerEventType.ACTION_REMOVE_PLAYLIST_MUSIC,
                            { id: music.id },
                          );
                        }}
                      >
                        <MdOutlineClose />
                      </Button>
                    </Operation>
                  }
                />
              );
            }}
          />
        </div>
      ) : (
        <div className="content empty" style={contentStyle}>
          <Empty
            description={keyword ? t('no_suitable_music') : t('empty_playlist')}
          />
        </div>
      )}
      <Toolbar onKeywordChange={onKeywordChange} />
    </Style>
  );
}

export default Playlist;
