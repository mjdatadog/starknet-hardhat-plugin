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
exports.ArgentAccount = exports.OpenZeppelinAccount = exports.Account = void 0;
const types_1 = require("./types");
const constants_1 = require("./constants");
const starknet_plugin_error_1 = require("./starknet-plugin-error");
const ellipticCurve = __importStar(require("starknet/utils/ellipticCurve"));
const number_1 = require("starknet/utils/number");
const account_utils_1 = require("./account-utils");
const utils_1 = require("./utils");
const starknet_1 = require("starknet");
const extend_utils_1 = require("./extend-utils");
/**
 * Representation of an Account.
 * Multiple implementations can exist, each will be defined by an extension of this Abstract class
 */
class Account {
    constructor(starknetContract, privateKey, salt, deployed) {
        this.starknetContract = starknetContract;
        this.privateKey = privateKey;
        this.salt = salt;
        this.deployed = deployed;
        const signer = (0, account_utils_1.generateKeys)(privateKey);
        this.publicKey = signer.publicKey;
        this.keyPair = signer.keyPair;
    }
    /**
     * Uses the account contract as a proxy to invoke a function on the target contract with a signature
     *
     * @param toContract target contract to be called
     * @param functionName function in the contract to be called
     * @param calldata calldata to use as input for the contract call
     */
    invoke(toContract, functionName, calldata, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((options === null || options === void 0 ? void 0 : options.maxFee) && (options === null || options === void 0 ? void 0 : options.overhead)) {
                const msg = "maxFee and overhead cannot be specified together";
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            if ((options === null || options === void 0 ? void 0 : options.maxFee) === undefined || (options === null || options === void 0 ? void 0 : options.maxFee) === null) {
                const maxFee = yield this.estimateFee(toContract, functionName, calldata, options);
                options = Object.assign(Object.assign({}, options), { maxFee: (0, utils_1.estimatedFeeToMaxFee)(maxFee.amount, options === null || options === void 0 ? void 0 : options.overhead) });
            }
            return (yield this.interact(types_1.InteractChoice.INVOKE, toContract, functionName, calldata, options)).toString();
        });
    }
    get address() {
        return this.starknetContract.address;
    }
    /**
     * Deploy another contract using this account
     * @param contractFactory the factory of the contract to be deployed
     * @param constructorArguments
     * @param options extra options
     * @returns the deployed StarknetContract
     */
    deploy(contractFactory, constructorArguments, options = {}) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const classHash = yield contractFactory.getClassHash();
            const udc = yield utils_1.UDC.getInstance();
            const adaptedArgs = contractFactory.handleConstructorArguments(constructorArguments);
            const deployTxHash = yield this.invoke(udc, constants_1.UDC_DEPLOY_FUNCTION_NAME, {
                classHash,
                salt: (_a = options === null || options === void 0 ? void 0 : options.salt) !== null && _a !== void 0 ? _a : (0, utils_1.generateRandomSalt)(),
                unique: BigInt((_b = options === null || options === void 0 ? void 0 : options.unique) !== null && _b !== void 0 ? _b : true),
                calldata: adaptedArgs
            }, {
                maxFee: options === null || options === void 0 ? void 0 : options.maxFee
            });
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            const deploymentReceipt = yield (0, extend_utils_1.getTransactionReceiptUtil)(deployTxHash, hre);
            const decodedEvents = udc.decodeEvents(deploymentReceipt.events);
            // the only event should be ContractDeployed
            const deployedContractAddress = (0, utils_1.numericToHexString)(decodedEvents[0].data.address);
            const deployedContract = contractFactory.getContractAt(deployedContractAddress);
            deployedContract.deployTxHash = deployTxHash;
            return deployedContract;
        });
    }
    assertNotDeployed() {
        if (this.deployed) {
            const msg = "The account is not expected to be deployed.";
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
    }
    assertDeployed() {
        if (!this.deployed) {
            const msg = "Prior to usage, the account must be funded and deployed.";
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
    }
    estimateFee(toContract, functionName, calldata, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.interact(types_1.InteractChoice.ESTIMATE_FEE, toContract, functionName, calldata, options);
        });
    }
    estimateDeclareFee(contractFactory, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const nonce = options.nonce == null ? yield this.getNonce() : options.nonce;
            const maxFee = (options.maxFee || 0).toString();
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            const classHash = yield hre.starknetWrapper.getClassHash(contractFactory.metadataPath);
            const chainId = hre.starknet.networkConfig.starknetChainId;
            const calldata = [classHash];
            const calldataHash = starknet_1.hash.computeHashOnElements(calldata);
            const messageHash = starknet_1.hash.computeHashOnElements([
                constants_1.TransactionHashPrefix.DECLARE,
                (0, utils_1.numericToHexString)(constants_1.QUERY_VERSION),
                this.address,
                0,
                calldataHash,
                maxFee,
                chainId,
                (0, utils_1.numericToHexString)(nonce)
            ]);
            const signature = this.getSignatures(messageHash);
            const data = {
                type: "DECLARE",
                sender_address: this.address,
                contract_class: (0, utils_1.readContract)(contractFactory.metadataPath),
                signature: (0, utils_1.bnToDecimalStringArray)(signature || []),
                version: (0, utils_1.numericToHexString)(constants_1.QUERY_VERSION),
                nonce: (0, utils_1.numericToHexString)(nonce)
            };
            return yield (0, account_utils_1.sendEstimateFeeTx)(data);
        });
    }
    estimateDeployFee(contractFactory, constructorArguments, options = {}) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const classHash = yield contractFactory.getClassHash();
            const udc = yield utils_1.UDC.getInstance();
            const adaptedArgs = contractFactory.handleConstructorArguments(constructorArguments);
            const calldata = {
                classHash,
                salt: (_a = options === null || options === void 0 ? void 0 : options.salt) !== null && _a !== void 0 ? _a : (0, utils_1.generateRandomSalt)(),
                unique: BigInt((_b = options === null || options === void 0 ? void 0 : options.unique) !== null && _b !== void 0 ? _b : true),
                calldata: adaptedArgs
            };
            return yield this.estimateFee(udc, constants_1.UDC_DEPLOY_FUNCTION_NAME, calldata, options);
        });
    }
    interact(choice, toContract, functionName, calldata, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const call = {
                functionName: functionName,
                toContract: toContract,
                calldata: calldata
            };
            return yield this.multiInteract(choice, [call], options);
        });
    }
    /**
     * Performes multiple invokes as a single transaction through this account
     * @param callParameters an array with the paramaters for each invoke
     * @returns the transaction hash of the invoke
     */
    multiInvoke(callParameters, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // Invoke only returns one transaction hash, as the multiple invokes are done by the account contract, but only one is sent to it.
            return yield this.multiInteract(types_1.InteractChoice.INVOKE, callParameters, options);
        });
    }
    /**
     * Etimate the fee of the multicall.
     * @param callParameters an array with the parameters for each call
     * @returns the total estimated fee
     */
    multiEstimateFee(callParameters, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.multiInteract(types_1.InteractChoice.ESTIMATE_FEE, callParameters, options);
        });
    }
    multiInteract(choice, callParameters, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertDeployed();
            options = (0, utils_1.copyWithBigint)(options);
            options.maxFee = BigInt((options === null || options === void 0 ? void 0 : options.maxFee) || "0");
            const nonce = options.nonce == null ? yield this.getNonce() : options.nonce;
            delete options.nonce; // the options object is incompatible if passed on with nonce
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            const { messageHash, args } = this.handleMultiInteract(this.address, callParameters, nonce, options.maxFee, choice.transactionVersion, hre.starknet.networkConfig.starknetChainId);
            if (options.signature) {
                const msg = "Custom signature cannot be specified when using Account (it is calculated automatically)";
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            const signatures = this.getSignatures(messageHash);
            const contractInteractOptions = Object.assign({ signature: signatures }, options);
            const contractInteractor = (this.starknetContract[choice.internalCommand]).bind(this.starknetContract);
            const executionFunctionName = this.getExecutionFunctionName();
            return contractInteractor(executionFunctionName, args, contractInteractOptions);
        });
    }
    /**
     * Prepares the calldata and hashes the message for the multicall execution
     *
     * @param accountAddress address of the account contract
     * @param callParameters array witht the call parameters
     * @param nonce current nonce
     * @param maxFee the maximum fee amount set for the contract interaction
     * @param version the transaction version
     * @returns the message hash for the multicall and the arguments to execute it with
     */
    handleMultiInteract(accountAddress, callParameters, nonce, maxFee, version, chainId) {
        const callArray = callParameters.map((callParameters) => {
            return {
                contractAddress: callParameters.toContract.address,
                entrypoint: callParameters.functionName,
                calldata: callParameters.toContract.adaptInput(callParameters.functionName, callParameters.calldata)
            };
        });
        const executeCallArray = [];
        const rawCalldata = [];
        // Parse the Call array to create the objects which will be accepted by the contract
        callArray.forEach((call) => {
            executeCallArray.push({
                to: BigInt(call.contractAddress),
                selector: starknet_1.hash.starknetKeccak(call.entrypoint),
                data_offset: rawCalldata.length,
                data_len: call.calldata.length
            });
            rawCalldata.push(...call.calldata);
        });
        const adaptedNonce = nonce.toString();
        const adaptedMaxFee = (0, utils_1.numericToHexString)(maxFee);
        const adaptedVersion = (0, utils_1.numericToHexString)(version);
        const messageHash = this.getMessageHash(constants_1.TransactionHashPrefix.INVOKE, accountAddress, callArray, adaptedNonce, adaptedMaxFee, adaptedVersion, chainId);
        const args = {
            call_array: executeCallArray,
            calldata: rawCalldata
        };
        return { messageHash, args };
    }
    getExecutionFunctionName() {
        return "__execute__";
    }
    getNonce() {
        return __awaiter(this, void 0, void 0, function* () {
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            return yield hre.starknet.getNonce(this.address);
        });
    }
    /**
     * Declare the contract class corresponding to the `contractFactory`
     * @param contractFactory
     * @param options
     * @returns the hash of the declared class
     */
    declare(contractFactory, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let maxFee = options === null || options === void 0 ? void 0 : options.maxFee;
            if (maxFee && (options === null || options === void 0 ? void 0 : options.overhead)) {
                const msg = "maxFee and overhead cannot be specified together";
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            const nonce = options.nonce == null ? yield this.getNonce() : options.nonce;
            if (maxFee === undefined || maxFee === null) {
                const estimatedDeclareFee = yield this.estimateDeclareFee(contractFactory, options);
                maxFee = (0, utils_1.estimatedFeeToMaxFee)(estimatedDeclareFee.amount, options === null || options === void 0 ? void 0 : options.overhead);
            }
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            const classHash = yield hre.starknetWrapper.getClassHash(contractFactory.metadataPath);
            const chainId = hre.starknet.networkConfig.starknetChainId;
            const calldata = [classHash];
            const calldataHash = starknet_1.hash.computeHashOnElements(calldata);
            const messageHash = starknet_1.hash.computeHashOnElements([
                constants_1.TransactionHashPrefix.DECLARE,
                constants_1.TRANSACTION_VERSION.toString(),
                this.address,
                0,
                calldataHash,
                maxFee.toString(),
                chainId,
                nonce.toString()
            ]);
            const signature = this.getSignatures(messageHash);
            return contractFactory.declare({
                signature,
                token: options.token,
                sender: this.address,
                maxFee: BigInt(maxFee)
            });
        });
    }
}
exports.Account = Account;
/**
 * Wrapper for the OpenZeppelin implementation of an Account
 */
