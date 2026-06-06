import { ChangeEventHandler, useState } from 'react';
import styled from 'styled-components';
import { Delete, PlayArrow } from '@/components/icon';
import Button from '@/components/button';
import Divider from '@/components/divider';
import ImageViewer, { type ImageViewerPhoto } from '@/components/image_viewer';
import Input from '@/components/input';
import { Select, MultiSelect, type SelectOption } from '@/components';
import Slider from '@/components/slider';
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
  ImportPhase,
  ImportTask,
  ImportTaskSinger,
  isActiveImportPhase,
  removeTask,
  updateTask,
  useMusicImport,
} from '@/global_states/music_import';
import CreateSingerLabel from '../../components/create_singer_label';
import {
  cancelTask,
  retryTask,
} from './upload_manager';

const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Card = styled.div<{ $status: ImportPhase }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
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

const DeleteButton = styled(Button)`
  position: absolute;
  top: -18px;
  right: -8px;
  z-index: 2;
  width: 26px;
  height: 26px;
  min-width: 0;
  border-radius: 8px;
  font-size: 14px;
`;

const StartButton = styled(Button)`
  position: absolute;
  top: -18px;
  right: 22px;
  z-index: 2;
  width: 26px;
  height: 26px;
  min-width: 0;
  border-radius: 8px;
  font-size: 14px;
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
  min-width: 0;
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

const FileMetadata = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  max-width: min(45%, 220px);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: ${FONT};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  color: rgb(145 145 145);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CoverMetadataButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${CSSVariable.COLOR_PRIMARY};
  font: inherit;
  font-weight: 900;
  letter-spacing: 0;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    filter: brightness(1.05);
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const MetadataText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Fields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(118px, 150px);
  column-gap: 8px;
  row-gap: 14px;
`;

const SingerField = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;

const ProgressBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 与 Fields 内部的 row-gap 保持一致, 让进度区与上方输入区视觉间距连续 */
  margin-top: 6px;
`;

const ProgressSlider = styled(Slider)`
  pointer-events: none;

  > span:last-child {
    display: none;
  }
`;

const ProgressSizeText = styled.div`
  align-self: flex-end;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  white-space: nowrap;
`;

const ProgressMetaRight = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  overflow: hidden;
`;

const InlineActionButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${CSSVariable.COLOR_PRIMARY};
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 120ms,
    filter 120ms,
    transform 120ms;

  &:hover {
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const ErrorText = styled.div`
  min-width: 0;
  max-width: min(240px, 100%);
  flex: 1 1 auto;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${CSSVariable.COLOR_DANGEROUS};
`;

const UploadedText = styled.span`
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0;
  color: rgb(44 182 125);
  white-space: nowrap;
`;

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

const formatDurationMs = (durationMs: number) => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minute = Math.floor(totalSeconds / 60);
  const second = totalSeconds % 60;
  return `${minute > 9 ? minute : `0${minute}`}:${
    second > 9 ? second : `0${second}`
  }`;
};

const formatBitRate = (bitRate: number) => `${Math.round(bitRate / 1000)}kbps`;

const formatCodec = (codec?: string) => {
  const value = codec?.split('/').pop()?.trim();
  // Existing parsed tasks may still hold the parser's formal MP3 codec name.
  if (/^(mp3|mpeg[\s-]*(1|2|2\.5)?\s*(audio\s*)?layer\s*(3|iii))$/i.test(value || '')) {
    return 'MP3';
  }
  return value ? value.toUpperCase() : '';
};

const formatTaskMetadata = (task: ImportTask) =>
  [
    task.parsed.durationMs ? formatDurationMs(task.parsed.durationMs) : '',
    formatCodec(task.parsed.codec),
    task.parsed.bitRate ? formatBitRate(task.parsed.bitRate) : '',
  ]
    .filter(Boolean)
    .join(' · ');

