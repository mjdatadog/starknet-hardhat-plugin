/// <reference types="node" />
import { ChildProcess } from "child_process";
import { StringMap } from "../types";
export declare function getFreePort(): Promise<string>;
export declare abstract class ExternalServer {
    protected host: string;
    protected port: string | null;
    private isAliveURL;
    protected processName: string;
    protected stdout?: string;
    protected stderr?: string;
    protected childProcess: ChildProcess;
    private connected;
    private lastError;
    constructor(host: string, port: string | null, isAliveURL: string, processName: string, stdout?: string, stderr?: string);
    get url(): string;
    protected static cleanupFns: Array<() => void>;
    static cleanAll(): void;
    protected abstract spawnChildProcess(): Promise<ChildProcess>;
    protected abstract cleanup(): void;
    start(): Promise<void>;
    stop(): void;
    private isServerAlive;
    post<T>(data: StringMap): Promise<T>;
    private ensureStarted;
}
