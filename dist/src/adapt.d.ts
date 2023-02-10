import * as starknet from "./starknet-types";
import { StringMap } from "./types";
/**
 * Adapts an object of named input arguments to an array of stringified arguments in the correct order.
 *
 * E.g. If your contract has a function
 * ```text
 * func double_sum(x: felt, y: felt) -> (res: felt):
 *     return (res=(x + y) * 2)
 * end
 * ```
 * then running
 * ```typescript
 * const abi = readAbi(...);
 * const funcName = "double_sum";
 * const inputSpecs = abi[funcName].inputs;
 * const adapted = adaptInputUtil(funcName, {x: 1, y: 2}, inputSpecs, abi);
 * console.log(adapted);
 * ```
 * will yield
 * ```text
 * > ["1", "2"]
 * ```
 * @param functionName the name of the function whose input is adapted
 * @param input the input object containing function arguments under their names
 * @param inputSpecs ABI specifications extracted from function.inputs
 * @param abi the ABI artifact of compilation, parsed into an object
 * @returns array containing stringified function arguments in the correct order
 */
export declare function adaptInputUtil(functionName: string, input: any, inputSpecs: starknet.Argument[], abi: starknet.Abi): string[];
/**
 * Adapts the string resulting from a Starknet CLI function call or server purpose of adapting event
 * This is done according to the actual output type specifed by the called function.
 *
 * @param rawResult the actual result in the form of an unparsed string
 * @param outputSpecs array of starknet types in the expected function output
 * @param abi the ABI of the contract whose function was called
 */
export declare function adaptOutputUtil(rawResult: string, outputSpecs: starknet.Argument[], abi: starknet.Abi): StringMap;
