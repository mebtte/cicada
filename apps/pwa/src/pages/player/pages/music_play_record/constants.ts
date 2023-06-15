import getMusicPlayRecordList from '@/server/api/get_music_play_record_list';

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 60;

export type MusicPlayRecord = AsyncReturnType<
  typeof getMusicPlayRecordList
>['musicPlayRecordList'][0];
