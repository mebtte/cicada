import path from 'path';
import server from './src/server';

server.start(path.join(__dirname, '../../config.json5'));
