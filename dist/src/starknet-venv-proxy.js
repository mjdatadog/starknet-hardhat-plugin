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
exports.StarknetVenvProxy = void 0;
const child_process_1 = require("child_process");
const external_server_1 = require("./external-server");
const external_server_2 = require("./external-server/external-server");
const path_1 = __importDefault(require("path"));
class StarknetVenvProxy extends external_server_1.ExternalServer {
    constructor(pythonPath) {
        super("127.0.0.1", null, "", "starknet-venv-proxy");
        this.pythonPath = pythonPath;
    }
    spawnChildProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            this.port = yield (0, external_server_2.getFreePort)();
            const proxyServerPath = path_1.default.join(__dirname, "starknet_cli_wrapper.py");
            return (0, child_process_1.spawn)(this.pythonPath, [proxyServerPath, this.port]);
        });
    }
    cleanup() {
        var _a;
        (_a = this.childProcess) === null || _a === void 0 ? void 0 : _a.kill();
    }
}
exports.StarknetVenvProxy = StarknetVenvProxy;
//# sourceMappingURL=starknet-venv-proxy.js.map