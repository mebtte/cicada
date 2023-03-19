import getMusicPlayRecord from '@/server/get_music_play_record';

export type MusicPlayRecord = AsyncReturnType<typeof getMusicPlayRecord>[0];

export const PAGE_SIZE = 50;
