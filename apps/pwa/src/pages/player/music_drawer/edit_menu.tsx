import Drawer from '@/components/drawer';
import {
  CSSProperties,
  MouseEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react';
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
} from '#/constants/music';
import uploadAsset from '@/server/form/upload_asset';
import { AssetType, ASSET_TYPE_MAP } from '#/constants';
import updateMusic from '@/server/api/update_music';
import stringArrayEqual from '#/utils/string_array_equal';
import dialog from '@/utils/dialog';
import deleteMusic from '@/server/api/delete_music';
import logger from '@/utils/logger';
import { Option } from '@/components/multiple_select';
import searchSingerRequest from '@/server/api/search_singer';
import searchMusicRequest from '@/server/api/search_music';
import { SEARCH_KEYWORD_MAX_LENGTH as SINGER_SEARCH_KEYWORD_MAX_LENGTH } from '#/constants/singer';
import absoluteFullSize from '@/style/absolute_full_size';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { Variant } from '@/components/button';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import autoScrollbar from '@/style/auto_scrollbar';
import { Music, ZIndex } from '../constants';
import { MusicDetail } from './constants';
import e, { EventType } from './eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import MusicInfo from '../components/music_info';
import MissingSinger from '../components/missing_singer';

interface Singer {
  id: string;
  name: string;
  aliases: string[];
}
const formatSingerToMultipleSelectOption = (
  singer: Singer,
): Option<Singer> => ({
  key: singer.id,
  label: `${singer.name}${
    singer.aliases.length ? `(${singer.aliases[0]})` : ''
  }`,
  value: singer,
});
const searchSinger = (search: string): Promise<Option<Singer>[]> => {
  const keyword = search.trim().substring(0, SINGER_SEARCH_KEYWORD_MAX_LENGTH);
  return searchSingerRequest({ keyword, page: 1, pageSize: 100 }).then((data) =>
    data.singerList.map(formatSingerToMultipleSelectOption),
  );
};
const emitMusicUpdated = (id: string) =>
  playerEventemitter.emit(PlayerEventType.MUSIC_UPDATED, { id });
const formatMusicTouMultipleSelectOtion = (music: Music): Option<Music> => ({
  key: music.id,
  label: `${music.name} - ${music.singers.map((s) => s.name).join(',')}`,
  value: music,
});
const itemStyle: CSSProperties = { margin: '0 10px' };

const Style = styled.div`
  ${absoluteFullSize}

  overflow: auto;
  ${autoScrollbar}
`;
const maskProps: {
  style: CSSProperties;
  onClick: MouseEventHandler<HTMLDivElement>;
} = {
  style: { zIndex: ZIndex.DRAWER },
  onClick: (event) => event.stopPropagation(),
};
const bodyProps: { style: CSSProperties } = {
  style: { width: 300 },
};
const dangerousIconStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function EditMenu({ music }: { music: MusicDetail }) {
  const { height: titleBarHeight } = useTitlebarArea();
  const [open, setOpen] = useState(false);
  // const [open, setOpen] = useState(true);
  const onClose = () => setOpen(false);
  const searchMusic = useCallback(
    (search: string): Promise<Option<Music>[]> => {
      const keyword = search
        .trim()
        .substring(0, MUSIC_SEARCH_KEYWORD_MAX_LENGTH);
      return searchMusicRequest({ keyword, page: 1, pageSize: 100 }).then(
        (data) =>
          data.musicList
            .filter((m) => m.id !== music.id)
            .map(formatMusicTouMultipleSelectOtion),
      );
    },
    [music.id],
  );

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_EDIT_MENU, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={maskProps}
      bodyProps={bodyProps}
    >
      <Style
        style={{
          padding: `max(env(safe-area-inset-bottom, 10px), ${
            titleBarHeight + 10
          }px) 0 max(env(safe-area-inset-bottom, 10px), 10px) 0`,
        }}
        onClick={onClose}
      >
        <MusicInfo
          style={itemStyle}
          musicId={music.id}
          musicName={music.name}
          musicCover={getResizedImage({ url: music.cover, size: 80 })}
          singers={music.singers}
        />
        <MenuItem
          style={itemStyle}
          icon={<MdImage />}
          label={t('edit_cover')}
          onClick={() =>
            dialog.imageCut({
              title: t('edit_cover'),
              onConfirm: async (cover) => {
                if (!cover) {
                  notice.error(t('please_select_a_cover'));
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
                  emitMusicUpdated(music.id);
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
                title: t('reset_cover_question'),
                onConfirm: async () => {
                  try {
                    await updateMusic({
                      id: music.id,
                      key: AllowUpdateKey.COVER,
                      value: '',
                    });
                    emitMusicUpdated(music.id);
                  } catch (error) {
                    logger.error(error, 'Failed to reset cover of music');
                    dialog.alert({
                      content: error.message,
                    });
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
                  notice.error(t('please_enter_the_name'));
                  return false;
                }

                if (trimmedName !== music.name) {
                  try {
                    await updateMusic({
                      id: music.id,
                      key: AllowUpdateKey.NAME,
                      value: trimmedName,
                    });
                    emitMusicUpdated(music.id);
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
                    emitMusicUpdated(music.id);
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
                      emitMusicUpdated(music.id);
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
              optionsGetter: searchSinger,
              initialValue: music.singers.map(
                formatSingerToMultipleSelectOption,
              ),
              onConfirm: async (options) => {
                if (!options.length) {
                  notice.error(t('please_select_singers'));
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
                    emitMusicUpdated(music.id);
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
              acceptTypes: ASSET_TYPE_MAP[AssetType.MUSIC].acceptTypes,
              placeholder: t(
                'one_of_formats',
                ASSET_TYPE_MAP[AssetType.MUSIC].acceptTypes.join(','),
              ),
              onConfirm: async (file) => {
                if (!file) {
                  notice.error(t('please_select_a_file'));
                  return false;
                }
                try {
                  const { id } = await uploadAsset(file, AssetType.MUSIC);
                  await updateMusic({
                    id: music.id,
                    key: AllowUpdateKey.ASSET,
                    value: id,
                  });
                  emitMusicUpdated(music.id);
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
            dialog.multipleSelect<Music>({
              title: t('modify_fork_from'),
              label: t('fork_from'),
              optionsGetter: searchMusic,
              initialValue: music.forkFromList.map(
                formatMusicTouMultipleSelectOtion,
              ),
              onConfirm: async (options) => {
                if (
                  !stringArrayEqual(
                    music.forkFromList.map((m) => m.id).sort(),
                    options.map((o) => o.value.id).sort(),
                  )
                ) {
                  try {
                    await updateMusic({
                      id: music.id,
                      key: AllowUpdateKey.FORK_FROM,
                      value: options.map((o) => o.value.id),
                    });
                    emitMusicUpdated(music.id);
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
                    emitMusicUpdated(music.id);
                  } catch (error) {
                    logger.error(
                      error,
                      "Failed to update music's year of issue",
                    );
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
              return notice.error(
                t('music_forked_by_other_can_not_be_deleted'),
              );
            }
            return dialog.captcha({
              confirmText: t('delete_music'),
              confirmVariant: Variant.DANGER,
              onConfirm: async ({ captchaId, captchaValue }) => {
                try {
                  await deleteMusic({ id: music.id, captchaId, captchaValue });
                  playerEventemitter.emit(PlayerEventType.MUSIC_DELETED, {
                    id: music.id,
                  });
                } catch (error) {
                  logger.error(error, 'Failed to delete music');
                  notice.error(error.message);

                  return false;
                }
              },
            });
          }}
        />
      </Style>
    </Drawer>
  );
}

export default EditMenu;