class OpenZeppelinAccount extends Account {
    constructor(starknetContract, privateKey, salt, deployed) {
        super(starknetContract, privateKey, salt, deployed);
    }
    static getContractFactory() {
        return __awaiter(this, void 0, void 0, function* () {
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            if (!this.contractFactory) {
                const contractPath = (0, account_utils_1.handleInternalContractArtifacts)("OpenZeppelinAccount", "Account", "0.5.1", hre);
                this.contractFactory = yield hre.starknet.getContractFactory(contractPath);
            }
            return this.contractFactory;
        });
    }
    /**
     * Generates a new key pair if none specified.
     * The created account needs to be deployed using the `deployAccount` method.
     * @param options
     * @returns an undeployed instance of account
     */
    static createAccount(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = (0, account_utils_1.generateKeys)(options.privateKey);
            const salt = options.salt || (0, utils_1.generateRandomSalt)();
            const contractFactory = yield this.getContractFactory();
            const address = starknet_1.hash.calculateContractAddressFromHash(salt, yield contractFactory.getClassHash(), [signer.publicKey], "0x0" // deployer address
            );
            const contract = contractFactory.getContractAt(address);
            return new this(contract, signer.privateKey, salt, false);
        });
    }
    getMessageHash(transactionHashPrefix, accountAddress, callArray, nonce, maxFee, version, chainId) {
        const hashable = [callArray.length];
        const rawCalldata = [];
        callArray.forEach((call) => {
            hashable.push(call.contractAddress, starknet_1.hash.starknetKeccak(call.entrypoint), rawCalldata.length, call.calldata.length);
            rawCalldata.push(...call.calldata);
        });
        hashable.push(rawCalldata.length, ...rawCalldata);
        const calldataHash = starknet_1.hash.computeHashOnElements(hashable);
        return starknet_1.hash.computeHashOnElements([
            transactionHashPrefix,
            version,
            accountAddress,
            0,
            calldataHash,
            maxFee,
            chainId,
            nonce
        ]);
    }
    getSignatures(messageHash) {
        return (0, account_utils_1.signMultiCall)(this.publicKey, this.keyPair, messageHash);
    }
    estimateDeployAccountFee() {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertNotDeployed();
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            const contractFactory = yield OpenZeppelinAccount.getContractFactory();
            const classHash = yield contractFactory.getClassHash();
            const constructorCalldata = [BigInt(this.publicKey).toString()];
            const maxFee = (0, utils_1.numericToHexString)(0);
            const nonce = (0, utils_1.numericToHexString)(0);
            const calldataHash = starknet_1.hash.computeHashOnElements([
                classHash,
                this.salt,
                ...constructorCalldata
            ]);
            const msgHash = starknet_1.hash.computeHashOnElements([
                constants_1.TransactionHashPrefix.DEPLOY_ACCOUNT,
                (0, utils_1.numericToHexString)(constants_1.QUERY_VERSION),
                this.address,
                0,
                calldataHash,
                maxFee,
                hre.starknet.networkConfig.starknetChainId,
                nonce
            ]);
            const signature = this.getSignatures(msgHash);
            const data = {
                type: "DEPLOY_ACCOUNT",
                class_hash: classHash,
                constructor_calldata: constructorCalldata,
                contract_address_salt: this.salt,
                signature: (0, utils_1.bnToDecimalStringArray)(signature || []),
                version: (0, utils_1.numericToHexString)(constants_1.QUERY_VERSION),
                nonce
            };
            return yield (0, account_utils_1.sendEstimateFeeTx)(data);
        });
    }
    deployAccount(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertNotDeployed();
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            let maxFee = options === null || options === void 0 ? void 0 : options.maxFee;
            if (maxFee && (options === null || options === void 0 ? void 0 : options.overhead)) {
                const msg = "maxFee and overhead cannot be specified together";
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            if (maxFee === undefined || maxFee === null) {
                const estimatedDeployFee = yield this.estimateDeployAccountFee();
                maxFee = (0, utils_1.estimatedFeeToMaxFee)(estimatedDeployFee.amount, options === null || options === void 0 ? void 0 : options.overhead);
            }
            const contractFactory = yield OpenZeppelinAccount.getContractFactory();
            const classHash = yield contractFactory.getClassHash();
            const constructorCalldata = [BigInt(this.publicKey).toString()];
            const msgHash = (0, account_utils_1.calculateDeployAccountHash)(this.address, constructorCalldata, this.salt, classHash, (0, utils_1.numericToHexString)(maxFee), hre.starknet.networkConfig.starknetChainId);
            const deploymentTxHash = yield (0, account_utils_1.sendDeployAccountTx)(this.getSignatures(msgHash).map((val) => val.toString()), classHash, constructorCalldata, this.salt, (0, utils_1.numericToHexString)(maxFee));
            this.starknetContract.deployTxHash = deploymentTxHash;
            this.deployed = true;
            return deploymentTxHash;
        });
    }
    static getAccountFromAddress(address, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractFactory = yield this.getContractFactory();
            const contract = contractFactory.getContractAt(address);
            const { publicKey: expectedPubKey } = yield contract.call("getPublicKey");
            const keyPair = ellipticCurve.getKeyPair((0, number_1.toBN)(privateKey.substring(2), "hex"));
            const publicKey = ellipticCurve.getStarkKey(keyPair);
            if (BigInt(publicKey) !== expectedPubKey) {
                throw new starknet_plugin_error_1.StarknetPluginError("The provided private key is not compatible with the public key stored in the contract.");
            }
            return new this(contract, privateKey, undefined, true);
        });
    }
}
exports.OpenZeppelinAccount = OpenZeppelinAccount;
/**
 * Wrapper for the Argent implementation of Account
 */
