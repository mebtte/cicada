import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import {
  getMusicbillById,
  Property as MusicbillProperty,
} from '@/db/musicbill';
import { Music, Property as MusicProperty } from '@/db/music';
import {
  getSingerListInMusicIds,
  Property as SingerProperty,
} from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import { getAssetUrl } from '@/platform/asset';
import db from '@/db';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: string };

  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const musicbill = await getMusicbillById(id, [
    MusicbillProperty.ID,
    MusicbillProperty.USER_ID,
    MusicbillProperty.COVER,
    MusicbillProperty.NAME,
    MusicbillProperty.PUBLIC,
    MusicbillProperty.CREATE_TIMESTAMP,
  ]);

  if (!musicbill || musicbill.userId !== ctx.user.id) {
    return ctx.except(ExceptionCode.MUSICBILL_NOT_EXIST);
  }

  const musicList = await db.all<
    Pick<
      Music,
      | MusicProperty.ID
      | MusicProperty.TYPE
      | MusicProperty.NAME
      | MusicProperty.ALIASES
      | MusicProperty.COVER
      | MusicProperty.SQ
      | MusicProperty.HQ
      | MusicProperty.AC
    >
  >(
    `
      select
        m.id,
        m.type,
        m.name,
        m.aliases,
        m.cover,
        m.sq,
        m.hq,
        m.ac
      from
        musicbill_music as mm
        left join music as m on mm.musicId = m.id 
      where
        mm.musicbillId = ? 
      order by
        mm.addTimestamp desc;
    `,
    [id],
  );

  const musicIdMapSingers: {
    [key: string]: {
      id: string;
      name: string;
      aliases: string[];
      avatar: string;
    }[];
  } = {};
  if (musicList.length) {
    const allSingerList = await getSingerListInMusicIds(
      Array.from(new Set(musicList.map((m) => m.id))),
      [
        SingerProperty.ID,
        SingerProperty.AVATAR,
        SingerProperty.NAME,
        SingerProperty.ALIASES,
      ],
    );
    for (const singer of allSingerList) {
      if (!musicIdMapSingers[singer.musicId]) {
        musicIdMapSingers[singer.musicId] = [];
      }
      musicIdMapSingers[singer.musicId].push({
        ...excludeProperty(singer, ['musicId']),
        avatar: getAssetUrl(singer.avatar, AssetType.SINGER_AVATAR),
        aliases: singer.aliases ? singer.aliases.split(ALIAS_DIVIDER) : [],
      });
    }
  }

  return ctx.success({
    ...excludeProperty(musicbill, [MusicbillProperty.USER_ID]),
    cover: getAssetUrl(musicbill.cover, AssetType.MUSICBILL_COVER),
    musicList: musicList.map((m) => ({
      ...m,
      aliases: m.aliases ? m.aliases.split(ALIAS_DIVIDER) : [],
      cover: getAssetUrl(m.cover, AssetType.MUSIC_COVER),
      sq: getAssetUrl(m.sq, AssetType.MUSIC_SQ),
      hq: getAssetUrl(m.hq, AssetType.MUSIC_HQ),
      ac: getAssetUrl(m.ac, AssetType.MUSIC_AC),
      singers: musicIdMapSingers[m.id] || [],
    })),
  });
};
