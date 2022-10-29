import { NAME_MAX_LENGTH } from '#/constants/musicbill';
import createMusicbillRequest from '@/server/create_musicbill';
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
