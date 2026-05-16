import Storage from '@/utils/storage';
import { MusicWithSingerAliases } from './constants';

export enum Key {
  PLAYLIST = 'playlist',
  PLAY_RECORD_UPLOAD_QUEUE = 'play-record-upload-queue',
}

export interface PlayRecordUploadQueueItem {
  serverOrigin: string;
  userId: string;
  token: string;
  clientRecordId: string;
  musicId: string;
  percent: number;
  timestamp: number;
  retryCount: number;
}

const storage = new Storage<
  Key,
  {
    [Key.PLAYLIST]: MusicWithSingerAliases[];
    [Key.PLAY_RECORD_UPLOAD_QUEUE]: PlayRecordUploadQueueItem[];
  }
>('player');

export default storage;
