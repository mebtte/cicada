import fs from 'fs/promises';

function exist(path: string) {
  return fs
    .access(path)
    .then(() => true)
    .catch(() => false);
}

export default exist;
