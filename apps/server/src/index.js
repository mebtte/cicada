"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const env_1 = __importDefault(require("./env"));
function initialize() {
    return __awaiter(this, void 0, void 0, function* () { });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cluster_1.default.isPrimary) {
            console.log(`--- port: ${config_1.default.port} ---`);
            yield initialize();
            const clusterCount = env_1.default.development ? 1 : os_1.default.cpus().length;
            console.log(`--- clusterCount: ${clusterCount} ---`);
            for (let i = 0; i < clusterCount; i += 1) {
                cluster_1.default.fork();
            }
        }
        else {
            app_1.default.start(config_1.default.port);
        }
    });
}
start();
