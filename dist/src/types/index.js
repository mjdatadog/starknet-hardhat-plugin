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
exports.StarknetContract = exports.StarknetContractFactory = exports.parseFeeEstimation = exports.iterativelyCheckStatus = exports.isTxAccepted = exports.extractClassHash = exports.InteractChoice = void 0;
const fs = __importStar(require("fs"));
const starknet_plugin_error_1 = require("../starknet-plugin-error");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const adapt_1 = require("../adapt");
const starknet_1 = require("starknet");
/**
 * Enumerates the ways of interacting with a contract.
 */
class InteractChoice {
    constructor(
    /**
     * The way it's supposed to be used passed to CLI commands.
     */
    cliCommand, 
    /**
     * The way it's supposed to be used internally in code.
     */
    internalCommand, 
    /**
     * Indicates whether the belonging CLI option allows specifying max_fee.
     */
    allowsMaxFee, 
    /**
     * The version of the transaction.
     */
    transactionVersion) {
        this.cliCommand = cliCommand;
        this.internalCommand = internalCommand;
        this.allowsMaxFee = allowsMaxFee;
        this.transactionVersion = transactionVersion;
    }
}
exports.InteractChoice = InteractChoice;
InteractChoice.INVOKE = new InteractChoice(["invoke"], "invoke", true, constants_1.TRANSACTION_VERSION);
InteractChoice.CALL = new InteractChoice(["call"], "call", false, constants_1.QUERY_VERSION);
InteractChoice.ESTIMATE_FEE = new InteractChoice(["invoke", "--estimate_fee"], "estimateFee", false, constants_1.QUERY_VERSION);
function extractClassHash(response) {
    return extractFromResponse(response, /^Contract class hash: (.*)$/m);
}
exports.extractClassHash = extractClassHash;
function extractTxHash(response) {
    return extractFromResponse(response, /^Transaction hash: (.*)$/m);
}
function extractFromResponse(response, regex) {
    const matched = response.match(regex);
    if (!matched || !matched[1]) {
        throw new starknet_plugin_error_1.StarknetPluginError(`Could not parse response. Check that you're using the correct network. Response received: ${response}`);
    }
    return matched[1];
}
function checkStatus(hash, starknetWrapper) {
    return __awaiter(this, void 0, void 0, function* () {
        const executed = yield starknetWrapper.getTxStatus({
            hash
        });
        if (executed.statusCode) {
            throw new starknet_plugin_error_1.StarknetPluginError(executed.stderr.toString());
        }
        const response = executed.stdout.toString();
        try {
            const responseParsed = JSON.parse(response);
            return responseParsed;
        }
        catch (err) {
            throw new starknet_plugin_error_1.StarknetPluginError(`Cannot interpret the following: ${response}`);
        }
    });
}
const ACCEPTABLE_STATUSES = ["PENDING", "ACCEPTED_ON_L2", "ACCEPTED_ON_L1"];
function isTxAccepted(statusObject) {
    return ACCEPTABLE_STATUSES.includes(statusObject.tx_status);
}
exports.isTxAccepted = isTxAccepted;
const UNACCEPTABLE_STATUSES = ["REJECTED"];
function isTxRejected(statusObject) {
    return UNACCEPTABLE_STATUSES.includes(statusObject.tx_status);
}
function iterativelyCheckStatus(txHash, starknetWrapper, resolve, reject, retryCount = 10) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            let count = retryCount;
            let statusObject;
            let error;
            while (count > 0) {
                // This promise is rejected usually if the network is unavailable
                statusObject = yield checkStatus(txHash, starknetWrapper).catch((reason) => {
                    error = reason;
                    return undefined;
                });
                // Check count at 1 to avoid unnecessary waiting(sleep) in the last iteration
                if (statusObject || count === 1) {
                    break;
                }
                yield (0, utils_1.sleep)(constants_1.CHECK_STATUS_RECOVER_TIMEOUT);
                (0, utils_1.warn)("Retrying transaction status check...");
                count--;
            }
            if (!statusObject) {
                (0, utils_1.warn)("Checking transaction status failed.");
                return reject(error);
            }
            else if (isTxAccepted(statusObject)) {
                return resolve(statusObject.tx_status);
            }
            else if (isTxRejected(statusObject)) {
                return reject(new Error("Transaction rejected. Error message:\n\n" +
                    (0, utils_1.adaptLog)(statusObject.tx_failure_reason.error_message)));
            }
            yield (0, utils_1.sleep)(constants_1.CHECK_STATUS_TIMEOUT);
        }
    });
}
exports.iterativelyCheckStatus = iterativelyCheckStatus;
/**
 * Reads ABI from `abiPath` and converts it to an object for lookup by name.
 * @param abiPath the path where ABI is stored on disk
 * @returns an object mapping ABI entry names with their values
 */