function TaskCard({ task }: { task: ImportTask }) {
  const [viewerPhoto, setViewerPhoto] = useState<ImageViewerPhoto | null>(null);
  const editable = task.phase === 'editing';
  const pct = task.totalBytes
    ? Math.min(100, (task.uploadedBytes / task.totalBytes) * 100)
    : 0;
  const metadataText = formatTaskMetadata(task);
  const hasCover = !!task.parsed.pictureDataURI;

  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    updateTask(task.id, { name: event.target.value });
  };

  const onStart = () => {
    if (!task.name.trim()) {
      notice.error(t('empty_name_warning'));
      return;
    }
    updateTask(task.id, { phase: 'queued', errorMessage: undefined });
  };
  const deleteActiveTask =
    isActiveImportPhase(task.phase) || task.phase === 'paused';
  const onDelete = () =>
    deleteActiveTask ? cancelTask(task.id) : removeTask(task.id);
  const deleteTitle = deleteActiveTask ? t('cancel_upload') : t('remove');

  const onOpenCover = () => {
    if (!task.parsed.pictureDataURI) return;
    setViewerPhoto({
      src: task.parsed.pictureDataURI,
      alt: task.fileName,
    });
  };

  // Append the newly-created singer to the current task without disturbing
  // other in-flight drafts; existing tasks discover new singers through async
  // search.
  const onSingerCreated = (singer: { id: string; name: string }) => {
    if (task.singers.some((s) => s.id === singer.id)) return;
    updateTask(task.id, {
      singers: [...task.singers, { id: singer.id, name: singer.name }],
    });
  };

  return (
    <>
      <Card $status={task.phase}>
        {editable ? (
          <StartButton
            size="sm"
            square
            variant="primary"
            onClick={onStart}
            title={capitalize(t('start_import'))}
            aria-label={capitalize(t('start_import'))}
          >
            <PlayArrow />
          </StartButton>
        ) : null}
        <DeleteButton
          size="sm"
          square
          variant="danger"
          onClick={onDelete}
          title={deleteTitle}
          aria-label={deleteTitle}
        >
          <Delete />
        </DeleteButton>
        <InfoBox>
          <HeaderRow>
            <FileName title={task.fileName}>{task.fileName}</FileName>
            {hasCover || metadataText ? (
              <FileMetadata
                title={[hasCover ? t('cover') : '', metadataText]
                  .filter(Boolean)
                  .join(' · ')}
              >
                {hasCover ? (
                  <CoverMetadataButton type="button" onClick={onOpenCover}>
                    {t('cover')}
                  </CoverMetadataButton>
                ) : null}
                {hasCover && metadataText ? <span>·</span> : null}
                {metadataText ? <MetadataText>{metadataText}</MetadataText> : null}
              </FileMetadata>
            ) : null}
          </HeaderRow>
          <Divider />
          <Fields>
            <Input
              size="sm"
              label={t('song_name')}
              value={task.name}
              onChange={onNameChange}
              maxLength={NAME_MAX_LENGTH}
              disabled={!editable}
            />
            <Select
              size="sm"
              label={t('music_type_short')}
              options={musicTypeOptions}
              value={task.type}
              onChange={(value) => updateTask(task.id, { type: value })}
              disabled={!editable}
            />
            <SingerField>
              <MultiSelect
                size="sm"
                label={t('singer')}
                labelAddon={
                  editable ? (
                    <CreateSingerLabel
                      notifyOnCreated={false}
                      onCreated={onSingerCreated}
                    />
                  ) : undefined
                }
                wrapValues
                value={task.singers.map((s) => formatSingerToOption(s))}
                loadOptions={searchSinger}
                onChange={(value) =>
                  updateTask(task.id, {
                    singers: value.map((v) => ({
                      id: v.value.id,
                      name: v.value.name,
                    })),
                  })
                }
                disabled={!editable}
                placeholder=""
              />
            </SingerField>
          </Fields>
          <ProgressBlock>
            <ProgressSizeText>
              {formatBytes(task.uploadedBytes)} / {formatBytes(task.totalBytes)}
            </ProgressSizeText>
            <ProgressSlider value={pct} max={100} />
          </ProgressBlock>
          {task.errorMessage ||
          task.phase === 'failed' ||
          task.phase === 'success' ? (
            <ProgressMetaRight>
              {task.errorMessage ? (
                <ErrorText title={task.errorMessage}>
                  {task.errorMessage}
                </ErrorText>
              ) : null}
              {task.phase === 'failed' ? (
                <InlineActionButton
                  type="button"
                  onClick={() => retryTask(task.id)}
                >
                  {t('retry_upload')}
                </InlineActionButton>
              ) : task.phase === 'success' ? (
                <UploadedText>{t('upload_status_uploaded')}</UploadedText>
              ) : null}
            </ProgressMetaRight>
          ) : null}
        </InfoBox>
      </Card>
      <ImageViewer photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />
    </>
  );
}

function ImportPanel() {
  const tasks = useMusicImport((s) => s.tasks);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Container>
      <TaskList>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </TaskList>
    </Container>
  );
}

export default ImportPanel;
