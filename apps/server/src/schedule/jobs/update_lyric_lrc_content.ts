import withTimeout from '#/utils/with_timeout';
import db from '@/db';
import { Lyric, Property } from '@/db/lyric';
import { parse, LineType, LyricLine } from 'clrc';

type LocalLyric = Pick<
  Lyric,
  Property.ID | Property.LRC | Property.LRC_CONTENT
>;

async function updateLyricLrcContent() {
  let lyricList: LocalLyric[] = [];
  let lastMaxId = 0;
  do {
    lyricList = await db.all<LocalLyric>(
      `
        SELECT
          id,
          lrc,
          lrcContent
        FROM lyric
        WHERE id > ?
        ORDER BY id
        LIMIT 200
      `,
      [lastMaxId],
    );

    if (lyricList.length) {
      lastMaxId = lyricList[lyricList.length - 1].id;

      for (const lyric of lyricList) {
        const lrcContent = parse(lyric.lrc)
          .filter((l) => l.type === LineType.LYRIC)
          .map((line) =>
            (line as LyricLine).content.replace(/\s+/g, ' ').trim(),
          )
          .join('\n');
        if (lyric.lrcContent !== lrcContent) {
          await db.run(
            `
              UPDATE lyric
              SET lrcContent = ?
              WHERE id = ?
            `,
            [lrcContent, lyric.id],
          );
        }
      }
    }
  } while (lyricList.length);
}

export default withTimeout(updateLyricLrcContent, 60 * 1000);
