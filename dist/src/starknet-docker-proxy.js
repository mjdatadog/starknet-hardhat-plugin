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
exports.StarknetDockerProxy = void 0;
const path_1 = __importDefault(require("path"));
const docker_server_1 = require("./external-server/docker-server");
const external_server_1 = require("./external-server/external-server");
const PROXY_SERVER_FILE = "starknet_cli_wrapper.py";
const PROXY_SERVER_HOST_PATH = path_1.default.join(__dirname, PROXY_SERVER_FILE);
const PROXY_SERVER_CONTAINER_PATH = `/${PROXY_SERVER_FILE}`;
const LEGACY_CLI_FILE = "starknet_cli_legacy.py";
const LEGACY_CLI_HOST_PATH = path_1.default.join(__dirname, LEGACY_CLI_FILE);
const LEGACY_CLI_CONTAINER_PATH = `/${LEGACY_CLI_FILE}`;
class StarknetDockerProxy extends docker_server_1.DockerServer {
    /**
     * @param image the Docker image to be used for running the container
     * @param rootPath the hardhat project root
     * @param accountPaths the paths holding wallet information
     * @param cairoPaths the paths specified in hardhat config cairoPaths
     */
    constructor(image, rootPath, accountPaths, cairoPaths) {
        super(image, "127.0.0.1", null, "", "starknet-docker-proxy");
        this.rootPath = rootPath;
        this.accountPaths = accountPaths;
        this.cairoPaths = cairoPaths;
    }
    getDockerArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            // To access the files on host machine from inside the container, proper mounting has to be done.
            const volumes = ["-v", `${PROXY_SERVER_HOST_PATH}:${PROXY_SERVER_CONTAINER_PATH}`];
            volumes.push("-v", `${LEGACY_CLI_HOST_PATH}:${LEGACY_CLI_CONTAINER_PATH}`);
            for (const mirroredPath of [this.rootPath, ...this.accountPaths, ...this.cairoPaths]) {
                volumes.push("-v", `${mirroredPath}:${mirroredPath}`);
            }
            const dockerArgs = [...volumes];
            // Check host os
            const isDarwin = process.platform === "darwin";
            if (isDarwin) {
                this.port = yield this.getPort();
                dockerArgs.push("-p", `${this.port}:${this.port}`);
            }
            else {
                dockerArgs.push("--network", "host");
            }
            return dockerArgs;
        });
    }
    getContainerArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            this.port = yield this.getPort();
            return ["python3", PROXY_SERVER_CONTAINER_PATH, this.port];
        });
    }
    getPort() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.port) {
                this.port = yield (0, external_server_1.getFreePort)();
            }
            return this.port;
        });
    }
}
exports.StarknetDockerProxy = StarknetDockerProxy;
//# sourceMappingURL=starknet-docker-proxy.js.map