import chalk from 'chalk';

function exitWithMessage(message: string) {
  // eslint-disable-next-line no-console
  console.log(chalk.white.bgRed(message));
  return process.exit();
}

export default exitWithMessage;
