function exitWithMessage(message: string) {
  // eslint-disable-next-line no-console
  console.log(message);
  return process.exit();
}

export default exitWithMessage;
