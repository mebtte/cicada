import getRandomInteger from './get_random_integer';

const VALUES = [true, false];

export default () => VALUES[getRandomInteger(0, 2)];
