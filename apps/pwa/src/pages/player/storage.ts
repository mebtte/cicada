import Storage from '@/utils/storage';
import { MusicWithArtistAliases } from './constants';

export enum Key {
  PLAYLIST = 'playlist-v3',
  PLAY_RECORD_UPLOAD_QUEUE_V2 = 'play-record-upload-queue-v2',
}

export interface PlayRecordUploadQueueItem {
  serverOrigin: string;
  userId: string;
  clientRecordId: string;
  musicId: string;
  percent: number;
  playedAt: number;
  retryCount: number;
  nextRetryAt: number;
}

const storage = new Storage<
  Key,
  {
    [Key.PLAYLIST]: MusicWithArtistAliases[];
    [Key.PLAY_RECORD_UPLOAD_QUEUE_V2]: PlayRecordUploadQueueItem[];
  }
>('player');

export default storage;
