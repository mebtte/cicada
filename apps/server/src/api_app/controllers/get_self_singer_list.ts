import { ALIAS_DIVIDER } from '#/constants';
import { getDB } from '@/db';
import { Singer, Property } from '@/db/singer';
import { Context } from '../constants';

export default async (ctx: Context) => {
  const singerList = await getDB().all<
    Pick<
      Singer,
      Property.ID | Property.ALIASES | Property.CREATE_TIMESTAMP | Property.NAME
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
      GROUP BY msr.singerId
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
