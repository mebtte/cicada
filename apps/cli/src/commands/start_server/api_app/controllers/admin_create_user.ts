import { ExceptionCode } from '#/constants/exception';
import { getDB } from '@/db';
import generateRandomInteger from '#/utils/generate_random_integer';
import {
  PASSWORD_MAX_LENGTH,
  REMARK_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '#/constants/user';
import { USER_TABLE_NAME, UserProperty } from '@/constants/db_definition';
import getUserByUsername from '@/db/get_user_by_username';
import md5 from 'md5';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const {
    username,
    password,
    remark = '',
  } = ctx.request.body as {
    username?: unknown;
    password?: unknown;
    remark?: unknown;
  };

  if (
    typeof username !== 'string' ||
    !username.length ||
    username.length > USERNAME_MAX_LENGTH ||
    typeof password !== 'string' ||
    !password.length ||
    password.length > PASSWORD_MAX_LENGTH ||
    typeof remark !== 'string' ||
    remark.length > REMARK_MAX_LENGTH
  ) {
    return ctx.except(ExceptionCode.WRONG_PARAMETER);
  }

  const user = await getUserByUsername(username, [UserProperty.ID]);
  if (user) {
    return ctx.except(ExceptionCode.USERNAME_ALREADY_REGISTERED);
  }

  const id = generateRandomInteger(1_0000, 1000_0000).toString();
  await getDB().run(
    `
      INSERT INTO ${USER_TABLE_NAME} ( ${UserProperty.ID}, ${UserProperty.USERNAME}, ${UserProperty.PASSWORD}, ${UserProperty.NICKNAME}, ${UserProperty.JOIN_TIMESTAMP}, ${UserProperty.REMARK} )
      VALUES ( ?, ?, ?, ?, ?, ? )
    `,
    [id, username, md5(md5(password)), username, Date.now(), remark],
  );

  return ctx.success(null);
};
