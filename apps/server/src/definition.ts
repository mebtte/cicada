import cp from 'child_process';

export default {
  VERSION:
    globalThis.CICADA_VERSION ??
    cp.execSync('git describe --abbrev=0 --tags').toString().replace('\n', ''),
};
