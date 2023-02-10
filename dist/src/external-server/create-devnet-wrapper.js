"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntegratedDevnet = void 0;
const starknet_plugin_error_1 = require("../starknet-plugin-error");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const docker_devnet_1 = require("./docker-devnet");
const venv_devnet_1 = require("./venv-devnet");
function createIntegratedDevnet(hre) {
    const devnetNetwork = (0, utils_1.getNetwork)(constants_1.INTEGRATED_DEVNET, hre.config.networks, `networks["${constants_1.INTEGRATED_DEVNET}"]`);
    const { hostname, port } = new URL(devnetNetwork.url || constants_1.INTEGRATED_DEVNET_URL);
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        throw new starknet_plugin_error_1.StarknetPluginError("Integrated devnet works only with localhost and 127.0.0.1");
    }
    if (devnetNetwork.venv) {
        return new venv_devnet_1.VenvDevnet(devnetNetwork.venv, hostname, port, devnetNetwork === null || devnetNetwork === void 0 ? void 0 : devnetNetwork.args, devnetNetwork === null || devnetNetwork === void 0 ? void 0 : devnetNetwork.stdout, devnetNetwork === null || devnetNetwork === void 0 ? void 0 : devnetNetwork.stderr);
    }
    if (hostname === "localhost") {
        throw new starknet_plugin_error_1.StarknetPluginError("Dockerized integrated devnet works only with host 127.0.0.1");
    }
    const tag = (0, utils_1.getImageTagByArch)(devnetNetwork.dockerizedVersion || constants_1.DEFAULT_DEVNET_DOCKER_IMAGE_TAG);
    return new docker_devnet_1.DockerDevnet({
        repository: constants_1.DEVNET_DOCKER_REPOSITORY,
        tag
    }, hostname, port, devnetNetwork === null || devnetNetwork === void 0 ? void 0 : devnetNetwork.args, devnetNetwork === null || devnetNetwork === void 0 ? void 0 : devnetNetwork.stdout, devnetNetwork === null || devnetNetwork === void 0 ? void 0 : devnetNetwork.stderr);
}
exports.createIntegratedDevnet = createIntegratedDevnet;
//# sourceMappingURL=create-devnet-wrapper.js.map