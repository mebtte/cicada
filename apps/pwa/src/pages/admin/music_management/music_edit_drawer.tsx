import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import {
  MdAdd,
  MdDelete,
  MdFileUpload,
  MdOutlineFilePresent,
} from 'react-icons/md';
import DefaultCover from '@/asset/default_cover.jpeg';
import {
  Drawer,
  DrawerContent,
  MultiSelect,
  type SelectOption,
} from '@/components';
import Button from '@/components/button';
import ErrorCard from '@/components/error_card';
import { IconEdit } from '@/components/icon';
import Input from '@/components/input';
import Slider from '@/components/slider';
import Spinner from '@/components/spinner';
import Textarea from '@/components/textarea';
import {
  ALIAS_MAX_LENGTH,
  AllowUpdateKey,
  LYRIC_MAX_LENGTH,
  MUSIC_MAX_ALIAS_COUNT,
  MUSIC_MAX_LRYIC_AMOUNT,
  MusicType,
  NAME_MAX_LENGTH,
  SEARCH_KEYWORD_MAX_LENGTH as MUSIC_SEARCH_KEYWORD_MAX_LENGTH,
  YEAR_MAX,
  YEAR_MIN,
} from '@/constants/music';
import { AssetType, MUSIC_ASSET_ACCEPT_TYPES } from '@/constants/asset';
import { SEARCH_KEYWORD_MAX_LENGTH as SINGER_SEARCH_KEYWORD_MAX_LENGTH } from '@/constants/singer';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import autoScrollbar from '@/style/auto_scrollbar';
import upperCaseFirstLetterStyle from '@/style/upper_case_first_letter';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import formatBytes from '@/utils/format_bytes';
import getMusicFileMetadata, {
  type Metadata as MusicFileMetadata,
} from '@/utils/get_music_file_metadata';
import stringArrayEqual from '@/utils/string_array_equal';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import deleteMusic from '@/server/api/delete_music';
import getLyricList from '@/server/api/get_lyric_list';
import getMusicRequest from '@/server/api/get_music';
import searchMusicRequest from '@/server/api/search_music';
import searchSingerRequest from '@/server/api/search_singer';
import updateMusic from '@/server/api/update_music';
import uploadAsset from '@/server/form/upload_asset';
import uploadAssetChunked, {
  cancelPartialUpload,
  type UploadPhase,
} from '@/server/form/upload_asset_chunked';
import CreateSingerLabel from '../components/create_singer_label';

interface Singer {
  id: string;
  name: string;
  aliases: string[];
}

interface MusicSinger {
  id: string;
  name: string;
}

interface RelatedMusic {
  id: string;
  name: string;
  singers: MusicSinger[];
}

interface Lyric {
  id: number;
  lrc: string;
}

interface Music {
  id: string;
  name: string;
  cover: string;
  asset: string;
  assetSize: number;
  assetDurationMs: number;
  assetCodec: string;
  assetBitRate: number;
  type: MusicType;
  aliases: string[];
  singers: Singer[];
  heat: number;
  lyrics: Lyric[];
  forkFromList: RelatedMusic[];
  forkList: RelatedMusic[];
  year: number | null;
}

interface MusicFileUploadProgress {
  phase: UploadPhase;
  uploadedBytes: number;
  totalBytes: number;
  instant: boolean;
}

const COVER_SIZE = 120;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const DRAWER_WIDTH = 420;
const DRAWER_NARROW_SCREEN_GUTTER = 48;

const formatSingerToOption = (singer: Singer): SelectOption<Singer> => ({
  label: `${singer.name}${singer.aliases.length ? `(${singer.aliases[0]})` : ''}`,
  value: singer,
});

const searchSinger = (search: string): Promise<SelectOption<Singer>[]> => {
  const keyword = search.trim().substring(0, SINGER_SEARCH_KEYWORD_MAX_LENGTH);
  if (!keyword) {
    return Promise.resolve([]);
  }
  return searchSingerRequest({ keyword, page: 1, pageSize: 100 }).then((data) =>
    data.singerList.map(formatSingerToOption),
  );
};

