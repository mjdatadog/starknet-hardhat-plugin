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
exports.DockerDevnet = void 0;
const docker_server_1 = require("./docker-server");
class DockerDevnet extends docker_server_1.DockerServer {
    constructor(image, host, port, devnetArgs, stdout, stderr) {
        super(image, host, port, "is_alive", "integrated-devnet", devnetArgs, stdout, stderr);
        this.devnetArgs = devnetArgs;
    }
    getDockerArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            return ["-p", `${this.host}:${this.port}:${this.port}`];
        });
    }
    getContainerArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.devnetArgs || [];
        });
    }
}
exports.DockerDevnet = DockerDevnet;
//# sourceMappingURL=docker-devnet.js.map