class ArgentAccount extends Account {
    constructor(starknetContract, privateKey, guardianPrivateKey, salt, deployed) {
        super(starknetContract, privateKey, salt, deployed);
        this.guardianPrivateKey = guardianPrivateKey;
        if (this.guardianPrivateKey) {
            const guardianSigner = (0, account_utils_1.generateKeys)(this.guardianPrivateKey);
            this.guardianKeyPair = guardianSigner.keyPair;
            this.guardianPublicKey = guardianSigner.publicKey;
        }
    }
    static getImplementationContractFactory() {
        return __awaiter(this, void 0, void 0, function* () {
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            if (!this.implementationContractFactory) {
                const contractPath = (0, account_utils_1.handleInternalContractArtifacts)("ArgentAccount", "ArgentAccount", this.VERSION, hre);
                this.implementationContractFactory = yield hre.starknet.getContractFactory(contractPath);
            }
            return this.implementationContractFactory;
        });
    }
    static getProxyContractFactory() {
        return __awaiter(this, void 0, void 0, function* () {
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            if (!this.proxyContractFactory) {
                const contractPath = (0, account_utils_1.handleInternalContractArtifacts)("ArgentAccount", "Proxy", this.VERSION, hre);
                this.proxyContractFactory = yield hre.starknet.getContractFactory(contractPath);
            }
            return this.proxyContractFactory;
        });
    }
    static generateGuardianPublicKey(guardianPrivateKey) {
        if (!guardianPrivateKey) {
            return "0x0";
        }
        return (0, account_utils_1.generateKeys)(guardianPrivateKey).publicKey;
    }
    /**
     * Generates a new key pair if none specified.
     * Does NOT generate a new guardian key pair if none specified.
     * If you don't specify a guardian private key, no guardian will be assigned.
     * The created account needs to be deployed using the `deployAccount` method.
     * @param options
     * @returns an undeployed instance of account
     */
    static createAccount(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = (0, account_utils_1.generateKeys)(options.privateKey);
            const guardianPrivateKey = options === null || options === void 0 ? void 0 : options.guardianPrivateKey;
            const guardianPublicKey = this.generateGuardianPublicKey(guardianPrivateKey);
            const salt = options.salt || (0, utils_1.generateRandomSalt)();
            const constructorCalldata = [
                this.IMPLEMENTATION_CLASS_HASH,
                starknet_1.hash.getSelectorFromName("initialize"),
                "2",
                signer.publicKey,
                guardianPublicKey
            ];
            const address = starknet_1.hash.calculateContractAddressFromHash(salt, this.PROXY_CLASS_HASH, constructorCalldata, "0x0" // deployer address
            );
            const proxyContractFactory = yield this.getProxyContractFactory();
            const contract = proxyContractFactory.getContractAt(address);
            return new this(contract, signer.privateKey, guardianPrivateKey, salt, false);
        });
    }
    getMessageHash(transactionHashPrefix, accountAddress, callArray, nonce, maxFee, version, chainId) {
        const hashable = [callArray.length];
        const rawCalldata = [];
        callArray.forEach((call) => {
            hashable.push(call.contractAddress, starknet_1.hash.starknetKeccak(call.entrypoint), rawCalldata.length, call.calldata.length);
            rawCalldata.push(...call.calldata);
        });
        hashable.push(rawCalldata.length, ...rawCalldata);
        const calldataHash = starknet_1.hash.computeHashOnElements(hashable);
        return starknet_1.hash.computeHashOnElements([
            transactionHashPrefix,
            version,
            accountAddress,
            0,
            calldataHash,
            maxFee,
            chainId,
            nonce
        ]);
    }
    getSignatures(messageHash) {
        const signatures = (0, account_utils_1.signMultiCall)(this.publicKey, this.keyPair, messageHash);
        if (this.guardianPrivateKey) {
            const guardianSignatures = (0, account_utils_1.signMultiCall)(this.guardianPublicKey, this.guardianKeyPair, messageHash);
            signatures.push(...guardianSignatures);
        }
        return signatures;
    }
    estimateDeployAccountFee() {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertNotDeployed();
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            const nonce = (0, utils_1.numericToHexString)(0);
            const maxFee = (0, utils_1.numericToHexString)(0);
            const constructorCalldata = [
                ArgentAccount.IMPLEMENTATION_CLASS_HASH,
                starknet_1.hash.getSelectorFromName("initialize"),
                "2",
                this.publicKey,
                ArgentAccount.generateGuardianPublicKey(this.guardianPrivateKey)
            ].map((val) => BigInt(val).toString());
            const calldataHash = starknet_1.hash.computeHashOnElements([
                ArgentAccount.PROXY_CLASS_HASH,
                this.salt,
                ...constructorCalldata
            ]);
            const msgHash = starknet_1.hash.computeHashOnElements([
                constants_1.TransactionHashPrefix.DEPLOY_ACCOUNT,
                (0, utils_1.numericToHexString)(constants_1.QUERY_VERSION),
                this.address,
                0,
                calldataHash,
                maxFee,
                hre.starknet.networkConfig.starknetChainId,
                nonce
            ]);
            const signature = this.getSignatures(msgHash);
            const data = {
                type: "DEPLOY_ACCOUNT",
                class_hash: ArgentAccount.PROXY_CLASS_HASH,
                constructor_calldata: constructorCalldata,
                contract_address_salt: this.salt,
                signature: (0, utils_1.bnToDecimalStringArray)(signature || []),
                version: (0, utils_1.numericToHexString)(constants_1.QUERY_VERSION),
                nonce
            };
            return yield (0, account_utils_1.sendEstimateFeeTx)(data);
        });
    }
    /**
     * Deploys (initializes) the account.
     * @param options
     * @returns the tx hash of the deployment
     */
    deployAccount(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertNotDeployed();
            const hre = yield Promise.resolve().then(() => __importStar(require("hardhat")));
            let maxFee = options === null || options === void 0 ? void 0 : options.maxFee;
            if (maxFee && (options === null || options === void 0 ? void 0 : options.overhead)) {
                const msg = "maxFee and overhead cannot be specified together";
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            if (maxFee === undefined || maxFee === null) {
                const estimatedDeployFee = yield this.estimateDeployAccountFee();
                maxFee = (0, utils_1.estimatedFeeToMaxFee)(estimatedDeployFee.amount, options === null || options === void 0 ? void 0 : options.overhead);
            }
            const constructorCalldata = [
                ArgentAccount.IMPLEMENTATION_CLASS_HASH,
                starknet_1.hash.getSelectorFromName("initialize"),
                "2",
                this.publicKey,
                ArgentAccount.generateGuardianPublicKey(this.guardianPrivateKey)
            ].map((val) => BigInt(val).toString());
            const msgHash = (0, account_utils_1.calculateDeployAccountHash)(this.address, constructorCalldata, this.salt, ArgentAccount.PROXY_CLASS_HASH, (0, utils_1.numericToHexString)(maxFee), hre.starknet.networkConfig.starknetChainId);
            const deploymentTxHash = yield (0, account_utils_1.sendDeployAccountTx)(this.getSignatures(msgHash).map((val) => val.toString()), ArgentAccount.PROXY_CLASS_HASH, constructorCalldata, this.salt, (0, utils_1.numericToHexString)(maxFee));
            const implementationFactory = yield ArgentAccount.getImplementationContractFactory();
            this.starknetContract.setImplementation(implementationFactory);
            this.starknetContract.deployTxHash = deploymentTxHash;
            this.deployed = true;
            return deploymentTxHash;
        });
    }
    /**
     * Updates the guardian key in the contract. Set it to `undefined` to remove the guardian.
     * @param newGuardianPrivateKey private key of the guardian to update
     * @returns hash of the transaction which changes the guardian
     */
    setGuardian(newGuardianPrivateKey, invokeOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let guardianKeyPair;
            let guardianPublicKey;
            if (!BigInt(newGuardianPrivateKey || 0)) {
                newGuardianPrivateKey = undefined;
                guardianPublicKey = undefined;
            }
            else {
                guardianKeyPair = ellipticCurve.getKeyPair((0, number_1.toBN)(newGuardianPrivateKey.substring(2), "hex"));
                guardianPublicKey = ellipticCurve.getStarkKey(guardianKeyPair);
            }
            const call = {
                functionName: "changeGuardian",
                toContract: this.starknetContract,
                calldata: { newGuardian: BigInt(guardianPublicKey || 0) }
            };
            const txHash = yield this.multiInvoke([call], invokeOptions);
            // set after signing
            this.guardianPrivateKey = newGuardianPrivateKey;
            this.guardianPublicKey = guardianPublicKey;
            this.guardianKeyPair = guardianKeyPair;
            return txHash;
        });
    }
    /**
     * Returns an account previously deployed to `address`.
     * A check is performed if the public key stored in the account matches the provided `privateKey`.
     * No check is done for the optoinal guardian private key.
     * @param address
     * @param privateKey
     * @param options
     * @returns the retrieved account
     */
    static getAccountFromAddress(address, privateKey, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractFactory = yield this.getProxyContractFactory();
            const contract = contractFactory.getContractAt(address);
            const implementationFactory = yield this.getImplementationContractFactory();
            contract.setImplementation(implementationFactory);
            const { signer: expectedPubKey } = yield contract.call("getSigner");
            const keyPair = ellipticCurve.getKeyPair((0, number_1.toBN)(privateKey.substring(2), "hex"));
            const publicKey = ellipticCurve.getStarkKey(keyPair);
            if (expectedPubKey === BigInt(0)) {
                // not yet initialized
            }
            else if (BigInt(publicKey) !== expectedPubKey) {
                throw new starknet_plugin_error_1.StarknetPluginError("The provided private key is not compatible with the public key stored in the contract.");
            }
            return new this(contract, privateKey, options.guardianPrivateKey, undefined, true);
        });
    }
}
exports.ArgentAccount = ArgentAccount;
ArgentAccount.VERSION = "780760e4156afe592bb1feff7e769cf279ae9831";
ArgentAccount.PROXY_CLASS_HASH = "0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918";
ArgentAccount.IMPLEMENTATION_CLASS_HASH = "0x33434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2";
//# sourceMappingURL=account.js.map