import * as schedule from 'node-schedule';
import fs from 'fs';
import util from 'util';
import day from '#/utils/day';
import { SCHEDULE_LOG_DIR } from '@/constants/directory';
import removeOutdatedScheduleLog from './remove_outdated_schedule_log';
import removeOutdatedDBLog from './remove_outdated_db_log';

const appendFileAysnc = util.promisify(fs.appendFile);

if (!fs.existsSync(SCHEDULE_LOG_DIR)) {
  fs.mkdirSync(SCHEDULE_LOG_DIR);
}

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
  },
};
