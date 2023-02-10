import { Image } from "@nomiclabs/hardhat-docker";
import { DockerServer } from "./external-server/docker-server";
export declare class StarknetDockerProxy extends DockerServer {
    private rootPath;
    private accountPaths;
    private cairoPaths;
    /**
     * @param image the Docker image to be used for running the container
     * @param rootPath the hardhat project root
     * @param accountPaths the paths holding wallet information
     * @param cairoPaths the paths specified in hardhat config cairoPaths
     */
    constructor(image: Image, rootPath: string, accountPaths: string[], cairoPaths: string[]);
    protected getDockerArgs(): Promise<string[]>;
    protected getContainerArgs(): Promise<string[]>;
    protected getPort(): Promise<string>;
}
