import { getDataVersionPath, updateConfig } from '@/config';
import exitWithMessage from '@/utils/exit_with_message';
import fs from 'fs';
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
        ALTER TABLE music ADD year INTEGER
      `,
    );
  }
}

export default async ({ data }: { data: string }) => {
  updateConfig({ data });

  if (!fs.existsSync(getDataVersionPath())) {
    return exitWithMessage(`[ ${data} ] isn't a valid datadirectory`);
  }
  const dataVersion = Number(
    fs.readFileSync(getDataVersionPath()).toString().replace(/\s/gm, ''),
  );
  if (dataVersion !== 1) {
    return exitWithMessage(
      `This version of cicada can fix data only v1, your data version is v${dataVersion}`,
    );
  }

  let spinner: Spinner;

  // eslint-disable-next-line prefer-const
  spinner = createSpinner();
  spinner.start({ text: "Fixing music's year..." });
  await fixMusicYear();
  spinner.success({ text: "Music's year fixed" });

  createSpinner().success({ text: 'Fixing data succeed' });
  return process.exit();
};
