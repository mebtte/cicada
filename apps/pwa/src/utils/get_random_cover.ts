import definition from '@/definition';

function getRandomCover() {
  return definition.COVER_LIST[
    Math.floor(Math.random() * definition.COVER_LIST.length)
  ];
}

export default getRandomCover;
