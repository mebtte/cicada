import * as schedule from 'node-schedule';
import fs from 'fs';
import util from 'util';
import day from '#/utils/day';
import { LOG_DIR } from '@/constants/directory';
import removeOutdatedCaptcha from './jobs/remove_outdated_captcha';
import createDBSnapshot from './jobs/create_db_snapshot';
import removeOutdatedLoginCode from './jobs/remove_outdated_login_code';
import cleanTrash from './jobs/clean_trash';
import moveOutdatedFileToTrash from './jobs/move_outdated_file_to_trash';

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

/**
 * 每日任务
 * 注意顺序
 */
const DAILY_JOBS: {
  name: string;
  job: schedule.JobCallback;
}[] = [
  {
    name: 'clean_trash',
    job: cleanTrash,
  },
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
