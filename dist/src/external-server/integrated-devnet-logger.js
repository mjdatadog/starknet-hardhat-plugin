"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegratedDevnetLogger = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class IntegratedDevnetLogger {
    constructor(stdout, stderr) {
        this.stdout = stdout;
        this.stderr = stderr;
        this.checkFileExists(this.stdout);
        this.checkFileExists(this.stderr);
    }
    // Checks if the file exists
    checkFileExists(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!filePath || filePath === "STDOUT" || filePath === "STDERR")
                return;
            const file = path.resolve(filePath);
            // Create the file if it doesn't exist
            const dir = path.dirname(file);
            if (!fs.existsSync(dir)) {
                yield fs.promises.mkdir(dir, { recursive: true });
            }
            yield fs.promises.writeFile(file, "");
        });
    }
    logHandler(logTarget, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!logTarget)
                return;
            if (logTarget === "STDOUT") {
                console.log(message);
                return;
            }
            if (logTarget === "STDERR") {
                console.error(message);
                return;
            }
            // Append the message to the target log file
            this.appendLogToFile(logTarget, message);
        });
    }
    isFile(file) {
        return fs.existsSync(file);
    }
    // Appends the message to the file
    appendLogToFile(file, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.promises.appendFile(file, message);
        });
    }
}
exports.IntegratedDevnetLogger = IntegratedDevnetLogger;
//# sourceMappingURL=integrated-devnet-logger.js.map