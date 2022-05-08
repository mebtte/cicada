import { homedir } from 'os';
import config from '../../../config.json';

const port: number = (config as any).port || 8000;
const serverAddress: string =
  (config as any).server_address || `localhost:${port}`;
const base: string = (config as any).base || `${homedir()}/.cicada`;

export default {
  port,
  serverAddress,
  base,
};
