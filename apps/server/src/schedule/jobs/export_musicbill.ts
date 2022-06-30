import { encode } from 'html-entities';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';
import withTimeout from '#/utils/with_timeout';
import db from '@/db';
import { getUserById, User, Property as UserProperty } from '@/db/user';
import { Music, Property as MusicProperty } from '@/db/music';
import { sendEmail } from '@/platform/email';
import day from '#/utils/day';
import { AssetType, BRAND_NAME, MUSICBILL_EXPORT_TTL } from '#/constants';
import { getTemporaryPath, getTemporaryUrl } from '@/platform/temporary';
import {
  getSingerListInMusicIds,
  Singer,
  Property as SingerProperty,
} from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import { getAssetPath } from '@/platform/asset';
import generateRandomString from '#/utils/generate_random_string';
import { TemporaryType } from '../../constants';

interface MusicbillExport {
  id: number;
  userId: string;
  musicbillId: string;
  musicbillName: string;
}
type LocalUser = Pick<User, UserProperty.NICKNAME | UserProperty.EMAIL>;

function zipFileList(
  fileList: { path: string; name: string }[],
  target: string,
) {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(target);
    const archive = archiver('zip');

    output.on('close', () => resolve());
    archive.on('error', (error) => reject(error));

    archive.pipe(output);
    for (const file of fileList) {
      archive.file(file.path, { name: file.name });
    }
    archive.finalize();
  });
}

function setMusicbillExported(id: number) {
  return db.run(
    `
      update musicbill_export
        set exportedTimestamp = ?
        where id = ?
    `,
    [Date.now(), id],
  );
}

async function exportMusicbill(
  musicbillExport: MusicbillExport,
  user: LocalUser,
) {
  const musicList = await db.all<
    Pick<Music, MusicProperty.ID | MusicProperty.NAME | MusicProperty.SQ>
  >(
    `
      SELECT
        m.id,
        m.name,
        m.sq
      FROM
        musicbill_music AS mm
        LEFT JOIN music AS m ON mm.musicId = m.id 
      WHERE
        mm.musicbillId = ?
    `,
    [musicbillExport.musicbillId],
  );

  if (!musicList.length) {
    return Promise.all([
      setMusicbillExported(musicbillExport.id),
      sendEmail({
        to: user.email,
        title: `「${BRAND_NAME}」乐单无法导出`,
        html: `
        Hi, ${encode(user.nickname)},
        <br />
        <br />
        乐单「${encode(
          musicbillExport.musicbillName,
        )}」无法导出, 因为这是空的乐单, 请选择非空的乐单进行导出.
        <br />
        <br />
        ${BRAND_NAME}
        <br />
        ${day().format('YYYY-MM-DD HH:mm:ss')}
      `,
      }),
    ]);
  }

  const singerList = await getSingerListInMusicIds(
    musicList.map((m) => m.id),
    [SingerProperty.NAME],
  );
  const musicIdMapSingerList: {
    [key: string]: Pick<Singer, SingerProperty.NAME>[];
  } = {};
  singerList.forEach((s) => {
    if (!musicIdMapSingerList[s.musicId]) {
      musicIdMapSingerList[s.musicId] = [];
    }
    musicIdMapSingerList[s.musicId].push(excludeProperty(s, ['musicId']));
  });

  const exportFilename = `cicada_musicbill_${
    musicbillExport.musicbillId
  }_${day().format('YYYYMMDDHHmmss')}_${generateRandomString(6, false)}.zip`;

  await zipFileList(
    musicList.map((m) => {
      const singers = musicIdMapSingerList[m.id];
      return {
        path: getAssetPath(m.sq, AssetType.MUSIC_SQ),
        name: sanitize(
          `${
            // eslint-disable-next-line no-nested-ternary
            singers.length === 0
              ? '未知歌手'
              : singers.length > 3
              ? '群星'
              : singers.map((s) => s.name).join(',')
          } - ${m.name}${path.parse(m.sq).ext}`,
        ),
      };
    }),
    getTemporaryPath(exportFilename, TemporaryType.MUSICBILL_EXPORT),
  );

  await Promise.all([
    setMusicbillExported(musicbillExport.id),
    sendEmail({
      to: user.email,
      title: `「${BRAND_NAME}」乐单已导出`,
      html: `
        Hi, ${encode(user.nickname)},
        <br />
        <br />
        乐单「${encode(
          musicbillExport.musicbillName,
        )}」已导出, 你可以<a href="${getTemporaryUrl(
        exportFilename,
        TemporaryType.MUSICBILL_EXPORT,
      )}">点击这里进行下载</a>,
        链接将在 ${day(Date.now() + MUSICBILL_EXPORT_TTL).format(
          'YYYY-MM-DD HH:mm:ss',
        )} 后失效.
        <br />
        <br />
        ${BRAND_NAME}
        <br />
        ${day().format('YYYY-MM-DD HH:mm:ss')}
      `,
    }),
  ]);
}

async function exportMusicbillWrapper() {
  const musicbillExport = await db.get<MusicbillExport>(
    `
      select me.id, me.userId, me.musicbillId, m.name as musicbillName from musicbill_export as me
        left join musicbill as m on me.musicbillId = m.id
        where me.exportedTimestamp is null
        order by me.createTimestamp
    `,
    [],
  );
  if (musicbillExport) {
    const user = await getUserById(musicbillExport.userId, [
      UserProperty.NICKNAME,
      UserProperty.EMAIL,
    ]);
    try {
      await exportMusicbill(musicbillExport, user!);
    } catch (error) {
      console.error(error);
      await Promise.all([
        setMusicbillExported(musicbillExport.id),
        sendEmail({
          to: user!.email,
          title: `「${BRAND_NAME}」乐单导出失败`,
          html: `
            Hi, ${encode(user!.nickname)},
            <br />
            <br />
            很抱歉地通知你, 乐单「${encode(
              musicbillExport.musicbillName,
            )}」导出失败, 具体失败原因请联系管理员,
            或重新创建导出任务.
            <br />
            <br />
            ${BRAND_NAME}
            <br />
            ${day().format('YYYY-MM-DD HH:mm:ss')}
          `,
        }),
      ]);
      throw error;
    }
  }
}

export default withTimeout(exportMusicbillWrapper, 1000 * 60 * 60);
