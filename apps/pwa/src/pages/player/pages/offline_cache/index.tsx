import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  MdDelete,
  MdHelpOutline,
  MdPlayArrow,
  MdPlaylistAdd,
  MdReadMore,
} from 'react-icons/md';
import autoScrollbar from '@/style/auto_scrollbar';
import capitalizeString from '@/utils/capitalize';
import { CSSVariable } from '@/global_style';
import Button from '@/components/button';
import Input from '@/components/input';
import Empty from '@/components/empty';
import { Tooltip } from '@/components';
import { flexCenter } from '@/style/flexbox';
import { IS_TOUCHABLE } from '@/constants/browser';
import { t } from '@/i18n';
import dialog from '@/utils/dialog';
import {
  audioAssetCacheEvents,
  isAudioAssetCached,
  removeCachedMusic,
} from '@/utils/audio_asset_cache';
import {
  getOfflineMusicMap,
  offlineMusicEvents,
  removeOfflineMusic,
} from '@/utils/offline_music';
import { OfflineMusic } from '@/storage';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import { MusicPlaybackQuality } from '@/constants/setting';
import { useSetting } from '@/global_states/setting';
import Page, { PAGE_HORIZONTAL_PADDING } from '../page';
import MusicBase from '../../components/music_base';
import addMusicListToPlaylist from '../../add_to_playlist';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import {
  CONTROLLER_FLOATING_RESERVED_HEIGHT,
  FLOATING_CONTROLLER_SCROLL_SPACE,
  MusicWithSingerAliases,
} from '../../constants';

const SUMMARY_BAR_HEIGHT = 58;
const SUMMARY_BAR_FLOATING_GAP = 12;
const SUMMARY_BAR_HORIZONTAL_INSET = `calc(${PAGE_HORIZONTAL_PADDING} + 8px)`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

const Style = styled(Page)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgb(248 249 250);

  > .scrollable {
    height: 100%;
    overflow: auto;
    padding: ${PAGE_HORIZONTAL_PADDING};
    background:
      linear-gradient(180deg, rgb(247 253 248) 0, rgb(248 249 250) 300px),
      rgb(248 249 250);
    ${autoScrollbar}
  }
`;

const ListWrap = styled.div`
  position: relative;
  width: 100%;
  min-height: 100%;
`;

const EmptyWrap = styled.div`
  position: absolute;
  inset: 0;
  ${flexCenter}
`;

const Tail = styled.div`
  height: calc(
    ${FLOATING_CONTROLLER_SCROLL_SPACE} + ${SUMMARY_BAR_HEIGHT}px +
      ${SUMMARY_BAR_FLOATING_GAP * 2}px
  );
`;

const LineAfter = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const SummaryBar = styled.div`
  z-index: 2;

  position: absolute;
  left: ${SUMMARY_BAR_HORIZONTAL_INSET};
  right: ${SUMMARY_BAR_HORIZONTAL_INSET};
  bottom: calc(${CONTROLLER_FLOATING_RESERVED_HEIGHT} + ${SUMMARY_BAR_FLOATING_GAP}px);
  height: ${SUMMARY_BAR_HEIGHT}px;

  padding: 7px 10px 9px;

  display: flex;
  align-items: center;
  gap: 8px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 14px;
  box-shadow: 0 5px 0 ${NEUTRAL_SHADOW};

  @media (max-width: 480px) {
    gap: 6px;
    padding-right: 8px;
    padding-left: 8px;
  }
