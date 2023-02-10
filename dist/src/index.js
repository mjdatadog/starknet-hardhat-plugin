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
const path = __importStar(require("path"));
const config_1 = require("hardhat/config");
const starknet_plugin_error_1 = require("./starknet-plugin-error");
const plugins_1 = require("hardhat/plugins");
const exit_hook_1 = __importDefault(require("exit-hook"));
require("./type-extensions");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const starknet_wrappers_1 = require("./starknet-wrappers");
const task_actions_1 = require("./task-actions");
const extend_utils_1 = require("./extend-utils");
const devnet_utils_1 = require("./devnet-utils");
const external_server_1 = require("./external-server");
const account_1 = require("./account");
const docker_amarna_1 = require("./external-server/docker-amarna");
(0, exit_hook_1.default)(() => {
    external_server_1.ExternalServer.cleanAll();
});
// copy all user-defined cairo settings; other extendConfig calls will overwrite if needed
(0, config_1.extendConfig)((config, userConfig) => {
    if (userConfig.starknet) {
        config.starknet = JSON.parse(JSON.stringify(userConfig.starknet));
    }
    if (!config.starknet) {
        config.starknet = {};
    }
});
// add sources path
(0, config_1.extendConfig)((config, userConfig) => {
    let newPath;
    if (userConfig.paths && userConfig.paths.starknetSources) {
        const userPath = userConfig.paths.starknetSources;
        if (path.isAbsolute(userPath)) {
            newPath = userPath;
        }
        else {
            newPath = path.normalize(path.join(config.paths.root, userPath));
        }
        config.paths.starknetSources = userConfig.paths.starknetSources;
    }
    else {
        const defaultPath = path.join(config.paths.root, constants_1.DEFAULT_STARKNET_SOURCES_PATH);
        newPath = defaultPath;
    }
    config.paths.starknetSources = newPath;
});
// add artifacts path
(0, config_1.extendConfig)((config, userConfig) => {
    let newPath;
    if (userConfig.paths && userConfig.paths.starknetArtifacts) {
        const userPath = userConfig.paths.starknetArtifacts;
        if (path.isAbsolute(userPath)) {
            newPath = userPath;
        }
        else {
            newPath = path.normalize(path.join(config.paths.root, userPath));
        }
        config.paths.starknetArtifacts = userConfig.paths.starknetArtifacts;
    }
    else {
        const defaultPath = path.join(config.paths.root, constants_1.DEFAULT_STARKNET_ARTIFACTS_PATH);
        newPath = defaultPath;
    }
    config.paths.starknetArtifacts = newPath;
});
// add url to alpha network
(0, config_1.extendConfig)((config) => {
    if (!config.networks.alphaGoerli) {
        config.networks.alphaGoerli = (0, utils_1.getDefaultHttpNetworkConfig)(constants_1.ALPHA_URL, constants_1.VOYAGER_GOERLI_CONTRACT_API_URL, constants_1.VOYAGER_GOERLI_VERIFIED_URL, constants_1.StarknetChainId.TESTNET);
    }
    if (!config.networks.alphaGoerli2) {
        config.networks.alphaGoerli2 = (0, utils_1.getDefaultHttpNetworkConfig)(constants_1.ALPHA_GOERLI_URL_2, constants_1.VOYAGER_GOERLI_2_CONTRACT_API_URL, constants_1.VOYAGER_GOERLI_2_VERIFIED_URL, constants_1.StarknetChainId.TESTNET2);
    }
    if (!config.networks.alphaMainnet) {
        config.networks.alphaMainnet = (0, utils_1.getDefaultHttpNetworkConfig)(constants_1.ALPHA_MAINNET_URL, constants_1.VOYAGER_MAINNET_CONTRACT_API_URL, constants_1.VOYAGER_MAINNET_VERIFIED_URL, constants_1.StarknetChainId.MAINNET);
    }
    if (!config.networks.integratedDevnet) {
        config.networks.integratedDevnet = (0, utils_1.getDefaultHardhatNetworkConfig)(constants_1.INTEGRATED_DEVNET_URL);
    }
});
// set network as specified in userConfig
(0, config_1.extendConfig)((config, userConfig) => {
    if (userConfig.starknet && userConfig.starknet.network) {
        config.starknet.network = userConfig.starknet.network;
    }
    else {
        config.starknet.network = constants_1.DEFAULT_STARKNET_NETWORK;
    }
    const networkConfig = (0, utils_1.getNetwork)(config.starknet.network, config.networks, "starknet.network in hardhat.config");
    config.starknet.networkConfig = networkConfig;
});
function setVenvWrapper(hre, venvPath) {
    if (hre.config.starknet.dockerizedVersion) {
        const msg = "Error in config file. Only one of (starknet.dockerizedVersion, starknet.venv) can be specified.";
        throw new starknet_plugin_error_1.StarknetPluginError(msg);
    }
    hre.starknetWrapper = new starknet_wrappers_1.VenvWrapper(venvPath, hre);
}
function extractAccountPaths(hre) {
    const accountPaths = new Set();
    const wallets = hre.config.starknet.wallets || {};
    for (const walletName in wallets) {
        const wallet = wallets[walletName];
        if (wallet.accountPath) {
            const normalizedPath = (0, utils_1.getAccountPath)(wallet.accountPath, hre);
            accountPaths.add(normalizedPath);
        }
    }
    return [...accountPaths];
}
// add venv wrapper or docker wrapper of starknet
(0, config_1.extendEnvironment)((hre) => {
    const venvPath = hre.config.starknet.venv;
    if (venvPath) {
        setVenvWrapper(hre, venvPath);
    }
    else {
        const repository = constants_1.CAIRO_CLI_DOCKER_REPOSITORY;
        const tag = (0, utils_1.getImageTagByArch)(hre.config.starknet.dockerizedVersion || constants_1.CAIRO_CLI_DEFAULT_DOCKER_IMAGE_TAG);
        const image = { repository, tag };
        const accountPaths = extractAccountPaths(hre);
        const cairoPaths = [];
        for (const cairoPath of hre.config.paths.cairoPaths || []) {
            if (!path.isAbsolute(cairoPath)) {
                cairoPaths.push((0, utils_1.adaptPath)(hre.config.paths.root, cairoPath));
            }
            else {
                cairoPaths.push(cairoPath);
            }
        }
        hre.starknetWrapper = new starknet_wrappers_1.DockerWrapper(image, hre.config.paths.root, accountPaths, cairoPaths, hre);
        const amarnaImage = { repository: constants_1.AMARNA_DOCKER_REPOSITORY, tag: constants_1.AMARNA_DOCKER_IMAGE_TAG };
        hre.amarnaDocker = new docker_amarna_1.AmarnaDocker(amarnaImage, hre.config.paths.root, hre.config.paths.cairoPaths || [], hre);
    }
});
(0, config_1.task)("starknet-compile", "Compiles Starknet contracts")
    .addOptionalVariadicPositionalParam("paths", "The paths to be used for deployment.\n" +
    "Each of the provided paths is recursively looked into while searching for compilation artifacts.\n" +
    "If no paths are provided, the default contracts directory is traversed.")
    .addOptionalParam("cairoPath", "Allows specifying the locations of imported files, if necessary.\n" +
    "Separate them with a colon (:), e.g. --cairo-path='path/to/lib1:path/to/lib2'")
    .addFlag("accountContract", "Allows compiling an account contract.")
    .addFlag("disableHintValidation", "Allows compiling a contract with any python code in hints.")
    .setAction(task_actions_1.starknetCompileAction);
