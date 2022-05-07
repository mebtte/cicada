"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const koa_1 = __importDefault(require("koa"));
const app = new koa_1.default();
exports.default = {
    start: (port) => (0, http_1.createServer)(app.callback()).listen(port),
};
