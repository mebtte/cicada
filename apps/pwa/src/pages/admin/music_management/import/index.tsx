import { ChangeEventHandler, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  MdCheckCircle,
  MdCloudUpload,
  MdDelete,
  MdError,
  MdMusicNote,
  MdPause,
  MdPlayArrow,
  MdReplay,
} from 'react-icons/md';
import Button from '@/components/button';
import Input from '@/components/input';
import { Select, MultiSelect, type SelectOption } from '@/components';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import formatBytes from '@/utils/format_bytes';
import notice from '@/utils/notice';
import {
  MUSIC_TYPES,
  MUSIC_TYPE_MAP,
  MusicType,
  NAME_MAX_LENGTH,
} from '@/constants/music';
import { SEARCH_KEYWORD_MAX_LENGTH as SINGER_SEARCH_KEYWORD_MAX_LENGTH } from '@/constants/singer';
import searchSingerRequest from '@/server/api/search_singer';
import {
  clearFinished,
  ImportPhase,
  ImportTask,
  ImportTaskSinger,
  removeTask,
  updateTask,
  useMusicImport,
} from '@/global_states/music_import';
import {
  cancelTask,
  pauseTask,
  resumeTask,
  retryTask,
} from './upload_manager';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
`;

const Counter = styled.div`
  margin-left: auto;
  display: flex;
  gap: 10px;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Card = styled.div<{ $status: ImportPhase }>`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) max-content;
  gap: 12px;
  padding: 12px;
  border: 2px solid
    ${({ $status }) => {
      if ($status === 'success') return 'rgb(44 182 125 / 0.45)';
      if ($status === 'failed') return 'rgb(242 80 66 / 0.45)';
      return CSSVariable.COLOR_BORDER;
    }};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
`;

const Cover = styled.div`
  width: 56px;
  height: 56px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const FileName = styled.div`
  flex: 1;
  min-width: 0;
  font-family: ${FONT};
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  color: rgb(75 75 75);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Fields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1fr);
  gap: 8px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`;

const ProgressTrack = styled.div`
  height: 8px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $pct: number; $status: ImportPhase }>`
  width: ${({ $pct }) => `${$pct}%`};
  height: 100%;
  background: ${({ $status }) => {
    if ($status === 'failed') return CSSVariable.COLOR_DANGEROUS;
    return CSSVariable.COLOR_PRIMARY;
  }};
  transition: width 200ms ease-out;
`;

const StatusLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

const InstantBadge = styled.span`
  font-family: ${FONT};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2px;
  padding: 3px 8px;
  border-radius: 8px;
  background: ${CSSVariable.COLOR_PRIMARY};
  color: #fff;
  box-shadow: 0 2px 0 ${ROW_SHADOW};
`;

const ErrorText = styled.span`
  color: ${CSSVariable.COLOR_DANGEROUS};
`;

const SpinIcon = styled(MdCloudUpload)`
  font-size: 18px;
  color: ${CSSVariable.COLOR_PRIMARY};
  animation: ${spin} 1s linear infinite;
`;

const phaseLabel = (phase: ImportPhase): string => {
  switch (phase) {
    case 'editing':
      return capitalize(t('pending'));
    case 'queued':
      return capitalize(t('pending'));
    case 'hashing':
      return capitalize(t('hashing_file'));
    case 'initializing':
      return capitalize(t('initializing_upload'));
    case 'uploading':
      return capitalize(t('uploading_chunk'));
    case 'completing':
      return capitalize(t('completing_upload'));
    case 'creating':
      return capitalize(t('creating_music'));
    case 'success':
      return capitalize(t('import_success'));
    case 'failed':
      return capitalize(t('import_failed'));
    case 'paused':
      return capitalize(t('paused_state'));
    case 'canceled':
      return capitalize(t('cancel_upload'));
    default:
      return phase;
  }
};

const isRunningPhase = (p: ImportPhase) =>
  p === 'queued' ||
  p === 'hashing' ||
  p === 'initializing' ||
  p === 'uploading' ||
  p === 'completing' ||
  p === 'creating';

const isFinalPhase = (p: ImportPhase) =>
  p === 'success' || p === 'canceled';

const formatSingerToOption = (
  singer: ImportTaskSinger & { aliases?: string[] },
): SelectOption<ImportTaskSinger> => ({
  label: singer.aliases?.length
    ? `${singer.name}(${singer.aliases[0]})`
    : singer.name,
  value: { id: singer.id, name: singer.name },
});

