#!/usr/bin/env -S node -r ts-node/register
/* eslint-disable no-console */
import fs from 'fs';
import * as yargs from 'yargs';
import jwt from 'jsonwebtoken';
import argvJSON from '../argv.json';
import { JWT_SECRET_FILENAME, JWT_TTL } from '../shared/constants';

const argv = yargs.parse(process.argv) as {
  id?: string;
};

if (!argv.id) {
  throw new Error('请通过 --id 指明用户 ID');
}

console.log(
  jwt.sign(
    { userId: argv.id },
    fs.readFileSync(`${argvJSON.base}/${JWT_SECRET_FILENAME}`).toString(),
    {
      expiresIn: JWT_TTL / 1000,
    },
  ),
);
