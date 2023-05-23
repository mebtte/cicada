import fsPromises from 'fs/promises';
import day from '#/utils/day';
import { getLogDirectory } from '@/config';

function getTime() {
  const now = day();
  const date = now.format('YYYYMMDD');
  const time = now.format('HH:mm:ss.SSS');
  return { date, time };
}

function info({
  label,
  title,
  message,
}: {
  label: string;
  title: string;
  message: string;
}) {
  const ts = getTime();
  fsPromises.appendFile(
    `${getLogDirectory()}/${label}_${ts.date}.log`,
    `[${ts.time}] ${title}\n${message}\n\n\n`,
  );
}

function error({
  label,
  title,
  error: e,
}: {
  label: string;
  title: string;
  error: Error;
}) {
  const ts = getTime();
  fsPromises.appendFile(
    `${getLogDirectory()}/${label}_error_${ts.date}.log`,
    `[${ts.time}] ${title}\n${e.stack}\n\n\n`,
  );
}

export default {
  info,
  error,
};