const searchSinger = (search: string): Promise<SelectOption<ImportTaskSinger>[]> => {
  const keyword = search.trim().substring(0, SINGER_SEARCH_KEYWORD_MAX_LENGTH);
  if (!keyword) {
    return Promise.resolve([]);
  }
  return searchSingerRequest({ keyword, page: 1, pageSize: 100 }).then((data) =>
    data.singerList.map(formatSingerToOption),
  );
};

const musicTypeOptions: SelectOption<MusicType>[] = MUSIC_TYPES.map((type) => ({
  label: capitalize(MUSIC_TYPE_MAP[type].label),
  value: type,
}));

function StatusIcon({ phase }: { phase: ImportPhase }) {
  if (phase === 'success') {
    return (
      <MdCheckCircle
        style={{ fontSize: 18, color: CSSVariable.COLOR_PRIMARY }}
      />
    );
  }
  if (phase === 'failed') {
    return (
      <MdError style={{ fontSize: 18, color: CSSVariable.COLOR_DANGEROUS }} />
    );
  }
  if (isRunningPhase(phase)) {
    return <SpinIcon />;
  }
  return <MdMusicNote style={{ fontSize: 18 }} />;
}

function TaskCard({ task, instantHit }: { task: ImportTask; instantHit?: boolean }) {
  const editable = task.phase === 'editing';
  const pct = task.totalBytes
    ? Math.min(100, (task.uploadedBytes / task.totalBytes) * 100)
    : 0;

  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    updateTask(task.id, { name: event.target.value });
  };

  const onStart = () => {
    if (!task.name.trim()) {
      notice.error(t('empty_name_warning'));
      return;
    }
    if (!task.singers.length) {
      notice.error(t('singers_required_warning', task.fileName));
      return;
    }
    updateTask(task.id, { phase: 'queued', errorMessage: undefined });
  };

  return (
    <Card $status={task.phase}>
      <Cover>
        {task.parsed.pictureDataURI ? (
          <img src={task.parsed.pictureDataURI} alt={task.fileName} />
        ) : (
          <StatusIcon phase={task.phase} />
        )}
      </Cover>
      <InfoBox>
        <HeaderRow>
          <FileName title={task.fileName}>{task.fileName}</FileName>
          <span>{formatBytes(task.fileSize)}</span>
          {instantHit ? (
            <InstantBadge>{t('instant_upload_hit')}</InstantBadge>
          ) : null}
        </HeaderRow>
        <Fields>
          <Input
            value={task.name}
            onChange={onNameChange}
            maxLength={NAME_MAX_LENGTH}
            disabled={!editable}
            placeholder={t('name')}
          />
          <MultiSelect
            value={task.singers.map((s) => formatSingerToOption(s))}
            loadOptions={searchSinger}
            onChange={(value) =>
              updateTask(task.id, {
                singers: value.map((v) => ({ id: v.value.id, name: v.value.name })),
              })
            }
            disabled={!editable}
            placeholder={t('singer')}
          />
          <Select
            options={musicTypeOptions}
            value={task.type}
            onChange={(value) => updateTask(task.id, { type: value })}
            disabled={!editable}
          />
        </Fields>
        {task.phase !== 'editing' ? (
          <>
            <ProgressTrack>
              <ProgressFill $pct={pct} $status={task.phase} />
            </ProgressTrack>
            <StatusLine>
              <span>{phaseLabel(task.phase)}</span>
              <span>
                {formatBytes(task.uploadedBytes)} / {formatBytes(task.totalBytes)}
                {task.totalBytes > 0
                  ? ` (${pct.toFixed(1)}%)`
                  : ''}
              </span>
              {task.speedBps > 0 && isRunningPhase(task.phase) ? (
                <span>{t('speed_per_second', formatBytes(task.speedBps))}</span>
              ) : null}
              {task.errorMessage ? (
                <ErrorText>{task.errorMessage}</ErrorText>
              ) : null}
            </StatusLine>
          </>
        ) : null}
      </InfoBox>
      <Actions>
        {editable ? (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={onStart}
            >
              {capitalize(t('start_import'))}
            </Button>
            <Button
              size="sm"
              square
              variant="ghost"
              onClick={() => removeTask(task.id)}
              title={t('remove')}
              aria-label={t('remove')}
            >
              <MdDelete />
            </Button>
          </>
        ) : isRunningPhase(task.phase) ? (
          <>
            <Button
              size="sm"
              square
              variant="secondary"
              onClick={() => pauseTask(task.id)}
              title={t('pause')}
              aria-label={t('pause')}
            >
              <MdPause />
            </Button>
            <Button
              size="sm"
              square
              variant="ghost"
              onClick={() => cancelTask(task.id)}
              title={t('cancel_upload')}
              aria-label={t('cancel_upload')}
            >
              <MdDelete />
            </Button>
          </>
        ) : task.phase === 'paused' ? (
          <>
            <Button
              size="sm"
              square
              variant="primary"
              onClick={() => resumeTask(task.id)}
              title={t('resume_upload')}
              aria-label={t('resume_upload')}
            >
              <MdPlayArrow />
            </Button>
            <Button
              size="sm"
              square
              variant="ghost"
              onClick={() => cancelTask(task.id)}
              title={t('cancel_upload')}
              aria-label={t('cancel_upload')}
            >
              <MdDelete />
            </Button>
          </>
        ) : task.phase === 'failed' ? (
          <>
            <Button
              size="sm"
              square
              variant="primary"
              onClick={() => retryTask(task.id)}
              title={t('retry_upload')}
              aria-label={t('retry_upload')}
            >
              <MdReplay />
            </Button>
            <Button
              size="sm"
              square
              variant="ghost"
              onClick={() => removeTask(task.id)}
              title={t('remove')}
              aria-label={t('remove')}
            >
              <MdDelete />
            </Button>
          </>
        ) : isFinalPhase(task.phase) ? (
          <Button
            size="sm"
            square
            variant="ghost"
            onClick={() => removeTask(task.id)}
            title={t('remove')}
            aria-label={t('remove')}
          >
            <MdDelete />
          </Button>
        ) : null}
      </Actions>
    </Card>
  );
}

