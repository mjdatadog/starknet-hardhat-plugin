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
exports.DevnetUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const starknet_plugin_error_1 = require("./starknet-plugin-error");
const constants_1 = require("./constants");
const starknet_1 = require("starknet");
const utils_1 = require("./utils");
class DevnetUtils {
    constructor(hre) {
        this.hre = hre;
        this.axiosInstance = axios_1.default.create({
            baseURL: this.endpoint,
            timeout: constants_1.REQUEST_TIMEOUT,
            timeoutErrorMessage: "Request timed out"
        });
    }
    get endpoint() {
        return `${this.hre.starknet.networkConfig.url}`;
    }
    requestHandler(url, method, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Make the request
                return this.axiosInstance.request({
                    url,
                    method,
                    data
                });
            }
            catch (error) {
                const parent = error instanceof Error && error;
                const msg = `Request failed: Could not ${method} ${url}. This is a Devnet-specific functionality.
Make sure you really want to interact with Devnet and that it is running and available at ${this.endpoint}`;
                throw new starknet_plugin_error_1.StarknetPluginError(msg, parent);
            }
        });
    }
    restart() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.requestHandler("/restart", "POST");
        });
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/postman/flush", "POST");
            return response.data;
        });
    }
    loadL1MessagingContract(networkUrl, address, networkId) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                networkId,
                address,
                networkUrl
            };
            const response = yield this.requestHandler("/postman/load_l1_messaging_contract", "POST", body);
            return response.data;
        });
    }
    sendMessageToL2(l2ContractAddress, funcionName, l1ContractAddress, payload, nonce) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                l2_contract_address: l2ContractAddress,
                entry_point_selector: starknet_1.hash.getSelectorFromName(funcionName),
                l1_contract_address: l1ContractAddress,
                payload: payload.map((item) => (0, utils_1.numericToHexString)(item)),
                nonce: (0, utils_1.numericToHexString)(nonce)
            };
            const response = yield this.requestHandler("/postman/send_message_to_l2", "POST", body);
            return response.data;
        });
    }
    consumeMessageFromL2(l2ContractAddress, l1ContractAddress, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                l2_contract_address: l2ContractAddress,
                l1_contract_address: l1ContractAddress,
                payload: payload.map((item) => (0, utils_1.numericToHexString)(item))
            };
            const response = yield this.requestHandler("/postman/consume_message_from_l2", "POST", body);
            return response.data;
        });
    }
    increaseTime(seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/increase_time", "POST", {
                time: seconds
            });
            return response.data;
        });
    }
    setTime(seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/set_time", "POST", {
                time: seconds
            });
            return response.data;
        });
    }
    getPredeployedAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/predeployed_accounts", "GET");
            return response.data;
        });
    }
    dump(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/dump", "POST", {
                path
            });
            return response.data;
        });
    }
    load(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/load", "POST", {
                path
            });
            return response.data;
        });
    }
    createBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/create_block", "POST");
            return response.data;
        });
    }
    mint(address, amount, lite = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.requestHandler("/mint", "POST", {
                amount,
                address,
                lite
            });
            return response.data;
        });
    }
}
exports.DevnetUtils = DevnetUtils;
//# sourceMappingURL=devnet-utils.js.map