function readAbi(abiPath) {
    const abiRaw = fs.readFileSync(abiPath).toString();
    const abiArray = JSON.parse(abiRaw);
    const abi = {};
    for (const abiEntry of abiArray) {
        if (!abiEntry.name) {
            const msg = `Abi entry has no name: ${abiEntry}`;
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
        abi[abiEntry.name] = abiEntry;
    }
    return abi;
}
/**
 * Add `signature` elements to to `starknetArgs`, if there are any.
 * @param signature array of transaction signature elements
 */
function handleSignature(signature) {
    if (signature) {
        return signature.map((s) => s.toString());
    }
    return [];
}
/**
 * Extract events from the ABI.
 * @param abi the path where ABI is stored on disk.
 * @returns an object mapping ABI entry names with their values.
 */
function extractEventSpecifications(abi) {
    const events = {};
    for (const abiEntryName in abi) {
        if (abi[abiEntryName].type === "event") {
            const event = abi[abiEntryName];
            const encodedEventName = starknet_1.hash.getSelectorFromName(event.name);
            events[encodedEventName] = event;
        }
    }
    return events;
}
function parseFeeEstimation(raw) {
    const matchedAmount = raw.match(/^The estimated fee is: (\d*) WEI \(.* ETH\)\./m);
    const matchedGasUsage = raw.match(/^Gas usage: (\d*)/m);
    const matchedGasPrice = raw.match(/^Gas price: (\d*) WEI/m);
    if (matchedAmount && matchedGasUsage && matchedGasPrice) {
        return {
            amount: BigInt(matchedAmount[1]),
            unit: "wei",
            gas_price: BigInt(matchedGasPrice[1]),
            gas_usage: BigInt(matchedGasUsage[1])
        };
    }
    throw new starknet_plugin_error_1.StarknetPluginError(`Cannot parse fee estimation response:\n${raw}`);
}
exports.parseFeeEstimation = parseFeeEstimation;
/**
 * Returns a modified copy of the provided object with its blockNumber set to pending.
 * @param options the options object with a blockNumber key
 */
function defaultToPendingBlock(options) {
    const adaptedOptions = (0, utils_1.copyWithBigint)(options);
    if (adaptedOptions.blockNumber === undefined) {
        // using || operator would not handle the zero case correctly
        adaptedOptions.blockNumber = "pending";
    }
    return adaptedOptions;
}
class StarknetContractFactory {
    constructor(config) {
        this.hre = config.hre;
        this.abiPath = config.abiPath;
        this.abi = readAbi(this.abiPath);
        this.metadataPath = config.metadataPath;
        // find constructor
        for (const abiEntryName in this.abi) {
            const abiEntry = this.abi[abiEntryName];
            if (abiEntry.type === "constructor") {
                this.constructorAbi = abiEntry;
            }
        }
    }
    /**
     * Declare a contract class.
     * @param options optional arguments to class declaration
     * @returns the class hash as a hex string
     */
    declare(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const executed = yield this.hre.starknetWrapper.declare({
                contract: this.metadataPath,
                maxFee: (options.maxFee || 0).toString(),
                token: options.token,
                signature: handleSignature(options.signature),
                sender: options.sender
            });
            if (executed.statusCode) {
                const msg = `Could not declare class: ${executed.stderr.toString()}`;
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            const executedOutput = executed.stdout.toString();
            const classHash = extractClassHash(executedOutput);
            const txHash = extractTxHash(executedOutput);
            return new Promise((resolve, reject) => {
                iterativelyCheckStatus(txHash, this.hre.starknetWrapper, () => resolve(classHash), (error) => {
                    reject(new starknet_plugin_error_1.StarknetPluginError(`Declare transaction ${txHash}: ${error}`));
                });
            });
        });
    }
    handleConstructorArguments(constructorArguments) {
        if (!this.constructorAbi) {
            const argsProvided = Object.keys(constructorArguments || {}).length;
            if (argsProvided) {
                const msg = `No constructor arguments required but ${argsProvided} provided`;
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            return [];
        }
        return (0, adapt_1.adaptInputUtil)(this.constructorAbi.name, constructorArguments, this.constructorAbi.inputs, this.abi);
    }
    /**
     * Returns a contract instance with set address.
     * No address validity checks are performed.
     * @param address the address of a previously deployed contract
     * @returns the contract instance at the provided address
     */
    getContractAt(address) {
        if (!address) {
            throw new starknet_plugin_error_1.StarknetPluginError("No address provided");
        }
        if (typeof address !== "string" || !constants_1.HEXADECIMAL_REGEX.test(address)) {
            throw new starknet_plugin_error_1.StarknetPluginError(`Address must be 0x-prefixed hex string. Got: "${address}".`);
        }
        const contract = new StarknetContract({
            abiPath: this.abiPath,
            hre: this.hre
        });
        contract.address = address;
        return contract;
    }
    getAbiPath() {
        return this.abiPath;
    }
    getClassHash() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.classHash) {
                this.classHash = yield this.hre.starknetWrapper.getClassHash(this.metadataPath);
            }
            return this.classHash;
        });
    }
}
exports.StarknetContractFactory = StarknetContractFactory;
class StarknetContract {
    constructor(config) {
        this.hre = config.hre;
        this.abiPath = config.abiPath;
        this.abi = readAbi(this.abiPath);
        this.eventsSpecifications = extractEventSpecifications(this.abi);
    }
    get address() {
        return this._address;
    }
    set address(address) {
        this._address = address;
        return;
    }
    /**
     * Set a custom abi and abi path to the contract
     * @param implementation the contract factory of the implementation to be set
     */
    setImplementation(implementation) {
        this.abi = implementation.abi;
        this.abiPath = implementation.abiPath;
    }
    interact(choice, functionName, args, options = {}) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.address) {
                throw new starknet_plugin_error_1.StarknetPluginError("Contract not deployed");
            }
            const adaptedInput = this.adaptInput(functionName, args);
            const executed = yield this.hre.starknetWrapper.interact({
                choice,
                address: this.address,
                abi: this.abiPath,
                functionName: functionName,
                inputs: adaptedInput,
                signature: handleSignature(options.signature),
                wallet: (_a = options.wallet) === null || _a === void 0 ? void 0 : _a.modulePath,
                account: (_b = options.wallet) === null || _b === void 0 ? void 0 : _b.accountName,
                accountDir: (_c = options.wallet) === null || _c === void 0 ? void 0 : _c.accountPath,
                blockNumber: "blockNumber" in options ? options.blockNumber : undefined,
                maxFee: (_d = options.maxFee) === null || _d === void 0 ? void 0 : _d.toString(),
                nonce: (_e = options.nonce) === null || _e === void 0 ? void 0 : _e.toString()
            });
            if (executed.statusCode) {
                const msg = `Could not perform ${choice.internalCommand} on ${functionName}.\n` +
                    executed.stderr.toString() +
                    "\n" +
                    "Make sure to `invoke` and `estimateFee` through account, and `call` directly through contract.";
                const replacedMsg = (0, utils_1.adaptLog)(msg);
                throw new starknet_plugin_error_1.StarknetPluginError(replacedMsg);
            }
            return executed;
        });
    }
    /**
     * Invoke the function by name and optionally provide arguments in an array.
     * For a usage example @see {@link call}
     * @param functionName
     * @param args arguments to Starknet contract function
     * @options optional additions to invoking
     * @returns a Promise that resolves when the status of the transaction is at least `PENDING`
     */
    invoke(functionName, args, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const executed = yield this.interact(InteractChoice.INVOKE, functionName, args, options);
            const txHash = extractTxHash(executed.stdout.toString());
            return new Promise((resolve, reject) => {
                iterativelyCheckStatus(txHash, this.hre.starknetWrapper, () => resolve(txHash), (error) => {
                    reject(new starknet_plugin_error_1.StarknetPluginError(`Invoke transaction ${txHash}: ${error}`));
                });
            });
        });
    }
    /**
     * Call the function by name and optionally provide arguments in an array.
     *
     * E.g. If your contract has a function
     * ```text
     * func double_sum(x: felt, y: felt) -> (res: felt):
     *     return (res=(x + y) * 2)
     * end
     * ```
     * then you would call it like:
     * ```typescript
     * const contract = ...;
     * const { res: sum } = await contract.call("double_sum", { x: 2, y: 3 });
     * console.log(sum);
     * ```
     * which would result in:
     * ```text
     * > 10n
     * ```
     *
     * If options.rawOutput, the Promised object holds a property `response` with an array of strings.
     *
     * @param functionName
     * @param args arguments to Starknet contract function
     * @param options optional additions to calling
     * @returns a Promise that resolves when the status of the transaction is at least `PENDING`
     */
    call(functionName, args, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const adaptedOptions = defaultToPendingBlock(options);
            const executed = yield this.interact(InteractChoice.CALL, functionName, args, adaptedOptions);
            if (options.rawOutput) {
                return { response: executed.stdout.toString().split(" ") };
            }
            return this.adaptOutput(functionName, executed.stdout.toString());
        });
    }
    /**
     * Estimate the gas fee of executing `functionName` with `args`.
     * @param functionName
     * @param args arguments to Starknet contract function
     * @param options optional execution specifications
     * @returns an object containing the amount and the unit of the estimation
     */
    estimateFee(functionName, args, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const adaptedOptions = defaultToPendingBlock(options);
            const executed = yield this.interact(InteractChoice.ESTIMATE_FEE, functionName, args, adaptedOptions);
            return parseFeeEstimation(executed.stdout.toString());
        });
    }
    /**
     * Returns the ABI of the whole contract.
     * @returns contract ABI
     */
    getAbi() {
        return this.abi;
    }
    /**
     * Adapt structured `args` to unstructured array expected by e.g. Starknet CLI.
     * @param functionName the name of the function to adapt
     * @param args structured args
     * @returns unstructured args
     */
    adaptInput(functionName, args) {
        const func = this.abi[functionName];
        if (!func) {
            const msg = `Function '${functionName}' doesn't exist on ${this.abiPath}.`;
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
        if (Array.isArray(args)) {
            throw new starknet_plugin_error_1.StarknetPluginError("Arguments should be passed in the form of an object.");
        }
        return (0, adapt_1.adaptInputUtil)(functionName, args, func.inputs, this.abi);
    }
    /**
     * Adapt unstructured `rawResult` to a structured object.
     * @param functionName the name of the function that produced the output
     * @param rawResult the function output as as unparsed space separated string
     * @returns structured output
     */
    adaptOutput(functionName, rawResult) {
        const func = this.abi[functionName];
        return (0, adapt_1.adaptOutputUtil)(rawResult, func.outputs, this.abi);
    }
    /**
     * Decode the events to a structured object with parameter names.
     * Only decodes the events originating from this contract.
     * @param events as received from the server.
     * @returns structured object with parameter names.
     * @throws if no events decoded
     */
    decodeEvents(events) {
        const decodedEvents = [];
        for (const event of events) {
            // skip events originating from other contracts, e.g. fee token
            if (parseInt(event.from_address, 16) !== parseInt(this.address, 16))
                continue;
            const rawEventData = event.data.map(BigInt).join(" ");
            // encoded event name guaranteed to be at index 0
            const eventSpecification = this.eventsSpecifications[event.keys[0]];
            if (!eventSpecification) {
                const msg = `Event "${event.keys[0]}" doesn't exist in ${this.abiPath}.`;
                throw new starknet_plugin_error_1.StarknetPluginError(msg);
            }
            const adapted = (0, adapt_1.adaptOutputUtil)(rawEventData, eventSpecification.data, this.abi);
            decodedEvents.push({ name: eventSpecification.name, data: adapted });
        }
        if (decodedEvents.length === 0) {
            const msg = `No events were decoded. You might be using a wrong contract. ABI used for decoding: ${this.abiPath}`;
            throw new starknet_plugin_error_1.StarknetPluginError(msg);
        }
        return decodedEvents;
    }
}
exports.StarknetContract = StarknetContract;
//# sourceMappingURL=index.js.map