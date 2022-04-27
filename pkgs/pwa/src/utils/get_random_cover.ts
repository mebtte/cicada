import config from '@/config';

function getRandomCover() {
  return config.coverList[Math.floor(Math.random() * config.coverList.length)];
}

export default getRandomCover;
