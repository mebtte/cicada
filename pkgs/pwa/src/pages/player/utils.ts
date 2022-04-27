/* eslint-disable camelcase */
import getRandomCover from '@/utils/get_random_cover';
import { MusicType } from '@/constants/music';
import { Figure, Music } from './constants';

export const transformMusic = (originalMusic: {
  id: string;
  cover: string;
  name: string;
  type: MusicType;
  alias: string;
  singers: Figure[];
  sq: string;
  hq: string;
  ac: string;
  mv_link: string;
  fork?: string[];
  fork_from?: string[];
}): Music => {
  const {
    id,
    cover,
    name,
    type,
    alias,
    singers,
    sq,
    hq,
    ac,
    mv_link: mvLink,
    fork,
    fork_from: forkFrom,
  } = originalMusic;
  return {
    id,
    cover: cover || getRandomCover(),
    name,
    type,
    alias,
    singers: singers.map((s) => ({
      ...s,
      avatar: s.avatar || getRandomCover(),
    })),
    sq,
    ac,
    hq,
    mvLink,
    fork: fork || [],
    forkFrom: forkFrom || [],
  };
};
