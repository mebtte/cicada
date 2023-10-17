import path from 'path';
import startServer from './src/commands/start_server';
import exitWithMessage from './src/utils/exit_with_message';
import { Mode } from './src/config';

const data = process.env.CICADA_DATA;
if (!data) {
  exitWithMessage(
    '\nPlease start dev server after setting environment [ CICADA_DATA ]\n',
  );
}
const absoluteData = path.isAbsolute(data!)
  ? data!
  : path.resolve(process.cwd(), data!);
startServer({ mode: Mode.DEVELOPMENT, port: 8000, data: absoluteData });
