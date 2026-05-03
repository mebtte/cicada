import { ChangeEventHandler, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Button from '@/components/button';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import {
  MdCheckCircle,
  MdError,
  MdCloudUpload,
  MdMusicNote,
} from 'react-icons/md';
import { AssetType, ASSET_TYPE_MAP } from '@/constants/asset';
import uploadAsset from '@/server/form/upload_asset';
import createMusic from '@/server/api/create_music';
import updateMusic from '@/server/api/update_music';
import { AllowUpdateKey, MusicType } from '@/constants/music';
import getMusicFileMetadata from '@/utils/get_music_file_metadata';
import logger from '@/utils/logger';
import autoScrollbar from '@/style/auto_scrollbar';
import {
  base64ToCover,
  getMusicNameFromFilename,
} from '@/utils/music_file';
import capitalize from '@/utils/capitalize';

type ImportStatus = 'pending' | 'importing' | 'success' | 'failed';

interface ImportItem {
  id: string;
  file: File;
  name: string;
  status: ImportStatus;
  error?: string;
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const UploadZone = styled.div<{ $active: boolean }>`
  border: 2px dashed
    ${({ $active }) => ($active ? CSSVariable.COLOR_PRIMARY : CSSVariable.COLOR_BORDER)};
  border-radius: 8px;
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: ${({ $active }) =>
    $active ? CSSVariable.BACKGROUND_COLOR_LEVEL_ONE : 'transparent'};

  &:hover {
    border-color: ${CSSVariable.COLOR_PRIMARY};
    background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }
`;

const UploadIcon = styled(MdCloudUpload)`
  font-size: 36px;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
`;

const UploadHint = styled.div`
  font-size: 13px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;
  line-height: 1.5;

  > .highlight {
    color: ${CSSVariable.COLOR_PRIMARY};
    font-weight: 500;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 4px;
`;

const ItemList = styled.div`
  max-height: 260px;
  overflow-y: auto;
  ${autoScrollbar}
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
`;

const ItemRow = styled.div<{ $status: ImportStatus }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: ${({ $status }) => {
    if ($status === 'success') return 'rgb(44 182 125 / 0.06)';
    if ($status === 'failed') return 'rgb(242 80 66 / 0.05)';
    return '#fafafa';
  }};
  border: 1px solid
    ${({ $status }) => {
      if ($status === 'success') return 'rgb(44 182 125 / 0.2)';
      if ($status === 'failed') return 'rgb(242 80 66 / 0.15)';
      return CSSVariable.COLOR_BORDER;
    }};
`;

const ItemIcon = styled.div`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${CSSVariable.COLOR_PRIMARY};
`;

const SpinIcon = styled(MdCloudUpload)`
  font-size: 14px;
  color: ${CSSVariable.COLOR_PRIMARY};
  animation: ${spin} 1s linear infinite;
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemError = styled.div`
  font-size: 11px;
  color: ${CSSVariable.COLOR_DANGEROUS};
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.div<{ $status: ImportStatus }>`
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 10px;
  background: ${({ $status }) => {
    if ($status === 'success') return 'rgb(44 182 125 / 0.12)';
    if ($status === 'failed') return 'rgb(242 80 66 / 0.1)';
    if ($status === 'importing') return 'rgb(44 182 125 / 0.08)';
    return '#f0f0f0';
  }};
  color: ${({ $status }) => {
    if ($status === 'success') return CSSVariable.COLOR_PRIMARY;
    if ($status === 'failed') return CSSVariable.COLOR_DANGEROUS;
    if ($status === 'importing') return CSSVariable.COLOR_PRIMARY;
    return CSSVariable.TEXT_COLOR_SECONDARY;
  }};
`;

const StatusLabelMap = (): Record<ImportStatus, string> => ({
  pending: capitalize(t('pending')),
  importing: capitalize(t('importing')),
  success: capitalize(t('import_success')),
  failed: capitalize(t('import_failed')),
});

function ItemStatusIcon({ status }: { status: ImportStatus }) {
  if (status === 'importing') return <SpinIcon />;
  if (status === 'success')
    return (
      <MdCheckCircle
        style={{ fontSize: 14, color: CSSVariable.COLOR_PRIMARY }}
      />
    );
  if (status === 'failed')
    return (
      <MdError style={{ fontSize: 14, color: CSSVariable.COLOR_DANGEROUS }} />
    );
  return <MdMusicNote style={{ fontSize: 14 }} />;
}

function ImportSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [importing, setImporting] = useState(false);

  const updateItemStatus = (id: string, status: ImportStatus, error?: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, error } : item)),
    );
  };

  const onFilesChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const newItems: ImportItem[] = await Promise.all(
      files.map(async (file) => {
        let name = '';
        try {
          const metadata = await getMusicFileMetadata(file);
          name = metadata.title || getMusicNameFromFilename(file.name);
        } catch {
          name = getMusicNameFromFilename(file.name);
        }
        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          name: name || file.name,
          status: 'pending' as ImportStatus,
        };
      }),
    );

    setItems((prev) => [...prev, ...newItems]);
    event.target.value = '';
  };

  const startImport = async () => {
    const pendingItems = items.filter((item) => item.status === 'pending');
    if (!pendingItems.length) return;

    setImporting(true);

    for (const item of pendingItems) {
      updateItemStatus(item.id, 'importing');
      try {
        const { id: assetId } = await uploadAsset(item.file, AssetType.MUSIC);
        const musicId = await createMusic({
          name: item.name,
          singerIds: [],
          type: MusicType.SONG,
          asset: assetId,
        });

        try {
          const metadata = await getMusicFileMetadata(item.file);
          const updates: Promise<unknown>[] = [];
          if (metadata.picture) {
            updates.push(
              base64ToCover(metadata.picture.dataURI).then(
                async (coverBlob) => {
                  const { id: coverAssetId } = await uploadAsset(
                    coverBlob,
                    AssetType.MUSIC_COVER,
                  );
                  return updateMusic({
                    id: musicId,
                    key: AllowUpdateKey.COVER,
                    value: coverAssetId,
                    requestMinimalDuration: 0,
                  });
                },
              ),
            );
          }
          if (metadata.year) {
            updates.push(
              updateMusic({
                id: musicId,
                key: AllowUpdateKey.YEAR,
                value: metadata.year,
                requestMinimalDuration: 0,
              }),
            );
          }
          await Promise.all(updates);
        } catch (error) {
          logger.error(error, 'Failed to update metadata after import');
        }

        updateItemStatus(item.id, 'success');
      } catch (error) {
        logger.error(error, `Failed to import: ${item.name}`);
        updateItemStatus(item.id, 'failed', (error as Error).message);
      }
    }

    setImporting(false);
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const hasSuccessful = items.some((i) => i.status === 'success');
  const hasFailed = items.some((i) => i.status === 'failed');

  const acceptTypes = Object.values(
    ASSET_TYPE_MAP[AssetType.MUSIC].acceptType,
  ).flat();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FileInput
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptTypes.join(',')}
        onChange={onFilesChange}
      />

      <UploadZone
        $active={false}
        onClick={() => !importing && fileInputRef.current?.click()}
      >
        <UploadIcon />
        <UploadHint>
          <span className="highlight">{capitalize(t('select_music_files'))}</span>
          <br />
          {Object.keys(ASSET_TYPE_MAP[AssetType.MUSIC].acceptType).join(' / ')}
        </UploadHint>
      </UploadZone>

      {items.length > 0 ? (
        <>
          <ItemList>
            {items.map((item) => (
              <ItemRow key={item.id} $status={item.status}>
                <ItemIcon>
                  <ItemStatusIcon status={item.status} />
                </ItemIcon>
                <ItemInfo>
                  <ItemName>{item.name}</ItemName>
                  {item.error ? <ItemError>{item.error}</ItemError> : null}
                </ItemInfo>
                <StatusBadge $status={item.status}>
                  {StatusLabelMap()[item.status]}
                </StatusBadge>
              </ItemRow>
            ))}
          </ItemList>

          <ActionRow>
            {pendingCount > 0 ? (
              <Button
                variant={'primary'}
                onClick={startImport}
                loading={importing}
              >
                {capitalize(t('start_import'))} ({pendingCount})
              </Button>
            ) : null}
            {hasSuccessful && !importing ? (
              <Button
                onClick={() =>
                  setItems((p) => p.filter((i) => i.status !== 'success'))
                }
              >
                {t('clean_successful_items')}
              </Button>
            ) : null}
            {hasFailed && !importing ? (
              <Button
                onClick={() =>
                  setItems((p) =>
                    p.map((i) =>
                      i.status === 'failed'
                        ? { ...i, status: 'pending', error: undefined }
                        : i,
                    ),
                  )
                }
              >
                {t('retry_failed_items')}
              </Button>
            ) : null}
            {!importing ? (
              <Button onClick={() => setItems([])}>{t('clean_all_items')}</Button>
            ) : null}
          </ActionRow>
        </>
      ) : null}
    </div>
  );
}

export default ImportSection;
