import { prefixServerOrigin } from '@/global_states/setting';

export const getResizedMusicCover = ({
  id,
  size,
}: {
  id: string;
  size: 96 | 128 | 192 | 256 | 384 | 512;
}) => prefixServerOrigin(`/asset/resized_music_cover?id=${id}&size=${size}`);
