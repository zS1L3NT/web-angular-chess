import express from "express"
import Board from "./board/Board"
import BoardUtils from "./board/BoardUtils"
import Team from "./board/Team"
import Tile from "./board/Tile"
import {
	addNotation,
	ConvertPiece,
	ValidateBoardBody,
	ValidateDepth,
	ValidateEPTS,
	ValidateHistory,
	ValidateTeamParam
} from "./conversions"
import fs from "fs"
import path from "path"
import movemaker from "./movemaker"
import addToDatabase from "./movemaker/database"

const app = express()
const PORT = process.env.PORT || 5000

/**
 * Initialise database
 */
const database = {
	wins: {
		white: 0,
		black: 0,
		draw: 0,
		total: 0
	}
}

console.log("Adding files to database...")
const start = new Date().getTime()

const fileNames = fs.readdirSync(path.join(__dirname, "movemaker", "PGNs"))
fileNames.forEach(fileName => {
	const file = fs.readFileSync(path.join(__dirname, "movemaker", "PGNs", fileName), {
		encoding: "utf8"
	})

	addToDatabase(database, file)
})

console.log(`Files added successfully (${new Date().getTime() - start}ms) ✔️`)

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: false }))
app.use(function (_req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	)
	next()
})

app.post("/api/getAllSafeMoves", (req, res) => {
	const { board: boardUnverified, epts: eptsUnverified } = req.body

	const board = ValidateBoardBody(res, boardUnverified)
	const epts = ValidateEPTS(res, eptsUnverified)
	if (!board || typeof epts !== "string") return undefined

	const map: Tile[] = Array.from(Array(64).keys()).map(i => new Tile(i, null))

	for (let i = 0, il = board.length; i < il; i++) {
		const piece = board[i]
		const position = BoardUtils.getPosition(piece.boardCode)

		if (map[position].isOccupied())
			return res
				.status(400)
				.send(`Two pieces have the same position of ${piece.boardCode}`)

		map[position].setPiece(ConvertPiece(piece))
	}

	const game = new Board(epts, map)

	res.send({
		white: new Team("white")
			.getAllSafeMoves(game)
			.map(move => addNotation(game, move)),
		black: new Team("black")
			.getAllSafeMoves(game)
			.map(move => addNotation(game, move))
	})
})

app.post("/api/getComputerMove/:team", async (req, res) => {
	console.log("getComputerMove...")
	console.time("getComputerMove")
	const {
		board: boardUnverified,
		epts: eptsUnverified,
		depth: depthUnverified,
		history: historyUnverified
	} = req.body
	const { team: teamUnverified } = req.params

	const board = ValidateBoardBody(res, boardUnverified)
	const epts = ValidateEPTS(res, eptsUnverified)
	const depth = ValidateDepth(res, depthUnverified)
	const history = ValidateHistory(res, historyUnverified)
	const team = ValidateTeamParam(res, teamUnverified)
	if (!team || !board || typeof epts !== "string" || !depth || !history)
		return undefined

	const map: Tile[] = Array.from(Array(64).keys()).map(i => new Tile(i, null))

	for (let i = 0, il = board.length; i < il; i++) {
		const piece = board[i]
		const position = BoardUtils.getPosition(piece.boardCode)

		if (map[position].isOccupied())
			return res
				.status(400)
				.send(`Two pieces have the same position of ${piece.boardCode}`)

		map[position].setPiece(ConvertPiece(piece))
	}

	const game = new Board(epts, map)
	
	res.send(addNotation(game, movemaker(database, game, depth, history, team)))
	console.timeEnd("getComputerMove")
})

app.post("/api/getGameStatus", (req, res) => {
	const { board: boardUnverified, epts: eptsUnverified } = req.body

	const board = ValidateBoardBody(res, boardUnverified)
	const epts = ValidateEPTS(res, eptsUnverified)
	if (!board || typeof epts !== "string") return undefined

	const map: Tile[] = Array.from(Array(64).keys()).map(i => new Tile(i, null))

	for (let i = 0, il = board.length; i < il; i++) {
		const piece = board[i]
		const position = BoardUtils.getPosition(piece.boardCode)

		if (map[position].isOccupied())
			return res
				.status(400)
				.send(`Two pieces have the same position of ${piece.boardCode}`)

		map[position].setPiece(ConvertPiece(piece))
	}

	const game = new Board(epts, map)
	const white = new Team("white")
	const black = new Team("black")
	const whiteMoves = white.getAllSafeMoves(game)
	const blackMoves = black.getAllSafeMoves(game)

	if (whiteMoves.length > 0 && blackMoves.length > 0) {
		res.status(400).send("Both players have moves!")
	}

	if (whiteMoves.length === 0 && blackMoves.length === 0) {
		res.status(400).send("How can both teams have no moves?")
	}

	if (whiteMoves.length > 0 && blackMoves.length === 0) {
		if (black.isKingSafe(game)) {
			res.status(200).send({ status: "draw" })
		} else {
			res.status(200).send({ status: "white" })
		}
	}

	if (whiteMoves.length === 0 && blackMoves.length > 0) {
		if (white.isKingSafe(game)) {
			res.status(200).send({ status: "draw" })
		} else {
			res.status(200).send({ status: "black" })
		}
	}
})

app.post("/api/database", (req, res) => {
	const file = req.body.file as string

	if (!file) return res.status(400).send("No file data")
	addToDatabase(database, file)
	res.status(200).send("Done at " + new Date())
})

app.use(express.static(path.resolve(__dirname, "..", "..", "client", "dist")))
app.get("*", (_req, res) => {
	res.sendFile(
		path.resolve(__dirname, "..", "..", "client", "dist", "index.html")
	)
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
