import {
  CSSProperties,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import absoluteFullSize from '#/style/absolute_full_size';
import List from 'react-list';
import IconButton from '#/components/icon_button';
import { MdPlayArrow, MdReadMore, MdOutlineClose } from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import { CSSVariable } from '#/global_style';
import Empty from '@/components/empty';
import { flexCenter } from '#/style/flexbox';
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

    padding-top: ${TAB_LIST_HEIGHT}px;
    padding-bottom: calc(${FILTER_HEIGHT}px + env(safe-area-inset-bottom, 0));

    &.list {
      overflow: auto;
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

  const filteredPlaylist = playlist.filter((music) =>
    filterMusic(music, keyword),
  );
  return (
    // @ts-expect-error
    <Style style={style}>
      {filteredPlaylist.length ? (
        <div className="content list" ref={listRef}>
          <List
            length={filteredPlaylist.length}
            type="uniform"
            // eslint-disable-next-line react/no-unstable-nested-components
            itemRenderer={(index, key) => {
              const music = filteredPlaylist[index];
              return (
                <MusicBase
                  key={key}
                  music={music}
                  active={music.id === currentMusic?.id}
                  lineAfter={
                    <Operation>
                      <IconButton
                        size={ComponentSize.SMALL}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          return playerEventemitter.emit(
                            PlayerEventType.ACTION_PLAY_MUSIC,
                            { music },
                          );
                        }}
                      >
                        <MdPlayArrow />
                      </IconButton>
                      <IconButton
                        size={ComponentSize.SMALL}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          return playerEventemitter.emit(
                            PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
                            { music },
                          );
                        }}
                      >
                        <MdReadMore />
                      </IconButton>
                      <IconButton
                        size={ComponentSize.SMALL}
                        style={removeStyle}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          return playerEventemitter.emit(
                            PlayerEventType.ACTION_REMOVE_PLAYLIST_MUSIC,
                            { music },
                          );
                        }}
                      >
                        <MdOutlineClose />
                      </IconButton>
                    </Operation>
                  }
                />
              );
            }}
          />
        </div>
      ) : (
        <div className="content empty">
          <Empty description={keyword ? '未找到合适的音乐' : '空的播放列表'} />
        </div>
      )}
      <Toolbar onKeywordChange={onKeywordChange} />
    </Style>
  );
}

export default Playlist;
