import { Image, ProcessResult } from "@nomiclabs/hardhat-docker";
import { BlockNumber, InteractChoice } from "./types";
import { ExternalServer } from "./external-server";
import { HardhatRuntimeEnvironment } from "hardhat/types";
interface CompileWrapperOptions {
    file: string;
    output: string;
    abi: string;
    cairoPath: string;
    accountContract: boolean;
    disableHintValidation: boolean;
}
interface DeclareWrapperOptions {
    contract: string;
    maxFee: string;
    signature?: string[];
    token?: string;
    sender?: string;
}
interface InteractWrapperOptions {
    maxFee: string;
    nonce: string;
    choice: InteractChoice;
    address: string;
    abi: string;
    functionName: string;
    inputs?: string[];
    signature?: string[];
    wallet?: string;
    account?: string;
    accountDir?: string;
    blockNumber?: BlockNumber;
}
interface TxHashQueryWrapperOptions {
    hash: string;
}
interface DeployAccountWrapperOptions {
    wallet: string;
    accountName: string;
    accountDir: string;
    network: string;
}
interface NewAccountWrapperOptions {
    wallet: string;
    accountName: string;
    accountDir: string;
    network: string;
}
interface BlockQueryWrapperOptions {
    number?: BlockNumber;
    hash?: string;
}
interface NonceQueryWrapperOptions {
    address: string;
    blockHash?: string;
    blockNumber?: BlockNumber;
}
interface MigrateContractWrapperOptions {
    files: string[];
    inplace: boolean;
}
export declare abstract class StarknetWrapper {
    private externalServer;
    protected hre: HardhatRuntimeEnvironment;
    constructor(externalServer: ExternalServer, hre: HardhatRuntimeEnvironment);
    protected abstract get gatewayUrl(): string;
    private get chainID();
    private get networkID();
    execute(command: "starknet" | "starknet-compile" | "get_class_hash" | "cairo-migrate", args: string[]): Promise<ProcessResult>;
    protected prepareCompileOptions(options: CompileWrapperOptions): string[];
    compile(options: CompileWrapperOptions): Promise<ProcessResult>;
    prepareDeclareOptions(options: DeclareWrapperOptions): string[];
    declare(options: DeclareWrapperOptions): Promise<ProcessResult>;
    protected prepareInteractOptions(options: InteractWrapperOptions): string[];
    abstract interact(options: InteractWrapperOptions): Promise<ProcessResult>;
    protected prepareTxQueryOptions(command: string, options: TxHashQueryWrapperOptions): string[];
    getTxStatus(options: TxHashQueryWrapperOptions): Promise<ProcessResult>;
    getTransactionTrace(options: TxHashQueryWrapperOptions): Promise<ProcessResult>;
    protected prepareDeployAccountOptions(options: DeployAccountWrapperOptions): string[];
    deployAccount(options: DeployAccountWrapperOptions): Promise<ProcessResult>;
    protected prepareNewAccountOptions(options: NewAccountWrapperOptions): string[];
    newAccount(options: NewAccountWrapperOptions): Promise<ProcessResult>;
    getTransactionReceipt(options: TxHashQueryWrapperOptions): Promise<ProcessResult>;
    getTransaction(options: TxHashQueryWrapperOptions): Promise<ProcessResult>;
    protected prepareBlockQueryOptions(options: BlockQueryWrapperOptions): string[];
    getBlock(options: BlockQueryWrapperOptions): Promise<ProcessResult>;
    protected prepareNonceQueryOptions(options: NonceQueryWrapperOptions): string[];
    getNonce(options: NonceQueryWrapperOptions): Promise<ProcessResult>;
    getClassHash(artifactPath: string): Promise<string>;
    migrateContract(options: MigrateContractWrapperOptions): Promise<ProcessResult>;
}
export declare class DockerWrapper extends StarknetWrapper {
    constructor(image: Image, rootPath: string, accountPaths: string[], cairoPaths: string[], hre: HardhatRuntimeEnvironment);
    protected get gatewayUrl(): string;
    interact(options: InteractWrapperOptions): Promise<ProcessResult>;
}
export declare class VenvWrapper extends StarknetWrapper {
    constructor(venvPath: string, hre: HardhatRuntimeEnvironment);
    protected get gatewayUrl(): string;
    interact(options: InteractWrapperOptions): Promise<ProcessResult>;
}
export {};
