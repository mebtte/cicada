import {
  ChangeEventHandler,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  MdAdd,
  MdClose,
  MdCropSquare,
  MdRemove,
} from 'react-icons/md';
import styled, { css } from 'styled-components';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import autoScrollbar from '@/style/auto_scrollbar';
import capitalize from '@/utils/capitalize';
import formatBytes from '@/utils/format_bytes';
import { MUSIC_ASSET_ACCEPT_TYPES } from '@/constants/asset';
import {
  hasActiveTasks,
  ImportPhase,
  setWindowMinimized,
  setWindowOpen,
  setWindowPosition,
  useMusicImport,
} from '@/global_states/music_import';
import ImportPanel from '.';
import useSelectFiles from './use_select_files';

const SURFACE_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const VIEWPORT_GAP = 18;
const DEFAULT_HEADER_OFFSET = 84;

const Window = styled.div<{ $dragging: boolean }>`
  position: fixed;
  z-index: 50;
  width: min(540px, calc(100vw - ${VIEWPORT_GAP * 2}px));
  max-height: min(680px, calc(100vh - 200px));
  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 18px;
  box-shadow:
    0 4px 0 ${SURFACE_SHADOW},
    0 12px 28px rgb(0 0 0 / 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 160ms ease;

  ${({ $dragging }) =>
    $dragging &&
    css`
      transition: none;
      box-shadow:
        0 6px 0 ${SURFACE_SHADOW},
        0 18px 40px rgb(0 0 0 / 0.12);
    `}
`;

const Header = styled.div`
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  background: #fff;
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    cursor: grabbing;
  }
`;

const HeaderTitle = styled.div`
  flex: 1;
  min-width: 0;
  font-family: ${FONT};
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const HeaderCount = styled.span`
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const ActiveDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${CSSVariable.COLOR_PRIMARY};
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px ${CSSVariable.COLOR_PRIMARY};
  flex-shrink: 0;
`;

const FileInputHidden = styled.input`
  display: none;
`;

const SummaryBar = styled.div`
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
`;

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const ProgressTrack = styled.div`
  height: 8px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number; $allDone: boolean }>`
  width: ${({ $pct }) => `${$pct}%`};
  height: 100%;
  background: ${CSSVariable.COLOR_PRIMARY};
  opacity: ${({ $allDone }) => ($allDone ? 0.85 : 1)};
  transition: width 200ms ease-out;
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  background: rgb(247 247 247);
  ${autoScrollbar}
`;

const isFinishedPhase = (p: ImportPhase) =>
  p === 'success' || p === 'failed' || p === 'canceled';

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const clampPoint = (
  point: { x: number; y: number },
  size: { width: number; height: number },
) => {
  const maxX = Math.max(VIEWPORT_GAP, window.innerWidth - size.width - VIEWPORT_GAP);
  const maxY = Math.max(VIEWPORT_GAP, window.innerHeight - size.height - VIEWPORT_GAP);
  return {
    x: clamp(point.x, VIEWPORT_GAP, maxX),
    y: clamp(point.y, VIEWPORT_GAP, maxY),
  };
};

