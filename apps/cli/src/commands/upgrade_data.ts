import inquirer from 'inquirer';
import md5 from 'md5';
import { getConfig, getDataVersionPath, updateConfig } from '@/config';
import { createSpinner, Spinner } from 'nanospinner';
import fs from 'fs';
import fsPromises from 'fs/promises';
import exitWithMessage from '@/utils/exit_with_message';
import { getDB } from '@/db';
import generateRandomString from '#/utils/generate_random_string';

function dropLoginCodeSalt() {
  return fsPromises.unlink(`${getConfig().data}/login_code_salt`);
}

function dropLoginCode() {
  return getDB().run(
    `
      DROP TABLE login_code
    `,
  );
}

function renameUserEmailToUsername() {
  return getDB().run(
    `
      ALTER TABLE user RENAME COLUMN email TO username
    `,
  );
}

async function addUserPassword() {
  await getDB().run(
    `
      ALTER TABLE user ADD password TEXT NOT NULL DEFAULT ''
    `,
  );

  const userList: {
    id: string;
    username: string;
    password: string;
  }[] = [];
  const dbUserList = await getDB().all<{
    id: string;
    username: string;
  }>(
    `
      SELECT id, username FROM user
    `,
    [],
  );
  for (const user of dbUserList) {
    const password = generateRandomString(12);
    await getDB().run(
      `
        UPDATE user SET password = ?
        WHERE id = ?
      `,
      [md5(md5(password)), user.id],
    );
    userList.push({ id: user.id, username: user.username, password });
  }

  /**
   * make user.password not null
   * @author mebtte<hi@mebtte.com>
   */
  const tmpTableName = 'user_tmp';
  await getDB().run(
    `
      CREATE TABLE ${tmpTableName} (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT UNIQUE NOT NULL,
        avatar TEXT NOT NULL DEFAULT '',
        nickname TEXT NOT NULL,
        joinTimestamp INTEGER NOT NULL,
        admin INTEGER NOT NULL DEFAULT 0,
        remark TEXT NOT NULL DEFAULT '',
        musicbillOrdersJSON TEXT DEFAULT NULL,
        musicbillMaxAmount INTEGER NOT NULL DEFAULT 100,
        createMusicMaxAmountPerDay INTEGER NOT NULL DEFAULT 10,
        lastActiveTimestamp INTEGER NOT NULL DEFAULT 0,
        musicPlayRecordIndate INTEGER NOT NULL DEFAULT 0,
        password TEXT NOT NULL
      )
    `,
  );
  await getDB().run(
    `
      INSERT INTO ${tmpTableName} SELECT * FROM user;
    `,
  );
  await getDB().run(
    `
      DROP TABLE user
    `,
  );
  await getDB().run(
    `
      ALTER TABLE ${tmpTableName} RENAME TO user
    `,
  );

  return userList;
}

async function addUserTwoFASecret() {
  return await getDB().run(
    `
      ALTER TABLE user ADD twoFASecret TEXT DEFAULT NULL
    `,
  );
}

async function addUserTokenIdentifier() {
  return await getDB().run(
    `
      ALTER TABLE user ADD tokenIdentifier TEXT NOT NULL DEFAULT ''
    `,
  );
}

function writeNewVersion() {
  return fsPromises.writeFile(getDataVersionPath(), '2');
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
      `This version of cicada can upgrade data only v1, your data version is v${dataVersion}`,
    );
  }

  const answer: { confirmed: boolean } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message:
        'Cicada at v2 has deprecated login with email and will add password for all of users. After upgrade, CLI will print the password of each user, and all of users only can login by the password, so you need to save the output of CLI. Make sure you have the backup of data before upgrading. Continue ?',
      default: false,
    },
  ]);
  if (!answer.confirmed) {
    return;
  }

  let spinner: Spinner;

  spinner = createSpinner().start({ text: 'Dropping login code...' });
  await dropLoginCode();
  spinner.success({ text: 'Login code has dropped' });

  spinner = createSpinner().start({ text: 'Dropping login code salt...' });
  await dropLoginCodeSalt();
  spinner.success({ text: 'Login code salt has dropped' });

  spinner = createSpinner().start({
    text: 'Renaming user.email to user.username...',
  });
  await renameUserEmailToUsername();
  spinner.success({ text: 'user.email has renamed to user.username' });

  spinner = createSpinner().start({ text: 'Adding user.password...' });
  const userList = await addUserPassword();
  spinner.success({ text: 'user.password has added' });

  spinner = createSpinner().start({ text: 'Adding user.twoFASecret...' });
  await addUserTwoFASecret();
  spinner.success({ text: 'user.twoFASecret has added' });

  spinner = createSpinner().start({ text: 'Adding user.tokenIdentifier...' });
  await addUserTokenIdentifier();
  spinner.success({ text: 'user.tokenIdentifier has added' });

  spinner = createSpinner().start({ text: 'Writting new version of data...' });
  await writeNewVersion();
  spinner.success({ text: 'New version of data has wrote' });

  createSpinner().success({ text: 'Data upgrade to v2 from v1 successfully' });

  for (const user of userList) {
    // eslint-disable-next-line no-console
    console.log(
      `id:${user.id} username:${user.username} password:${user.password}`,
    );
  }

  return process.exit();
};
