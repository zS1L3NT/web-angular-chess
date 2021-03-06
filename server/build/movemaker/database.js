"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Convert's PGN File Data into a JSON Object to be parsed later on
 * @param PGN PGN String data
 */
const PGNtoJSON = (PGN) => {
    var _a;
    const GAME = ("1." + PGN.split("\n1.")[1])
        .split(" ")
        .slice(0, -1)
        .map(l => (l.indexOf(".") > 0 ? l.split(".")[1] : l));
    let winner = "";
    const REGEX = /\[Result "(.*)"\]/;
    const result = (_a = PGN.match(REGEX)) === null || _a === void 0 ? void 0 : _a[1];
    if (!result)
        throw new Error("Could not parse PGN result ❌");
    else if (result === "1-0")
        winner = "white";
    else if (result === "0-1")
        winner = "black";
    else if (result === "1/2-1/2")
        winner = "draw";
    else if (result === "*")
        return undefined;
    else
        throw new Error(`Result(${result}) was neither '1-0', '0-1' or '1/2-1/2'`);
    return {
        GAME,
        winner
    };
};
/**
 * Recursive function to set data into JSON database
 * @param ref Reference in the database depth
 * @param stack List of moves determining how much deeper into ref to go into
 * @param winner Winner's team
 */
const setStackAndTrace = (ref, stack, winner) => {
    if (stack.length === 0)
        return undefined;
    const currentMove = stack.shift();
    if (ref[currentMove]) {
        ref.wins[winner]++;
        ref.wins.total++;
    }
    else {
        ref[currentMove] = {
            wins: {
                white: winner === "white" ? 1 : 0,
                black: winner === "black" ? 1 : 0,
                draw: winner === "draw" ? 1 : 0,
                total: 1
            }
        };
    }
    setStackAndTrace(ref[currentMove], stack, winner);
};
exports.default = (database, file) => {
    /**
     * Parse database file after PGNs
     */
    const PGNs = [];
    file.split("[Event ")
        .slice(1)
        .forEach(game => {
        PGNs.push("[Event " + game);
    });
    for (let i = 0; i < PGNs.length; i++) {
        const PGN = PGNs[i];
        const JSON = PGNtoJSON(PGN);
        if (!JSON)
            continue;
        database.wins[JSON.winner]++;
        database.wins.total++;
        setStackAndTrace(database, JSON.GAME, JSON.winner);
    }
};
//# sourceMappingURL=database.js.map