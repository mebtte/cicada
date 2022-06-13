import * as schedule from 'node-schedule';
import fs from 'fs';
import util from 'util';
import day from '#/utils/day';
import { SCHEDULE_LOG_DIR } from '@/constants/directory';
import removeOutdatedScheduleLog from './jobs/remove_outdated_schedule_log';
import removeOutdatedDBLog from './jobs/remove_outdated_db_log';
import removeOutdatedCaptcha from './jobs/remove_outdated_captcha';
import createAndRemoveOutdatedDBSnapshot from './jobs/create_and_remove_outdated_db_snapshot';
import removeOutdatedLoginCode from './jobs/remove_outdated_login_code';
import removeOutdatedErrorLog from './jobs/remove_outdated_error_log';
import removeOutdatedAssetLog from './jobs/remove_outdated_asset_log';
import removeOutdatedDeletedMusicbill from './jobs/remove_outdated_deleted_musicbill';

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
      .scheduleJob('0 15 4 * * *', removeOutdatedLoginCode)
      .addListener('run', () => onRun('removeOutdatedLoginCode'))
      .addListener('error', (error) =>
        onError({
          job: 'removeOutdatedLoginCode',
          error,
        }),
      );
    schedule
      .scheduleJob('0 20 4 * * *', removeOutdatedErrorLog)
      .addListener('run', () => onRun('removeOutdatedErrorLog'))
      .addListener('error', (error) =>
        onError({
          job: 'removeOutdatedErrorLog',
          error,
        }),
      );
    schedule
      .scheduleJob('0 25 4 * * *', removeOutdatedAssetLog)
      .addListener('run', () => onRun('removeOutdatedAssetLog'))
      .addListener('error', (error) =>
        onError({
          job: 'removeOutdatedAssetLog',
          error,
        }),
      );
    schedule
      .scheduleJob('0 30 4 * * *', removeOutdatedDeletedMusicbill)
      .addListener('run', () => onRun('removeOutdatedDeletedMusicbill'))
      .addListener('error', (error) =>
        onError({
          job: 'removeOutdatedDeletedMusicbill',
          error,
        }),
      );
    schedule
      .scheduleJob('0 35 4 * * *', createAndRemoveOutdatedDBSnapshot)
      .addListener('run', () => onRun('createAndRemoveOutdatedDBSnapshot'))
      .addListener('error', (error) =>
        onError({
          job: 'createAndRemoveOutdatedDBSnapshot',
          error,
        }),
      );
  },
};
