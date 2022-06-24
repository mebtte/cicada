import * as schedule from 'node-schedule';
import fs from 'fs';
import util from 'util';
import day from '#/utils/day';
import { LOG_DIR } from '@/constants/directory';
import removeOutdatedCaptcha from './jobs/remove_outdated_captcha';
import createDBSnapshot from './jobs/create_db_snapshot';
import removeOutdatedLoginCode from './jobs/remove_outdated_login_code';
import cleanOutdatedFile from './jobs/clean_outdated_file';
import moveOutdatedFileToTrash from './jobs/move_outdated_file_to_trash';
import exportMusicbill from './jobs/export_musicbill';

const getTimeString = () => {
  const now = day();
  const date = now.format('YYYYMMDD');
  const time = now.format('HH:mm:ss');
  return { date, time };
};
const appendFileAysnc = util.promisify(fs.appendFile);
const onRun = (job: string) => {
  const timeString = getTimeString();
  appendFileAysnc(
    `${LOG_DIR}/schedule_emit_${timeString.date}.log`,
    `[${timeString.time}] ${job}\n`,
  );
};
const onError = ({ job, error }: { job: string; error: Error }) => {
  const timeString = getTimeString();
  appendFileAysnc(
    `${LOG_DIR}/schedule_error_${timeString.date}.log`,
    `[${timeString.time}] ${job}\n${error.stack}\n\n`,
  );
};
const onFinish = (job: string) => {
  const timeString = getTimeString();
  appendFileAysnc(
    `${LOG_DIR}/schedule_emit_${timeString.date}.log`,
    `[${timeString.time}] ${job} done\n`,
  );
};

interface Job {
  name: string;
  job: schedule.JobCallback;
}
const DAILY_JOBS: Job[] = [
  {
    name: 'move_outdated_file_to_trash',
    job: moveOutdatedFileToTrash,
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
    name: 'create_db_snapshot',
    job: createDBSnapshot,
  },
];
const HOURLY_JOBS: Job[] = [
  {
    name: 'clean_oudated_file',
    job: cleanOutdatedFile,
  },
];

export default {
  start: () => {
    /** daily */
    let hour = 4;
    let minute = 0;
    for (const dailyJob of DAILY_JOBS) {
      schedule
        .scheduleJob(`${minute} ${hour} * * *`, dailyJob.job)
        .addListener('run', () => onRun(dailyJob.name))
        .addListener('error', (error) =>
          onError({
            job: dailyJob.name,
            error,
          }),
        )
        .addListener('success', () => onFinish(dailyJob.name));

      minute += 5;
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
    }

    /** hourly */
    minute = 0;
    for (const hourlyJob of HOURLY_JOBS) {
      schedule
        .scheduleJob(`${minute} * * * *`, hourlyJob.job)
        .addListener('run', () => onRun(hourlyJob.name))
        .addListener('error', (error) =>
          onError({
            job: hourlyJob.name,
            error,
          }),
        )
        .addListener('success', () => onFinish(hourlyJob.name));

      minute = (minute + 7) % 60;
    }

    /** custom */
    schedule
      .scheduleJob('*/5 * * * *', exportMusicbill)
      .addListener('run', () => onRun('export_musicbill'))
      .addListener('error', (error) =>
        onError({
          job: 'export_musicbill',
          error,
        }),
      )
      .addListener('success', () => onFinish('export_musicbill'));
  },
};
