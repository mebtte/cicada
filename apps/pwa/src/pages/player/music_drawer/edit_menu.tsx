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
import { Music, ZIndex } from '../constants';
import { MusicDetail } from './constants';
import e, { EventType } from './eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
  EditDialogType,
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

const Style = styled.div`
  ${absoluteFullSize}

  overflow: auto;
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
        <MusicInfo music={music} />
        <MenuItem
          icon={<MdImage />}
          label="编辑封面"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              title: '编辑封面',
              type: EditDialogType.COVER,
              onSubmit: async (cover: Blob | undefined) => {
                if (typeof cover === 'undefined') {
                  throw new Error('请选择封面');
                }
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
              },
            })
          }
        />
        {music.cover.length ? (
          <MenuItem
            icon={<MdImage />}
            label="重置封面"
            onClick={() =>
              dialog.confirm({
                title: '确定重置封面吗?',
                content: '重置后音乐将使用默认封面',
                onConfirm: async () => {
                  try {
                    await updateMusic({
                      id: music.id,
                      key: AllowUpdateKey.COVER,
                      value: '',
                    });
                    emitMusicUpdated(music.id);
                  } catch (error) {
                    logger.error(error, '重置音乐封面失败');
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
          icon={<MdTitle />}
          label="编辑名字"
          onClick={() =>
            dialog.input({
              title: '编辑名字',
              label: '名字',
              initialValue: music.name,
              maxLength: NAME_MAX_LENGTH,
              onConfirm: async (name: string) => {
                const trimmedName = name.replace(/\s+/g, ' ').trim();
                if (!trimmedName.length) {
                  notice.error('请输入名字');
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
                    logger.error(error, '更新音乐名字失败');
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdTextFields />}
          label="编辑别名"
          onClick={() =>
            dialog.inputList({
              title: '编辑别名',
              label: '别名',
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
                    logger.error(error, "Updating music's aliases fail");
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
            icon={<MdTextFields />}
            label="编辑歌词"
            onClick={() =>
              playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
                type: EditDialogType.TEXTAREA_LIST,
                title: '编辑歌词',
                label: '歌词',
                initialValue: music.lyrics.map((l) => l.lrc),
                max: MUSIC_MAX_LRYIC_AMOUNT,
                maxLength: LYRIC_MAX_LENGTH,
                placeholder: 'LRC 格式的文本',
                onSubmit: async (lyrics: string[]) => {
                  const trimmedLyrics = lyrics
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0);

                  if (
                    !stringArrayEqual(
                      trimmedLyrics,
                      music.lyrics.map((l) => l.lrc),
                    )
                  ) {
                    await updateMusic({
                      id: music.id,
                      key: AllowUpdateKey.LYRIC,
                      value: trimmedLyrics,
                    });
                    emitMusicUpdated(music.id);
                  }
                },
              })
            }
          />
        ) : null}
        <MenuItem
          icon={<MdGroup />}
          label="编辑歌手列表"
          onClick={() =>
            dialog.multipleSelect<Singer>({
              label: '歌手列表',
              labelAddon: <MissingSinger />,
              title: '编辑歌手列表',
              optionsGetter: searchSinger,
              initialValue: music.singers.map(
                formatSingerToMultipleSelectOption,
              ),
              onConfirm: async (options) => {
                if (!options.length) {
                  notice.error('请选择歌手');
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
                    logger.error(error, '更新歌手列表失败');
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdOutlineFilePresent />}
          label="编辑音乐文件"
          onClick={() =>
            dialog.fileSelect({
              title: '编辑音乐文件',
              label: '音乐文件',
              acceptTypes: ASSET_TYPE_MAP[AssetType.MUSIC].acceptTypes,
              placeholder: `选择文件, 支持以下类型 ${ASSET_TYPE_MAP[
                AssetType.MUSIC
              ].acceptTypes.join(',')}`,
              onConfirm: async (file) => {
                if (!file) {
                  notice.error('请选择文件');
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
                  logger.error(error, 'Updating music asset fail');
                  notice.error(error.message);
                  return false;
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdCallSplit />}
          label="编辑二次创作来源"
          onClick={() =>
            dialog.multipleSelect<Music>({
              title: '二次创作来源',
              label: '创作来源自以下音乐',
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
                    logger.error(error, '更新二次创作来源失败');
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdOutlineCalendarToday />}
          label="编辑发行年份"
          onClick={() =>
            dialog.input({
              title: '编辑发行年份',
              label: '发行年份',
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
                  notice.error(`发行年份应在 ${YEAR_MIN}-${YEAR_MAX} 范围内`);
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
                    logger.error(error, '更新音乐发行年份失败');
                    notice.error(error.message);
                    return false;
                  }
                }
              },
            })
          }
        />
        <MenuItem
          icon={<MdDelete style={dangerousIconStyle} />}
          label="删除"
          onClick={() => {
            if (music.forkList.length) {
              return notice.error('被二次创作的音乐无法被删除');
            }
            return dialog.captcha({
              confirmText: '删除音乐',
              confirmVariant: Variant.DANGER,
              onConfirm: async ({ captchaId, captchaValue }) => {
                try {
                  await deleteMusic({ id: music.id, captchaId, captchaValue });
                  playerEventemitter.emit(PlayerEventType.MUSIC_DELETED, {
                    id: music.id,
                  });
                } catch (error) {
                  logger.error(error, '删除音乐失败');
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
