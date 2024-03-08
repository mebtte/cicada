import { getConfig, getDataVersionPath, updateConfig } from '@/config';
import exitWithMessage from '@/utils/exit_with_message';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { getDB } from '@/db';
import { createSpinner, Spinner } from 'nanospinner';
import { MusicProperty, MUSIC_TABLE_NAME } from '@/constants/db_definition';

async function fixMusicYear() {
  let yearColumnExist = true;
  try {
    await getDB().get(
      `
        SELECT ${MusicProperty.YEAR} FROM ${MUSIC_TABLE_NAME}
        LIMIT 1
      `,
    );
  } catch (error) {
    yearColumnExist = false;
  }

  if (!yearColumnExist) {
    await getDB().run(
      `
        ALTER TABLE ${MUSIC_TABLE_NAME} ADD ${MusicProperty.YEAR} INTEGER DEFAULT NULL
      `,
    );
  }
}

async function fixDBSnapshots() {
  const dbSnapshotsDir = `${getConfig().data}/db_snapshots`;
  if (fs.existsSync(dbSnapshotsDir)) {
    await fsPromises.rm(dbSnapshotsDir, { force: true, recursive: true });
  }
}

export default async ({ data }: { data: string }) => {
  updateConfig({ data });

  if (!fs.existsSync(getDataVersionPath())) {
    return exitWithMessage(`[ ${data} ] isn't a valid datadirectory`);
  }

  let spinner: Spinner;

  // eslint-disable-next-line prefer-const
  spinner = createSpinner().start({ text: "Fixing music's year..." });
  await fixMusicYear();
  spinner.success({ text: "Music's year has fixed" });

  spinner = createSpinner().start({ text: 'Fixing DB snapshots...' });
  await fixDBSnapshots();
  spinner.success({ text: 'DB snapshots have fixed' });

  createSpinner().success({ text: 'Fixing data successfully' });
  return process.exit();
};
