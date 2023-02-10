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
exports.sendEstimateFeeTx = exports.sendDeployAccountTx = exports.calculateDeployAccountHash = exports.generateKeys = exports.handleInternalContractArtifacts = exports.signMultiCall = exports.generateRandomStarkPrivateKey = void 0;
const types_1 = require("./types");
const number_1 = require("starknet/utils/number");
const ellipticCurve = __importStar(require("starknet/utils/ellipticCurve"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const crypto = __importStar(require("crypto"));
const starknet_1 = require("starknet");
const axios_1 = __importDefault(require("axios"));
const starknet_plugin_error_1 = require("./starknet-plugin-error");
/*
 * Helper cryptography functions for Key generation and message signing
 */
function generateRandomStarkPrivateKey(length = 63) {
    const characters = "0123456789ABCDEF";
    let result = "";
    for (let i = 0; i < length; ++i) {
        result += characters.charAt(crypto.randomInt(characters.length));
    }
    return (0, number_1.toBN)(result, "hex");
}
exports.generateRandomStarkPrivateKey = generateRandomStarkPrivateKey;
function signMultiCall(publicKey, keyPair, messageHash) {
    if (publicKey === "0x0") {
        return [BigInt(0), BigInt(0)];
    }
    return ellipticCurve.sign(keyPair, BigInt(messageHash).toString(16)).map(BigInt);
}
exports.signMultiCall = signMultiCall;
/**
 * Move from an internal directory to the user's artifacts.
 * @param contractDir the subdirectory internally holding the artifact
 * @returns the new path where the artifacts can be found
 */
function handleInternalContractArtifacts(contractDir, contractName, artifactsVersion, hre) {
    // Name of the artifacts' parent folder
    const artifactsBase = contractName + ".cairo";
    const baseArtifactsPath = path_1.default.join(hre.config.paths.starknetArtifacts, constants_1.INTERNAL_ARTIFACTS_DIR);
    // Full path to where the artifacts will be saved
    const artifactsTargetPath = path_1.default.join(baseArtifactsPath, contractDir, artifactsVersion, artifactsBase);
    const jsonArtifact = contractName + ".json";
    const abiArtifact = contractName + constants_1.ABI_SUFFIX;
    const artifactsSourcePath = path_1.default.join(__dirname, "..", // necessary since artifact dir is in the root, not in src
    constants_1.INTERNAL_ARTIFACTS_DIR, contractDir, artifactsVersion, artifactsBase);
    ensureArtifact(jsonArtifact, artifactsTargetPath, artifactsSourcePath);
    ensureArtifact(abiArtifact, artifactsTargetPath, artifactsSourcePath);
    return artifactsTargetPath;
}
exports.handleInternalContractArtifacts = handleInternalContractArtifacts;
/**
 * Checks if the provided artifact exists in the project's artifacts folder.
 * If it doesn't exist, it is downloaded from the GitHub repository.
 * @param fileName artifact file to download. E.g. "Account.json" or "Account_abi.json"
 * @param artifactsTargetPath folder to where the artifacts will be downloaded. E.g. "project/starknet-artifacts/Account.cairo"
 * @param artifactSourcePath path to the folder where the artifacts are stored
 */
function ensureArtifact(fileName, artifactsTargetPath, artifactSourcePath) {
    const finalTargetPath = path_1.default.join(artifactsTargetPath, fileName);
    if (!fs.existsSync(finalTargetPath)) {
        fs.mkdirSync(artifactsTargetPath, { recursive: true });
        const finalSourcePath = path_1.default.join(artifactSourcePath, fileName);
        fs.copyFileSync(finalSourcePath, finalTargetPath);
    }
}
/**
 * If no privateKey provided, generates random values, otherwise calculates from the
 * provided key.
 * @param providedPrivateKey hex string private key to use for generating the public key
 * @returns an object with public, private key and key pair
 */
function generateKeys(providedPrivateKey) {
    const starkPrivateKey = providedPrivateKey
        ? (0, number_1.toBN)(providedPrivateKey.replace(/^0x/, ""), 16)
        : generateRandomStarkPrivateKey();
    const keyPair = ellipticCurve.getKeyPair(starkPrivateKey);
    const publicKey = ellipticCurve.getStarkKey(keyPair);
    const privateKey = "0x" + starkPrivateKey.toString(16);
    return { publicKey, privateKey, keyPair };
}
exports.generateKeys = generateKeys;
const INITIAL_NONCE = "0x0";
function calculateDeployAccountHash(accountAddress, constructorCalldata, salt, classHash, maxFee, chainId) {
    const calldataHash = starknet_1.hash.computeHashOnElements([classHash, salt, ...constructorCalldata]);
    return starknet_1.hash.computeHashOnElements([
        constants_1.TransactionHashPrefix.DEPLOY_ACCOUNT,
        (0, utils_1.numericToHexString)(constants_1.TRANSACTION_VERSION),
        accountAddress,
        0,
        calldataHash,
        maxFee,
        chainId,
        INITIAL_NONCE
    ]);
}
exports.calculateDeployAccountHash = calculateDeployAccountHash;
function sendDeployAccountTx(signatures, classHash, constructorCalldata, salt, maxFee) {
    return __awaiter(this, void 0, void 0, function* () {
        const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
        const resp = yield axios_1.default
            .post(`${hre.starknet.networkConfig.url}/gateway/add_transaction`, {
            max_fee: maxFee,
            signature: signatures,
            nonce: INITIAL_NONCE,
            class_hash: classHash,
            contract_address_salt: salt,
            constructor_calldata: constructorCalldata,
            version: (0, utils_1.numericToHexString)(constants_1.TRANSACTION_VERSION),
            type: "DEPLOY_ACCOUNT"
        })
            .catch((error) => {
            const msg = `Deploying account failed: ${error.response.data.message}`;
            throw new starknet_plugin_error_1.StarknetPluginError(msg, error);
        });
        return new Promise((resolve, reject) => {
            (0, types_1.iterativelyCheckStatus)(resp.data.transaction_hash, hre.starknetWrapper, () => resolve(resp.data.transaction_hash), reject);
        });
    });
}
exports.sendDeployAccountTx = sendDeployAccountTx;
function sendEstimateFeeTx(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
        // To resolve TypeError: Do not know how to serialize a BigInt
        // coming from axios
        BigInt.prototype.toJSON = function () {
            return this.toString();
        };
        const resp = yield axios_1.default.post(`${hre.starknet.networkConfig.url}/feeder_gateway/estimate_fee`, data);
        const { gas_price, gas_usage, overall_fee, unit } = resp.data;
        return {
            amount: BigInt(overall_fee),
            unit,
            gas_price: BigInt(gas_price),
            gas_usage: BigInt(gas_usage)
        };
    });
}
exports.sendEstimateFeeTx = sendEstimateFeeTx;
//# sourceMappingURL=account-utils.js.map