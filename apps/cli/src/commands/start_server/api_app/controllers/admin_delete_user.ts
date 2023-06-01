import { ExceptionCode } from '#/constants/exception';
import { getUserById } from '@/db/user';
import { getDB } from '@/db';
import {
  LOGIN_CODE_TABLE_NAME,
  LoginCodeProperty,
  MUSICBILL_COLLECTION_TABLE_NAME,
  MUSICBILL_MUSIC_TABLE_NAME,
  MUSICBILL_TABLE_NAME,
  MUSIC_MODIFY_RECORD_TABLE_NAME,
  MUSIC_PLAY_RECORD_TABLE_NAME,
  MUSIC_TABLE_NAME,
  MusicModifyRecordProperty,
  MusicPlayRecordProperty,
  MusicProperty,
  MusicbillCollectionProperty,
  MusicbillMusicProperty,
  MusicbillProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SINGER_MODIFY_RECORD_TABLE_NAME,
  SINGER_TABLE_NAME,
  SharedMusicbillProperty,
  SingerModifyRecordProperty,
  SingerProperty,
  USER_TABLE_NAME,
  UserProperty,
} from '@/constants/db_definition';
import { verifyCaptcha } from '@/platform/captcha';
import { getUserMusicbillList } from '@/db/musicbill';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const { id, captchaId, captchaValue } = ctx.query as {
    id?: unknown;
    captchaId?: unknown;
    captchaValue?: unknown;
  };
  if (
    typeof id !== 'string' ||
    !id.length ||
    typeof captchaId !== 'string' ||
    !captchaId.length ||
    typeof captchaValue !== 'string' ||
    !captchaValue.length
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const captchaVerified = await verifyCaptcha({
    id: captchaId,
    value: captchaValue,
  });
  if (!captchaVerified) {
    return ctx.except(ExceptionCode.CAPTCHA_ERROR);
  }

  const user = await getUserById(id, [UserProperty.ID, UserProperty.ADMIN]);
  if (!user) {
    return ctx.except(ExceptionCode.USER_NOT_EXIST);
  }
  if (user.admin) {
    return ctx.except(ExceptionCode.ADMIN_USER_CAN_NOT_BE_DELETED);
  }

  /**
   * 1. 删除数据库相关记录, 注意外键依赖顺序
   * 2. 转移所有权
   * @author mebtte<hi@mebtte.com>
   */
  const musicbillList = await getUserMusicbillList(id, [MusicbillProperty.ID]);
  await Promise.all([
    musicbillList.length
      ? getDB().run(
          `
            DELETE FROM ${MUSICBILL_MUSIC_TABLE_NAME}
            WHERE ${MusicbillMusicProperty.MUSICBILL_ID} IN ( ${musicbillList
            .map(() => '?')
            .join(', ')} )
          `,
          musicbillList.map((mb) => mb.id),
        )
      : null,
    getDB().run(
      `
        DELETE FROM ${SHARED_MUSICBILL_TABLE_NAME}
        WHERE ${SharedMusicbillProperty.SHARED_USER_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${LOGIN_CODE_TABLE_NAME}
        WHERE ${LoginCodeProperty.USER_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${LOGIN_CODE_TABLE_NAME}
        WHERE ${LoginCodeProperty.USER_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${MUSIC_PLAY_RECORD_TABLE_NAME}
        WHERE ${MusicPlayRecordProperty.USER_ID} = ?
      `,
      [id],
    ),
    getDB().run(
      `
        DELETE FROM ${MUSICBILL_COLLECTION_TABLE_NAME}
        WHERE ${MusicbillCollectionProperty.USER_ID} = ?
      `,
      [id],
    ),
  ]);
  await Promise.all([
    getDB().run(
      `
        DELETE FROM ${MUSICBILL_TABLE_NAME}
        WHERE ${MusicPlayRecordProperty.USER_ID} = ?
      `,
      [id],
    ),

    // 转移所有权
    getDB().run(
      `
        UPDATE ${MUSIC_TABLE_NAME} SET ${MusicProperty.CREATE_USER_ID} = ?
        WHERE ${MusicProperty.CREATE_USER_ID} = ?
      `,
      [ctx.user.id, id],
    ),
    getDB().run(
      `
        UPDATE ${MUSIC_MODIFY_RECORD_TABLE_NAME} SET ${MusicModifyRecordProperty.MODIFY_USER_ID} = ?
        WHERE ${MusicModifyRecordProperty.MODIFY_USER_ID} = ?
      `,
      [ctx.user.id, id],
    ),
    getDB().run(
      `
        UPDATE ${SINGER_TABLE_NAME} SET ${SingerProperty.CREATE_USER_ID} = ?
        WHERE ${SingerProperty.CREATE_USER_ID} = ?
      `,
      [ctx.user.id, id],
    ),
    getDB().run(
      `
        UPDATE ${SINGER_MODIFY_RECORD_TABLE_NAME} SET ${SingerModifyRecordProperty.MODIFY_USER_ID} = ?
        WHERE ${SingerModifyRecordProperty.MODIFY_USER_ID} = ?
      `,
      [ctx.user.id, id],
    ),
  ]);
  await getDB().run(
    `
      DELETE FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.ID} = ?
    `,
    [id],
  );

  return ctx.success(null);
};
