import { DeclareOptions, DeployAccountOptions, DeployOptions, EstimateFeeOptions, InvokeOptions, InvokeResponse, StarknetContract, StarknetContractFactory, StringMap } from "./types";
import * as starknet from "./starknet-types";
import { StarknetChainId, TransactionHashPrefix } from "./constants";
import { ec } from "elliptic";
import { CallParameters } from "./account-utils";
import { Call } from "starknet";
/**
 * Representation of an Account.
 * Multiple implementations can exist, each will be defined by an extension of this Abstract class
 */
export declare abstract class Account {
    starknetContract: StarknetContract;
    privateKey: string;
    salt: string;
    protected deployed: boolean;
    publicKey: string;
    keyPair: ec.KeyPair;
    protected constructor(starknetContract: StarknetContract, privateKey: string, salt: string, deployed: boolean);
    /**
     * Uses the account contract as a proxy to invoke a function on the target contract with a signature
     *
     * @param toContract target contract to be called
     * @param functionName function in the contract to be called
     * @param calldata calldata to use as input for the contract call
     */
    invoke(toContract: StarknetContract, functionName: string, calldata?: StringMap, options?: InvokeOptions): Promise<InvokeResponse>;
    get address(): string;
    /**
     * Deploy another contract using this account
     * @param contractFactory the factory of the contract to be deployed
     * @param constructorArguments
     * @param options extra options
     * @returns the deployed StarknetContract
     */
    deploy(contractFactory: StarknetContractFactory, constructorArguments?: StringMap, options?: DeployOptions): Promise<StarknetContract>;
    protected assertNotDeployed(): void;
    private assertDeployed;
    estimateFee(toContract: StarknetContract, functionName: string, calldata?: StringMap, options?: EstimateFeeOptions): Promise<starknet.FeeEstimation>;
    estimateDeclareFee(contractFactory: StarknetContractFactory, options?: EstimateFeeOptions): Promise<starknet.FeeEstimation>;
    estimateDeployFee(contractFactory: StarknetContractFactory, constructorArguments?: StringMap, options?: EstimateFeeOptions): Promise<starknet.FeeEstimation>;
    private interact;
    /**
     * Performes multiple invokes as a single transaction through this account
     * @param callParameters an array with the paramaters for each invoke
     * @returns the transaction hash of the invoke
     */
    multiInvoke(callParameters: CallParameters[], options?: InvokeOptions): Promise<string>;
    /**
     * Etimate the fee of the multicall.
     * @param callParameters an array with the parameters for each call
     * @returns the total estimated fee
     */
    multiEstimateFee(callParameters: CallParameters[], options?: EstimateFeeOptions): Promise<starknet.FeeEstimation>;
    private multiInteract;
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
    private handleMultiInteract;
    protected abstract getMessageHash(transactionHashPrefix: TransactionHashPrefix, accountAddress: string, callArray: Call[], nonce: string, maxFee: string, version: string, chainId: StarknetChainId): string;
    protected abstract getSignatures(messageHash: string): bigint[];
    protected abstract estimateDeployAccountFee(): Promise<starknet.FeeEstimation>;
    abstract deployAccount(options?: DeployAccountOptions): Promise<string>;
    protected getExecutionFunctionName(): string;
    private getNonce;
    /**
     * Declare the contract class corresponding to the `contractFactory`
     * @param contractFactory
     * @param options
     * @returns the hash of the declared class
     */
    declare(contractFactory: StarknetContractFactory, options?: DeclareOptions): Promise<string>;
}
/**
 * Wrapper for the OpenZeppelin implementation of an Account
 */
export declare class OpenZeppelinAccount extends Account {
    private static contractFactory;
    protected constructor(starknetContract: StarknetContract, privateKey: string, salt: string, deployed: boolean);
    private static getContractFactory;
    /**
     * Generates a new key pair if none specified.
     * The created account needs to be deployed using the `deployAccount` method.
     * @param options
     * @returns an undeployed instance of account
     */
    static createAccount(options?: {
        salt?: string;
        privateKey?: string;
    }): Promise<OpenZeppelinAccount>;
    protected getMessageHash(transactionHashPrefix: TransactionHashPrefix, accountAddress: string, callArray: Call[], nonce: string, maxFee: string, version: string, chainId: StarknetChainId): string;
    protected getSignatures(messageHash: string): bigint[];
    estimateDeployAccountFee(): Promise<starknet.FeeEstimation>;
    deployAccount(options?: DeployAccountOptions): Promise<string>;
    static getAccountFromAddress(address: string, privateKey: string): Promise<OpenZeppelinAccount>;
}
/**
 * Wrapper for the Argent implementation of Account
 */
export declare class ArgentAccount extends Account {
    private static readonly VERSION;
    private static proxyContractFactory;
    private static implementationContractFactory;
    private static readonly PROXY_CLASS_HASH;
    private static readonly IMPLEMENTATION_CLASS_HASH;
    guardianPublicKey: string;
    guardianPrivateKey: string;
    guardianKeyPair: ec.KeyPair;
    protected constructor(starknetContract: StarknetContract, privateKey: string, guardianPrivateKey: string, salt: string, deployed: boolean);
    private static getImplementationContractFactory;
    private static getProxyContractFactory;
    private static generateGuardianPublicKey;
    /**
     * Generates a new key pair if none specified.
     * Does NOT generate a new guardian key pair if none specified.
     * If you don't specify a guardian private key, no guardian will be assigned.
     * The created account needs to be deployed using the `deployAccount` method.
     * @param options
     * @returns an undeployed instance of account
     */
    static createAccount(options?: {
        salt?: string;
        privateKey?: string;
        guardianPrivateKey?: string;
    }): Promise<ArgentAccount>;
    protected getMessageHash(transactionHashPrefix: TransactionHashPrefix, accountAddress: string, callArray: Call[], nonce: string, maxFee: string, version: string, chainId: StarknetChainId): string;
    protected getSignatures(messageHash: string): bigint[];
    estimateDeployAccountFee(): Promise<starknet.FeeEstimation>;
    /**
     * Deploys (initializes) the account.
     * @param options
     * @returns the tx hash of the deployment
     */
    deployAccount(options?: DeployAccountOptions): Promise<string>;
    /**
     * Updates the guardian key in the contract. Set it to `undefined` to remove the guardian.
     * @param newGuardianPrivateKey private key of the guardian to update
     * @returns hash of the transaction which changes the guardian
     */
    setGuardian(newGuardianPrivateKey?: string, invokeOptions?: InvokeOptions): Promise<string>;
    /**
     * Returns an account previously deployed to `address`.
     * A check is performed if the public key stored in the account matches the provided `privateKey`.
     * No check is done for the optoinal guardian private key.
     * @param address
     * @param privateKey
     * @param options
     * @returns the retrieved account
     */
    static getAccountFromAddress(address: string, privateKey: string, options?: {
        guardianPrivateKey?: string;
    }): Promise<ArgentAccount>;
}
