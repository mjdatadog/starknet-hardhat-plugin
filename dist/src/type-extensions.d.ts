import "hardhat/types/config";
import "hardhat/types/runtime";
import { StarknetContract, StarknetContractFactory, StringMap } from "./types";
import { StarknetWrapper } from "./starknet-wrappers";
import * as DevnetTypes from "./types/devnet";
import * as StarknetTypes from "./types/starknet";
import { Account } from "./account";
import { Transaction, TransactionReceipt, Block, TransactionTrace } from "./starknet-types";
import { StarknetChainId } from "./constants";
import { AmarnaDocker } from "./external-server/docker-amarna";
declare module "hardhat/types/config" {
    interface ProjectPathsUserConfig {
        starknetArtifacts?: string;
        starknetSources?: string;
        cairoPaths?: string[];
    }
    interface ProjectPathsConfig {
        starknetArtifacts: string;
        starknetSources?: string;
        cairoPaths?: string[];
    }
    interface HardhatConfig {
        starknet: StarknetTypes.StarknetConfig;
    }
    interface HardhatUserConfig {
        starknet?: StarknetTypes.StarknetConfig;
    }
    interface NetworksConfig {
        alphaGoerli: HttpNetworkConfig;
        alphaGoerli2: HttpNetworkConfig;
        alphaMainnet: HttpNetworkConfig;
        integratedDevnet: HardhatNetworkConfig;
    }
    interface NetworksUserConfig {
        integratedDevnet?: HardhatNetworkUserConfig;
    }
    interface HttpNetworkConfig {
        verificationUrl?: string;
        verifiedUrl?: string;
        starknetChainId?: StarknetChainId;
    }
    interface HardhatNetworkConfig {
        url?: string;
        venv?: string;
        dockerizedVersion?: string;
        starknetChainId?: StarknetChainId;
        args?: string[];
        stdout?: string;
        stderr?: string;
    }
    interface HardhatNetworkUserConfig {
        url?: string;
        venv?: string;
        dockerizedVersion?: string;
        args?: string[];
        stdout?: string;
        stderr?: string;
    }
}
declare type StarknetContractType = StarknetContract;
declare type StarknetContractFactoryType = StarknetContractFactory;
declare type StringMapType = StringMap;
declare type AccountType = Account;
declare type TransactionReceiptType = TransactionReceipt;
declare type TransactionTraceType = TransactionTrace;
declare type TransactionType = Transaction;
declare type BlockType = Block;
declare module "hardhat/types/runtime" {
    interface Devnet extends DevnetTypes.Devnet {
    }
    interface HardhatRuntimeEnvironment {
        starknetWrapper: StarknetWrapper;
        amarnaDocker: AmarnaDocker;
        starknet: StarknetTypes.Starknet;
    }
    type StarknetContract = StarknetContractType;
    type StarknetContractFactory = StarknetContractFactoryType;
    type StringMap = StringMapType;
    type Wallet = StarknetTypes.WalletConfig;
    type Account = AccountType;
    type Transaction = TransactionType;
    type TransactionReceipt = TransactionReceiptType;
    type TransactionTrace = TransactionTraceType;
    type Block = BlockType;
}
export {};