function FloatingUploadWindow() {
  const tasks = useMusicImport((s) => s.tasks);
  const taskCount = tasks.length;
  const active = useMusicImport(hasActiveTasks);
  const open = useMusicImport((s) => s.windowOpen);
  const minimized = useMusicImport((s) => s.windowMinimized);
  const position = useMusicImport((s) => s.windowPosition);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const selectFiles = useSelectFiles();
  const [dragging, setDragging] = useState(false);

  const onSelectClick = () => fileInputRef.current?.click();
  const onFilesChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    await selectFiles(files);
  };

  const queuedTasks = tasks.filter((task) => task.phase !== 'editing');
  const totalBytes = queuedTasks.reduce((sum, task) => sum + task.totalBytes, 0);
  const uploadedBytes = queuedTasks.reduce(
    (sum, task) =>
      sum + (task.phase === 'success' ? task.totalBytes : task.uploadedBytes),
    0,
  );
  const finishedCount = queuedTasks.filter((task) => isFinishedPhase(task.phase)).length;
  const overallPct = totalBytes > 0
    ? Math.min(100, (uploadedBytes / totalBytes) * 100)
    : 0;
  const allDone = queuedTasks.length > 0 && finishedCount === queuedTasks.length;
  const showSummary = minimized && queuedTasks.length > 0;

  // Default position: bottom-right of the viewport, leaving room for the
  // admin header. Computed on first render after the window has measured
  // itself, then frozen until the user drags.
  useLayoutEffect(() => {
    if (!open) return;
    if (position !== null) return;
    const node = windowRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const next = clampPoint(
      {
        x: window.innerWidth - rect.width - VIEWPORT_GAP,
        y: window.innerHeight - rect.height - VIEWPORT_GAP,
      },
      { width: rect.width, height: rect.height },
    );
    setWindowPosition(next);
  }, [open, position, minimized]);

  // Reposition when the viewport shrinks so the window cannot drift offscreen.
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const node = windowRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const current = useMusicImport.getState().windowPosition;
      if (!current) return;
      const next = clampPoint(current, { width: rect.width, height: rect.height });
      if (next.x !== current.x || next.y !== current.y) {
        setWindowPosition(next);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      // Only start dragging when the user grabs the header chrome itself —
      // clicks on header buttons should still behave as buttons.
      const target = event.target as HTMLElement;
      if (target.closest('button')) return;

      const node = windowRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: rect.left,
        originY: rect.top,
      };
      setDragging(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const node = windowRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const next = clampPoint(
        {
          x: drag.originX + event.clientX - drag.startX,
          y: drag.originY + event.clientY - drag.startY,
        },
        { width: rect.width, height: rect.height },
      );
      setWindowPosition(next);
    },
    [],
  );

  const onPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragStateRef.current = null;
      setDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  if (!open) return null;

  const style = position
    ? { left: position.x, top: position.y }
    : {
        // Pre-position before the layout effect runs so there is no flash at
        // the top-left of the viewport.
        right: VIEWPORT_GAP,
        bottom: VIEWPORT_GAP,
        top: 'auto' as const,
        left: 'auto' as const,
      };

  return (
    <Window
      ref={windowRef}
      role="dialog"
      aria-label={t('batch_import_music')}
      style={style}
      $dragging={dragging}
    >
      <FileInputHidden
        ref={fileInputRef}
        type="file"
        multiple
        accept={MUSIC_ASSET_ACCEPT_TYPES.join(',')}
        onChange={onFilesChange}
      />
      <Header
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <HeaderTitle>
          {capitalize(t('batch_import_music'))}
          {taskCount > 0 ? <HeaderCount>({taskCount})</HeaderCount> : null}
        </HeaderTitle>
        {active ? <ActiveDot title={capitalize(t('uploading_chunk'))} /> : null}
        <Button
          square
          size="sm"
          variant="primary"
          onClick={onSelectClick}
          title={capitalize(t('select_music_files'))}
          aria-label={capitalize(t('select_music_files'))}
        >
          <MdAdd />
        </Button>
        <Button
          square
          size="sm"
          variant="ghost"
          onClick={() => setWindowMinimized(!minimized)}
          title={minimized ? t('expand') : t('collapse')}
          aria-label={minimized ? t('expand') : t('collapse')}
        >
          {minimized ? <MdCropSquare /> : <MdRemove />}
        </Button>
        <Button
          square
          size="sm"
          variant="ghost"
          onClick={() => setWindowOpen(false)}
          title={t('close')}
          aria-label={t('close')}
        >
          <MdClose />
        </Button>
      </Header>
      {showSummary ? (
        <SummaryBar>
          <ProgressTrack>
            <ProgressFill $pct={overallPct} $allDone={allDone} />
          </ProgressTrack>
          <SummaryRow>
            <span>
              {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
              {totalBytes > 0 ? ` (${overallPct.toFixed(1)}%)` : ''}
            </span>
            <span>{`${finishedCount}/${queuedTasks.length}`}</span>
          </SummaryRow>
        </SummaryBar>
      ) : null}
      {!minimized && taskCount > 0 ? (
        <Body>
          <ImportPanel />
        </Body>
      ) : null}
    </Window>
  );
}

void DEFAULT_HEADER_OFFSET;

export default FloatingUploadWindow;
