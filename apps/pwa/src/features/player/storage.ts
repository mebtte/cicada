import Storage from '@/utils/storage';
import { APP_NAMESPACE } from '@/constants/app';

export enum Key {
  PLAY_RECORD_UPLOAD_QUEUE_V3 = 'play-record-upload-queue-v3',
}

export interface PlayRecordUploadQueueItem {
  serverBaseURL: string;
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
    [Key.PLAY_RECORD_UPLOAD_QUEUE_V3]: PlayRecordUploadQueueItem[];
  }
>(`${APP_NAMESPACE}:player`);

export default storage;
