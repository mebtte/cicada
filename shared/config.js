/**
 * 全局配置文件
 * 除 server 外, 客户端请勿直接引用
 * 否则敏感信息将构建在客户端中
 * 造成安全问题
 * @author mebtte<hi@mebtte.com>
 */
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