const formatMusicToOption = (
  music: RelatedMusic,
): SelectOption<RelatedMusic> => ({
  label: `${music.name} - ${music.singers.map((s) => s.name).join(',')}`,
  value: music,
});

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeAliases = (aliases: string[]) =>
  aliases.map(normalizeText).filter((alias) => alias.length > 0);

const normalizeLyrics = (lyrics: string[]) =>
  lyrics.map((lyric) => lyric.trim()).filter((lyric) => lyric.length > 0);

const sortedIds = (ids: string[]) => [...ids].sort();

const EditDrawerContent = styled(DrawerContent)`
  > div {
    overflow: hidden;
  }
`;

const Form = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const CoverSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CoverBox = styled.div`
  width: ${COVER_SIZE}px;
  height: ${COVER_SIZE}px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 15px;
  flex-shrink: 0;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  font-size: 22px;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const CoverActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  background: #fff;
  padding: 20px 20px calc(96px + env(safe-area-inset-bottom, 0));
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  ${autoScrollbar}
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const GroupTitle = styled.div`
  font-family: ${FONT};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: rgb(66 66 66);
  ${upperCaseFirstLetterStyle}
`;

const FileFieldBox = styled.div`
  min-height: 54px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
`;

const FileInfo = styled.div`
  min-width: 0;
  font-family: ${FONT};
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0;
  color: rgb(75 75 75);
  overflow: hidden;
`;

const FileInfoSecondary = styled.div`
  margin-top: 2px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: 12px;
`;

const FileUploadProgressBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

// 只读进度条：禁止指针交互，并隐藏拇指（slider 内部最后一个 span）
const FileUploadTrack = styled(Slider)`
  pointer-events: none;

  > span:last-child {
    display: none;
  }
`;

const FileUploadMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  font-family: ${FONT};
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  > span:last-child {
    flex-shrink: 0;
  }
`;

const AliasInputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 8px;
  align-items: start;
`;

const TextareaRow = styled.div`
  position: relative;
  min-width: 0;
`;

const LyricTextarea = styled(Textarea)`
  min-width: 0;
  height: 112px;
  max-height: 180px;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 13px;
  box-shadow: 0 3px 0 ${ROW_SHADOW};
  font-family: ${FONT};
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.4;
  overflow-y: auto;
  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out;

  &:focus {
    border-color: ${CSSVariable.COLOR_PRIMARY};
    box-shadow: 0 3px 0 ${CSSVariable.COLOR_PRIMARY_ACTIVE};
  }
`;

const LyricDeleteButton = styled(Button)`
  position: absolute;
  top: -16px;
  right: -8px;
  z-index: 2;
  width: 26px;
  height: 26px;
  min-width: 0;
  border-radius: 8px;
  font-size: 14px;
`;

// 歌词块行距比通用 FieldGroup 大, 给按钮溢出留出空间
const LyricFieldGroup = styled(FieldGroup)`
  gap: 20px;
`;

// 添加歌词 / 上传 LRC 两个按钮并排, 各占一半宽度
const LyricActions = styled.div`
  display: flex;
  gap: 8px;

  > button {
    flex: 1;
    min-width: 0;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const CenterBox = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Footer = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 14px 16px calc(16px + env(safe-area-inset-bottom, 0));
  display: flex;
  flex-direction: row;
  gap: 10px;
`;

const ActionButton = styled(Button)`
  flex: 1;
  min-width: 0;
  min-height: 44px;

  @media (max-width: 360px) {
    padding: 0 12px;
    font-size: 14px;
  }
`;

const formatDurationMs = (durationMs: number) => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minute = Math.floor(totalSeconds / 60);
  const second = totalSeconds % 60;
  return `${minute > 9 ? minute : `0${minute}`}:${
    second > 9 ? second : `0${second}`
  }`;
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)}KB`;
  }
  return `${(size / 1024 / 1024).toFixed(2)}MB`;
};

const formatBitRate = (bitRate: number) => `${Math.round(bitRate / 1000)}kbps`;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getFileUploadPercent = (progress: MusicFileUploadProgress) =>
  progress.totalBytes
    ? clampPercent((progress.uploadedBytes / progress.totalBytes) * 100)
    : 0;

