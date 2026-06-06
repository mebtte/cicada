import { ChangeEventHandler, useCallback, useRef } from 'react';
import {
  MdDeleteSweep,
  MdMusicNote,
  MdPlayArrow,
} from 'react-icons/md';
import { Add } from '@/components/icon';
import styled from 'styled-components';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components';
import Button from '@/components/button';
import Slider from '@/components/slider';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import autoScrollbar from '@/style/auto_scrollbar';
import capitalize from '@/utils/capitalize';
import formatBytes from '@/utils/format_bytes';
import notice from '@/utils/notice';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import { MUSIC_ASSET_ACCEPT_TYPES } from '@/constants/asset';
import {
  clearFinished,
  getMusicImportSummary,
  isActiveImportPhase,
  setWindowOpen,
  updateTask,
  useMusicImport,
} from '@/global_states/music_import';
import ImportPanel from '.';
import useSelectFiles from './use_select_files';

const DRAWER_WIDTH = 420;
// Keep a tappable overlay strip on small screens because the drawer itself no
// longer renders a close button.
const DRAWER_OUTSIDE_CLOSE_GUTTER = 56;
const SURFACE_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";

const UploadDrawerContent = styled(DrawerContent)`
  > div {
    overflow: hidden;
  }
`;

const Container = styled.div`
  height: 100%;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
`;

const Header = styled(DrawerHeader)`
  padding: 16px 18px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 3px 0 ${SURFACE_SHADOW};
`;

const HeaderMain = styled.div`
  min-width: 0;
  flex: 1;
`;

const HeaderTitleRow = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
`;

const UploadDrawerTitle = styled(DrawerTitle)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const FileInputHidden = styled.input`
  display: none;
`;

const SummaryBar = styled.div`
  padding: 14px 16px 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  background: #fff;
`;

const SummaryProgress = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
`;

const SummaryProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: ${FONT};
  font-weight: 800;
  letter-spacing: 0;
`;

const SummaryPercent = styled.div`
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  font-size: 12px;
  line-height: 1.2;
`;

const SummaryBytes = styled.div`
  min-width: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
  line-height: 1.2;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SummaryTrack = styled(Slider)`
  margin-bottom: 4px;
  pointer-events: none;

  > span:last-child {
    display: none;
  }
`;

const SummaryMeta = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
`;

const SummaryCounts = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const SummaryCount = styled.span<{ $tone?: 'active' | 'success' | 'danger' }>`
  min-height: 18px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-radius: 6px;
  background: ${({ $tone }) => {
    if ($tone === 'active') return 'rgb(29 130 255 / 0.1)';
    if ($tone === 'success') return 'rgb(44 182 125 / 0.1)';
    if ($tone === 'danger') return 'rgb(242 80 66 / 0.1)';
    return 'rgb(247 247 247)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'active') return CSSVariable.COLOR_PRIMARY;
    if ($tone === 'success') return 'rgb(44 182 125)';
    if ($tone === 'danger') return CSSVariable.COLOR_DANGEROUS;
    return CSSVariable.TEXT_COLOR_SECONDARY;
  }};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Body = styled.div<{ $center: boolean; $hasBottomToolbar: boolean }>`
  flex: 1;
  min-height: 0;
  padding: 21px 16px ${({ $hasBottomToolbar }) => ($hasBottomToolbar ? 84 : 16)}px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  ${({ $center }) =>
    $center
      ? `
        align-items: center;
        justify-content: center;
      `
      : ''}
  ${autoScrollbar}
`;

