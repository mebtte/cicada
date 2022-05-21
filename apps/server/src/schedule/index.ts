import * as schedule from 'node-schedule';
import fs from 'fs';
import util from 'util';
import day from '#/utils/day';
import { SCHEDULE_LOG_DIR } from '#/constants/directory';
import removeOutdatedScheduleLog from './jobs/remove_outdated_schedule_log';
import removeOutdatedDBLog from './jobs/remove_outdated_db_log';
import removeOutdatedCaptcha from './jobs/remove_outdated_captcha';
import createAndRemoveOutdatedDBSnapshot from './jobs/create_and_remove_outdated_db_snapshot';

const appendFileAysnc = util.promisify(fs.appendFile);

const onRun = (job: string) => {
  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');
  appendFileAysnc(
    `${SCHEDULE_LOG_DIR}/emit_${dateString}.log`,
    `[${timeString}] ${job}\n`,
  );
};
const onError = ({ job, error }: { job: string; error: Error }) => {
  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');
  appendFileAysnc(
    `${SCHEDULE_LOG_DIR}/error_${dateString}.log`,
    `[${timeString}] ${job}\n${error.stack}\n\n`,
  );
};

export default {
  start: () => {
    /** daily */
    schedule
      .scheduleJob('0 0 4 * * *', removeOutdatedScheduleLog)
      .addListener('run', () => onRun('removeOutdatedScheduleLog'))
      .addListener('error', (error) =>
        onError({
          job: 'removeOutdatedScheduleLog',
          error,
        }),
      );
    schedule
      .scheduleJob('0 5 4 * * *', removeOutdatedDBLog)
      .addListener('run', () => onRun('removeOutdatedDBLog'))
      .addListener('error', (error) =>
        onError({
          job: 'removeOutdatedDBLog',
          error,
        }),
      );
    schedule
      .scheduleJob('0 10 4 * * *', removeOutdatedCaptcha)
      .addListener('run', () => onRun('removeOutdatedCaptcha'))
      .addListener('error', (error) =>
        onError({
          job: 'removeOutdatedCaptcha',
          error,
        }),
      );
    schedule
      .scheduleJob('0 15 4 * * *', createAndRemoveOutdatedDBSnapshot)
      .addListener('run', () => onRun('createAndRemoveOutdatedDBSnapshot'))
      .addListener('error', (error) =>
        onError({
          job: 'createAndRemoveOutdatedDBSnapshot',
          error,
        }),
      );
  },
};
