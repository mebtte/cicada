import { ExceptionCode } from '#/constants/exception';
import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import dialog from '#/utils/dialog';
import createMusicbillRequest from '@/server/create_musicbill';
import createSingerRequest from '@/server/create_singer';
import getMusicDetail from '@/server/get_music_detail';
import getSingerDetail from '@/server/get_singer_detail';
import e, { EventType } from './eventemitter';

export async function createMusicbill(name: string) {
  const trimmedName = name.replace(/\s+/, ' ').trim();
  if (!trimmedName.length) {
    throw new Error('请输入名字');
  }
  if (trimmedName.length > NAME_MAX_LENGTH) {
    throw new Error(`名字长度应小于等于 ${NAME_MAX_LENGTH}`);
  }
  await createMusicbillRequest(trimmedName);
  e.emit(EventType.RELOAD_MUSICBILL_LIST, null);
}

export async function createSinger({
  name,
  force = false,
  callback,
}: {
  name: string;
  force?: boolean;
  callback?: (id: string) => void;
}) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('请输入名字');
  }

  try {
    const id = await createSingerRequest({ name: trimmedName, force });

    // eslint-disable-next-line no-unused-expressions
    callback && callback(id);
  } catch (error) {
    if (error.code === ExceptionCode.SINGER_EXIST) {
      dialog.confirm({
        title: '歌手已存在, 是否仍要创建?',
        content:
          '重复的歌手难以进行分类, 通常情况下只有两个歌手同名才会重复创建',
        onConfirm: () => createSinger({ name, force: true, callback }),
      });
    } else {
      throw error;
    }
  }
}

export function emitMusicUpdated(id: string) {
  getMusicDetail(id).then((music) =>
    e.emit(EventType.MUSIC_UPDATED, {
      music: {
        id: music.id,
        cover: music.cover,
        name: music.name,
        type: music.type,
        aliases: music.aliases,
        sq: music.sq,
        hq: music.hq,
        ac: music.ac,
        singers: music.singers,
      },
    }),
  );
}

export function emitSingerUpdated(id: string) {
  getSingerDetail(id).then((singer) =>
    e.emit(EventType.SINGER_UPDATED, {
      singer: {
        id: singer.id,
        avatar: singer.avatar,
        name: singer.name,
        aliases: singer.aliases,
      },
    }),
  );
}
