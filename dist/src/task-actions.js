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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.starknetMigrateAction = exports.starknetPluginVersionAction = exports.starknetRunAction = exports.starknetTestAction = exports.starknetDeployAccountAction = exports.starknetNewAccountAction = exports.starknetVoyagerAction = exports.amarnaAction = exports.starknetCompileAction = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const FormData = require("form-data");
const starknet_plugin_error_1 = require("./starknet-plugin-error");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const extend_utils_1 = require("./extend-utils");
const external_server_1 = require("./external-server");
const recompiler_1 = require("./recompiler");
const package_json_1 = require("../package.json");
function checkSourceExists(sourcePath) {
    if (!fs.existsSync(sourcePath)) {
        const msg = `Source expected to be at ${sourcePath}, but not found.`;
        throw new starknet_plugin_error_1.StarknetPluginError(msg);
    }
}
/**
 * Transfers logs and generates a return status code.
 *
 * @param executed The process result of running the container
 * @returns 0 if succeeded, 1 otherwise
 */
function processExecuted(executed, logStatus) {
    if (executed.stdout.length) {
        console.log((0, utils_1.adaptLog)(executed.stdout.toString()));
    }
    if (executed.stderr.length) {
        // synchronize param names reported by actual CLI with param names used by this plugin
        const err = executed.stderr.toString();
        const replacedErr = (0, utils_1.adaptLog)(err);
        console.error(replacedErr);
    }
    if (logStatus) {
        const finalMsg = executed.statusCode ? "Failed" : "Succeeded";
        console.log(`\t${finalMsg}\n`);
    }
    return executed.statusCode ? 1 : 0;
}
/**
 * First deletes the file if it already exists. Then creates an empty file at the provided path.
 * Unlinking/deleting is necessary if user switched from docker to venv.
 * @param filePath the file to be recreated
 */
function initializeFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    fs.closeSync(fs.openSync(filePath, "w"));
}
function getFileName(filePath) {
    return path.basename(filePath, path.extname(filePath));
}
function starknetCompileAction(args, hre) {
    return __awaiter(this, void 0, void 0, function* () {
        const root = hre.config.paths.root;
        const rootRegex = new RegExp("^" + root);
        const defaultSourcesPath = hre.config.paths.starknetSources;
        const sourcesPaths = args.paths || [defaultSourcesPath];
        const artifactsPath = hre.config.paths.starknetArtifacts;
        const cairoPaths = [defaultSourcesPath, root];
        if (args.cairoPath) {
            args.cairoPath.split(":").forEach((path) => {
                cairoPaths.push(path);
            });
        }
        if (hre.config.paths.cairoPaths) {
            hre.config.paths.cairoPaths.forEach((path) => {
                cairoPaths.push(path);
            });
        }
        for (let i = 0; i < cairoPaths.length; i++) {
            if (!path.isAbsolute(cairoPaths[i])) {
                cairoPaths[i] = path.normalize(path.join(root, cairoPaths[i]));
            }
        }
        const cairoPath = cairoPaths.join(":");
        let statusCode = 0;
        for (let sourcesPath of sourcesPaths) {
            if (!path.isAbsolute(sourcesPath)) {
                sourcesPath = path.normalize(path.join(root, sourcesPath));
            }
            checkSourceExists(sourcesPath);
            const files = yield (0, utils_1.traverseFiles)(sourcesPath, "*.cairo");
            const recompiler = new recompiler_1.Recompiler(hre);
            for (const file of files) {
                console.log("Compiling", file);
                const suffix = file.replace(rootRegex, "");
                const fileName = getFileName(suffix);
                const dirPath = path.join(artifactsPath, suffix);
                const outputPath = path.join(dirPath, `${fileName}.json`);
                const abiPath = path.join(dirPath, `${fileName}${constants_1.ABI_SUFFIX}`);
                fs.mkdirSync(dirPath, { recursive: true });
                initializeFile(outputPath);
                initializeFile(abiPath);
                const executed = yield hre.starknetWrapper.compile({
                    file,
                    output: outputPath,
                    abi: abiPath,
                    cairoPath,
                    accountContract: args.accountContract,
                    disableHintValidation: args.disableHintValidation
                });
                // Update cache after compilation
                yield recompiler.updateCache(args, file, outputPath, abiPath, cairoPath);
                statusCode += processExecuted(executed, true);
            }
            yield recompiler.saveCache();
        }
        if (statusCode) {
            const msg = `Failed compilation of ${statusCode} contract${statusCode === 1 ? "" : "s"}.`;
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
    });
}
exports.starknetCompileAction = starknetCompileAction;
function amarnaAction(args, hre) {
    return __awaiter(this, void 0, void 0, function* () {
        yield hre.amarnaDocker.run(args);
    });
}
exports.amarnaAction = amarnaAction;
/**
 * Extracts the verification URL assigned to the network provided.
 * If no `networkName` is provided, defaults to Alpha testnet.
 * If `networkName` is provided, but not supported for verification, an error is thrown.
 * @param networkName the name of the network
 * @param hre the runtime environment from which network data is extracted
 * @param origin short string describing where/how `networkName` was specified
 */
function getVerificationNetwork(networkName, hre, origin) {
    networkName || (networkName = constants_1.ALPHA_TESTNET);
    const network = (0, utils_1.getNetwork)(networkName, hre.config.networks, origin);
    if (!network.verificationUrl) {
        throw new starknet_plugin_error_1.StarknetPluginError(`Network ${networkName} does not support Voyager verification.`);
    }
    return network;
}
function starknetVoyagerAction(args, hre) {
    return __awaiter(this, void 0, void 0, function* () {
        const network = getVerificationNetwork(args.starknetNetwork, hre, "--starknet-network");
        const voyagerUrl = `${network.verificationUrl}${args.address}/code`;
        const verifiedUrl = `${network.verifiedUrl}${args.address}#code`;
        let isVerified = false;
        try {
            const resp = yield axios_1.default.get(voyagerUrl);
            const data = resp.data;
            if (data.contract) {
                if (data.contract.length > 0 || Object.keys(data.contract).length > 0) {
                    isVerified = true;
                }
            }
        }
        catch (error) {
            const msg = "Something went wrong while checking if the contract has already been verified.";
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
        if (isVerified) {
            console.log(`Contract at address ${args.address} has already been verified`);
            console.log(`Check it out on Voyager: ${verifiedUrl}`);
        }
        else {
            yield handleContractVerification(args, voyagerUrl, verifiedUrl, hre);
        }
    });
}
exports.starknetVoyagerAction = starknetVoyagerAction;
function getMainVerificationPath(contractPath, root) {
    if (!path.isAbsolute(contractPath)) {
        contractPath = path.normalize(path.join(root, contractPath));
        if (!fs.existsSync(contractPath)) {
            throw new starknet_plugin_error_1.StarknetPluginError(`File ${contractPath} does not exist`);
        }
    }
    return contractPath;
}
function handleContractVerification(args, voyagerUrl, verifiedUrl, hre) {
    return __awaiter(this, void 0, void 0, function* () {
        // Set main contract path
        const mainPath = getMainVerificationPath(args.path, hre.config.paths.root);
        const paths = [mainPath];
        const bodyFormData = new FormData();
        bodyFormData.append("compiler-version", args.compilerVersion);
        const accountContract = args.accountContract ? "true" : "false";
        bodyFormData.append("account-contract", accountContract);
        bodyFormData.append("license", args.license || "No License (None)");
        // Dependencies (non-main contracts) are in args.paths
        if (args.paths) {
            paths.push(...args.paths);
        }
        const sourceRegex = new RegExp("^" + hre.config.paths.starknetSources + "/");
        const contractNameDefault = mainPath.replace(sourceRegex, "");
        // If contract name is not provided, use the default
        bodyFormData.append("contract-name", contractNameDefault);
        // Appends all contracts to the form data with the name "file" + index
        handleMultiPartContractVerification(bodyFormData, paths, hre.config.paths.root, sourceRegex);
        yield axios_1.default
            .post(voyagerUrl, bodyFormData.getBuffer(), {
            headers: bodyFormData.getHeaders()
        })
            .catch((err) => {
            throw new starknet_plugin_error_1.StarknetPluginError(`\
Could not verify the contract at address ${args.address}.
${err.response.data.message ||
                `It is hard to tell exactly what happened, but possible reasons include:
- Deployment transaction hasn't been accepted or indexed yet (check its tx_status or try in a minute)
- Wrong contract address
- Wrong files provided
- Wrong main contract chosen (first after --path)
- Voyager is down`}
            `);
        });
        console.log(`Contract has been successfuly verified at address ${args.address}`);
        console.log(`Check it out on Voyager: ${verifiedUrl}`);
    });
}
function handleMultiPartContractVerification(bodyFormData, paths, root, sourceRegex) {
    paths.forEach(function (item, index) {
        if (!path.isAbsolute(item)) {
            paths[index] = path.normalize(path.join(root, item));
            if (!fs.existsSync(paths[index])) {
                throw new starknet_plugin_error_1.StarknetPluginError(`File ${paths[index]} does not exist`);
            }
        }
        bodyFormData.append("file" + index, fs.readFileSync(paths[index]), {
            filepath: paths[index].replace(sourceRegex, ""),
            contentType: "application/octet-stream"
        });
    });
}
function starknetNewAccountAction(args, hre) {
    return __awaiter(this, void 0, void 0, function* () {
        setRuntimeNetwork(args, hre);
        const wallet = (0, extend_utils_1.getWalletUtil)(args.wallet, hre);
        const accountDir = (0, utils_1.getAccountPath)(wallet.accountPath, hre);
        fs.mkdirSync(accountDir, { recursive: true });
        (0, utils_1.warn)("Warning! You are creating a modified version of OZ account which may not be compatible with the Account class.");
        const executed = yield hre.starknetWrapper.newAccount({
            accountDir: accountDir,
            accountName: wallet.accountName,
            network: args.starknetNetwork,
            wallet: wallet.modulePath
        });
        const statusCode = processExecuted(executed, true);
        if (statusCode) {
            const msg = "Could not create a new account contract:\n" + executed.stderr.toString();
            const replacedMsg = (0, utils_1.adaptLog)(msg);
            throw new starknet_plugin_error_1.StarknetPluginError(replacedMsg);
        }
    });
}
exports.starknetNewAccountAction = starknetNewAccountAction;
function starknetDeployAccountAction(args, hre) {
    return __awaiter(this, void 0, void 0, function* () {
        setRuntimeNetwork(args, hre);
        const wallet = (0, extend_utils_1.getWalletUtil)(args.wallet, hre);
        const accountDir = (0, utils_1.getAccountPath)(wallet.accountPath, hre);
        fs.mkdirSync(accountDir, { recursive: true });
        (0, utils_1.warn)("Warning! You are deploying a modified version of OZ account which may not be compatible with the Account class.");
        const executed = yield hre.starknetWrapper.deployAccount({
            accountDir: accountDir,
            accountName: wallet.accountName,
            network: args.starknetNetwork,
            wallet: wallet.modulePath
        });
        const statusCode = processExecuted(executed, true);
        if (statusCode) {
            const msg = "Could not deploy account contract:\n" + executed.stderr.toString();
            const replacedMsg = (0, utils_1.adaptLog)(msg);
            throw new starknet_plugin_error_1.StarknetPluginError(replacedMsg);
        }
    });
}
exports.starknetDeployAccountAction = starknetDeployAccountAction;
/**
 * Used later on for network interaction.
 * @param args Hardhat CLI args
 * @param hre HardhatRuntimeEnvironment
 */
function setRuntimeNetwork(args, hre) {
    let networkName;
    let networkConfig;
    if (args.starknetNetwork) {
        networkName = args.starknetNetwork;
        networkConfig = (0, utils_1.getNetwork)(networkName, hre.config.networks, "--starknet-network");
    }
    else if (hre.config.starknet.network) {
        networkName = hre.config.starknet.network;
        networkConfig = (0, utils_1.getNetwork)(networkName, hre.config.networks, "starknet.network in hardhat.config");
    }
    else {
        networkName = constants_1.DEFAULT_STARKNET_NETWORK;
        networkConfig = (0, utils_1.getNetwork)(networkName, hre.config.networks, "default settings");
    }
    hre.starknet.network = networkName;
    hre.starknet.networkConfig = networkConfig;
    console.log(`Using network ${hre.starknet.network} at ${hre.starknet.networkConfig.url}`);
}
function runWithDevnet(hre, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, utils_1.isStarknetDevnet)(hre.starknet.network)) {
            yield fn();
            return;
        }
        const devnet = (0, external_server_1.createIntegratedDevnet)(hre);
        yield devnet.start();
        yield fn();
        devnet.stop();
    });
}
function starknetTestAction(args, hre, runSuper) {
    return __awaiter(this, void 0, void 0, function* () {
        setRuntimeNetwork(args, hre);
        yield new recompiler_1.Recompiler(hre).handleCache();
        yield runWithDevnet(hre, () => __awaiter(this, void 0, void 0, function* () {
            yield runSuper(args);
        }));
    });
}
exports.starknetTestAction = starknetTestAction;
function starknetRunAction(args, hre, runSuper) {
    return __awaiter(this, void 0, void 0, function* () {
        if (args.starknetNetwork) {
            throw new starknet_plugin_error_1.StarknetPluginError(`Using "--starknet-network" with "hardhat run" currently does not have effect.
Use the "network" property of the "starknet" object in your hardhat config file.`);
        }
        setRuntimeNetwork(args, hre);
        yield new recompiler_1.Recompiler(hre).handleCache();
        yield runWithDevnet(hre, () => __awaiter(this, void 0, void 0, function* () {
            yield runSuper(args);
        }));
    });
}
exports.starknetRunAction = starknetRunAction;
function starknetPluginVersionAction() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Version: ${package_json_1.version}`);
    });
}
exports.starknetPluginVersionAction = starknetPluginVersionAction;
function starknetMigrateAction(args, hre) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!args.paths || args.paths.length < 1) {
            throw new starknet_plugin_error_1.StarknetPluginError("Expected at least one file to migrate");
        }
        const root = hre.config.paths.root;
        const defaultSourcesPath = hre.config.paths.starknetSources;
        const files = args.paths || [defaultSourcesPath];
        const cairoFiles = [];
        for (let file of files) {
            if (!path.isAbsolute(file)) {
                file = path.normalize(path.join(root, file));
            }
            cairoFiles.push(file);
        }
        const result = yield hre.starknetWrapper.migrateContract({
            files: cairoFiles,
            inplace: args.inplace
        });
        processExecuted(result, true);
    });
}
exports.starknetMigrateAction = starknetMigrateAction;
//# sourceMappingURL=task-actions.js.map