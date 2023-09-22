import path from 'path';
import startServer from './src/commands/start_server';
import exitWithMessage from './src/utils/exit_with_message';

const data = process.env.CICADA_DATA;
if (!data) {
  exitWithMessage('Please set environment [ CICADA_DATA ]');
}
const absoluteData = path.isAbsolute(data!)
  ? data!
  : path.resolve(process.cwd(), data!);
startServer({ mode: 'development', port: 8000, data: absoluteData });
