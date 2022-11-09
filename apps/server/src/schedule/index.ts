import * as schedule from 'node-schedule';
import fs from 'fs';
import util from 'util';
import day from '#/utils/day';
import { LOG_DIR } from '@/constants/directory';
import removeOutdatedCaptcha from './jobs/remove_outdated_captcha';
import createDBSnapshot from './jobs/create_db_snapshot';
import removeOutdatedLoginCode from './jobs/remove_outdated_login_code';
import cleanOutdatedFile from './jobs/clean_outdated_file';
import exportMusicbill from './jobs/export_musicbill';
import removeNoMusicSinger from './jobs/remove_no_music_singer';
import moveUnlinkedAssetToTrash from './jobs/move_unlinked_asset_to_trash';
import updateLyricLrcContent from './jobs/update_lyric_lrc_content';

const getTimeString = () => {
  const now = day();
  const date = now.format('YYYYMMDD');
  const time = now.format('HH:mm:ss.SSS');
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
  {
    name: 'remove_no_music_singer',
    job: removeNoMusicSinger,
  },
  {
    name: 'move_unlinked_asset_to_trash',
    job: moveUnlinkedAssetToTrash,
  },
  {
    name: 'update_lyric_lrc_content',
    job: updateLyricLrcContent,
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