(0, config_1.extendEnvironment)((hre) => {
    hre.starknet = {
        getContractFactory: (contractPath) => __awaiter(void 0, void 0, void 0, function* () {
            const contractFactory = yield (0, extend_utils_1.getContractFactoryUtil)(hre, contractPath);
            return contractFactory;
        }),
        shortStringToBigInt: (convertableString) => {
            const convertedString = (0, extend_utils_1.shortStringToBigIntUtil)(convertableString);
            return convertedString;
        },
        bigIntToShortString: (convertableBigInt) => {
            const convertedBigInt = (0, extend_utils_1.bigIntToShortStringUtil)(convertableBigInt);
            return convertedBigInt;
        },
        getWallet: (name) => {
            const wallet = (0, extend_utils_1.getWalletUtil)(name, hre);
            return wallet;
        },
        devnet: (0, plugins_1.lazyObject)(() => new devnet_utils_1.DevnetUtils(hre)),
        getTransaction: (txHash) => __awaiter(void 0, void 0, void 0, function* () {
            const transaction = yield (0, extend_utils_1.getTransactionUtil)(txHash, hre);
            return transaction;
        }),
        getTransactionReceipt: (txHash) => __awaiter(void 0, void 0, void 0, function* () {
            const txReceipt = yield (0, extend_utils_1.getTransactionReceiptUtil)(txHash, hre);
            return txReceipt;
        }),
        getTransactionTrace: (txHash) => __awaiter(void 0, void 0, void 0, function* () {
            const txTrace = yield (0, extend_utils_1.getTransactionTraceUtil)(txHash, hre);
            return txTrace;
        }),
        getBlock: (identifier) => __awaiter(void 0, void 0, void 0, function* () {
            const block = yield (0, extend_utils_1.getBlockUtil)(hre, identifier);
            return block;
        }),
        getNonce: (address, options) => __awaiter(void 0, void 0, void 0, function* () {
            const nonce = yield (0, extend_utils_1.getNonceUtil)(hre, address, options);
            return nonce;
        }),
        getBalance: (address) => __awaiter(void 0, void 0, void 0, function* () {
            const balance = yield (0, extend_utils_1.getBalanceUtil)(address, hre);
            return balance;
        }),
        network: hre.config.starknet.network,
        networkConfig: hre.config.starknet.networkConfig,
        OpenZeppelinAccount: account_1.OpenZeppelinAccount,
        ArgentAccount: account_1.ArgentAccount
    };
});
(0, config_1.task)("starknet-verify", "Verifies a contract on a Starknet network.")
    .addOptionalParam("starknetNetwork", "The network version to be used (e.g. alpha)")
    .addParam("path", "The path of the main cairo contract (e.g. contracts/contract.cairo)")
    .addParam("address", "The address where the contract is deployed")
    .addParam("compilerVersion", "The compiler version used to compile the cairo contract")
    .addFlag("accountContract", "The contract type which specifies it's an account contract.")
    .addOptionalParam("license", "The licence of the contract (e.g No License (None))")
    .addOptionalVariadicPositionalParam("paths", "The paths of the dependencies of the contract specified in --path\n" +
    "All dependencies should be in the same folder as the contract." +
    "e.g. path/to/dependency1 path/to/dependency2")
    .setAction(task_actions_1.starknetVoyagerAction);
