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
import cleanTrash from './jobs/clean_trash';

const appendFileAysnc = util.promisify(fs.appendFile);
const onRun = (job: string) => {
  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');
  appendFileAysnc(
    `${SCHEDULE_LOG_DIR}/schedule_emit_${dateString}.log`,
    `[${timeString}] ${job}\n`,
  );
};
const onError = ({ job, error }: { job: string; error: Error }) => {
  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');
  appendFileAysnc(
    `${SCHEDULE_LOG_DIR}/schedule_error_${dateString}.log`,
    `[${timeString}] ${job}\n${error.stack}\n\n`,
  );
};

const DAILY_JOBS: {
  name: string;
  job: schedule.JobCallback;
}[] = [
  {
    name: 'remove_outdated_schedule_log',
    job: removeOutdatedScheduleLog,
  },
  {
    name: 'remove_outdated_db_log',
    job: removeOutdatedDBLog,
  },
  {
    name: 'remove_outdated_captcha',
    job: removeOutdatedCaptcha,
  },
  {
    name: 'remove_outdated_login_code',
    job: removeOutdatedLoginCode,
  },
  {
    name: 'remove_outdated_error_log',
    job: removeOutdatedErrorLog,
  },
  {
    name: 'remove_outdated_asset_log',
    job: removeOutdatedAssetLog,
  },
  {
    name: 'clean_trash',
    job: cleanTrash,
  },
  {
    name: 'create_and_remove_outdated_db_snapshot',
    job: createAndRemoveOutdatedDBSnapshot,
  },
];

export default {
  start: () => {
    /** daily */
    let hour = 4;
    let minute = 0;
    for (const dailyJob of DAILY_JOBS) {
      schedule
        .scheduleJob(`0 ${minute} ${hour} * * *`, dailyJob.job)
        .addListener('run', () => onRun(dailyJob.name))
        .addListener('error', (error) =>
          onError({
            job: dailyJob.name,
            error,
          }),
        );

      minute += 5;
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
    }
  },
};
