"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recompiler = exports.Cache = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const task_actions_1 = require("./task-actions");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
// Cache file name
const CACHE_FILE_NAME = "cairo-files-cache.json";
class Cache {
    constructor(hre) {
        this.hre = hre;
        this.cache = {};
        this.fsPromises = fs_1.default.promises;
    }
    // Returns the contract data from the cache
    getCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadCache();
            return this.cache;
        });
    }
    // Sets the cache
    setCache(cacheData) {
        this.cache = cacheData;
    }
    // Returns the cache file path
    getCacheFilePath() {
        return path_1.default.join(this.hre.config.paths.cache, CACHE_FILE_NAME);
    }
    // Returns the cache directory path
    getCacheDirPath() {
        return path_1.default.join(this.hre.config.paths.cache);
    }
    // Loads the cache from the file
    loadCache() {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheDirpath = this.getCacheDirPath();
            // Creates cache directory if it doesn't exist
            if (!fs_1.default.existsSync(cacheDirpath)) {
                fs_1.default.mkdirSync(cacheDirpath, { recursive: true });
            }
            const cacheFilePath = this.getCacheFilePath();
            if (fs_1.default.existsSync(cacheFilePath)) {
                const cacheBuffer = yield this.fsPromises.readFile(cacheFilePath);
                this.setCache(JSON.parse(cacheBuffer.toString() || "{}"));
            }
            else {
                yield fs_1.default.promises.writeFile(cacheFilePath, JSON.stringify({}) + "\n");
                this.setCache({});
            }
        });
    }
    // Saves the cache to the file
    saveCache() {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheFilePath = this.getCacheFilePath();
            yield this.fsPromises.writeFile(cacheFilePath, JSON.stringify(this.cache, null, " ") + "\n");
        });
    }
}
exports.Cache = Cache;
class Recompiler {
    constructor(hre) {
        this.cache = new Cache(hre);
        this.hre = hre;
    }
    // Gets hash of each .cairo file inside source
    getContractHash(paths) {
        return __awaiter(this, void 0, void 0, function* () {
            const { starknetSources: defaultSourcesPath } = paths;
            const sourceRegex = new RegExp("^" + defaultSourcesPath + "/");
            const artifactsDir = (0, utils_1.getArtifactPath)(defaultSourcesPath, paths);
            const newCacheEntry = {};
            // Get soucrces from source path. Check only cairo file extensions
            const filesList = yield (0, utils_1.traverseFiles)(defaultSourcesPath, "*.cairo");
            // Select file name
            for (const cairoContract of filesList) {
                const data = yield this.cache.fsPromises.readFile(cairoContract);
                const hash = (0, crypto_1.createHash)("sha256");
                hash.update(data);
                const suffix = cairoContract.replace(sourceRegex, "");
                const fileName = path_1.default.basename(suffix, ".cairo");
                const abiPath = path_1.default.join(artifactsDir, suffix, `${fileName}${constants_1.ABI_SUFFIX}`);
                const outputPath = path_1.default.join(artifactsDir, suffix, `${fileName}.json`);
                newCacheEntry[cairoContract] = {
                    contentHash: hash.digest("hex").toString(),
                    outputPath,
                    abiPath
                };
            }
            return newCacheEntry;
        });
    }
    // Gets cache entry of a given cairo file plus artifacts
    getCacheEntry(file, output, abi, cairoPath, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.cache.fsPromises.readFile(file);
            const hash = (0, crypto_1.createHash)("sha256");
            hash.update(data);
            const newCacheEntry = {};
            newCacheEntry[file] = {
                contentHash: hash.digest("hex").toString(),
                outputPath: output,
                abiPath: abi
            };
            if (args === null || args === void 0 ? void 0 : args.disableHintValidation) {
                newCacheEntry[file].disableHintValidation = true;
            }
            if (args === null || args === void 0 ? void 0 : args.accountContract) {
                newCacheEntry[file].accountContract = true;
            }
            if (cairoPath) {
                newCacheEntry[file].cairoPath = args.cairoPath;
            }
            return newCacheEntry;
        });
    }
    // Updates cache entry with new contracts
    getUpdatedCache(oldCache, newCacheEntry) {
        var _a;
        const updatedCacheEntry = oldCache;
        for (const contractName in newCacheEntry) {
            if (((_a = oldCache[contractName]) === null || _a === void 0 ? void 0 : _a.contentHash) !== newCacheEntry[contractName].contentHash) {
                updatedCacheEntry[contractName] = newCacheEntry[contractName];
            }
        }
        return updatedCacheEntry;
    }
    // Checks artifacts availability
    checkArtifacts(paths, newCacheEntry) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set to save contracts with changed content & unavailable artifacts
            const changed = new Set();
            const { starknetSources: defaultSourcesPath } = paths;
            const artifactsDir = (0, utils_1.getArtifactPath)(defaultSourcesPath, paths);
            // Traverse on artifacts directory
            // Create if it doesn't exist
            if (!fs_1.default.existsSync(artifactsDir)) {
                fs_1.default.mkdirSync(artifactsDir, { recursive: true });
            }
            const artifactsList = yield (0, utils_1.traverseFiles)(artifactsDir, "*.json");
            for (const name in newCacheEntry) {
                const outputPath = newCacheEntry[name].outputPath;
                const abiPath = newCacheEntry[name].abiPath;
                if (!artifactsList.includes(outputPath) || !artifactsList.includes(abiPath)) {
                    changed.add(name);
                }
            }
            return changed;
        });
    }
    // Compile changed contracts
    compileChangedContracts(newCacheEntry, changed) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const changedContract of changed) {
                const entry = newCacheEntry[changedContract];
                const compileArguments = {
                    paths: [changedContract],
                    disableHintValidation: entry === null || entry === void 0 ? void 0 : entry.disableHintValidation,
                    accountContract: entry === null || entry === void 0 ? void 0 : entry.accountContract,
                    carioPath: entry === null || entry === void 0 ? void 0 : entry.cairoPath
                };
                yield (0, task_actions_1.starknetCompileAction)(compileArguments, this.hre);
            }
        });
    }
    // Updated set with changed and new contracts
    updateSet(cache, newCacheEntry, changed) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const contractName in newCacheEntry) {
                // Add new contracts that are not in cache before
                if (!cache[contractName]) {
                    changed.add(contractName);
                    continue;
                }
                // Add contracts that contiain a change in content
                if (newCacheEntry[contractName].contentHash !== cache[contractName].contentHash) {
                    changed.add(contractName);
                }
            }
            // Remove deleted sources from old cache by overwriting it
            this.cache.setCache(newCacheEntry);
            yield this.cache.saveCache();
            return changed;
        });
    }
    // Handles cache on Starknet cli calls
    handleCache() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // If recompile is not enabled, do nothing
            if (!((_b = (_a = this.hre.userConfig) === null || _a === void 0 ? void 0 : _a.starknet) === null || _b === void 0 ? void 0 : _b.recompile))
                return;
            const paths = this.hre.config.paths;
            try {
                const oldCache = yield this.cache.getCache();
                const newCacheEntry = yield this.getContractHash(paths);
                const changedContracts = yield this.checkArtifacts(paths, newCacheEntry);
                const updatedSet = yield this.updateSet(oldCache, newCacheEntry, changedContracts);
                yield this.compileChangedContracts(newCacheEntry, updatedSet);
            }
            catch (error) {
                // If there is an error, do not recompile
                console.error(error);
                process.exit(1);
            }
        });
    }
    // Updates cache with new contract and artifacts
    updateCache(args, file, output, abi, cairoPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldCache = yield this.cache.getCache();
            const newCacheEntry = yield this.getCacheEntry(file, output, abi, cairoPath, args);
            const updatedCache = this.getUpdatedCache(oldCache, newCacheEntry);
            this.cache.setCache(updatedCache);
        });
    }
    // Calls save cache after compilation
    saveCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.cache.saveCache();
        });
    }
}
exports.Recompiler = Recompiler;
//# sourceMappingURL=recompiler.js.map