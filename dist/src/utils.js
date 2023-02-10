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
exports.estimatedFeeToMaxFee = exports.bnToDecimalStringArray = exports.handleJsonWithBigInt = exports.readContract = exports.UDC = exports.generateRandomSalt = exports.numericToHexString = exports.warn = exports.sleep = exports.getImageTagByArch = exports.copyWithBigint = exports.getAccountPath = exports.findPath = exports.isStarknetDevnet = exports.getNetwork = exports.checkArtifactExists = exports.adaptPath = exports.getArtifactPath = exports.traverseFiles = exports.getDefaultHardhatNetworkConfig = exports.getDefaultHttpNetworkConfig = exports.adaptUrl = exports.adaptLog = void 0;
const starknet_plugin_error_1 = require("./starknet-plugin-error");
const constants_1 = require("./constants");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const glob_1 = require("glob");
const util_1 = require("util");
const starknet_1 = require("starknet");
const account_utils_1 = require("./account-utils");
const extend_utils_1 = require("./extend-utils");
const stark_1 = require("starknet/utils/stark");
const json_bigint_1 = __importDefault(require("json-bigint"));
const globPromise = (0, util_1.promisify)(glob_1.glob);
/**
 * Replaces Starknet specific terminology with the terminology used in this plugin.
 *
 * @param msg the log message to be adapted
 * @returns the log message with adaptation replacements
 */
function adaptLog(msg) {
    return msg
        .replace("--network", "--starknet-network")
        .replace("gateway_url", "gateway-url")
        .replace("--account_contract", "--account-contract")
        .replace("the 'starknet deploy_account' command", "'hardhat starknet-deploy-account'")
        .replace("the 'new_account' command", "'hardhat starknet-new-account'")
        .split(".\nTraceback (most recent call last)")[0] // remove duplicated log
        .replace(/\\n/g, "\n"); // use newlines from json response for formatting
}
exports.adaptLog = adaptLog;
const DOCKER_HOST = "host.docker.internal";
const MACOS_PLATFORM = "darwin";
/**
 * Adapts `url` by replacing localhost and 127.0.0.1 with `host.internal.docker`
 * @param url string representing the url to be adapted
 * @returns adapted url
 */
function adaptUrl(url) {
    if (process.platform === MACOS_PLATFORM) {
        for (const protocol of ["http://", "https://", ""]) {
            for (const host of ["localhost", "127.0.0.1"]) {
                if (url === `${protocol}${host}`) {
                    return `${protocol}${DOCKER_HOST}`;
                }
                const prefix = `${protocol}${host}:`;
                if (url.startsWith(prefix)) {
                    return url.replace(prefix, `${protocol}${DOCKER_HOST}:`);
                }
            }
        }
    }
    return url;
}
exports.adaptUrl = adaptUrl;
function getDefaultHttpNetworkConfig(url, verificationUrl, verifiedUrl, starknetChainId) {
    return {
        url,
        verificationUrl,
        verifiedUrl,
        starknetChainId,
        accounts: undefined,
        gas: undefined,
        gasMultiplier: undefined,
        gasPrice: undefined,
        httpHeaders: undefined,
        timeout: undefined
    };
}
exports.getDefaultHttpNetworkConfig = getDefaultHttpNetworkConfig;
function getDefaultHardhatNetworkConfig(url) {
    return {
        url,
        chainId: undefined,
        gas: undefined,
        gasPrice: undefined,
        gasMultiplier: undefined,
        hardfork: undefined,
        mining: undefined,
        accounts: undefined,
        blockGasLimit: undefined,
        minGasPrice: undefined,
        throwOnTransactionFailures: undefined,
        throwOnCallFailures: undefined,
        allowUnlimitedContractSize: undefined,
        initialDate: undefined,
        loggingEnabled: undefined,
        chains: undefined
    };
}
exports.getDefaultHardhatNetworkConfig = getDefaultHardhatNetworkConfig;
function traverseFiles(traversable, fileCriteria = "*") {
    return __awaiter(this, void 0, void 0, function* () {
        let paths = [];
        if (fs.lstatSync(traversable).isDirectory()) {
            paths = yield globPromise(path.join(traversable, "**", fileCriteria));
        }
        else {
            paths.push(traversable);
        }
        const files = paths.filter((file) => fs.lstatSync(file).isFile());
        return files;
    });
}
exports.traverseFiles = traverseFiles;
function getArtifactPath(sourcePath, paths) {
    const rootRegex = new RegExp("^" + paths.root);
    const suffix = sourcePath.replace(rootRegex, "");
    return path.join(paths.starknetArtifacts, suffix);
}
exports.getArtifactPath = getArtifactPath;
function adaptPath(root, newPath) {
    return path.normalize(path.join(root, newPath));
}
exports.adaptPath = adaptPath;
function checkArtifactExists(artifactsPath) {
    if (!fs.existsSync(artifactsPath)) {
        const msg = `Artifact expected to be at ${artifactsPath}, but not found. Consider recompiling your contracts.`;
        throw new starknet_plugin_error_1.StarknetPluginError(msg);
    }
}
exports.checkArtifactExists = checkArtifactExists;
/**
 * Extracts the network config from `hre.config.networks` according to `networkName`.
 * @param networkName The name of the network
 * @param networks Object holding network configs
 * @param origin Short string describing where/how `networkName` was specified
 * @returns Network config corresponding to `networkName`
 */
