import { ALIAS_DIVIDER, AssetType } from '#/constants';
import { ExceptionCode } from '#/constants/exception';
import {
  ALIAS_MAX_LENGTH,
  AllowUpdateKey,
  NAME_MAX_LENGTH,
  SINGER_ALIAS_MAX_COUNT,
} from '#/constants/singer';
import exist from '#/utils/exist';
import {
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MUSIC_TABLE_NAME,
  MusicProperty,
  MusicSingerRelation,
  MusicSingerRelationProperty,
  SINGER_MODIFY_RECORD_TABLE_NAME,
  Singer,
  SingerModifyRecordProperty,
  SingerProperty,
} from '@/constants/db_definition';
import { updateSinger } from '@/db/singer';
import { getAssetFilePath } from '@/platform/asset';
import { getDB } from '@/db';
import getSingerById from '@/db/get_singer_by_id';
import { Context } from '../constants';

function saveSingerModifyRecord({
  singerId,
  key,
  modifyUserId,
}: {
  singerId: string;
  key: AllowUpdateKey;
  modifyUserId: string;
}) {
  return getDB().run(
    `
      INSERT INTO ${SINGER_MODIFY_RECORD_TABLE_NAME} ( ${SingerModifyRecordProperty.SINGER_ID}, ${SingerModifyRecordProperty.KEY}, ${SingerModifyRecordProperty.MODIFY_USER_ID}, ${SingerModifyRecordProperty.MODIFY_TIMESTAMP})
      VALUES ( ?, ?, ?, ? )
    `,
    [singerId, key, modifyUserId, Date.now()],
  );
}

type LocalSinger = Pick<
  Singer,
  | SingerProperty.ID
  | SingerProperty.AVATAR
  | SingerProperty.NAME
  | SingerProperty.ALIASES
  | SingerProperty.CREATE_USER_ID
>;
const ALLOW_UPDATE_KEYS = Object.values(AllowUpdateKey);
const KEY_MAP_HANDLER: Record<
  AllowUpdateKey,
  ({
    ctx,
    singer,
    value,
  }: {
    ctx: Context;
    singer: LocalSinger;
    value: unknown;
  }) => Promise<void>
> = {
  [AllowUpdateKey.NAME]: async ({ ctx, singer, value: name }) => {
    if (
      typeof name !== 'string' ||
      !name.length ||
      name.length > NAME_MAX_LENGTH ||
      name.trim() !== name
    ) {
      return ctx.except(ExceptionCode.WRONG_PARAMETER);
    }

    if (singer.name === name) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.NAME,
        value: name,
      }),
      saveSingerModifyRecord({
        singerId: singer.id,
        key: AllowUpdateKey.NAME,
        modifyUserId: ctx.user.id,
      }),
    ]);

    return ctx.success(null);
  },
  [AllowUpdateKey.ALIASES]: async ({ ctx, singer, value }) => {
    if (
      !Array.isArray(value) ||
      value.length > SINGER_ALIAS_MAX_COUNT ||
      value.find((a) => typeof a !== 'string' || a.length > ALIAS_MAX_LENGTH)
    ) {
      return ctx.except(ExceptionCode.WRONG_PARAMETER);
    }

    const trimmedAliases: string[] = value.map((v) =>
      v.replace(/\s+/g, ' ').trim(),
    );
    if (trimmedAliases.find((a) => a.length === 0)) {
      return ctx.except(ExceptionCode.WRONG_PARAMETER);
    }

    const aliases = value.join(ALIAS_DIVIDER);
    if (singer.aliases === aliases) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.ALIASES,
        value: aliases,
      }),
      saveSingerModifyRecord({
        singerId: singer.id,
        key: AllowUpdateKey.ALIASES,
        modifyUserId: ctx.user.id,
      }),
    ]);

    return ctx.success(null);
  },
  [AllowUpdateKey.AVATAR]: async ({ ctx, singer, value: avatar }) => {
    if (typeof avatar !== 'string') {
      return ctx.except(ExceptionCode.WRONG_PARAMETER);
    }
    if (singer.avatar === avatar) {
      return ctx.except(ExceptionCode.NO_NEED_TO_UPDATE);
    }

    if (avatar.length) {
      const avatarExist = await exist(
        getAssetFilePath(avatar, AssetType.SINGER_AVATAR),
      );
      if (!avatarExist) {
        return ctx.except(ExceptionCode.ASSET_NOT_EXISTED);
      }
    }

    await Promise.all([
      updateSinger({
        id: singer.id,
        property: SingerProperty.AVATAR,
        value: avatar,
      }),
      saveSingerModifyRecord({
        singerId: singer.id,
        key: AllowUpdateKey.AVATAR,
        modifyUserId: ctx.user.id,
      }),
    ]);

    return ctx.success(null);
  },
};

export default async (ctx: Context) => {
  const { id, key, value } = ctx.request.body as {
    id: unknown;
    key: unknown;
    value: unknown;
  };
  if (
    typeof id !== 'string' ||
    // @ts-expect-error
    !ALLOW_UPDATE_KEYS.includes(key)
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const singer: LocalSinger | null = await getSingerById(id, [
    SingerProperty.ID,
    SingerProperty.AVATAR,
    SingerProperty.NAME,
    SingerProperty.ALIASES,
    SingerProperty.CREATE_USER_ID,
  ]);
  if (!singer) {
    return ctx.except(ExceptionCode.SINGER_NOT_EXISTED);
  }
  if (!ctx.user.admin && singer.createUserId !== ctx.user.id) {
    const editable = await getDB().get<
      Pick<MusicSingerRelation, MusicSingerRelationProperty.ID>
    >(
      `
        SELECT
          msr.${MusicSingerRelationProperty.ID}
        FROM ${MUSIC_SINGER_RELATION_TABLE_NAME} AS msr
        LEFT JOIN ${MUSIC_TABLE_NAME} AS m
          ON m.${MusicProperty.ID} = msr.${MusicSingerRelationProperty.MUSIC_ID}
            AND m.${MusicProperty.CREATE_USER_ID} = ?
        WHERE msr.${MusicSingerRelationProperty.SINGER_ID} = ?
        LIMIT 1
      `,
      [ctx.user.id, id],
    );
    if (!editable) {
      return ctx.except(ExceptionCode.SINGER_NOT_EXISTED);
    }
  }

  // @ts-expect-error
  return KEY_MAP_HANDLER[key]({ ctx, singer, value });
};
