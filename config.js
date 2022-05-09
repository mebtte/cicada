const os = require('os');
const config = require('./config.json');

const port = config.port || 8000;
const serverAddress = config.server_address || `http://localhost:${port}`;
const base = config.base || `${os.homedir()}/.cicada`;
const clusterCount = config.clusterCount || os.cpus().length;

module.exports = {
  port,
  serverAddress,
  base,
  clusterCount,
};
