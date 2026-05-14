import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styled from 'styled-components';
import {
  MdAdd,
  MdDelete,
  MdMusicNote,
  MdOutlineFilePresent,
} from 'react-icons/md';
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
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import stringArrayEqual from '@/utils/string_array_equal';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import deleteMusic from '@/server/api/delete_music';
import getLyricList from '@/server/api/get_lyric_list';
import getMusicRequest from '@/server/api/get_music';
import searchMusicRequest from '@/server/api/search_music';
import searchSingerRequest from '@/server/api/search_singer';
import updateMusic from '@/server/api/update_music';
import uploadAsset from '@/server/form/upload_asset';
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

const COVER_SIZE = 120;
const FONT = "'Nunito', 'Varela Round', system-ui, sans-serif";
const ROW_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

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
  padding: 20px;
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
  padding-right: 44px;
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

const LyricDeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  border: 2px solid transparent;
  border-radius: 9px;
  padding: 0;
  background: rgb(255 255 255 / 0.88);
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 120ms,
    background 120ms,
    border-color 120ms,
    filter 120ms;

  &:not(:disabled):hover {
    color: ${CSSVariable.COLOR_DANGEROUS};
    border-color: rgb(242 80 66 / 0.18);
    background: rgb(255 245 244);
  }

  &:not(:disabled):active {
    filter: brightness(0.96);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:focus-visible {
    outline: 2px solid ${CSSVariable.COLOR_DANGEROUS};
    outline-offset: 2px;
  }
`;

const CenterBox = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Footer = styled.div`
  flex-shrink: 0;
  padding: 14px 16px calc(16px + env(safe-area-inset-bottom, 0));
  border-top: 2px solid ${CSSVariable.COLOR_BORDER};
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FullWidthActionButton = styled(Button)`
  flex-shrink: 0;
  min-height: 44px;
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
  const [fileSaving, setFileSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(music.name);
    setAliases(music.aliases);
    setLyrics(music.lyrics.map((lyric) => lyric.lrc));
    setSingers(music.singers.map(formatSingerToOption));
    setForkFromList(music.forkFromList.map(formatMusicToOption));
    setYear(music.year === null ? '' : `${music.year}`);
  }, [music]);

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

  const onRemoveLyric = (index: number) =>
    setLyrics((list) => list.filter((_, lyricIndex) => lyricIndex !== index));

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

  const onModifyFile = () =>
    dialog.fileSelect({
      title: t('modify_file_of_music'),
      label: t('file_of_music'),
      acceptTypes: MUSIC_ASSET_ACCEPT_TYPES,
      placeholder: upperCaseFirstLetter(
        t('one_of_formats', t('ffmpeg_supported_audio')),
      ),
      onConfirm: async (file) => {
        if (!file) {
          notice.error(t('empty_file_warning'));
          return false;
        }
        setFileSaving(true);
        try {
          const { id } = await uploadAsset(file, AssetType.MUSIC);
          await updateMusic({
            id: music.id,
            key: AllowUpdateKey.ASSET,
            value: id,
          });
          onReload();
        } catch (error) {
          logger.error(error, 'Failed to modify file of music');
          notice.error(error.message);
          return false;
        } finally {
          setFileSaving(false);
        }
      },
    });

  const onSave = async () => {
    const nextName = normalizeText(name);
    if (!nextName) {
      notice.error(t('empty_name_warning'));
      return;
    }
    if (!singerIds.length) {
      notice.error(t('emtpy_singers_warning'));
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
            {music.cover ? (
              <img src={music.cover} alt={music.name} />
            ) : (
              <MdMusicNote />
            )}
          </CoverBox>
          <CoverActions>
            <Button
              variant="secondary"
              size="sm"
              square
              onClick={onEditCover}
              loading={coverSaving}
              disabled={saving || fileSaving || deleting}
              title={t('edit_cover')}
              aria-label={t('edit_cover')}
            >
              <IconEdit size={18} />
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
            <CreateSingerLabel />
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
          disabled={saving || coverSaving || deleting}
        />

        {music.type === MusicType.SONG ? (
          <Group>
            <GroupTitle>{t('lyric')}</GroupTitle>
            <FieldGroup>
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
                    type="button"
                    onClick={() => onRemoveLyric(index)}
                    disabled={saving}
                    title={t('delete')}
                    aria-label={t('delete')}
                  >
                    <MdDelete size={18} />
                  </LyricDeleteButton>
                </TextareaRow>
              ))}
              {lyrics.length < MUSIC_MAX_LRYIC_AMOUNT ? (
                <Button
                  variant="secondary"
                  icon={<MdAdd />}
                  onClick={onAddLyric}
                  disabled={saving}
                >
                  {t('add')} {t('lyric')}
                </Button>
              ) : null}
            </FieldGroup>
          </Group>
        ) : null}

      </Body>

      <Footer>
        <Button
          block
          variant="primary"
          onClick={onSave}
          loading={saving}
          disabled={!changed || coverSaving || fileSaving || deleting}
        >
          {t('save')}
        </Button>
        <FullWidthActionButton
          block
          variant="danger"
          icon={<MdDelete />}
          onClick={onDelete}
          loading={deleting}
          disabled={saving || coverSaving || fileSaving}
        >
          {t('delete_music')}
        </FullWidthActionButton>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [music, setMusic] = useState<Music | null>(null);

  const loadMusic = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMusicRequest({ id, requestMinimalDuration: 0 });
      let lyrics: Lyric[] = [];
      if (result.type === MusicType.SONG) {
        lyrics = await getLyricList({ musicId: id, requestMinimalDuration: 0 });
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
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      void loadMusic(musicId);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <EditDrawerContent
        side="right"
        style={{ width: 420 }}
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
