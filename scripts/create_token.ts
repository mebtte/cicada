#!/usr/bin/env -S node -r ts-node/register
/* eslint-disable no-console */
import * as yargs from 'yargs';
import { sign } from '../shared/utils/jwt';

const argv = yargs.parse(process.argv) as {
  id?: string;
};

if (!argv.id) {
  throw new Error('请通过 --id 指明用户 ID');
}

console.log(sign(argv.id));
