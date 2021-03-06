"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailedError = exports.Timer = void 0;
class Timer {
    constructor(name) {
        this.name = name;
        this.start = process.hrtime()[1];
    }
    stop() {
        const end = process.hrtime()[1];
        console.log(`${this.name}: ${this.prettyTime(end - this.start)}`);
    }
    prettyTime(ns) {
        if (ns > 1000) {
            const mcs = ns / 1000;
            if (mcs > 1000) {
                const ms = mcs / 1000;
                if (ms > 1000) {
                    const s = ms / 1000;
                    if (s > 60) {
                        const m = s / 60;
                        return m.toFixed(3) + "m";
                    }
                    else {
                        return s.toFixed(3) + "s";
                    }
                }
                else {
                    return ms.toFixed(3) + "ms";
                }
            }
            else {
                return mcs.toFixed(3) + "mcs";
            }
        }
        else {
            return ns.toFixed(3) + "ns";
        }
    }
}
exports.Timer = Timer;
class DetailedError extends Error {
    constructor(message, ...items) {
        console.log("\nš Error details:");
        console.log(...items);
        super(message);
    }
}
exports.DetailedError = DetailedError;
//# sourceMappingURL=_interfaces.js.map