/// <reference types="node" />
import { ChildProcess } from "child_process";
import { ExternalServer } from "./external-server";
export declare class VenvDevnet extends ExternalServer {
    private command;
    private args?;
    constructor(venvPath: string, host: string, port: string, args?: string[], stdout?: string, stderr?: string);
    protected spawnChildProcess(): Promise<ChildProcess>;
    protected cleanup(): void;
}
