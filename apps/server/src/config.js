import { homedir } from 'os';
import config from '../../../config.json';
export default {
    ...config,
    port: config.port || 8000,
    base: config.base || `${homedir()}/cicada`,
};
