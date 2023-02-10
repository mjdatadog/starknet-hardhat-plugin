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
exports.DockerServer = void 0;
const hardhat_docker_1 = require("@nomiclabs/hardhat-docker");
const child_process_1 = require("child_process");
const external_server_1 = require("./external-server");
class DockerServer extends external_server_1.ExternalServer {
    constructor(image, host, externalPort, isAliveURL, containerName, args, stdout, stderr) {
        // to make name unique and allow multiple simultaneous instances
        containerName += "-" + Math.random().toString().slice(2);
        super(host, externalPort, isAliveURL, containerName, stdout, stderr);
        this.image = image;
        this.args = args;
        this.containerName = containerName;
    }
    pullImage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.docker) {
                this.docker = yield hardhat_docker_1.HardhatDocker.create();
            }
            if (!(yield this.docker.hasPulledImage(this.image))) {
                console.log(`Pulling image ${hardhat_docker_1.HardhatDocker.imageToRepoTag(this.image)}`);
                yield this.docker.pullImage(this.image);
            }
        });
    }
    spawnChildProcess() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pullImage();
            const formattedImage = `${this.image.repository}:${this.image.tag}`;
            const args = [
                "run",
                "--rm",
                "--name",
                this.containerName,
                ...(yield this.getDockerArgs()),
                formattedImage,
                ...(yield this.getContainerArgs())
            ];
            return (0, child_process_1.spawn)("docker", args);
        });
    }
    cleanup() {
        var _a;
        (0, child_process_1.spawnSync)("docker", ["kill", this.containerName]);
        (_a = this.childProcess) === null || _a === void 0 ? void 0 : _a.kill();
    }
}
exports.DockerServer = DockerServer;
//# sourceMappingURL=docker-server.js.map