(0, config_1.task)("starknet-new-account", "Initializes a new account according to the parameters.")
    .addParam("wallet", "The wallet object to use, defined in the 'hardhat.config' file")
    .addParam("starknetNetwork", "The network version to be used (e.g. alpha)")
    .setAction(task_actions_1.starknetNewAccountAction);
(0, config_1.task)("starknet-deploy-account", "Deploys a new account according to the parameters.")
    .addParam("wallet", "The wallet object to use, defined in the 'hardhat.config' file")
    .addParam("starknetNetwork", "The network version to be used (e.g. alpha)")
    .setAction(task_actions_1.starknetDeployAccountAction);
function addStarknetNetworkParam(task) {
    return task.addOptionalParam("starknetNetwork", "Specify the starknet-network to be used; overrides the value from hardhat.config");
}
addStarknetNetworkParam((0, config_1.task)("test")).setAction(task_actions_1.starknetTestAction);
addStarknetNetworkParam((0, config_1.task)("run")).setAction(task_actions_1.starknetRunAction);
(0, config_1.task)("starknet-plugin-version", "Prints the version of the starknet plugin.").setAction(task_actions_1.starknetPluginVersionAction);
(0, config_1.task)("migrate", "Migrates a cairo contract to syntax of cairo-lang v0.10.0.")
    .addOptionalVariadicPositionalParam("paths", "The name of the contract to migrate")
    .addFlag("inplace", "Applies changes to the files in place.")
    .setAction(task_actions_1.starknetMigrateAction);
(0, config_1.task)("amarna", "Runs Amarna, the static-analyzer and linter for Cairo.")
    .addFlag("script", "Run ./amarna.sh file to use Amarna with custom args.")
    .setAction(task_actions_1.amarnaAction);
//# sourceMappingURL=index.js.map