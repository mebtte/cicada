import { ALIAS_DIVIDER } from '#/constants';
import { Singer, SingerProperty } from '@/constants/db_definition';
import { getDB } from '@/db';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const singerList = await getDB().all<
    Pick<
      Singer,
      | SingerProperty.ID
      | SingerProperty.ALIASES
      | SingerProperty.CREATE_TIMESTAMP
      | SingerProperty.NAME
    > & {
      musicCount: number;
    }
  >(
    `
      SELECT
        s.id,
        s.name,
        s.aliases,
        s.createTimestamp,
        count(msr.id) as musicCount
      FROM singer as s
      LEFT JOIN music_singer_relation as msr
        ON s.id = msr.singerId
      WHERE s.createUserId = ?
      GROUP BY s.id
      ORDER BY createTimestamp DESC
    `,
    [ctx.user.id],
  );

  return ctx.success(
    singerList.map((s) => ({
      ...s,
      aliases: s.aliases ? s.aliases.split(ALIAS_DIVIDER) : [],
    })),
  );
};
