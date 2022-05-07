"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const config_json_1 = __importDefault(require("../../../config.json"));
exports.default = Object.assign(Object.assign({}, config_json_1.default), { port: config_json_1.default.port || 8000, base: config_json_1.default.base || `${(0, os_1.homedir)()}/cicada` });
