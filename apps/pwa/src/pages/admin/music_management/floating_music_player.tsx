import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';
import { MultipleLrc, MultipleLrcLine } from 'react-lrc';
import {
  MdClose,
  MdDragIndicator,
  MdExpandLess,
  MdExpandMore,
  MdMusicNote,
  MdPause,
  MdPlayArrow,
} from 'react-icons/md';
import { Slider } from '@/components';
import Button from '@/components/button';
import { useSetting } from '@/global_states/setting';
import { MusicType } from '@/constants/music';
import { UtilZIndex } from '@/constants/style';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import getResizedImage from '@/server/asset/get_resized_image';
import getLyricList from '@/server/api/get_lyric_list';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import type adminGetMusicList from '@/server/api/admin_get_music_list';

type MusicItem = Awaited<ReturnType<typeof adminGetMusicList>>['musicList'][number];

type Point = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type LyricState =
  | { status: 'loading' }
  | { status: 'success'; lrcs: string[] }
  | { status: 'empty' }
  | { status: 'instrumental' }
  | { status: 'error'; error: Error };

const DEFAULT_POSITION_GAP = 18;
const EXPANDED_WIDTH = 420;
const EXPANDED_HEIGHT = 484;
const COLLAPSED_WIDTH = 420;
const CONTROL_RAIL_BUTTON_SIZE = 30;
const CONTROL_RAIL_GAP = 6;
const CONTROLLER_HEIGHT = CONTROL_RAIL_BUTTON_SIZE * 3 + CONTROL_RAIL_GAP * 2;
const BORDER_WIDTH = 2;
const PLAYER_CONTENT_PADDING = 12;
const CONTROLLER_SHADOW_OFFSET = 6;
const COLLAPSED_HEIGHT =
  CONTROLLER_HEIGHT +
  PLAYER_CONTENT_PADDING * 2 +
  CONTROLLER_SHADOW_OFFSET +
  BORDER_WIDTH * 2;
const CONTROL_COVER_SIZE = 66;
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";