`;

function entryToMusic(entry: OfflineMusic): MusicWithSingerAliases {
  return {
    id: entry.id,
    name: entry.name,
    aliases: entry.aliases,
    cover: entry.cover,
    type: entry.type,
    asset: entry.asset,
    singers: entry.singers.map((s) => ({
      id: s.id,
      name: s.name,
      aliases: s.aliases ?? [],
    })),
  };
}

const searchInputStyle = { flex: 1, minWidth: 0 } as const;

function OfflineCache() {
  const musicPlaybackQuality = useSetting((s) => s.musicPlaybackQuality);
  const [entries, setEntries] = useState<OfflineMusic[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const composingRef = useRef(false);
  const normalizedKeyword = keyword.trim().toLowerCase();

  /**
   * 排序稳定的序号: 用原始位置 (按 cachedAt 降序) 算出后存入 map.
   * 筛选后渲染从 map 取号, 序号与未筛选时保持一致.
   */
  const idToIndex = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((entry, i) => {
      map.set(entry.id, entries.length - i);
    });
    return map;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!normalizedKeyword) {
      return entries;
    }
    return entries.filter((entry) => {
      if (entry.name.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      if (
        entry.aliases.some((a) => a.toLowerCase().includes(normalizedKeyword))
      ) {
        return true;
      }
      return entry.singers.some((s) => {
        if (s.name.toLowerCase().includes(normalizedKeyword)) {
          return true;
        }
        return (s.aliases ?? []).some((a) =>
          a.toLowerCase().includes(normalizedKeyword),
        );
      });
    });
  }, [entries, normalizedKeyword]);

  /**
   * 仅展示同时满足两个条件的条目:
   * 1. 数据层 OFFLINE_MUSIC 里有
   * 2. 当前音质对应的字节缓存在 CacheStorage 里
   *
   * 不做任何主动清理: 数据与字节两层完全独立, 浏览器自然驱逐字节,
   * 数据持续保留. 若用户切回原音质, 之前缓存过的歌仍会重新出现.
   */
  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      const map = await getOfflineMusicMap();
      if (cancelled) {
        return;
      }
      const allEntries = Object.values(map).filter((e) => e.asset);
      const checks = await Promise.all(
        allEntries.map(async (entry) => ({
          entry,
          cached: await isAudioAssetCached(
            getMusicPlaybackAsset({
              asset: entry.asset,
              quality: musicPlaybackQuality,
            }),
          ),
        })),
      );
      if (cancelled) {
        return;
      }
      const visible = checks.filter((c) => c.cached).map((c) => c.entry);
      setEntries(visible.sort((a, b) => b.cachedAt - a.cachedAt));
    };
    reload();
    offlineMusicEvents.addEventListener('change', reload);
    audioAssetCacheEvents.addEventListener('change', reload);
    return () => {
      cancelled = true;
      offlineMusicEvents.removeEventListener('change', reload);
      audioAssetCacheEvents.removeEventListener('change', reload);
    };
  }, [musicPlaybackQuality]);

  const handleRemove = (entry: OfflineMusic) => {
    dialog.confirm({
      content: t('remove_from_offline_cache_question', entry.name),
      confirmText: t('remove_from_offline_cache'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        // 用户行级删除: 元数据 + 各音质字节一并清掉. 与系统层"被动不清理"原则不冲突,
        // 这是用户显式意图.
        await Promise.all([
          removeOfflineMusic(entry.id),
          ...Object.values(MusicPlaybackQuality).map((quality) =>
            removeCachedMusic(
              getMusicPlaybackAsset({ asset: entry.asset, quality }),
            ),
          ),
        ]);
      },
    });
  };

  const handleAddAll = () => {
    if (!filteredEntries.length) {
      return;
    }
    addMusicListToPlaylist(filteredEntries.map(entryToMusic));
  };

  return (
    <Style>
      <div className="scrollable">
        <ListWrap>
          {filteredEntries.length === 0 ? (
            <EmptyWrap>
              <Empty description={t('offline_cache_empty')} />
            </EmptyWrap>
          ) : (
            filteredEntries.map((entry) => {
              const music = entryToMusic(entry);
              return (
                <MusicBase
                  key={entry.id}
                  index={idToIndex.get(entry.id) ?? 0}
                  music={{
                    id: entry.id,
                    name: entry.name,
                    singers: entry.singers,
                    aliases: entry.aliases,
                  }}
                  lineAfter={
                    <LineAfter>
                      <Button
                        className="primary-action"
                        square
                        variant="plain"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          playerEventemitter.emit(
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
                          onClick={(event) => {
                            event.stopPropagation();
                            playerEventemitter.emit(
                              PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
                              { music },
                            );
                          }}
                        >
                          <MdReadMore />
                        </Button>
                      </Tooltip>
                      <Tooltip content={t('remove_from_offline_cache')}>
                        <Button
                          square
                          variant="plain"
                          size="sm"
                          aria-label={t('remove_from_offline_cache')}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemove(entry);
                          }}
                        >
                          <MdDelete />
                        </Button>
                      </Tooltip>
                    </LineAfter>
                  }
                />
              );
            })
          )}
        </ListWrap>
        <Tail />
      </div>
      <SummaryBar>
        <Tooltip content={t('add_all_to_playlist')}>
          <Button
            square
            variant="primary"
            size="sm"
            aria-label={t('add_all_to_playlist')}
            disabled={filteredEntries.length === 0}
            onClick={handleAddAll}
          >
            <MdPlaylistAdd />
          </Button>
        </Tooltip>
        <Input
          style={searchInputStyle}
          size="sm"
          autoFocus={!IS_TOUCHABLE}
          placeholder={capitalizeString(t('search'))}
          value={inputValue}
          onChange={(event) => {
            const next = event.target.value;
            setInputValue(next);
            if (!composingRef.current) {
              setKeyword(next);
            }
          }}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(event) => {
            composingRef.current = false;
            setKeyword(event.currentTarget.value);
          }}
        />
        <Tooltip content={t('offline_cache_help_title')}>
          <Button
            square
            variant="ghost"
            size="sm"
            aria-label={t('offline_cache_help_title')}
            onClick={() =>
              dialog.alert({
                title: t('offline_cache_help_title'),
                content: (
                  <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                    {t('offline_cache_help')}
                  </div>
                ),
                confirmText: t('got_it'),
              })
            }
          >
            <MdHelpOutline />
          </Button>
        </Tooltip>
      </SummaryBar>
    </Style>
  );
}

export default OfflineCache;
