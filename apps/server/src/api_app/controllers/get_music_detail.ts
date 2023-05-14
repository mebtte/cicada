import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import excludeProperty from '#/utils/exclude_property';
import {
  Music,
  MusicProperty,
  SingerProperty,
  Singer,
  UserProperty,
} from '@/constants/db_definition';
import { getMusicById, getMusicListByIds } from '@/db/music';
import {
  getMusicForkFromList,
  getMusicForkList,
  Property as MusicForkProperty,
} from '@/db/music_fork';
import { getSingerListInMusicIds } from '@/db/singer';
import { getUserById } from '@/db/user';
import { getAssetPublicPath } from '@/platform/asset';
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
    MusicProperty.CREATE_TIMESTAMP,
    MusicProperty.CREATE_USER_ID,
    MusicProperty.TYPE,
    MusicProperty.HEAT,
    MusicProperty.COVER,
    MusicProperty.ASSET,
    MusicProperty.YEAR,
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
          [MusicProperty.ID, MusicProperty.NAME, MusicProperty.COVER],
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
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
    });
  });

  const musicIdMapMusic: {
    [key: string]: Pick<
      Music,
      MusicProperty.ID | MusicProperty.NAME | MusicProperty.COVER
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
      singers: musicIdMapSingerList[m.id] || [],
    };
  });

  return ctx.success({
    ...excludeProperty(music, [MusicProperty.CREATE_USER_ID]),
    cover: getAssetPublicPath(music.cover, AssetType.MUSIC_COVER),
    asset: getAssetPublicPath(music.asset, AssetType.MUSIC),
    aliases: music.aliases ? music.aliases.split(ALIAS_DIVIDER) : [],
    singers: (musicIdMapSingerList[id] || []).map((s) => ({
      ...s,
      avatar: getAssetPublicPath(s.avatar, AssetType.SINGER_AVATAR),
    })),
    createUser,
    forkList: forkList
      .map((f) => musicIdMapMusic[f.musicId])
      .map((m) => ({
        ...m,
        cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      })),
    forkFromList: forkFromList
      .map((f) => musicIdMapMusic[f.forkFrom])
      .map((m) => ({
        ...m,
        cover: getAssetPublicPath(m.cover, AssetType.MUSIC_COVER),
      })),
  });
};
