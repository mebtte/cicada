import { encode } from 'html-entities';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import withTimeout from '#/utils/with_timeout';
import { getDB } from '@/db';
import { getUserById, User, Property as UserProperty } from '@/db/user';
import { Music, Property as MusicProperty } from '@/db/music';
import { sendEmail } from '@/platform/email';
import day from '#/utils/day';
import { AssetType, BRAND_NAME, DOWNLOAD_TTL, PathPrefix } from '#/constants';
import {
  getSingerListInMusicIds,
  Singer,
  Property as SingerProperty,
} from '@/db/singer';
import excludeProperty from '#/utils/exclude_property';
import { getAssetFilePath } from '@/platform/asset';
import generateRandomString from '#/utils/generate_random_string';
import { getDownloadDirectory } from '@/config';
import formatMusicFilename from '#/utils/format_music_filename';

interface MusicbillExport {
  id: number;
  userId: string;
  musicbillId: string;
  musicbillName: string;
  accessOrigin: string;
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
  return getDB().run(
    `
      UPDATE musicbill_export
      SET exportedTimestamp = ?
      WHERE id = ?
    `,
    [Date.now(), id],
  );
}

async function exportMusicbill(
  musicbillExport: MusicbillExport,
  user: LocalUser,
) {
  const musicList = await getDB().all<
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
        path: getAssetFilePath(m.sq, AssetType.MUSIC_SQ),
        name: formatMusicFilename({
          name: m.name,
          singerNames: singers.map((s) => s.name),
          ext: path.parse(m.sq).ext,
        }),
      };
    }),
    `${getDownloadDirectory()}/${exportFilename}`,
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
        )}」已导出, 你可以点击<a href="${musicbillExport.accessOrigin}/${
        PathPrefix.DOWNLOAD
      }/${exportFilename}">这里</a>进行下载, 链接将在 ${day(
        Date.now() + DOWNLOAD_TTL,
      ).format('YYYY-MM-DD HH:mm:ss')} 后失效.
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
  const musicbillExport = await getDB().get<MusicbillExport>(
    `
      SELECT
        me.id,
        me.userId,
        me.musicbillId,
        me.accessOrigin,
        m.name AS musicbillName
      FROM musicbill_export AS me
      LEFT JOIN musicbill AS m ON me.musicbillId = m.id
      WHERE me.exportedTimestamp IS NULL
      ORDER BY me.createTimestamp
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
