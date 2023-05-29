import getMusicPlayRecordList from '@/server/api/get_music_play_record_list';
import { Index } from '../../constants';

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 60;

export type MusicPlayRecord = AsyncReturnType<
  typeof getMusicPlayRecordList
>['musicPlayRecordList'][0] &
  Index;
