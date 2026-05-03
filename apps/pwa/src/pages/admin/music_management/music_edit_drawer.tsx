import { Drawer, DrawerContent } from '@/components_next';
import { CSSProperties, useCallback, useEffect, useState } from 'react';
import MenuItem from '@/components/menu_item';
import {
  MdDelete,
  MdOutlineFilePresent,
  MdTitle,
  MdGroup,
  MdTextFields,
  MdImage,
  MdCallSplit,
  MdOutlineCalendarToday,
  MdMusicNote,
} from 'react-icons/md';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import notice from '@/utils/notice';
import {
  AllowUpdateKey,
  LYRIC_MAX_LENGTH,
  MusicType,
  MUSIC_MAX_LRYIC_AMOUNT,
  NAME_MAX_LENGTH,
  ALIAS_MAX_LENGTH,
  MUSIC_MAX_ALIAS_COUNT,
  SEARCH_KEYWORD_MAX_LENGTH as MUSIC_SEARCH_KEYWORD_MAX_LENGTH,
  YEAR_MIN,
  YEAR_MAX,
} from '@/constants/music';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType, ASSET_TYPE_MAP } from '@/constants/asset';
import updateMusic from '@/server/api/update_music';
import stringArrayEqual from '@/utils/string_array_equal';
import dialog from '@/utils/dialog';
import deleteMusic from '@/server/api/delete_music';
import logger from '@/utils/logger';
import type { SelectOption } from '@/components_next';
import searchSingerRequest from '@/server/api/search_singer';
import searchMusicRequest from '@/server/api/search_music';
import { SEARCH_KEYWORD_MAX_LENGTH as SINGER_SEARCH_KEYWORD_MAX_LENGTH } from '@/constants/singer';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import getMusicRequest from '@/server/api/get_music';
import getLyricList from '@/server/api/get_lyric_list';
import Spinner from '@/components/spinner';
import ErrorCard from '@/components/error_card';
import { prefixServerOrigin } from '@/global_states/server';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import MissingSinger from '@/pages/player/components/missing_singer';

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
  type: MusicType;
  aliases: string[];
  singers: Singer[];
  heat: number;
  lyrics: Lyric[];
  forkFromList: RelatedMusic[];
  forkList: RelatedMusic[];
  year: number | null;
}

const formatSingerToOption = (singer: Singer): SelectOption<Singer> => ({
  label: `${singer.name}${singer.aliases.length ? `(${singer.aliases[0]})` : ''}`,
  value: singer,
});