const getInitialPosition = (): Point => {
  if (typeof window === 'undefined') {
    return {
      x: DEFAULT_POSITION_GAP,
      y: DEFAULT_POSITION_GAP,
    };
  }

  return {
    x: Math.max(
      DEFAULT_POSITION_GAP,
      window.innerWidth - EXPANDED_WIDTH - DEFAULT_POSITION_GAP,
    ),
    y: Math.max(
      DEFAULT_POSITION_GAP,
      window.innerHeight - EXPANDED_HEIGHT - DEFAULT_POSITION_GAP,
    ),
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const clampPosition = (
  position: Point,
  size: { width: number; height: number },
): Point => {
  if (typeof window === 'undefined') return position;

  return {
    x: clamp(
      position.x,
      DEFAULT_POSITION_GAP,
      Math.max(DEFAULT_POSITION_GAP, window.innerWidth - size.width - DEFAULT_POSITION_GAP),
    ),
    y: clamp(
      position.y,
      DEFAULT_POSITION_GAP,
      Math.max(DEFAULT_POSITION_GAP, window.innerHeight - size.height - DEFAULT_POSITION_GAP),
    ),
  };
};

const getError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

const formatSecond = (second: number) => {
  if (!Number.isFinite(second) || second <= 0) return '00:00';

  const totalSeconds = Math.floor(second);
  const minute = Math.floor(totalSeconds / 60);
  const restSecond = totalSeconds % 60;
  return `${minute > 9 ? minute : `0${minute}`}:${
    restSecond > 9 ? restSecond : `0${restSecond}`
  }`;
};

const Player = styled.div<{
  $collapsed: boolean;
  $dragging: boolean;
}>`
  position: fixed;
  z-index: ${UtilZIndex.PAGINATION - 3};
  width: ${({ $collapsed }) =>
    $collapsed
      ? `min(${COLLAPSED_WIDTH}px, calc(100vw - ${DEFAULT_POSITION_GAP * 2}px))`
      : `min(${EXPANDED_WIDTH}px, calc(100vw - ${DEFAULT_POSITION_GAP * 2}px))`};
  height: ${({ $collapsed }) =>
    $collapsed
      ? `${COLLAPSED_HEIGHT}px`
      : `min(${EXPANDED_HEIGHT}px, calc(100vh - ${DEFAULT_POSITION_GAP * 2}px))`};
  min-height: ${COLLAPSED_HEIGHT}px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: ${BORDER_WIDTH}px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 6px 0 ${ROW_SHADOW};
  font-family: ${FONT};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  transition:
    width 160ms ease,
    height 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;

  ${({ $dragging }) =>
    $dragging &&
    css`
      transition: none;
      box-shadow: 0 8px 0 ${ROW_SHADOW};
    `}
`;

const DragHandle = styled.button`
  width: ${CONTROL_RAIL_BUTTON_SIZE}px;
  height: ${CONTROL_RAIL_BUTTON_SIZE}px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 9px;
  padding: 0;
  background: #fff;
  box-shadow: 0 2px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    cursor: grabbing;
    transform: translateY(2px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
    border-radius: 8px;
  }

  > svg {
    font-size: 22px;
  }
`;

const IconButton = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  width: ${CONTROL_RAIL_BUTTON_SIZE}px;
  height: ${CONTROL_RAIL_BUTTON_SIZE}px;
  border: 2px solid
    ${({ $danger, $primary }) =>
      $danger
        ? CSSVariable.COLOR_DANGEROUS
        : $primary
          ? CSSVariable.COLOR_PRIMARY
          : CSSVariable.COLOR_BORDER};
  border-radius: 9px;
  padding: 0;
  background: #fff;
  box-shadow: 0 2px 0
    ${({ $danger, $primary }) =>
      $danger
        ? 'rgb(190 46 34)'
        : $primary
          ? CSSVariable.COLOR_PRIMARY_ACTIVE
          : ROW_SHADOW};
  color: ${({ $danger, $primary }) =>
    $danger
      ? CSSVariable.COLOR_DANGEROUS
      : $primary
        ? CSSVariable.COLOR_PRIMARY
        : CSSVariable.TEXT_COLOR_SECONDARY};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(2px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:focus-visible {
    outline: 2px solid
      ${({ $danger }) =>
        $danger ? CSSVariable.COLOR_DANGEROUS : CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
  }

  > svg {
    font-size: 18px;
  }
`;

const PlayerContent = styled.div<{ $collapsed: boolean }>`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: ${({ $collapsed }) =>
    $collapsed ? 'max-content' : 'max-content minmax(0, 1fr)'};
  gap: 12px;
  padding: ${PLAYER_CONTENT_PADDING}px;
  background: rgb(247 247 247);
`;

const ControllerRow = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${CONTROL_RAIL_BUTTON_SIZE}px;
  gap: 10px;
  align-items: center;
`;

const ControlRail = styled.div`
  min-height: ${CONTROLLER_HEIGHT}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${CONTROL_RAIL_GAP}px;
`;

const ControllerSurface = styled.div<{ $playing: boolean }>`
  height: ${CONTROLLER_HEIGHT}px;
  display: flex;
  flex-direction: column;
  padding: 6px 10px 8px;
  border: ${BORDER_WIDTH}px solid
    ${({ $playing }) =>
      $playing ? CSSVariable.COLOR_PRIMARY : CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 ${CONTROLLER_SHADOW_OFFSET}px 0
    ${({ $playing }) =>
      $playing ? CSSVariable.COLOR_PRIMARY_ACTIVE : ROW_SHADOW};
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
`;

const ControllerContent = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 2px;
`;

const ControllerMain = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
`;

const ControllerRest = styled.div`
  flex: 0 0 auto;
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CoverBox = styled.div<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex-shrink: 0;
  overflow: hidden;
  border: 2px solid ${CSSVariable.COLOR_PRIMARY_ACTIVE};
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 0 ${CSSVariable.COLOR_PRIMARY_ACTIVE};
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  display: flex;
  align-items: center;
  justify-content: center;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  > svg {
    font-size: ${({ $size }) => Math.max(20, Math.floor($size * 0.36))}px;
  }
`;

const ControllerInfo = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-family: ${FONT};
`;

const InfoTop = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .name {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
  }

  > .alias {
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
  }
`;

const SingerText = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 700;
`;

const TimeBadge = styled.div`
  flex-shrink: 0;
  padding: 4px 7px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 10px;
  background: rgb(248 248 248);
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  font-family: 'Nunito', monospace;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  line-height: 1.1;
  font-weight: 800;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  user-select: none;

  > .duration {
    margin-top: 2px;
    padding-top: 2px;
    border-top: 2px solid ${CSSVariable.COLOR_BORDER};
  }
`;

const OperationGroup = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const StyledSlider = styled(Slider)`
  z-index: 1;
  flex: 0 0 auto;
`;

const LyricBox = styled.div`
  position: relative;
  min-height: 0;
  overflow: hidden;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
`;

const LyricStatusBox = styled.div`
  height: 100%;
  min-height: 156px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 13px;
  line-height: 1.45;
  font-weight: 800;
  text-align: center;
`;

const RetryButton = styled.button`
  margin-top: 8px;
  border: none;
  padding: 0;
  background: transparent;
  color: ${CSSVariable.COLOR_PRIMARY};
  cursor: pointer;
  font: inherit;
  font-weight: 900;
`;

const StyledMultipleLrc = styled(MultipleLrc)`
  position: absolute;
  inset: 0;
  overflow: auto;
  ${autoScrollbar}

  --lyric-fade-size: 24px;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--lyric-fade-size),
    #000 calc(100% - var(--lyric-fade-size)),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--lyric-fade-size),
    #000 calc(100% - var(--lyric-fade-size)),
    transparent 100%
  );
`;

const LyricLine = styled.div<{ $active: boolean }>`
  margin: 13px 12px;
  display: flex;
  justify-content: center;

  > .content {
    color: ${({ $active }) =>
      $active ? CSSVariable.COLOR_PRIMARY_ACTIVE : CSSVariable.TEXT_COLOR_PRIMARY};
    font-size: ${({ $active }) => ($active ? '15px' : '13px')};
    line-height: 1.5;
    font-weight: 900;
    text-align: center;

    &:empty {
      visibility: hidden;
    }
  }
`;

const HiddenAudio = styled.audio`
  position: fixed;
  left: -9999px;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;

const renderLyricLine = ({
  active,
  line,
}: {
  index: number;
  active: boolean;
  line: MultipleLrcLine;
}) => (
  <LyricLine $active={active}>
    <div className="content">
      {line.children.map((child) =>
        child.content ? <div key={child.id}>{child.content}</div> : null,
      )}
    </div>
  </LyricLine>
);

function Cover({ music, size }: { music: MusicItem; size: number }) {
  if (!music.cover) {
    return (
      <CoverBox $size={size}>
        <MdMusicNote />
      </CoverBox>
    );
  }

  return (
    <CoverBox $size={size}>
      <img
        src={getResizedImage({ url: music.cover, size: size * 2 })}
        alt={music.name}
        decoding="async"
      />
    </CoverBox>
  );
}

function LyricContent({
  lyricState,
  currentMillisecond,
  retry,
}: {
  lyricState: LyricState;
  currentMillisecond: number;
  retry: () => void;
}) {
  switch (lyricState.status) {
    case 'success': {
      return (
        <StyledMultipleLrc
          currentMillisecond={currentMillisecond}
          lrcs={lyricState.lrcs}
          lineRenderer={renderLyricLine}
          verticalSpace
        />
      );
    }
    case 'empty':
      return <LyricStatusBox>{t('no_lyric')}</LyricStatusBox>;
    case 'instrumental':
      return <LyricStatusBox>{t('instrument_without_lyric')}</LyricStatusBox>;
    case 'error':
      return (
        <LyricStatusBox>
          <div>
            <div>{lyricState.error.message}</div>
            <RetryButton type="button" onClick={retry}>
              {t('retry')}
            </RetryButton>
          </div>
        </LyricStatusBox>
      );
    default:
      return <LyricStatusBox>{t('loading')}</LyricStatusBox>;
  }
}

function FloatingMusicPlayer({
  music,
  playToken,
  onClose,
}: {
  music: MusicItem | null;
  playToken: number;
  onClose: () => void;
}) {
  const { musicPlaybackQuality, playerVolume } = useSetting();
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState(getInitialPosition);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(true);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentMillisecond, setCurrentMillisecond] = useState(0);
  const [lyricState, setLyricState] = useState<LyricState>({
    status: 'loading',
  });
  const playerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const previousMusicIdRef = useRef<string | null>(null);

  const source = useMemo(
    () =>
      music
        ? getMusicPlaybackAsset({
            asset: music.asset,
            quality: musicPlaybackQuality,
          })
        : '',
    [music, musicPlaybackQuality],
  );
  const singerText = music?.singers.map((singer) => singer.name).join(', ') || '';
  const canSeek = duration > 0 && Number.isFinite(duration);
  const currentSecond = currentMillisecond / 1000;

  useEffect(() => {
    const musicId = music?.id ?? null;
    if (musicId && previousMusicIdRef.current !== musicId) {
      setCollapsed(false);
    }
    previousMusicIdRef.current = musicId;
  }, [music?.id]);

  const clampToPlayerSize = useCallback((nextPosition: Point) => {
    const rect = playerRef.current?.getBoundingClientRect();
    return clampPosition(nextPosition, {
      width: rect?.width || (collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH),
      height: rect?.height || (collapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT),
    });
  }, [collapsed]);

  useEffect(() => {
    setPosition((p) => clampToPlayerSize(p));
  }, [clampToPlayerSize, collapsed]);

  useEffect(() => {
    const onResize = () => setPosition((p) => clampToPlayerSize(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToPlayerSize]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = playerVolume;
  }, [playerVolume, music]);

  useEffect(() => {
    if (!music) return;

    setCurrentMillisecond(0);
    setDuration(music.assetDurationMs / 1000 || 0);
    setPaused(false);
    setLoading(true);

    window.setTimeout(() => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.currentTime = 0;
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch((error: DOMException) => {
          if (error.name === 'AbortError') return;
          setPaused(true);
          setLoading(false);
          notice.error(t('failed_to_play'));
        });
      }
    }, 0);
  }, [music?.id, playToken, source]);

  const loadLyrics = useCallback(() => {
    if (!music) return () => undefined;

    if (music.type === MusicType.INSTRUMENTAL) {
      setLyricState({ status: 'instrumental' });
      return () => undefined;
    }

    let canceled = false;
    setLyricState({ status: 'loading' });
    getLyricList({ musicId: music.id, requestMinimalDuration: 0 })
      .then((lyricList) => {
        if (canceled) return;
        setLyricState(
          lyricList.length
            ? { status: 'success', lrcs: lyricList.map((lyric) => lyric.lrc) }
            : { status: 'empty' },
        );
      })
      .catch((error) => {
        if (canceled) return;
        logger.error(error, '加载管理页播放器歌词失败');
        setLyricState({ status: 'error', error: getError(error) });
      });

    return () => {
      canceled = true;
    };
  }, [music]);

  useEffect(() => loadLyrics(), [loadLyrics]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch((error: DOMException) => {
          if (error.name === 'AbortError') return;
          setPaused(true);
          setLoading(false);
          notice.error(t('failed_to_play'));
        });
      }
    } else {
      audio.pause();
    }
  }, []);

  const onSeek = (percent: number) => {
    const audio = audioRef.current;
    if (!audio || !canSeek) return;

    const nextSecond = duration * clamp(percent, 0, 1);
    audio.currentTime = nextSecond;
    setCurrentMillisecond(nextSecond * 1000);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    setPosition(
      clampToPlayerSize({
        x: dragState.originX + event.clientX - dragState.startX,
        y: dragState.originY + event.clientY - dragState.startY,
      }),
    );
  };

  const finishDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!music) return null;

  const progressValue = canSeek ? Math.min(currentSecond / duration, 1) : 0;
  const controller = (
    <ControllerSurface $playing={!paused}>
      <ControllerContent>
        <Cover music={music} size={CONTROL_COVER_SIZE} />
        <ControllerMain>
          <StyledSlider
            edge="rounded"
            value={progressValue}
            onChange={onSeek}
            disabled={!canSeek}
            alwaysShowThumb
            aria-label={t('music_playback_progress')}
          />
          <ControllerRest>
            <ControllerInfo>
              <InfoTop title={music.name}>
                <span className="name">{music.name}</span>
                {music.aliases[0] ? (
                  <span className="alias">&nbsp;{music.aliases[0]}</span>
                ) : null}
              </InfoTop>
              <SingerText title={singerText}>
                {singerText || t('unknown_singer')}
              </SingerText>
            </ControllerInfo>
            <TimeBadge>
              <div>{formatSecond(currentSecond)}</div>
              <div className="duration">{formatSecond(duration)}</div>
            </TimeBadge>
            <OperationGroup>
              <Button
                square
                variant="primary"
                size="sm"
                loading={loading}
                title={paused ? t('play') : t('pause')}
                aria-label={paused ? t('play') : t('pause')}
                onClick={togglePlay}
              >
                {paused ? <MdPlayArrow /> : <MdPause />}
              </Button>
            </OperationGroup>
          </ControllerRest>
        </ControllerMain>
      </ControllerContent>
    </ControllerSurface>
  );
  const controlRail = (
    <ControlRail>
      <IconButton
        type="button"
        title={t('close')}
        aria-label={t('close')}
        $danger
        onClick={onClose}
      >
        <MdClose />
      </IconButton>
      <DragHandle
        type="button"
        title={t('drag_player')}
        aria-label={t('drag_player')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <MdDragIndicator />
      </DragHandle>
      <IconButton
        type="button"
        title={collapsed ? t('expand') : t('collapse')}
        aria-label={collapsed ? t('expand') : t('collapse')}
        onClick={() => setCollapsed((c) => !c)}
      >
        {collapsed ? <MdExpandLess /> : <MdExpandMore />}
      </IconButton>
    </ControlRail>
  );

  return (
    <Player
      ref={playerRef}
      $collapsed={collapsed}
      $dragging={dragging}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <HiddenAudio
        ref={audioRef}
        src={source}
        crossOrigin="anonymous"
        preload="auto"
        playsInline
        onLoadStart={() => setLoading(true)}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || music.assetDurationMs / 1000 || 0);
        }}
        onDurationChange={(event) => {
          setDuration(event.currentTarget.duration || music.assetDurationMs / 1000 || 0);
        }}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => {
          setPaused(false);
          setLoading(false);
        }}
        onPlay={() => setPaused(false)}
        onPause={() => {
          setPaused(true);
          setLoading(false);
        }}
        onWaiting={() => setLoading(true)}
        onTimeUpdate={(event) => {
          setCurrentMillisecond(event.currentTarget.currentTime * 1000);
        }}
        onEnded={() => {
          setPaused(true);
          setLoading(false);
        }}
        onError={() => {
          setPaused(true);
          setLoading(false);
          notice.error(t('failed_to_play'));
        }}
      />
      <PlayerContent $collapsed={collapsed}>
        <ControllerRow>
          {controller}
          {controlRail}
        </ControllerRow>
        {collapsed ? null : (
          <LyricBox>
            <LyricContent
              lyricState={lyricState}
              currentMillisecond={currentMillisecond}
              retry={loadLyrics}
            />
          </LyricBox>
        )}
      </PlayerContent>
    </Player>
  );
}

export default FloatingMusicPlayer;
