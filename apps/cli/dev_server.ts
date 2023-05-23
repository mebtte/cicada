import path from 'path';
import startServer from './src/start_server';

startServer({ configFilePath: path.join(__dirname, '../../config.json5') });
