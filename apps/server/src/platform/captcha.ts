import { CAPTCHA_TTL } from '#/constants';
import { getDB } from '@/db';

export function saveCaptcha({ id, value }: { id: string; value: string }) {
  return getDB().run(
    'insert into captcha(id, value, createTimestamp) values(?, ?, ?)',
    [id, value, Date.now()],
  );
}

export async function verifyCaptcha({
  id,
  value,
}: {
  id: string;
  value: string;
}): Promise<boolean> {
  const captcha = await getDB().get<{
    id: string;
    value: string;
  }>(
    `
    select
      id,
      value
    from captcha
      where id = ?
        and createTimestamp >= ?
        and used = 0;
  `,
    [id, Date.now() - CAPTCHA_TTL],
  );

  if (!captcha) {
    return false;
  }

  /**
   * 无论验证成功与否
   * 都需要记录已使用
   */
  getDB()
    .run('update captcha set used = 1 where id = ?', [id])
    .catch((error) => console.error(error));

  if (value.toLowerCase() !== captcha.value.toLowerCase()) {
    return false;
  }

  return true;
}
