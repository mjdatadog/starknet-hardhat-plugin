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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenvDevnet = void 0;
const child_process_1 = require("child_process");
const venv_1 = require("../utils/venv");
const external_server_1 = require("./external-server");
class VenvDevnet extends external_server_1.ExternalServer {
    constructor(venvPath, host, port, args, stdout, stderr) {
        super(host, port, "is_alive", "integrated-devnet", stdout, stderr);
        this.command = "starknet-devnet";
        this.args = args;
        if (venvPath !== "active") {
            this.command = (0, venv_1.getPrefixedCommand)((0, venv_1.normalizeVenvPath)(venvPath), this.command);
        }
    }
    spawnChildProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            const args = ["--host", this.host, "--port", this.port].concat(this.args || []);
            return (0, child_process_1.spawn)(this.command, args);
        });
    }
    cleanup() {
        var _a;
        (_a = this.childProcess) === null || _a === void 0 ? void 0 : _a.kill();
    }
}
exports.VenvDevnet = VenvDevnet;
//# sourceMappingURL=venv-devnet.js.map