import chalk from 'chalk';

function exitWithMessage(message: string) {
  console.log(chalk.white.bgRed(message));
  return process.exit();
}

export default exitWithMessage;
