import { ExceptionCode } from '#/constants/exception';
import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import dialog from '@/utils/dialog';
import createMusicbillRequest from '@/server/api/create_musicbill';
import createSingerRequest from '@/server/api/create_singer';
import getSinger from '@/server/api/get_singer';
import { Music, SingerWithAliases } from './constants';
import e, { EditDialogType, EventType } from './eventemitter';

export function openCreateMusicbillDialog() {
  return e.emit(EventType.OPEN_EDIT_DIALOG, {
    type: EditDialogType.INPUT,
    title: '创建乐单',
    label: '名字',
    onSubmit: async (name: string) => {
      const trimmedName = name.replace(/\s+/, ' ').trim();
      if (!trimmedName.length) {
        throw new Error('请输入名字');
      }
      if (trimmedName.length > NAME_MAX_LENGTH) {
        throw new Error(`名字长度应小于等于 ${NAME_MAX_LENGTH}`);
      }
      const id = await createMusicbillRequest(trimmedName);
      e.emit(EventType.MUSICBILL_CREATED, { id });
    },
  });
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
  const trimmedName = name.replace(/\s+/g, ' ').trim();
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

export function emitSingerUpdated(id: string) {
  getSinger(id).then((singer) =>
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

export const openCreateSingerDialog = (callback: (id: string) => void) =>
  e.emit(EventType.OPEN_EDIT_DIALOG, {
    title: '创建歌手',
    label: '名字',
    type: EditDialogType.INPUT,
    maxLength: NAME_MAX_LENGTH,
    onSubmit: async (name: string) =>
      createSinger({
        name,
        callback,
      }),
  });

export const filterMusic = (
  music: Omit<Music, 'singers'> & {
    singers: SingerWithAliases[];
  },
  keyword: string,
) => {
  if (keyword) {
    const lowerCaseKeyword = keyword.toLowerCase();
    return (
      music.name.toLowerCase().includes(lowerCaseKeyword) ||
      music.aliases.find((a) => a.toLowerCase().includes(lowerCaseKeyword)) ||
      music.singers.find(
        (singer) =>
          singer.name.toLowerCase().includes(lowerCaseKeyword) ||
          singer.aliases.find((alias) =>
            alias.toLowerCase().includes(lowerCaseKeyword),
          ),
      )
    );
  }
  return true;
};

export const formatSecond = (s: number) => {
  const minute = Math.floor(s / 60);
  const second = Math.floor(s % 60);
  return `${minute < 10 ? '0' : ''}${minute}:${
    second < 10 ? '0' : ''
  }${second}`;
};
