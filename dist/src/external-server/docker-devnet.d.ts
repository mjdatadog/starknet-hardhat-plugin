import { Image } from "@nomiclabs/hardhat-docker";
import { DockerServer } from "./docker-server";
export declare class DockerDevnet extends DockerServer {
    private devnetArgs?;
    constructor(image: Image, host: string, port: string, devnetArgs?: string[], stdout?: string, stderr?: string);
    protected getDockerArgs(): Promise<string[]>;
    protected getContainerArgs(): Promise<string[]>;
}
