import { ExceptionCode } from '#/constants/exception';
import { Response } from '#/server/api/get_singer_modify_record_list';
import { getDB } from '@/db';
import getSingerById from '@/db/get_singer_by_id';
import {
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MUSIC_TABLE_NAME,
  MusicProperty,
  MusicSingerRelation,
  MusicSingerRelationProperty,
  SINGER_MODIFY_RECORD_TABLE_NAME,
  SingerModifyRecord,
  SingerModifyRecordProperty,
  SingerProperty,
  USER_TABLE_NAME,
  User,
  UserProperty,
} from '@/constants/db_definition';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id } = ctx.query as { id?: unknown };
  if (typeof id !== 'string' || !id.length) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const singer = await getSingerById(id, [SingerProperty.CREATE_USER_ID]);
  if (!singer) {
    return ctx.except(ExceptionCode.SINGER_NOT_EXIST);
  }
  if (singer.createUserId !== ctx.user.id) {
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
      return ctx.except(ExceptionCode.SINGER_NOT_EXIST);
    }
  }

  const modifyRecordList = await getDB().all<
    Pick<
      SingerModifyRecord,
      | SingerModifyRecordProperty.ID
      | SingerModifyRecordProperty.KEY
      | SingerModifyRecordProperty.MODIFY_USER_ID
      | SingerModifyRecordProperty.MODIFY_TIMESTAMP
    > & {
      modifyUserNickname: User[UserProperty.NICKNAME];
    }
  >(
    `
      SELECT
        smr.${SingerModifyRecordProperty.ID},
        smr.${SingerModifyRecordProperty.KEY},
        smr.${SingerModifyRecordProperty.MODIFY_USER_ID},
        smr.${SingerModifyRecordProperty.MODIFY_TIMESTAMP},
        u.${UserProperty.NICKNAME} AS modifyUserNickname
      FROM ${SINGER_MODIFY_RECORD_TABLE_NAME} AS smr
      LEFT JOIN ${USER_TABLE_NAME} AS u
        ON smr.${SingerModifyRecordProperty.MODIFY_USER_ID} = u.${UserProperty.ID}
      WHERE smr.${SingerModifyRecordProperty.SINGER_ID} = ?
      ORDER BY smr.${SingerModifyRecordProperty.MODIFY_TIMESTAMP} DESC
    `,
    [id],
  );
  return ctx.success<Response>(modifyRecordList);
};
