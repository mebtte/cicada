import {
  CSSProperties,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import { MdPlayArrow, MdReadMore, MdOutlineClose } from 'react-icons/md';
import { CSSVariable } from '@/global_style';
import Empty from '@/components/empty';
import VirtualList from '@/components/virtual_list';
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
import RemovalAnimationItem from '../removal_animation_item';
import useRemovalAnimation from '../use_removal_animation';

const Style = styled(TabContent)`
  > .content {
    ${absoluteFullSize}

    background: rgb(247 247 247);
    padding-bottom: env(safe-area-inset-bottom, 0);

    &.list {
      overflow: auto;
      padding-right: 16px;
      padding-left: 16px;
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
const LIST_BOTTOM_SPACE = FILTER_HEIGHT + TAB_LIST_HEIGHT;
const LIST_BOTTOM_SAFE_AREA_SPACE = `calc(${LIST_BOTTOM_SPACE}px + env(safe-area-inset-bottom, 0))`;

function Playlist() {
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
  const listTopSpace = titlebarAreaHeight + 12;
  const emptyContentStyle: CSSProperties = {
    paddingTop: titlebarAreaHeight + 12,
    paddingBottom: LIST_BOTTOM_SAFE_AREA_SPACE,
  };

  const filteredPlaylist = useMemo(
    () => playlist.filter((music) => filterMusic(music, keyword)),
    [keyword, playlist],
  );
  const getPlaylistItemKey = useCallback((music) => music.id, []);
  const { finishRemoval, renderedItems: renderedPlaylist } = useRemovalAnimation(
    filteredPlaylist,
    getPlaylistItemKey,
  );
  const leavingIndexes = useMemo(
    () =>
      renderedPlaylist.flatMap((item, index) =>
        item.leaving ? [index] : [],
      ),
    [renderedPlaylist],
  );
  return (
    <Style>
      {renderedPlaylist.length ? (
        <div className="content list" ref={listRef}>
          <VirtualList
            count={renderedPlaylist.length}
            forceRenderIndexes={leavingIndexes}
            getItemKey={(index) => renderedPlaylist[index].key}
            paddingStart={listTopSpace}
            paddingEnd={LIST_BOTTOM_SPACE}
            scrollElementRef={listRef}
            renderItem={(index, key, { requestMeasure }) => {
              const renderedMusic = renderedPlaylist[index];
              const music = renderedMusic.item;
              return (
                <RemovalAnimationItem
                  key={key}
                  itemKey={renderedMusic.key}
                  leaving={renderedMusic.leaving}
                  finishRemoval={finishRemoval}
                  requestMeasure={requestMeasure}
                >
                  <MusicBase
                    index={music.index}
                    music={music}
                    active={
                      !renderedMusic.leaving && music.id === currentMusic?.id
                    }
                    lineAfter={
                      <Operation>
                        <Button
                          className="primary-action"
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
                        <Tooltip content={t('play_next')}>
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
                        </Tooltip>
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
                </RemovalAnimationItem>
              );
            }}
          />
        </div>
      ) : (
        <div className="content empty" style={emptyContentStyle}>
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
