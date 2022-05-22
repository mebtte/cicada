import getRandomInteger from '#/utils/generate_random_integer';

const VALUES = [true, false];

export default () => VALUES[getRandomInteger(0, 2)];
