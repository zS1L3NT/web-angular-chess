import fs from "fs"
import path from "path"

console.log("Reading all games...")
const PGNs: string[] = []
const fileNames = fs.readdirSync(path.join(__dirname, "PGNs"))

fileNames.forEach(fileName => {
	if (fileName.endsWith(")")) return undefined
	const file = fs.readFileSync(path.join(__dirname, "PGNs", fileName), {
		encoding: "utf8"
	})
	file.split("[Event ")
		.slice(1)
		.forEach(game => {
			PGNs.push("[Event " + game)
		})
})

console.log("Read all games ✔️\n")

// Parse database file after PGNs
// const database = JSON.parse(
// 	fs.readFileSync(path.join(__dirname, "database.json"), { encoding: "utf8" })
// )
const database: any = {
	wins: {
		white: 0,
		black: 0,
		draw: 0,
		total: 0
	}
}

const GetGame = (PGN: string) => {
	return "1." + PGN.split("\n1.")[1]
}

/**
 * Convert's PGN File Data into a JSON Object to be parsed later on
 * @param PGN PGN String data
 */
const PGNtoJSON = (PGN: string) => {
	const GAME = GetGame(PGN)
		.split(" ")
		.slice(0, -1)
		.map(l => l.indexOf(".") > 0 ? l.split(".")[1] : l)

	let winner = ""
	const REGEX = /\[Result "(.*)"\]/
	const result = PGN.match(REGEX)?.[1]
	if (!result) throw new Error("Could not parse PGN result ❌")
	else if (result === "1-0") winner = "white"
	else if (result === "0-1") winner = "black"
	else if (result === "1/2-1/2") winner = "draw"
	else if (result === "*") return undefined
	else
		throw new Error(
			`Result(${result}) was neither '1-0', '0-1' or '1/2-1/2'`
		)

	return {
		GAME,
		winner
	} as {
		GAME: string[]
		winner: "white" | "black" | "draw"
	}
}

/**
 * Recursive function to set data into JSON database
 * @param ref Reference in the database depth
 * @param stack List of moves determining how much deeper into ref to go into
 * @param winner Winner's team
 */
const setStackAndTrace = (
	ref: any,
	stack: string[],
	winner: "white" | "black" | "draw"
) => {
	if (stack.length === 0) return undefined

	const currentMove = stack.shift() as string

	if (ref[currentMove]) {
		ref.wins[winner]++
		ref.wins.total++
	} else {
		ref[currentMove] = {
			wins: {
				white: winner === "white" ? 1 : 0,
				black: winner === "black" ? 1 : 0,
				draw: winner === "draw" ? 1 : 0,
				total: 1
			}
		}
	}

	setStackAndTrace(ref[currentMove], stack, winner)
}

for (let i = 0; i < PGNs.length; i++) {
	const PGN = PGNs[i]
	const JSON = PGNtoJSON(PGN)
	if (!JSON) continue

	database.wins[JSON.winner]++
	database.wins.total++
	setStackAndTrace(database, JSON.GAME, JSON.winner)
}

fs.writeFileSync(
	path.join(__dirname, "database.json"),
	JSON.stringify(database)
)

database.e4