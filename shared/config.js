const os = require('os');
const config = require('../config.json');

const serverPort = config.serverPort || 8000;
const serverAddress = config.serverAddress || `http://localhost:${serverPort}`;
const serverClusterCount = config.serverClusterCount || os.cpus().length;
const serverBase = config.serverBase || `${os.homedir()}/.cicada`;

const pwaDevPort = config.pwaDevPort || 8001;

module.exports = {
  serverPort,
  serverAddress,
  serverClusterCount,
  serverBase,

  pwaDevPort,
};