function getNetwork(networkName, networks, origin) {
    if (isMainnet(networkName)) {
        networkName = constants_1.ALPHA_MAINNET_INTERNALLY;
    }
    else if (isTestnet(networkName)) {
        networkName = constants_1.ALPHA_TESTNET_INTERNALLY;
    }
    else if (isTestnetTwo(networkName)) {
        networkName = constants_1.ALPHA_TESTNET_2_INTERNALLY;
    }
    else if (isStarknetDevnet(networkName)) {
        networkName = constants_1.INTEGRATED_DEVNET_INTERNALLY;
    }
    const network = networks[networkName];
    if (!network) {
        const available = Object.keys(networks).join(", ");
        const msg = `Invalid network provided in ${origin}: ${networkName}.\nValid hardhat networks: ${available}`;
        throw new starknet_plugin_error_1.StarknetPluginError(msg);
    }
    if (!network.url) {
        throw new starknet_plugin_error_1.StarknetPluginError(`Cannot use network ${networkName}. No "url" specified.`);
    }
    network.starknetChainId || (network.starknetChainId = constants_1.StarknetChainId.TESTNET);
    return network;
}
exports.getNetwork = getNetwork;
function isTestnet(networkName) {
    return networkName === constants_1.ALPHA_TESTNET || networkName === constants_1.ALPHA_TESTNET_INTERNALLY;
}
function isTestnetTwo(networkName) {
    return networkName === constants_1.ALPHA_TESTNET_2 || networkName === constants_1.ALPHA_TESTNET_2_INTERNALLY;
}
function isMainnet(networkName) {
    return networkName === constants_1.ALPHA_MAINNET || networkName === constants_1.ALPHA_MAINNET_INTERNALLY;
}
function isStarknetDevnet(networkName) {
    return networkName === constants_1.INTEGRATED_DEVNET || networkName === constants_1.INTEGRATED_DEVNET_INTERNALLY;
}
exports.isStarknetDevnet = isStarknetDevnet;
function findPath(traversable, pathSegment) {
    return __awaiter(this, void 0, void 0, function* () {
        // Relative path to artifacts can be resolved now
        const resolvedPath = path.resolve(path.join(traversable, pathSegment));
        if (fs.existsSync(resolvedPath) && fs.lstatSync(resolvedPath).isFile()) {
            return resolvedPath;
        }
        let files = yield traverseFiles(traversable);
        files = files.filter((f) => f.endsWith(pathSegment));
        if (files.length == 0) {
            return null;
        }
        else if (files.length == 1) {
            return files[0];
        }
        else {
            const msg = "More than one file was found because the path provided is ambiguous, please specify a relative path";
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
    });
}
exports.findPath = findPath;
/**
 *
 * @param accountPath Path where the account file is saved
 * @param hre The HardhatRuntimeEnvironment
 * @returns Absolute path where the account file is saved
 */
function getAccountPath(accountPath, hre) {
    let accountDir = accountPath || constants_1.DEFAULT_STARKNET_ACCOUNT_PATH;
    // Adapt path to be absolute
    if (accountDir[0] === "~") {
        accountDir = path.normalize(path.join(process.env.HOME, accountDir.slice(1)));
    }
    else if (!path.isAbsolute(accountDir)) {
        const root = hre.config.paths.root;
        accountDir = path.normalize(path.join(root, accountDir));
    }
    return accountDir;
}
exports.getAccountPath = getAccountPath;
function copyWithBigint(object) {
    return JSON.parse(JSON.stringify(object, (_key, value) => typeof value === "bigint" ? value.toString() : value));
}
exports.copyWithBigint = copyWithBigint;
function getImageTagByArch(tag) {
    // Check CPU architecture
    const arch = process.arch;
    if (arch === "arm64" && !tag.endsWith("-arm")) {
        tag = `${tag}-arm`;
    }
    return tag;
}
exports.getImageTagByArch = getImageTagByArch;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
/**
 * Log a yellow message to STDERR.
 * @param message
 */
function warn(message) {
    console.warn("\x1b[33m%s\x1b[0m", message);
}
exports.warn = warn;
/**
 * Converts BigInt to 0x-prefixed hex string
 * @param numeric
 */
function numericToHexString(numeric) {
    return "0x" + BigInt(numeric).toString(16);
}
exports.numericToHexString = numericToHexString;
/**
 * @returns random salt
 */
function generateRandomSalt() {
    return starknet_1.stark.randomAddress();
}
exports.generateRandomSalt = generateRandomSalt;
/**
 * Global handler of UDC
 */
class UDC {
    /**
     * Returns the UDC singleton.
     */
    static getInstance() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!UDC.instance) {
                const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
                const contractPath = (0, account_utils_1.handleInternalContractArtifacts)("OpenZeppelinUDC", // dir name
                "UDC", // file name
                "0.5.0", // version
                hre);
                const udcContractFactory = yield (0, extend_utils_1.getContractFactoryUtil)(hre, contractPath);
                UDC.instance = udcContractFactory.getContractAt(constants_1.UDC_ADDRESS);
            }
            return UDC.instance;
        });
    }
}
exports.UDC = UDC;
function readContract(contractPath) {
    const { parse } = handleJsonWithBigInt(false);
    const parsedContract = parse(fs.readFileSync(contractPath).toString("ascii"));
    return Object.assign(Object.assign({}, parsedContract), { program: (0, stark_1.compressProgram)(parsedContract.program) });
}
exports.readContract = readContract;
function handleJsonWithBigInt(alwaysParseAsBig) {
    return (0, json_bigint_1.default)({
        alwaysParseAsBig,
        useNativeBigInt: true,
        protoAction: "preserve",
        constructorAction: "preserve"
    });
}
exports.handleJsonWithBigInt = handleJsonWithBigInt;
function bnToDecimalStringArray(rawCalldata) {
    return rawCalldata.map((x) => x.toString(10));
}
exports.bnToDecimalStringArray = bnToDecimalStringArray;
function estimatedFeeToMaxFee(amount, overhead = 0.5) {
    overhead = Math.round((1 + overhead) * 100);
    return (amount * BigInt(overhead)) / BigInt(100);
}
exports.estimatedFeeToMaxFee = estimatedFeeToMaxFee;
//# sourceMappingURL=utils.js.map