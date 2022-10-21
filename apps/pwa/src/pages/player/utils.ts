/* eslint-disable camelcase */
import getRandomCover from '@/utils/get_random_cover';
import { MusicType } from '#/constants/music';
import { Singer, Music } from './constants';

export const transformMusic = (originalMusic: {
  id: string;
  cover: string;
  name: string;
  type: MusicType;
  aliases: string[];
  singers: Singer[];
  sq: string;
  hq: string;
  ac: string;
  mv_link: string;
}): Music => {
  const { id, cover, name, type, aliases, singers, sq, hq, ac } = originalMusic;
  return {
    id,
    cover: cover || getRandomCover(),
    name,
    type,
    aliases,
    singers: singers.map((s) => ({
      ...s,
      avatar: s.avatar || getRandomCover(),
    })),
    sq,
    ac,
    hq,
  };
};
