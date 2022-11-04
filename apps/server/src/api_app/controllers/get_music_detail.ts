import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import excludeProperty from '#/utils/exclude_property';
import {
  getMusicById,
  getMusicListByIds,
  Music,
  Property as MusicProperty,
} from '@/db/music';
import {
  getMusicForkFromList,
  getMusicForkList,
  Property as MusicForkProperty,
} from '@/db/music_fork';
import {
  getSingerListInMusicIds,
  Property as SingerProperty,
  Singer,
} from '@/db/singer';
import { getUserById, Property as UserProperty } from '@/db/user';
import { getAssetUrl } from '@/platform/asset';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const music = await getMusicById(id, [
    MusicProperty.ID,
    MusicProperty.NAME,
    MusicProperty.ALIASES,
    MusicProperty.COVER,
    MusicProperty.CREATE_TIMESTAMP,
    MusicProperty.CREATE_USER_ID,
    MusicProperty.TYPE,
    MusicProperty.SQ,
    MusicProperty.HQ,
    MusicProperty.AC,
    MusicProperty.EFFECTIVE_PLAY_TIMES,
  ]);
  if (!music) {
    return ctx.except(ExceptionCode.MUSIC_NOT_EXIST);
  }
  const [createUser, forkList, forkFromList] = await Promise.all([
    getUserById(music.createUserId, [
      UserProperty.ID,
      UserProperty.AVATAR,
      UserProperty.NICKNAME,
    ]),
    getMusicForkList(id, [MusicForkProperty.MUSIC_ID]),
    getMusicForkFromList(id, [MusicForkProperty.FORK_FROM]),
  ]);

  const [allSingerList, musicList = []] = await Promise.all([
    getSingerListInMusicIds(
      Array.from([
        id,
        ...forkList.map((f) => f.musicId),
        ...forkFromList.map((f) => f.forkFrom),
      ]),
      [
        SingerProperty.ALIASES,
        SingerProperty.ID,
        SingerProperty.AVATAR,
        SingerProperty.NAME,
      ],
    ),
    forkList.length || forkFromList.length
      ? getMusicListByIds(
          Array.from(
            new Set([
              ...forkList.map((f) => f.musicId),
              ...forkFromList.map((f) => f.forkFrom),
            ]),
          ),
          [
            MusicProperty.ID,
            MusicProperty.TYPE,
            MusicProperty.NAME,
            MusicProperty.ALIASES,
            MusicProperty.COVER,
            MusicProperty.SQ,
            MusicProperty.HQ,
            MusicProperty.AC,
          ],
        )
      : undefined,
  ]);
  const musicIdMapSingerList: {
    [key: string]: (Pick<
      Singer,
      SingerProperty.ID | SingerProperty.NAME | SingerProperty.AVATAR
    > & {
      aliases: string[];
    })[];
  } = {};
  allSingerList.forEach((s) => {
    if (!musicIdMapSingerList[s.musicId]) {
      musicIdMapSingerList[s.musicId] = [];
    }
    musicIdMapSingerList[s.musicId].push({
      ...excludeProperty(s, ['musicId']),
      avatar: getAssetUrl(s.avatar, AssetType.SINGER_AVATAR),
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
    });
  });

  const musicIdMapMusic: {
    [key: string]: Pick<
      Music,
      | MusicProperty.ID
      | MusicProperty.TYPE
      | MusicProperty.NAME
      | MusicProperty.ALIASES
      | MusicProperty.COVER
      | MusicProperty.SQ
      | MusicProperty.HQ
      | MusicProperty.AC
    > & {
      singers: (Pick<
        Singer,
        SingerProperty.ID | SingerProperty.NAME | SingerProperty.AVATAR
      > & {
        aliases: string[];
      })[];
    };
  } = {};
  musicList.forEach((m) => {
    musicIdMapMusic[m.id] = {
      ...m,
      cover: getAssetUrl(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetUrl(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetUrl(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetUrl(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSingerList[m.id] || [],
    };
  });

  return ctx.success({
    ...excludeProperty(music, [MusicProperty.CREATE_USER_ID]),
    aliases: music.aliases ? music.aliases.split(ALIAS_DIVIDER) : [],
    cover: getAssetUrl(music.cover, AssetType.MUSIC_COVER),
    sq: getAssetUrl(music.sq, AssetType.MUSIC_SQ),
    hq: getAssetUrl(music.hq, AssetType.MUSIC_HQ),
    ac: getAssetUrl(music.ac, AssetType.MUSIC_AC),
    singers: musicIdMapSingerList[id] || [],
    createUser: {
      ...createUser,
      avatar: getAssetUrl(createUser!.avatar, AssetType.USER_AVATAR),
    },
    forkList: forkList.map((f) => musicIdMapMusic[f.musicId]),
    forkFromList: forkFromList.map((f) => musicIdMapMusic[f.forkFrom]),
  });
};
