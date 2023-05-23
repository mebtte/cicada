import path from 'path';
import startServer from './src/commands/start_server';

startServer({ configFilePath: path.join(__dirname, '../../config.json5') });
