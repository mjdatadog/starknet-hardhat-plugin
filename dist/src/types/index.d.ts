import * as starknet from "../starknet-types";
import { HardhatRuntimeEnvironment, Wallet } from "hardhat/types";
import { StarknetWrapper } from "../starknet-wrappers";
/**
 * According to: https://starknet.io/docs/hello_starknet/intro.html#interact-with-the-contract
 * Not using an enum to avoid code duplication and reverse mapping.
 */
export declare type TxStatus = 
/** The transaction passed the validation and entered the pending block. */
"PENDING"
/** The transaction has not been received yet (i.e., not written to storage). */
 | "NOT_RECEIVED"
/** The transaction was received by the operator. */
 | "RECEIVED"
/** The transaction failed validation and thus was skipped. */
 | "REJECTED"
/** The transaction passed the validation and entered an actual created block. */
 | "ACCEPTED_ON_L2"
/** The transaction was accepted on-chain. */
 | "ACCEPTED_ON_L1";
export declare type InvokeResponse = string;
export declare type StarknetContractFactoryConfig = StarknetContractConfig & {
    metadataPath: string;
    hre: HardhatRuntimeEnvironment;
};
export interface StarknetContractConfig {
    abiPath: string;
    hre: HardhatRuntimeEnvironment;
}
export declare type Numeric = number | bigint;
/**
 * Object whose keys are strings (names) and values are any object.
 */
export interface StringMap {
    [key: string]: any;
}
/**
 * Object holding the event name and have a proprety data of type StingMap.
 */
export interface DecodedEvent {
    name: string;
    data: StringMap;
}
/**
 * Enumerates the ways of interacting with a contract.
 */
export declare class InteractChoice {
    /**
     * The way it's supposed to be used passed to CLI commands.
     */
    readonly cliCommand: string[];
    /**
     * The way it's supposed to be used internally in code.
     */
    readonly internalCommand: keyof StarknetContract;
    /**
     * Indicates whether the belonging CLI option allows specifying max_fee.
     */
    readonly allowsMaxFee: boolean;
    /**
     * The version of the transaction.
     */
    transactionVersion: Numeric;
    static readonly INVOKE: InteractChoice;
    static readonly CALL: InteractChoice;
    static readonly ESTIMATE_FEE: InteractChoice;
    private constructor();
}
export declare function extractClassHash(response: string): string;
/**
 * The object returned by starknet tx_status.
 */
declare type StatusObject = {
    block_hash: string;
    tx_status: TxStatus;
    tx_failure_reason?: starknet.TxFailureReason;
};
export declare function isTxAccepted(statusObject: StatusObject): boolean;
export declare function iterativelyCheckStatus(txHash: string, starknetWrapper: StarknetWrapper, resolve: (status: string) => void, reject: (reason: Error) => void, retryCount?: number): Promise<void>;
export declare function parseFeeEstimation(raw: string): starknet.FeeEstimation;
export interface DeclareOptions {
    token?: string;
    signature?: Array<Numeric>;
    sender?: string;
    nonce?: Numeric;
    maxFee?: Numeric;
    overhead?: number;
}
export interface DeployOptions {
    salt?: string;
    unique?: boolean;
    maxFee?: Numeric;
}
export interface DeployAccountOptions {
    maxFee?: Numeric;
    overhead?: number;
}
export interface InvokeOptions {
    signature?: Array<Numeric>;
    wallet?: Wallet;
    nonce?: Numeric;
    maxFee?: Numeric;
    overhead?: number;
}
export interface CallOptions {
    signature?: Array<Numeric>;
    wallet?: Wallet;
    blockNumber?: BlockNumber;
    nonce?: Numeric;
    maxFee?: Numeric;
    rawOutput?: boolean;
    token?: string;
    salt?: string;
    unique?: boolean;
    sender?: string;
}
export declare type EstimateFeeOptions = CallOptions;
export declare type InteractOptions = InvokeOptions | CallOptions | EstimateFeeOptions;
export declare type ContractInteractionFunction = (functionName: string, args?: StringMap, options?: InteractOptions) => Promise<any>;
export declare type BlockNumber = number | "pending" | "latest";
export interface BlockIdentifier {
    blockNumber?: BlockNumber;
    blockHash?: string;
}
export declare type NonceQueryOptions = BlockIdentifier;
export declare class StarknetContractFactory {
    private hre;
    abi: starknet.Abi;
    abiPath: string;
    private constructorAbi;
    metadataPath: string;
    private classHash;
    constructor(config: StarknetContractFactoryConfig);
    /**
     * Declare a contract class.
     * @param options optional arguments to class declaration
     * @returns the class hash as a hex string
     */
    declare(options?: DeclareOptions): Promise<string>;
    handleConstructorArguments(constructorArguments: StringMap): string[];
    /**
     * Returns a contract instance with set address.
     * No address validity checks are performed.
     * @param address the address of a previously deployed contract
     * @returns the contract instance at the provided address
     */
    getContractAt(address: string): StarknetContract;
    getAbiPath(): string;
    getClassHash(): Promise<string>;
}
export declare class StarknetContract {
    private hre;
    private abi;
    private eventsSpecifications;
    private abiPath;
    private _address;
    deployTxHash: string;
    constructor(config: StarknetContractConfig);
    get address(): string;
    set address(address: string);
    /**
     * Set a custom abi and abi path to the contract
     * @param implementation the contract factory of the implementation to be set
     */
    setImplementation(implementation: StarknetContractFactory): void;
    private interact;
    /**
     * Invoke the function by name and optionally provide arguments in an array.
     * For a usage example @see {@link call}
     * @param functionName
     * @param args arguments to Starknet contract function
     * @options optional additions to invoking
     * @returns a Promise that resolves when the status of the transaction is at least `PENDING`
     */
    invoke(functionName: string, args?: StringMap, options?: InvokeOptions): Promise<InvokeResponse>;
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
    call(functionName: string, args?: StringMap, options?: CallOptions): Promise<StringMap>;
    /**
     * Estimate the gas fee of executing `functionName` with `args`.
     * @param functionName
     * @param args arguments to Starknet contract function
     * @param options optional execution specifications
     * @returns an object containing the amount and the unit of the estimation
     */
    estimateFee(functionName: string, args?: StringMap, options?: EstimateFeeOptions): Promise<starknet.FeeEstimation>;
    /**
     * Returns the ABI of the whole contract.
     * @returns contract ABI
     */
    getAbi(): starknet.Abi;
    /**
     * Adapt structured `args` to unstructured array expected by e.g. Starknet CLI.
     * @param functionName the name of the function to adapt
     * @param args structured args
     * @returns unstructured args
     */
    adaptInput(functionName: string, args?: StringMap): string[];
    /**
     * Adapt unstructured `rawResult` to a structured object.
     * @param functionName the name of the function that produced the output
     * @param rawResult the function output as as unparsed space separated string
     * @returns structured output
     */
    adaptOutput(functionName: string, rawResult: string): StringMap;
    /**
     * Decode the events to a structured object with parameter names.
     * Only decodes the events originating from this contract.
     * @param events as received from the server.
     * @returns structured object with parameter names.
     * @throws if no events decoded
     */
    decodeEvents(events: starknet.Event[]): DecodedEvent[];
}
export {};