const getFileUploadPhaseText = ({
  phase,
  instant,
}: MusicFileUploadProgress) => {
  if (instant) {
    return t('instant_upload_hit');
  }
  switch (phase) {
    case 'hashing':
      return t('hashing_file');
    case 'initializing':
      return t('initializing_upload');
    case 'uploading':
      return t('uploading_file');
    case 'completing':
      return t('completing_upload');
  }
};

const formatSelectedMusicMetadata = (metadata: MusicFileMetadata | null) => {
  if (!metadata) {
    return [];
  }
  return [
    metadata.year ? `${metadata.year}` : '',
    metadata.durationMs ? formatDurationMs(metadata.durationMs) : '',
    metadata.codec ? metadata.codec.toUpperCase() : '',
    metadata.bitRate ? formatBitRate(metadata.bitRate) : '',
  ].filter(Boolean);
};

const isAbortedUploadError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === 'aborted';

function MusicFileUploadProgressView({
  progress,
}: {
  progress: MusicFileUploadProgress;
}) {
  const uploadPercent = getFileUploadPercent(progress);
  return (
    <FileUploadProgressBox>
      <FileUploadTrack value={uploadPercent} max={100} />
      <FileUploadMeta>
        <span>{getFileUploadPhaseText(progress)}</span>
        <span>
          {formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)} ·{' '}
          {Math.round(uploadPercent)}%
        </span>
      </FileUploadMeta>
    </FileUploadProgressBox>
  );
}

