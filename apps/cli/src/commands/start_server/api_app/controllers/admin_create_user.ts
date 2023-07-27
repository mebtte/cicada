import day from '#/utils/day';
import { ExceptionCode } from '#/constants/exception';
import { EMAIL } from '#/constants/regexp';
import { getDB } from '@/db';
import generateRandomInteger from '#/utils/generate_random_integer';
import { REMARK_MAX_LENGTH } from '#/constants/user';
import { sendEmail } from '@/platform/email';
import { getUserByEmail } from '@/db/user';
import { USER_TABLE_NAME, UserProperty } from '@/constants/db_definition';
import capitalize from '#/utils/capitalize';
import upperCaseFirstLetter from '#/utils/upper_case_first_letter';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const {
    email,
    remark = '',
    accessOrigin,
  } = ctx.request.body as {
    email?: unknown;
    remark?: unknown;
    accessOrigin?: string;
  };

  if (
    typeof email !== 'string' ||
    !EMAIL.test(email) ||
    typeof remark !== 'string' ||
    remark.length > REMARK_MAX_LENGTH ||
    typeof accessOrigin !== 'string'
  ) {
    return ctx.except(ExceptionCode.PARAMETER_ERROR);
  }

  const user = await getUserByEmail(email, [UserProperty.ID]);
  if (user) {
    return ctx.except(ExceptionCode.EMAIL_ALREADY_REGISTERED);
  }

  await sendEmail({
    to: email,
    title: upperCaseFirstLetter(
      ctx.t('welcome_to', capitalize(ctx.t('cicada'))),
    ),
    html: `
      Hi,
      <br>
      <br>
      ${upperCaseFirstLetter(
        ctx.t(
          'new_user_email_content',
          `<a href="${accessOrigin}">${ctx.t('cicada')}</a>`,
        ),
      )}
      <br>
      <br>
      ${capitalize(ctx.t('cicada'))}
      <br>
      ${day(new Date()).format('YYYY-MM-DD HH:mm')}
    `,
    fromName: capitalize(ctx.t('cicada')),
  });

  const id = generateRandomInteger(1_0000, 1000_0000).toString();
  await getDB().run(
    `
      INSERT INTO ${USER_TABLE_NAME} ( ${UserProperty.ID}, ${UserProperty.EMAIL}, ${UserProperty.NICKNAME}, ${UserProperty.JOIN_TIMESTAMP}, ${UserProperty.REMARK} )
      VALUES ( ?, ?, ?, ?, ? )
    `,
    [id, email, id, Date.now(), remark],
  );

  return ctx.success(null);
};
