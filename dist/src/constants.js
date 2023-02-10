"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETH_ADDRESS = exports.UDC_DEPLOY_FUNCTION_NAME = exports.UDC_ADDRESS = exports.HEXADECIMAL_REGEX = exports.QUERY_VERSION = exports.TRANSACTION_VERSION = exports.PREFIX_TRANSACTION = exports.StarknetChainId = exports.TransactionHashPrefix = exports.SHORT_STRING_MAX_CHARACTERS = exports.LEN_SUFFIX = exports.REQUEST_TIMEOUT = exports.CHECK_STATUS_RECOVER_TIMEOUT = exports.CHECK_STATUS_TIMEOUT = exports.VOYAGER_MAINNET_VERIFIED_URL = exports.VOYAGER_MAINNET_CONTRACT_API_URL = exports.VOYAGER_GOERLI_2_VERIFIED_URL = exports.VOYAGER_GOERLI_2_CONTRACT_API_URL = exports.VOYAGER_GOERLI_VERIFIED_URL = exports.VOYAGER_GOERLI_CONTRACT_API_URL = exports.INTEGRATED_DEVNET_INTERNALLY = exports.INTEGRATED_DEVNET = exports.ALPHA_MAINNET_URL = exports.ALPHA_GOERLI_URL_2 = exports.ALPHA_URL = exports.DEFAULT_STARKNET_NETWORK = exports.ALPHA_MAINNET_INTERNALLY = exports.ALPHA_MAINNET = exports.ALPHA_TESTNET_2_INTERNALLY = exports.ALPHA_TESTNET_INTERNALLY = exports.ALPHA_TESTNET_2 = exports.ALPHA_TESTNET = exports.INTERNAL_ARTIFACTS_DIR = exports.CAIRO_CLI_DOCKER_REPOSITORY_WITH_TAG = exports.INTEGRATED_DEVNET_URL = exports.AMARNA_DOCKER_IMAGE_TAG = exports.AMARNA_DOCKER_REPOSITORY = exports.DEFAULT_DEVNET_DOCKER_IMAGE_TAG = exports.DEVNET_DOCKER_REPOSITORY = exports.CAIRO_CLI_DEFAULT_DOCKER_IMAGE_TAG = exports.CAIRO_CLI_DOCKER_REPOSITORY = exports.DEFAULT_STARKNET_ACCOUNT_PATH = exports.DEFAULT_STARKNET_ARTIFACTS_PATH = exports.DEFAULT_STARKNET_SOURCES_PATH = exports.ABI_SUFFIX = exports.PLUGIN_NAME = void 0;
const config_json_1 = __importDefault(require("../config.json"));
exports.PLUGIN_NAME = "Starknet";
exports.ABI_SUFFIX = "_abi.json";
exports.DEFAULT_STARKNET_SOURCES_PATH = "contracts";
exports.DEFAULT_STARKNET_ARTIFACTS_PATH = "starknet-artifacts";
exports.DEFAULT_STARKNET_ACCOUNT_PATH = "~/.starknet_accounts";
exports.CAIRO_CLI_DOCKER_REPOSITORY = "shardlabs/cairo-cli";
exports.CAIRO_CLI_DEFAULT_DOCKER_IMAGE_TAG = config_json_1.default["CAIRO_LANG"];
exports.DEVNET_DOCKER_REPOSITORY = "shardlabs/starknet-devnet";
exports.DEFAULT_DEVNET_DOCKER_IMAGE_TAG = config_json_1.default["STARKNET_DEVNET"];
exports.AMARNA_DOCKER_REPOSITORY = "shramee/amarna";
exports.AMARNA_DOCKER_IMAGE_TAG = "latest";
exports.INTEGRATED_DEVNET_URL = "http://127.0.0.1:5050";
exports.CAIRO_CLI_DOCKER_REPOSITORY_WITH_TAG = `${exports.CAIRO_CLI_DOCKER_REPOSITORY}:${exports.CAIRO_CLI_DEFAULT_DOCKER_IMAGE_TAG}`;
exports.INTERNAL_ARTIFACTS_DIR = "contract-artifacts";
exports.ALPHA_TESTNET = "alpha-goerli";
exports.ALPHA_TESTNET_2 = "alpha-goerli2";
exports.ALPHA_TESTNET_INTERNALLY = "alphaGoerli";
exports.ALPHA_TESTNET_2_INTERNALLY = "alphaGoerli2";
exports.ALPHA_MAINNET = "alpha-mainnet";
exports.ALPHA_MAINNET_INTERNALLY = "alphaMainnet";
exports.DEFAULT_STARKNET_NETWORK = exports.ALPHA_TESTNET_INTERNALLY;
exports.ALPHA_URL = "https://alpha4.starknet.io";
exports.ALPHA_GOERLI_URL_2 = "https://alpha4-2.starknet.io";
exports.ALPHA_MAINNET_URL = "https://alpha-mainnet.starknet.io";
exports.INTEGRATED_DEVNET = "integrated-devnet";
exports.INTEGRATED_DEVNET_INTERNALLY = "integratedDevnet";
exports.VOYAGER_GOERLI_CONTRACT_API_URL = "https://goerli.voyager.online/api/contract/";
exports.VOYAGER_GOERLI_VERIFIED_URL = "https://goerli.voyager.online/contract/";
exports.VOYAGER_GOERLI_2_CONTRACT_API_URL = "https://goerli-2.voyager.online/api/contract";
exports.VOYAGER_GOERLI_2_VERIFIED_URL = "https://goerli-2.voyager.online/contract/";
exports.VOYAGER_MAINNET_CONTRACT_API_URL = "https://voyager.online/api/contract/";
exports.VOYAGER_MAINNET_VERIFIED_URL = "https://voyager.online/contract/";
exports.CHECK_STATUS_TIMEOUT = 5000; // ms
exports.CHECK_STATUS_RECOVER_TIMEOUT = 10000; // ms
exports.REQUEST_TIMEOUT = 90000; // ms
exports.LEN_SUFFIX = "_len";
exports.SHORT_STRING_MAX_CHARACTERS = 31;
var TransactionHashPrefix;
(function (TransactionHashPrefix) {
    TransactionHashPrefix["DECLARE"] = "28258975365558885";
    TransactionHashPrefix["DEPLOY"] = "110386840629113";
    TransactionHashPrefix["DEPLOY_ACCOUNT"] = "2036277798190617858034555652763252";
    TransactionHashPrefix["INVOKE"] = "115923154332517";
})(TransactionHashPrefix = exports.TransactionHashPrefix || (exports.TransactionHashPrefix = {}));
var StarknetChainId;
(function (StarknetChainId) {
    StarknetChainId["MAINNET"] = "0x534e5f4d41494e";
    StarknetChainId["TESTNET"] = "0x534e5f474f45524c49";
    StarknetChainId["TESTNET2"] = "0x534e5f474f45524c4932";
})(StarknetChainId = exports.StarknetChainId || (exports.StarknetChainId = {}));
exports.PREFIX_TRANSACTION = "StarkNet Transaction";
exports.TRANSACTION_VERSION = BigInt(1);
exports.QUERY_VERSION = BigInt(2) ** BigInt(128) + exports.TRANSACTION_VERSION;
exports.HEXADECIMAL_REGEX = /^0x[0-9a-fA-F]+?$/;
exports.UDC_ADDRESS = "0x41A78E741E5AF2FEC34B695679BC6891742439F7AFB8484ECD7766661AD02BF";
exports.UDC_DEPLOY_FUNCTION_NAME = "deployContract";
exports.ETH_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
//# sourceMappingURL=constants.js.map