function SelectedMusicFileMetadata({ file }: { file: File }) {
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<MusicFileMetadata | null>(null);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setMetadata(null);
    getMusicFileMetadata(file)
      .then((nextMetadata) => {
        if (!disposed) {
          setMetadata(nextMetadata);
        }
      })
      .catch((error) => {
        logger.error(error as Error, 'Failed to read selected music metadata');
        if (!disposed) {
          setMetadata(null);
        }
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [file]);

  const lines = formatSelectedMusicMetadata(metadata);

  if (loading) {
    return <> · {t('reading_metadata')}</>;
  }

  return lines.length ? <> · {lines.join(' · ')}</> : null;
}

function MusicFileField({
  music,
  onModifyFile,
  loading,
  disabled,
}: {
  music: Music;
  onModifyFile: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  const primary = [
    music.assetDurationMs ? formatDurationMs(music.assetDurationMs) : '',
    music.assetSize ? formatFileSize(music.assetSize) : '',
  ].filter(Boolean);
  const secondary = [
    music.assetCodec ? music.assetCodec.toUpperCase() : '',
    music.assetBitRate ? formatBitRate(music.assetBitRate) : '',
  ].filter(Boolean);

  return (
    <Group>
      <GroupTitle>{t('music_file')}</GroupTitle>
      <FileFieldBox>
        <FileInfo>
          {primary.length ? <div>{primary.join(' · ')}</div> : null}
          {secondary.length ? (
            <FileInfoSecondary>{secondary.join(' · ')}</FileInfoSecondary>
          ) : null}
          {!primary.length && !secondary.length ? t('unknown') : null}
        </FileInfo>
        <Button
          variant="secondary"
          size="sm"
          icon={<MdOutlineFilePresent />}
          onClick={onModifyFile}
          loading={loading}
          disabled={disabled}
          title={t('modify_file_of_music')}
          aria-label={t('modify_file_of_music')}
        >
          {t('modify')}
        </Button>
      </FileFieldBox>
    </Group>
  );
}

function EditContent({
  music,
  onDeleted,
  onReload,
}: {
  music: Music;
  onDeleted: () => void;
  onReload: () => void;
}) {
  const [name, setName] = useState(music.name);
  const [aliases, setAliases] = useState<string[]>(() => music.aliases);
  const [lyrics, setLyrics] = useState<string[]>(() =>
    music.lyrics.map((lyric) => lyric.lrc),
  );
  const [singers, setSingers] = useState<SelectOption<Singer>[]>(() =>
    music.singers.map(formatSingerToOption),
  );
  const [forkFromList, setForkFromList] = useState<
    SelectOption<RelatedMusic>[]
  >(() => music.forkFromList.map(formatMusicToOption));
  const [year, setYear] = useState(music.year === null ? '' : `${music.year}`);
  const [saving, setSaving] = useState(false);
  const [coverSaving, setCoverSaving] = useState(false);
  const [coverDeleting, setCoverDeleting] = useState(false);
  const [fileSaving, setFileSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mountedRef = useRef(true);
  const fileUploadAbortRef = useRef<AbortController | null>(null);
  const fileUploadIdRef = useRef<string | null>(null);
  const fileSelectDialogIdRef = useRef<string | null>(null);
  const lyricFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(music.name);
    setAliases(music.aliases);
    setLyrics(music.lyrics.map((lyric) => lyric.lrc));
    setSingers(music.singers.map(formatSingerToOption));
    setForkFromList(music.forkFromList.map(formatMusicToOption));
    setYear(music.year === null ? '' : `${music.year}`);
  }, [music]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      const uploadId = fileUploadIdRef.current;
      fileUploadIdRef.current = null;
      fileUploadAbortRef.current?.abort();
      fileUploadAbortRef.current = null;
      if (fileSelectDialogIdRef.current) {
        dialog.close(fileSelectDialogIdRef.current);
        fileSelectDialogIdRef.current = null;
      }
      // Drawer-local replacement uploads have no resume UI, so cancel the
      // partial server session when the drawer disappears mid-upload.
      if (uploadId) {
        cancelPartialUpload(uploadId).catch((error) =>
          logger.error(error as Error, 'Failed to cancel partial music upload'),
        );
      }
    };
  }, []);

  const searchMusic = useCallback(
    (search: string) => {
      const keyword = search.trim().substring(0, MUSIC_SEARCH_KEYWORD_MAX_LENGTH);
      if (!keyword) {
        return Promise.resolve([]);
      }
      return searchMusicRequest({ keyword, page: 1, pageSize: 100 }).then(
        (data) =>
          data.musicList
            .filter((m) => m.id !== music.id)
            .map(formatMusicToOption),
      );
    },
    [music.id],
  );

  const normalizedAliases = useMemo(() => normalizeAliases(aliases), [aliases]);
  const normalizedLyrics = useMemo(() => normalizeLyrics(lyrics), [lyrics]);
  const singerIds = useMemo(
    () => singers.map((option) => option.value.id),
    [singers],
  );
  const forkFromIds = useMemo(
    () => forkFromList.map((option) => option.value.id),
    [forkFromList],
  );
  const originalLyrics = useMemo(
    () => music.lyrics.map((lyric) => lyric.lrc),
    [music.lyrics],
  );
  const originalSingerIds = useMemo(
    () => music.singers.map((singer) => singer.id),
    [music.singers],
  );
  const originalForkFromIds = useMemo(
    () => music.forkFromList.map((forkFrom) => forkFrom.id),
    [music.forkFromList],
  );
  const parsedYear = useMemo(() => {
    const trimmed = year.trim();
    return trimmed ? Number(trimmed) : null;
  }, [year]);
  const changed =
    normalizeText(name) !== music.name ||
    !stringArrayEqual(normalizedAliases, music.aliases) ||
    (music.type === MusicType.SONG &&
      !stringArrayEqual(normalizedLyrics, originalLyrics)) ||
    !stringArrayEqual(sortedIds(singerIds), sortedIds(originalSingerIds)) ||
    !stringArrayEqual(sortedIds(forkFromIds), sortedIds(originalForkFromIds)) ||
    parsedYear !== music.year;

  const onNameChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setName(event.target.value);

  const onYearChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setYear(event.target.value);

  const onAliasChange = (index: number, value: string) =>
    setAliases((list) =>
      list.map((alias, aliasIndex) =>
        aliasIndex === index ? value : alias,
      ),
    );

  const onAddAlias = () =>
    setAliases((list) =>
      list.length >= MUSIC_MAX_ALIAS_COUNT ? list : [...list, ''],
    );

  const onRemoveAlias = (index: number) =>
    setAliases((list) => list.filter((_, aliasIndex) => aliasIndex !== index));

  const onLyricChange = (index: number, value: string) =>
    setLyrics((list) =>
      list.map((lyric, lyricIndex) =>
        lyricIndex === index ? value : lyric,
      ),
    );

  const onAddLyric = () =>
    setLyrics((list) =>
      list.length >= MUSIC_MAX_LRYIC_AMOUNT ? list : [...list, ''],
    );

  const onTriggerLyricUpload = () => {
    lyricFileInputRef.current?.click();
  };

  const onLyricFileSelected: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const input = event.target;
    const file = input.files?.[0];
    // 重置以便用户再次选同一个文件时仍能触发 change 事件
    input.value = '';
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      // 超长直接截断, 与 textarea 的 maxLength 行为一致
      const truncated = text.slice(0, LYRIC_MAX_LENGTH);
      // 将 lrc 内容作为一条新的歌词追加, 超过上限则丢弃
      setLyrics((list) =>
        list.length >= MUSIC_MAX_LRYIC_AMOUNT ? list : [...list, truncated],
      );
    } catch (error) {
      logger.error(error as Error, 'Failed to read lyric file');
      notice.error(error instanceof Error ? error.message : String(error));
    }
  };

  const onRemoveLyric = (index: number) => {
    const removeAt = () =>
      setLyrics((list) => list.filter((_, lyricIndex) => lyricIndex !== index));
    if (!lyrics[index]?.trim()) {
      removeAt();
      return;
    }
    dialog.confirm({
      content: t('delete_lyric_question'),
      confirmText: t('delete'),
      confirmVariant: 'danger',
      onConfirm: () => {
        removeAt();
      },
    });
  };

  const onSingerCreated = useCallback((singer: Singer) => {
    setSingers((list) => {
      if (list.some((option) => option.value.id === singer.id)) {
        return list;
      }
      return [...list, formatSingerToOption(singer)];
    });
  }, []);

  const onEditCover = () =>
    dialog.imageCut({
      title: t('edit_cover'),
      onConfirm: async (cover) => {
        if (!cover) {
          notice.error(t('empty_cover_warning'));
          return false;
        }
        setCoverSaving(true);
        try {
          const { id: assetId } = await uploadAsset(
            cover,
            AssetType.MUSIC_COVER,
          );
          await updateMusic({
            id: music.id,
            key: AllowUpdateKey.COVER,
            value: assetId,
          });
          onReload();
        } catch (error) {
          logger.error(error, 'Failed to update cover of music');
          notice.error(error.message);
          return false;
        } finally {
          setCoverSaving(false);
        }
      },
    });

  // 删除封面：弹出确认框，通过将 COVER 字段置空调用更新接口实现“删除”
  const onDeleteCover = () =>
    dialog.confirm({
      content: t('delete_cover_question'),
      confirmText: t('delete'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        setCoverDeleting(true);
        try {
          await updateMusic({
            id: music.id,
            key: AllowUpdateKey.COVER,
            value: '',
          });
          onReload();
        } catch (error) {
          logger.error(error, 'Failed to delete cover of music');
          notice.error(error.message);
          return false;
        } finally {
          setCoverDeleting(false);
        }
      },
    });

  const uploadMusicFile = async (
    file: File,
    setDialogProgress: (progress: MusicFileUploadProgress | null) => void,
    dialogSignal: AbortSignal,
  ) => {
    fileUploadAbortRef.current?.abort();
    const controller = new AbortController();
    const abortFromDialog = () => controller.abort();
    dialogSignal.addEventListener('abort', abortFromDialog, { once: true });
    fileUploadAbortRef.current = controller;
    fileUploadIdRef.current = null;
    let currentUploadedBytes = 0;
    let currentTotalBytes = file.size;
    if (mountedRef.current) {
      setFileSaving(true);
    }
    setDialogProgress({
      phase: 'hashing',
      uploadedBytes: 0,
      totalBytes: file.size,
      instant: false,
    });

    try {
      const { id, instant } = await uploadAssetChunked(file, AssetType.MUSIC, {
        signal: controller.signal,
        onPhase: (phase) => {
          if (phase === 'completing') {
            currentUploadedBytes = file.size;
            currentTotalBytes = file.size;
          }
          setDialogProgress({
            phase,
            uploadedBytes: currentUploadedBytes,
            totalBytes: currentTotalBytes,
            instant: false,
          });
        },
        onProgress: (uploadedBytes, totalBytes) => {
          currentUploadedBytes = uploadedBytes;
          currentTotalBytes = totalBytes;
          setDialogProgress({
            phase: 'uploading',
            uploadedBytes,
            totalBytes,
            instant: false,
          });
        },
        onResumeMetaResolved: (meta) => {
          fileUploadIdRef.current = meta.uploadId;
        },
      });
      fileUploadIdRef.current = null;
      setDialogProgress({
        phase: 'completing',
        uploadedBytes: file.size,
        totalBytes: file.size,
        instant,
      });
      await updateMusic({
        id: music.id,
        key: AllowUpdateKey.ASSET,
        value: id,
      });
      if (mountedRef.current) {
        onReload();
      }
      return true;
    } catch (error) {
      const uploadId = fileUploadIdRef.current;
      fileUploadIdRef.current = null;
      if (uploadId) {
        cancelPartialUpload(uploadId).catch((cancelError) =>
          logger.error(
            cancelError as Error,
            'Failed to cancel partial music upload',
          ),
        );
      }
      if (isAbortedUploadError(error)) {
        return false;
      }
      logger.error(error as Error, 'Failed to modify file of music');
      notice.error(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      dialogSignal.removeEventListener('abort', abortFromDialog);
      if (fileUploadAbortRef.current === controller) {
        fileUploadAbortRef.current = null;
      }
      setDialogProgress(null);
      if (mountedRef.current) {
        setFileSaving(false);
      }
    }
  };

  const onModifyFile = () => {
    fileSelectDialogIdRef.current = dialog.fileSelect({
      title: t('modify_file_of_music'),
      label: t('file_of_music'),
      acceptTypes: MUSIC_ASSET_ACCEPT_TYPES,
      placeholder: upperCaseFirstLetter(
        t('one_of_formats', t('ffmpeg_supported_audio')),
      ),
      renderSelectedFileExtra: (file) => <SelectedMusicFileMetadata file={file} />,
      onConfirm: (file, { setProgress, signal }) => {
        if (!file) {
          return false;
        }
        return uploadMusicFile(
          file,
          (progress) =>
            setProgress(
              progress ? <MusicFileUploadProgressView progress={progress} /> : null,
            ),
          signal,
        );
      },
    });
  };

  const onSave = async () => {
    const nextName = normalizeText(name);
    if (!nextName) {
      notice.error(t('empty_name_warning'));
      return;
    }
    if (
      parsedYear !== null &&
      (!Number.isInteger(parsedYear) ||
        parsedYear < YEAR_MIN ||
        parsedYear > YEAR_MAX)
    ) {
      notice.error(
        t('year_of_issue_limit', YEAR_MIN.toString(), YEAR_MAX.toString()),
      );
      return;
    }

    setSaving(true);
    try {
      if (nextName !== music.name) {
        await updateMusic({
          id: music.id,
          key: AllowUpdateKey.NAME,
          value: nextName,
        });
      }

      if (!stringArrayEqual(normalizedAliases, music.aliases)) {
        await updateMusic({
          id: music.id,
          key: AllowUpdateKey.ALIASES,
          value: normalizedAliases,
        });
      }

      if (
        music.type === MusicType.SONG &&
        !stringArrayEqual(normalizedLyrics, originalLyrics)
      ) {
        await updateMusic({
          id: music.id,
          key: AllowUpdateKey.LYRIC,
          value: normalizedLyrics,
        });
      }

      if (!stringArrayEqual(sortedIds(singerIds), sortedIds(originalSingerIds))) {
        await updateMusic({
          id: music.id,
          key: AllowUpdateKey.SINGER,
          value: singerIds,
        });
      }

      if (
        !stringArrayEqual(sortedIds(forkFromIds), sortedIds(originalForkFromIds))
      ) {
        await updateMusic({
          id: music.id,
          key: AllowUpdateKey.FORK_FROM,
          value: forkFromIds,
        });
      }

      if (parsedYear !== music.year) {
        await updateMusic({
          id: music.id,
          key: AllowUpdateKey.YEAR,
          value: parsedYear,
        });
      }

      onReload();
    } catch (error) {
      logger.error(error, 'Failed to update music');
      notice.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (music.forkList.length) {
      notice.error(t('music_forked_by_other_can_not_be_deleted'));
      return;
    }
    return dialog.captcha({
      confirmText: t('delete_music'),
      confirmVariant: 'danger',
      onConfirm: async ({ captchaId, captchaValue }) => {
        setDeleting(true);
        try {
          await deleteMusic({ id: music.id, captchaId, captchaValue });
          onDeleted();
        } catch (error) {
          logger.error(error, 'Failed to delete music');
          notice.error(error.message);
          return false;
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  return (
    <Form>
      <Body>
        <CoverSection>
          <CoverBox>
            <img src={music.cover || DefaultCover} alt={music.name} />
          </CoverBox>
          <CoverActions>
            <Button
              variant="secondary"
              size="sm"
              square
              onClick={onEditCover}
              loading={coverSaving}
              disabled={saving || fileSaving || deleting || coverDeleting}
              title={t('edit_cover')}
              aria-label={t('edit_cover')}
            >
              <IconEdit size={18} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              square
              onClick={onDeleteCover}
              loading={coverDeleting}
              disabled={
                !music.cover || saving || fileSaving || deleting || coverSaving
              }
              title={t('delete_cover')}
              aria-label={t('delete_cover')}
            >
              <MdDelete />
            </Button>
          </CoverActions>
        </CoverSection>

        <Input
          label={t('name')}
          value={name}
          onChange={onNameChange}
          maxLength={NAME_MAX_LENGTH}
          disabled={saving}
        />

        <Group>
          <GroupTitle>{t('aliases')}</GroupTitle>
          <FieldGroup>
            {aliases.map((alias, index) => (
              <AliasInputRow key={index}>
                <Input
                  value={alias}
                  onChange={(event) => onAliasChange(index, event.target.value)}
                  maxLength={ALIAS_MAX_LENGTH}
                  disabled={saving}
                  placeholder={`${t('alias')} ${index + 1}`}
                />
                <Button
                  square
                  size="md"
                  variant="ghost"
                  onClick={() => onRemoveAlias(index)}
                  disabled={saving}
                  title={t('delete')}
                  aria-label={t('delete')}
                >
                  <MdDelete />
                </Button>
              </AliasInputRow>
            ))}
            {aliases.length < MUSIC_MAX_ALIAS_COUNT ? (
              <Button
                variant="secondary"
                icon={<MdAdd />}
                onClick={onAddAlias}
                disabled={saving}
              >
                {t('add')} {t('alias')}
              </Button>
            ) : null}
          </FieldGroup>
        </Group>

        <Group>
          <GroupHeader>
            <GroupTitle>{t('singer')}</GroupTitle>
            <CreateSingerLabel
              notifyOnCreated={false}
              onCreated={onSingerCreated}
            />
          </GroupHeader>
          <MultiSelect
            value={singers}
            loadOptions={searchSinger}
            onChange={setSingers}
            clearable={false}
            disabled={saving}
            placeholder=""
          />
        </Group>

        <Input
          label={t('year_of_issue')}
          value={year}
          type="number"
          onChange={onYearChange}
          min={YEAR_MIN}
          max={YEAR_MAX}
          disabled={saving}
        />

        <Group>
          <GroupTitle>{t('fork_from')}</GroupTitle>
          <MultiSelect
            value={forkFromList}
            loadOptions={searchMusic}
            onChange={setForkFromList}
            disabled={saving}
            placeholder=""
          />
        </Group>

        <MusicFileField
          music={music}
          onModifyFile={onModifyFile}
          loading={fileSaving}
          disabled={saving || coverSaving || coverDeleting || deleting}
        />

        {music.type === MusicType.SONG ? (
          <Group>
            <GroupTitle>{t('lyric')}</GroupTitle>
            <LyricFieldGroup>
              {lyrics.map((lyric, index) => (
                <TextareaRow key={index}>
                  <LyricTextarea
                    value={lyric}
                    maxLength={LYRIC_MAX_LENGTH}
                    disabled={saving}
                    placeholder={t('text_of_lrc')}
                    onChange={(event) =>
                      onLyricChange(index, event.target.value)
                    }
                  />
                  <LyricDeleteButton
                    square
                    size="sm"
                    variant="danger"
                    onClick={() => onRemoveLyric(index)}
                    disabled={saving}
                    title={t('delete')}
                    aria-label={t('delete')}
                  >
                    <MdDelete />
                  </LyricDeleteButton>
                </TextareaRow>
              ))}
              {lyrics.length < MUSIC_MAX_LRYIC_AMOUNT ? (
                <LyricActions>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<MdAdd />}
                    onClick={onAddLyric}
                    disabled={saving}
                  >
                    {t('add')} {t('lyric')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<MdFileUpload />}
                    onClick={onTriggerLyricUpload}
                    disabled={saving}
                  >
                    {t('upload_lrc')}
                  </Button>
                </LyricActions>
              ) : null}
            </LyricFieldGroup>
            <HiddenFileInput
              ref={lyricFileInputRef}
              type="file"
              accept=".lrc,text/plain"
              onChange={onLyricFileSelected}
            />
          </Group>
        ) : null}

      </Body>

      <Footer>
        <ActionButton
          variant="primary"
          onClick={onSave}
          loading={saving}
          disabled={
            !changed || coverSaving || coverDeleting || fileSaving || deleting
          }
        >
          {t('save')}
        </ActionButton>
        <ActionButton
          variant="danger"
          icon={<MdDelete />}
          onClick={onDelete}
          loading={deleting}
          disabled={saving || coverSaving || coverDeleting || fileSaving}
        >
          {t('delete')}
        </ActionButton>
      </Footer>
    </Form>
  );
}

function MusicEditDrawer({
  open,
  musicId,
  onClose,
  onSaved,
}: {
  open: boolean;
  musicId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { top: titlebarTop } = useTitlebarOverlayInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [music, setMusic] = useState<Music | null>(null);

  const loadMusic = useCallback(
    async (id: string, { silent = false }: { silent?: boolean } = {}) => {
      // 静默刷新: 不切换到 Spinner, 避免保存后 EditContent 短暂被替换造成闪烁
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const result = await getMusicRequest({ id, requestMinimalDuration: 0 });
        let lyrics: Lyric[] = [];
        if (result.type === MusicType.SONG) {
          lyrics = await getLyricList({
            musicId: id,
            requestMinimalDuration: 0,
          });
        }
        setMusic({
          id: result.id,
          name: result.name,
          cover: result.cover,
          asset: result.asset,
          assetSize: result.assetSize,
          assetDurationMs: result.assetDurationMs,
          assetCodec: result.assetCodec,
          assetBitRate: result.assetBitRate,
          type: result.type,
          aliases: result.aliases,
          singers: result.singers,
          heat: result.heat,
          lyrics,
          forkFromList: result.forkFromList,
          forkList: result.forkList,
          year: result.year ?? null,
        });
      } catch (err) {
        if (silent) {
          // 静默路径下失败仅作提示, 保留当前 EditContent 不切到 ErrorCard
          logger.error(err as Error, 'Failed to silently reload music');
          notice.error((err as Error).message);
        } else {
          setError(err as Error);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (open && musicId) {
      void loadMusic(musicId);
    }
    if (!open) {
      setMusic(null);
      setError(null);
    }
  }, [open, musicId, loadMusic]);

  const handleDeleted = () => {
    onSaved?.();
    onClose();
  };

  const handleReload = () => {
    onSaved?.();
    if (musicId) {
      // 保存/上传完成后刷新 drawer 数据走静默路径, drawer 内容不闪烁
      void loadMusic(musicId, { silent: true });
    }
  };

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <EditDrawerContent
        side="right"
        style={{
          width: DRAWER_WIDTH,
          maxWidth: `calc(100vw - ${DRAWER_NARROW_SCREEN_GUTTER}px)`,
          paddingTop: titlebarTop,
        }}
        showClose={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {loading ? (
          <CenterBox>
            <Spinner />
          </CenterBox>
        ) : error ? (
          <CenterBox>
            <ErrorCard
              errorMessage={error.message}
              retry={() => musicId && loadMusic(musicId)}
            />
          </CenterBox>
        ) : music ? (
          <EditContent
            music={music}
            onDeleted={handleDeleted}
            onReload={handleReload}
          />
        ) : null}
      </EditDrawerContent>
    </Drawer>
  );
}

export default MusicEditDrawer;
