"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.AmarnaDocker = void 0;
const hardhat_docker_1 = require("@nomiclabs/hardhat-docker");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const DEFAULT_OUTPUT = "out.sarif";
class AmarnaDocker {
    /**
     * @param image the Docker image to be used for running the container
     * @param cairoPaths the paths specified in hardhat config cairoPaths
     */
    constructor(image, rootPath, cairoPaths, hre) {
        this.image = image;
        this.rootPath = rootPath;
        this.cairoPaths = cairoPaths;
        this.hre = hre;
        this.useShell = false;
        this.container = "amarna-container-" + Math.random().toString().slice(2);
    }
    getCommand() {
        let cmd = ["amarna", ".", "-o", DEFAULT_OUTPUT];
        if (this.useShell) {
            // Run ./amarna.sh file for custom args
            if (fs.existsSync(`${this.rootPath}/amarna.sh`)) {
                cmd = ["./amarna.sh"];
            }
            else {
                console.warn("amarna.sh file not found in the project directory.\n", "Add amarna.sh file with amarna command to run in the container.\n", "Running the container with default amarna script.`");
            }
        }
        return cmd;
    }
    cairoPathBindings(binds, dockerArgs) {
        const { cairoPaths } = this;
        if (cairoPaths.length) {
            const cairoPathsEnv = [];
            cairoPaths.forEach((path, i) => {
                const cPath = `/src/cairo-paths-${i}`;
                binds[path] = cPath;
                cairoPathsEnv.push(cPath);
            });
            dockerArgs.push("--env");
            dockerArgs.push(`CAIRO_PATH=${cairoPathsEnv.join(":")}`);
        }
    }
    ensureDockerImage(formattedImage) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.docker.hasPulledImage(this.image))) {
                console.log(`Pulling amarna image ${formattedImage}.`);
                yield this.docker.pullImage(this.image);
            }
        });
    }
    prepareDockerArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            const { rootPath, container } = this;
            const formattedImage = `${this.image.repository}:${this.image.tag}`;
            const binds = {
                [rootPath]: "/src"
            };
            const cmd = this.getCommand();
            const dockerArgs = ["--rm", "-i", "--name", container];
            this.cairoPathBindings(binds, dockerArgs);
            Object.keys(binds).forEach((k) => {
                dockerArgs.push("-v");
                dockerArgs.push(`${k}:${binds[k]}`);
            });
            const entrypoint = cmd.shift();
            yield this.ensureDockerImage(formattedImage);
            return [...dockerArgs, "--entrypoint", entrypoint, formattedImage, ...cmd];
        });
    }
    run(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.docker) {
                this.docker = yield hardhat_docker_1.HardhatDocker.create();
            }
            this.useShell = !!args.script;
            const dockerArgs = yield this.prepareDockerArgs();
            console.log("Running amarna, this may take a while.");
            const result = (0, child_process_1.spawnSync)("docker", ["run", ...dockerArgs]);
            const defaultOutput = ` at ${this.rootPath}/${DEFAULT_OUTPUT}`;
            console.log(`Sarif file generated${this.useShell ? "" : defaultOutput}`);
            // Output the output/error for user to review.
            result.stdout && console.log(result.stdout.toString());
            result.stderr && console.error(result.stderr.toString());
        });
    }
}
exports.AmarnaDocker = AmarnaDocker;
//# sourceMappingURL=docker-amarna.js.map