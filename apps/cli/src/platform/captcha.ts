import captcha from 'svg-captcha';
import { CAPTCHA_TTL } from '#/constants';
import generateRandomString from '#/utils/generate_random_string';
import { getDB } from '@/db';
import { CaptchaProperty, CAPTCHA_TABLE_NAME } from '@/constants/db_definition';

export async function create() {
  const id = generateRandomString(8, false);
  const captchaData = captcha.create({
    size: 5,
    ignoreChars: '0oO1IlL2zZ',
    noise: 4,
  });
  await getDB().run(
    `
      INSERT INTO ${CAPTCHA_TABLE_NAME} (${CaptchaProperty.ID}, ${CaptchaProperty.VALUE}, ${CaptchaProperty.CREATE_TIMESTAMP})
      VALUES (?, ?, ?)
    `,
    [id, captchaData.text, Date.now()],
  );
  return { id, svg: captchaData.data };
}

export async function verify({
  id,
  value,
}: {
  id: string;
  value: string;
}): Promise<boolean> {
  const captchaData = await getDB().get<{
    id: string;
    value: string;
  }>(
    `
      SELECT
        ${CaptchaProperty.ID},
        ${CaptchaProperty.VALUE}
      FROM ${CAPTCHA_TABLE_NAME}
      WHERE ${CaptchaProperty.ID} = ?
        AND ${CaptchaProperty.CREATE_TIMESTAMP} >= ?
        AND ${CaptchaProperty.USED} = 0;
    `,
    [id, Date.now() - CAPTCHA_TTL],
  );

  if (!captchaData) {
    return false;
  }

  /**
   * 无论验证成功与否
   * 都需要记录已使用
   * @author mebtte<hi@mebtte.com>
   */
  getDB()
    .run(
      `
        UPDATE ${CAPTCHA_TABLE_NAME} SET ${CaptchaProperty.USED} = 1
        WHERE ${CaptchaProperty.ID} = ?
      `,
      [id],
    )
    .catch((error) => console.error(error));

  if (value.toLowerCase() === captchaData.value.toLowerCase()) {
    return true;
  }

  return false;
}
