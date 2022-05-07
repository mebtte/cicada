import env from '@/env';

function getRandomCover() {
  return env.COVER_LIST[Math.floor(Math.random() * env.COVER_LIST.length)];
}

export default getRandomCover;
