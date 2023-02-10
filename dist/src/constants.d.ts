export declare const PLUGIN_NAME = "Starknet";
export declare const ABI_SUFFIX = "_abi.json";
export declare const DEFAULT_STARKNET_SOURCES_PATH = "contracts";
export declare const DEFAULT_STARKNET_ARTIFACTS_PATH = "starknet-artifacts";
export declare const DEFAULT_STARKNET_ACCOUNT_PATH = "~/.starknet_accounts";
export declare const CAIRO_CLI_DOCKER_REPOSITORY = "shardlabs/cairo-cli";
export declare const CAIRO_CLI_DEFAULT_DOCKER_IMAGE_TAG: string;
export declare const DEVNET_DOCKER_REPOSITORY = "shardlabs/starknet-devnet";
export declare const DEFAULT_DEVNET_DOCKER_IMAGE_TAG: string;
export declare const AMARNA_DOCKER_REPOSITORY = "shramee/amarna";
export declare const AMARNA_DOCKER_IMAGE_TAG = "latest";
export declare const INTEGRATED_DEVNET_URL = "http://127.0.0.1:5050";
export declare const CAIRO_CLI_DOCKER_REPOSITORY_WITH_TAG: string;
export declare const INTERNAL_ARTIFACTS_DIR = "contract-artifacts";
export declare const ALPHA_TESTNET = "alpha-goerli";
export declare const ALPHA_TESTNET_2 = "alpha-goerli2";
export declare const ALPHA_TESTNET_INTERNALLY = "alphaGoerli";
export declare const ALPHA_TESTNET_2_INTERNALLY = "alphaGoerli2";
export declare const ALPHA_MAINNET = "alpha-mainnet";
export declare const ALPHA_MAINNET_INTERNALLY = "alphaMainnet";
export declare const DEFAULT_STARKNET_NETWORK = "alphaGoerli";
export declare const ALPHA_URL = "https://alpha4.starknet.io";
export declare const ALPHA_GOERLI_URL_2 = "https://alpha4-2.starknet.io";
export declare const ALPHA_MAINNET_URL = "https://alpha-mainnet.starknet.io";
export declare const INTEGRATED_DEVNET = "integrated-devnet";
export declare const INTEGRATED_DEVNET_INTERNALLY = "integratedDevnet";
export declare const VOYAGER_GOERLI_CONTRACT_API_URL = "https://goerli.voyager.online/api/contract/";
export declare const VOYAGER_GOERLI_VERIFIED_URL = "https://goerli.voyager.online/contract/";
export declare const VOYAGER_GOERLI_2_CONTRACT_API_URL = "https://goerli-2.voyager.online/api/contract";
export declare const VOYAGER_GOERLI_2_VERIFIED_URL = "https://goerli-2.voyager.online/contract/";
export declare const VOYAGER_MAINNET_CONTRACT_API_URL = "https://voyager.online/api/contract/";
export declare const VOYAGER_MAINNET_VERIFIED_URL = "https://voyager.online/contract/";
export declare const CHECK_STATUS_TIMEOUT = 5000;
export declare const CHECK_STATUS_RECOVER_TIMEOUT = 10000;
export declare const REQUEST_TIMEOUT = 90000;
export declare const LEN_SUFFIX = "_len";
export declare const SHORT_STRING_MAX_CHARACTERS = 31;
export declare enum TransactionHashPrefix {
    DECLARE = "28258975365558885",
    DEPLOY = "110386840629113",
    DEPLOY_ACCOUNT = "2036277798190617858034555652763252",
    INVOKE = "115923154332517"
}
export declare enum StarknetChainId {
    MAINNET = "0x534e5f4d41494e",
    TESTNET = "0x534e5f474f45524c49",
    TESTNET2 = "0x534e5f474f45524c4932"
}
export declare const PREFIX_TRANSACTION = "StarkNet Transaction";
export declare const TRANSACTION_VERSION: bigint;
export declare const QUERY_VERSION: bigint;
export declare const HEXADECIMAL_REGEX: RegExp;
export declare const UDC_ADDRESS = "0x41A78E741E5AF2FEC34B695679BC6891742439F7AFB8484ECD7766661AD02BF";
export declare const UDC_DEPLOY_FUNCTION_NAME = "deployContract";
export declare const ETH_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