const searchSinger = (search: string): Promise<SelectOption<Singer>[]> => {
  const keyword = search.trim().substring(0, SINGER_SEARCH_KEYWORD_MAX_LENGTH);
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

const dangerousIconStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

const itemStyle: CSSProperties = { margin: '0 10px' };

const DrawerInner = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const DrawerHead = styled.div`
  flex-shrink: 0;
  padding: 16px 20px 14px;
  border-bottom: 1px solid ${CSSVariable.COLOR_BORDER};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeadCover = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  background: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${CSSVariable.TEXT_COLOR_DISABLED};
  font-size: 18px;

  > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const HeadInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const HeadTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HeadSingers = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
`;

const ScrollContainer = styled.div`
  flex: 1;
  overflow: auto;
  ${autoScrollbar}
  padding: 8px 0;
`;

const CenterBox = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function EditContent({
  music,
  onDeleted,
  onReload,
}: {
  music: Music;
  onDeleted: () => void;
  onReload: () => void;
}) {
  const searchMusic = useCallback(
    (search: string) => {
      const keyword = search.trim().substring(0, MUSIC_SEARCH_KEYWORD_MAX_LENGTH);
      return searchMusicRequest({ keyword, page: 1, pageSize: 100 }).then(
        (data) =>
          data.musicList
            .filter((m) => m.id !== music.id)
            .map(formatMusicToOption),
      );
    },
    [music.id],
  );

  return (
    <DrawerInner>
      <DrawerHead>
        <HeadCover>
          {music.cover ? (
            <img src={music.cover} alt={music.name} />
          ) : (
            <MdMusicNote />
          )}
        </HeadCover>
        <HeadInfo>
          <HeadTitle>{music.name}</HeadTitle>
          <HeadSingers>
            {music.singers.map((s) => s.name).join(' · ') || t('unknown')}
          </HeadSingers>
        </HeadInfo>
      </DrawerHead>
      <ScrollContainer>
      <MenuItem
        style={itemStyle}
        icon={<MdImage />}
        label={t('edit_cover')}
        onClick={() =>
          dialog.imageCut({
            title: t('edit_cover'),
            onConfirm: async (cover) => {
              if (!cover) {
                notice.error(t('empty_cover_warning'));
                return false;
              }
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
              }
            },
          })
        }
      />
      {music.cover.length ? (
        <MenuItem
          style={itemStyle}
          icon={<MdImage />}
          label={t('reset_cover')}
          onClick={() =>
            dialog.confirm({
              content: t('reset_cover_question'),
              onConfirm: async () => {
                try {
                  await updateMusic({
                    id: music.id,
                    key: AllowUpdateKey.COVER,
                    value: '',
                  });
                  onReload();
                } catch (error) {
                  logger.error(error, 'Failed to reset cover of music');
                  dialog.alert({ content: error.message });
                  return false;
                }
              },
            })
          }
        />
      ) : null}
      <MenuItem
        style={itemStyle}
        icon={<MdTitle />}
        label={t('edit_name')}
        onClick={() =>
          dialog.input({
            title: t('edit_name'),
            label: t('name'),
            initialValue: music.name,
            maxLength: NAME_MAX_LENGTH,
            onConfirm: async (name: string) => {
              const trimmedName = name.replace(/\s+/g, ' ').trim();
              if (!trimmedName.length) {
                notice.error(t('empty_name_warning'));
                return false;
              }
              if (trimmedName !== music.name) {
                try {
                  await updateMusic({
                    id: music.id,
                    key: AllowUpdateKey.NAME,
                    value: trimmedName,
                  });
                  onReload();
                } catch (error) {
                  logger.error(error, 'Failed to update name of music');
                  notice.error(error.message);
                  return false;
                }
              }
            },
          })
        }
      />
      <MenuItem
        style={itemStyle}
        icon={<MdTextFields />}
        label={t('edit_alias')}
        onClick={() =>
          dialog.inputList({
            title: t('edit_alias'),
            label: t('alias'),
            initialValue: music.aliases,
            max: MUSIC_MAX_ALIAS_COUNT,
            maxLength: ALIAS_MAX_LENGTH,
            onConfirm: async (aliases: string[]) => {
              const trimmedAliases = aliases
                .map((a) => a.replace(/\s+/g, ' ').trim())
                .filter((a) => a.length > 0);
              if (!stringArrayEqual(trimmedAliases, music.aliases)) {
                try {
                  await updateMusic({
                    id: music.id,
                    key: AllowUpdateKey.ALIASES,
                    value: trimmedAliases,
                  });
                  onReload();
                } catch (error) {
                  logger.error(error, 'Failed to update aliases of music');
                  notice.error(error.message);
                  return false;
                }
              }
            },
          })
        }
      />
      {music.type === MusicType.SONG ? (
        <MenuItem
          style={itemStyle}
          icon={<MdTextFields />}
          label={t('edit_lyric')}
          onClick={() =>
            dialog.textareaList({
              title: t('edit_lyric'),
              label: t('lyric'),
              initialValue: music.lyrics.map((l) => l.lrc),
              max: MUSIC_MAX_LRYIC_AMOUNT,
              maxLength: LYRIC_MAX_LENGTH,
              placeholder: t('text_of_lrc'),
              onConfirm: async (lyrics: string[]) => {
                const trimmedLyrics = lyrics
                  .map((l) => l.trim())
                  .filter((l) => l.length > 0);
                if (
                  !stringArrayEqual(
                    trimmedLyrics,
                    music.lyrics.map((l) => l.lrc),
                  )
                ) {
                  try {
                    await updateMusic({
                      id: music.id,
                      key: AllowUpdateKey.LYRIC,
                      value: trimmedLyrics,
                    });
                    onReload();
                  } catch (error) {
                    logger.error(error, 'Failed to update lyrics of music');
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
      ) : null}
      <MenuItem
        style={itemStyle}
        icon={<MdGroup />}
        label={t('modify_singer')}
        onClick={() =>
          dialog.multipleSelect<Singer>({
            label: t('singer'),
            labelAddon: <MissingSinger />,
            title: t('modify_singer'),
            loadOptions: searchSinger,
            initialValue: music.singers.map(formatSingerToOption),
            confirmVariant: 'primary',
            onConfirm: async (options) => {
              if (!options.length) {
                notice.error(t('emtpy_singers_warning'));
                return false;
              }
              if (
                !stringArrayEqual(
                  music.singers.map((s) => s.id).sort(),
                  options.map((o) => o.value.id).sort(),
                )
              ) {
                try {
                  await updateMusic({
                    id: music.id,
                    key: AllowUpdateKey.SINGER,
                    value: options.map((o) => o.value.id),
                  });
                  onReload();
                } catch (error) {
                  logger.error(error, 'Failed to modify singers of music');
                  notice.error(error.message);
                  return false;
                }
              }
            },
          })
        }
      />
      <MenuItem
        style={itemStyle}
        icon={<MdOutlineFilePresent />}
        label={t('modify_file_of_music')}
        onClick={() =>
          dialog.fileSelect({
            title: t('modify_file_of_music'),
            label: t('file_of_music'),
            acceptTypes: Object.values(
              ASSET_TYPE_MAP[AssetType.MUSIC].acceptType,
            ).flat(),
            placeholder: upperCaseFirstLetter(
              t(
                'one_of_formats',
                Object.keys(ASSET_TYPE_MAP[AssetType.MUSIC].acceptType).join(
                  '/',
                ),
              ),
            ),
            onConfirm: async (file) => {
              if (!file) {
                notice.error(t('empty_file_warning'));
                return false;
              }
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
              }
            },
          })
        }
      />
      <MenuItem
        style={itemStyle}
        icon={<MdCallSplit />}
        label={t('modify_fork_from')}
        onClick={() =>
          dialog.multipleSelect({
            title: t('modify_fork_from'),
            label: t('fork_from'),
            loadOptions: searchMusic,
            initialValue: music.forkFromList.map(formatMusicToOption),
            onConfirm: async (options) => {
              if (
                !stringArrayEqual(
                  music.forkFromList.map((m) => m.id).sort(),
                  options.map((o) => (o.value as { id: string }).id).sort(),
                )
              ) {
                try {
                  await updateMusic({
                    id: music.id,
                    key: AllowUpdateKey.FORK_FROM,
                    value: options.map((o) => (o.value as { id: string }).id),
                  });
                  onReload();
                } catch (error) {
                  logger.error(error, "Failed to update music's fork-from");
                  notice.error(error.message);
                  return false;
                }
              }
            },
          })
        }
      />
      <MenuItem
        style={itemStyle}
        icon={<MdOutlineCalendarToday />}
        label={t('edit_year_of_issue')}
        onClick={() =>
          dialog.input({
            title: t('edit_year_of_issue'),
            label: t('year_of_issue'),
            initialValue: music.year ? music.year.toString() : '',
            inputType: 'number',
            onConfirm: async (year: string) => {
              const yearNumber = Number(year);
              if (
                !yearNumber ||
                !Number.isInteger(yearNumber) ||
                yearNumber < YEAR_MIN ||
                yearNumber > YEAR_MAX
              ) {
                notice.error(
                  t(
                    'year_of_issue_limit',
                    YEAR_MIN.toString(),
                    YEAR_MAX.toString(),
                  ),
                );
                return false;
              }
              if (yearNumber !== music.year) {
                try {
                  await updateMusic({
                    id: music.id,
                    key: AllowUpdateKey.YEAR,
                    value: yearNumber,
                  });
                  onReload();
                } catch (error) {
                  logger.error(error, "Failed to update music's year of issue");
                  notice.error(error.message);
                  return false;
                }
              }
            },
          })
        }
      />
      <MenuItem
        style={itemStyle}
        icon={<MdDelete style={dangerousIconStyle} />}
        label={t('delete')}
        onClick={() => {
          if (music.forkList.length) {
            return notice.error(t('music_forked_by_other_can_not_be_deleted'));
          }
          return dialog.captcha({
            confirmText: t('delete_music'),
            confirmVariant: 'danger',
            onConfirm: async ({ captchaId, captchaValue }) => {
              try {
                await deleteMusic({ id: music.id, captchaId, captchaValue });
                onDeleted();
              } catch (error) {
                logger.error(error, 'Failed to delete music');
                notice.error(error.message);
                return false;
              }
            },
          });
        }}
      />
      </ScrollContainer>
    </DrawerInner>
  );
}

function MusicEditDrawer({
  open,
  musicId,
  onClose,
}: {
  open: boolean;
  musicId: string | null;
  onClose: () => void;
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
        cover: prefixServerOrigin(result.cover),
        asset: prefixServerOrigin(result.asset),
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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && musicId) {
      loadMusic(musicId);
    }
    if (!open) {
      setMusic(null);
      setError(null);
    }
  }, [open, musicId, loadMusic]);

  const handleDeleted = () => {
    onClose();
  };

  const handleReload = () => {
    if (musicId) {
      loadMusic(musicId);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 320 }} showClose={false}>
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
      </DrawerContent>
    </Drawer>
  );
}

export default MusicEditDrawer;