const FloatingToolbarLayer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 16px 16px calc(14px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
  pointer-events: none;
`;

const FloatingToolbar = styled.div`
  max-width: calc(100% - 32px);
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 0 ${SURFACE_SHADOW};
  pointer-events: auto;
`;

const EmptyState = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};

  > svg {
    width: 42px;
    height: 42px;
  }
`;

function MusicImportSidebar() {
  const tasks = useMusicImport((s) => s.tasks);
  const open = useMusicImport((s) => s.windowOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectFiles = useSelectFiles();
  const { top: titlebarTop } = useTitlebarOverlayInsets();
  const summary = getMusicImportSummary(tasks);
  const editableCount = tasks.filter((task) => task.phase === 'editing').length;
  const pendingCount = tasks.filter(
    (task) =>
      task.phase === 'editing' ||
      task.phase === 'paused' ||
      task.phase === 'queued',
  ).length;
  const activeCount = tasks.filter(
    (task) => task.phase !== 'queued' && isActiveImportPhase(task.phase),
  ).length;
  const successCount = tasks.filter((task) => task.phase === 'success').length;
  const failedCount = tasks.filter((task) => task.phase === 'failed').length;
  const cleanableCount = tasks.filter(
    (task) => task.phase === 'success' || task.phase === 'canceled',
  ).length;
  const hasBottomToolbar = tasks.length > 0;

  // File selection stays in the global sidebar so uploads can be started from
  // any admin page without depending on the music-management route.
  const onSelectClick = () => fileInputRef.current?.click();
  const onFilesChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    await selectFiles(files);
  };

  const onOpenChange = useCallback((nextOpen: boolean) => {
    setWindowOpen(nextOpen);
  }, []);

  const onStartAll = () => {
    const ready = tasks.filter((task) => task.phase === 'editing');
    let issued = 0;
    ready.forEach((task) => {
      if (!task.name.trim()) return;
      updateTask(task.id, { phase: 'queued', errorMessage: undefined });
      issued += 1;
    });
    if (!issued) {
      notice.error(t('empty_name_warning'));
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <UploadDrawerContent
        side="right"
        style={{
          width: DRAWER_WIDTH,
          maxWidth: `calc(100vw - ${DRAWER_OUTSIDE_CLOSE_GUTTER}px)`,
          paddingTop: titlebarTop,
        }}
        accessibleTitle={capitalize(t('upload_music'))}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Container>
          <FileInputHidden
            ref={fileInputRef}
            type="file"
            multiple
            accept={MUSIC_ASSET_ACCEPT_TYPES.join(',')}
            onChange={onFilesChange}
          />
          <Header>
            <HeaderMain>
              <HeaderTitleRow>
                <UploadDrawerTitle>
                  {capitalize(t('upload_music'))}
                </UploadDrawerTitle>
              </HeaderTitleRow>
            </HeaderMain>
            <HeaderActions>
              <Button
                square
                size="sm"
                variant="primary"
                onClick={onSelectClick}
                title={capitalize(t('select_music_files'))}
                aria-label={capitalize(t('select_music_files'))}
              >
                <Add />
              </Button>
            </HeaderActions>
          </Header>
          {summary.startedCount > 0 ? (
            <SummaryBar>
              <SummaryProgress>
                <SummaryProgressHeader>
                  <SummaryPercent>{summary.pct.toFixed(0)}%</SummaryPercent>
                  <SummaryBytes>
                    {formatBytes(summary.uploadedBytes)} /{' '}
                    {formatBytes(summary.totalBytes)}
                  </SummaryBytes>
                </SummaryProgressHeader>
                <SummaryTrack value={summary.pct} max={100} />
              </SummaryProgress>
              <SummaryMeta>
                <SummaryCounts>
                  <SummaryCount>
                    {t('pending_uploads', String(pendingCount))}
                  </SummaryCount>
                  <SummaryCount $tone="active">
                    {t('active_uploads', String(activeCount))}
                  </SummaryCount>
                  <SummaryCount $tone="success">
                    {t('successful_uploads', String(successCount))}
                  </SummaryCount>
                  <SummaryCount $tone="danger">
                    {t('failed_uploads', String(failedCount))}
                  </SummaryCount>
                </SummaryCounts>
              </SummaryMeta>
            </SummaryBar>
          ) : null}
          <Body $center={tasks.length === 0} $hasBottomToolbar={hasBottomToolbar}>
            {tasks.length > 0 ? (
              <ImportPanel />
            ) : (
              <EmptyState>
                <MdMusicNote />
                <Button size="sm" variant="primary" onClick={onSelectClick}>
                  {capitalize(t('upload_music'))}
                </Button>
              </EmptyState>
            )}
          </Body>
          {hasBottomToolbar ? (
            <FloatingToolbarLayer>
              <FloatingToolbar>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={editableCount === 0}
                  onClick={onStartAll}
                >
                  <MdPlayArrow />
                  {capitalize(t('start_import'))}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cleanableCount === 0}
                  onClick={clearFinished}
                >
                  <MdDeleteSweep />
                  {t('clean_successful_items')}
                </Button>
              </FloatingToolbar>
            </FloatingToolbarLayer>
          ) : null}
        </Container>
      </UploadDrawerContent>
    </Drawer>
  );
}

export default MusicImportSidebar;