function ImportPanel() {
  const tasks = useMusicImport((s) => s.tasks);

  const onApplyToAll = useCallback(() => {
    const editableTasks = tasks.filter((t) => t.phase === 'editing');
    if (editableTasks.length < 2) return;
    const first = editableTasks[0];
    editableTasks.slice(1).forEach((task) => {
      updateTask(task.id, { type: first.type, singers: first.singers });
    });
    notice.info(t('apply_to_all'));
  }, [tasks]);

  const onStartAll = () => {
    const ready = tasks.filter((t) => t.phase === 'editing');
    let issued = 0;
    ready.forEach((task) => {
      if (!task.name.trim()) return;
      if (!task.singers.length) return;
      updateTask(task.id, { phase: 'queued', errorMessage: undefined });
      issued += 1;
    });
    if (!issued) {
      notice.error(t('singers_required_warning', t('select_music_files')));
    }
  };

  const editableCount = tasks.filter((t) => t.phase === 'editing').length;
  const successCount = tasks.filter((t) => t.phase === 'success').length;
  const failedCount = tasks.filter((t) => t.phase === 'failed').length;
  const runningCount = tasks.filter((t) => isRunningPhase(t.phase) || t.phase === 'paused').length;
  const finishedCount = tasks.filter((t) => isFinalPhase(t.phase)).length;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Container>
      <Toolbar>
        {editableCount > 0 ? (
          <Button variant="primary" size="sm" onClick={onStartAll}>
            {capitalize(t('start_import'))} ({editableCount})
          </Button>
        ) : null}
        {editableCount > 1 ? (
          <Button variant="secondary" size="sm" onClick={onApplyToAll}>
            {t('apply_to_all')}
          </Button>
        ) : null}
        {finishedCount > 0 ? (
          <Button size="sm" onClick={clearFinished}>
            {t('clean_successful_items')}
          </Button>
        ) : null}
        <Counter>
          {runningCount > 0 ? <span>{t('pending_uploads', String(runningCount))}</span> : null}
          {successCount > 0 ? <span>{t('successful_uploads', String(successCount))}</span> : null}
          {failedCount > 0 ? <span>{t('failed_uploads', String(failedCount))}</span> : null}
        </Counter>
      </Toolbar>
      <TaskList>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskList>
    </Container>
  );
}

export default ImportPanel;
