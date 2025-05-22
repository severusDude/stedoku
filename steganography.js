class SudokuSteganography {
	constructor() {
		this.reference = null;
		this.board = null;
		this.sequenceMap = null;
	}

	/**
	 * Preprocesses cover text into a 3D reference array
	 * @param {string} text - The cover text to preprocess
	 * @returns {Array} 3D array: [sentence][word][character]
	 */
	preprocessCoverText(text) {
		const cleanedText = text.replace(/\n/g, " ").replace(/([.])/g, "$1|"); // Add delimiter for sentence splitting
		const sentences = cleanedText
			.split("|")
			.map((s) => s.trim())
			.filter(Boolean);

		const reference = sentences.slice(0, 9).map((sentence) => {
			const words = sentence
				.replace(/[,]/g, "") // Remove commas
				.split(/\s+/)
				.filter((word) => word.length <= 9) // Filter out words longer than 9 characters
				.slice(0, 9) // Take first 9 words (after filtering)
				.map((word) => {
					const padded = word.padEnd(9, " "); // Ensure 9 characters
					return padded.split("");
				});
			return words;
		});

		this.reference = reference;
		return reference;
	}

	/**
	 * Checks if secret text can be encoded using the reference matrix
	 * @param {string} secretText - The secret text to encode
	 * @param {Array} reference - Optional reference matrix (uses instance reference if not provided)
	 * @returns {boolean} True if encoding is possible
	 */
	canEncode(secretText, reference = null) {
		const ref = reference || this.reference;
		if (!ref) {
			console.warn(
				"No reference matrix available. Call preprocessCoverText first."
			);
			return false;
		}

		const availableChars = new Set();
		const secret = secretText.replaceAll(" ", "");

		for (let s = 0; s < ref.length; s++) {
			for (let w = 0; w < ref[s].length; w++) {
				for (let c = 0; c < ref[s][w].length; c++) {
					availableChars.add(ref[s][w][c].toLowerCase());
				}
			}
		}

		const missing = [];
		for (const ch of secret.toLowerCase()) {
			if (!availableChars.has(ch)) {
				missing.push(ch);
			}
		}

		if (missing.length > 0) {
			console.warn(
				"Missing characters in reference matrix:",
				[...new Set(missing)].join(", ")
			);
			return false;
		}

		return true;
	}

	/**
	 * Converts sentence and word indices to Sudoku grid coordinates
	 * @param {number} sentenceIndex - Index of the sentence (0-8)
	 * @param {number} wordIndex - Index of the word (0-8)
	 * @returns {Array} [row, col] coordinates in the Sudoku grid
	 */
	getSudokuCoordinates(sentenceIndex, wordIndex) {
		const gridRow = Math.floor(sentenceIndex / 3);
		const gridCol = sentenceIndex % 3;
		const cellRow = Math.floor(wordIndex / 3);
		const cellCol = wordIndex % 3;

		const row = gridRow * 3 + cellRow;
		const col = gridCol * 3 + cellCol;

		return [row, col];
	}

	/**
	 * Counts conflicts for a potential placement in the Sudoku board
	 * @param {Array} board - The Sudoku board
	 * @param {number} row - Row index
	 * @param {number} col - Column index
	 * @param {number} value - Value to place
	 * @returns {number} Number of conflicts
	 */
	countConflicts(board, row, col, value) {
		let conflicts = 0;

		// Check row
		for (let i = 0; i < 9; i++) {
			if (board[row][i] === value) conflicts++;
		}

		// Check column
		for (let i = 0; i < 9; i++) {
			if (board[i][col] === value) conflicts++;
		}

		// Check 3x3 subgrid
		const boxRow = Math.floor(row / 3) * 3;
		const boxCol = Math.floor(col / 3) * 3;
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (board[boxRow + i][boxCol + j] === value) conflicts++;
			}
		}

		return conflicts;
	}

	/**
	 * Checks if a value can be safely placed at the given position
	 * @param {Array} board - The Sudoku board
	 * @param {number} row - Row index
	 * @param {number} col - Column index
	 * @param {number} value - Value to check
	 * @returns {boolean} True if the placement is safe
	 */
	isSafe(board, row, col, value) {
		for (let i = 0; i < 9; i++) {
			if (board[row][i] === value || board[i][col] === value) return false;
		}

		const boxRow = Math.floor(row / 3) * 3;
		const boxCol = Math.floor(col / 3) * 3;

		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 3; c++) {
				if (board[boxRow + r][boxCol + c] === value) return false;
			}
		}

		return true;
	}

	/**
	 * Finds all possible character matches in the reference matrix
	 * @param {string} secretText - The secret text to find matches for
	 * @param {Array} reference - Optional reference matrix (uses instance reference if not provided)
	 * @returns {Object} Object with characters as keys and arrays of positions as values
	 */
	findCharacterMatches(secretText, reference = null) {
		const ref = reference || this.reference;
		if (!ref) {
			console.warn(
				"No reference matrix available. Call preprocessCoverText first."
			);
			return {};
		}

		const secret = secretText.replaceAll(" ", "").toLowerCase() + " ";
		const matches = {};

		for (const ch of secret) {
			// Initialize array for this character if it doesn't exist
			if (!matches[ch]) {
				matches[ch] = [];
			}

			for (let s = 0; s < ref.length && s < 9; s++) {
				for (let w = 0; w < ref[s].length && w < 9; w++) {
					for (let c = 0; c < ref[s][w].length && c < 9; c++) {
						if (ch === ref[s][w][c].toLowerCase()) {
							matches[ch].push({ s, w, c });
						}
					}
				}
			}

			if (matches[ch].length === 0) {
				console.warn(`Character "${ch}" not found in cover text!`);
				matches[ch].push({ s: -1, w: -1, c: -1 });
			}
		}

		return matches;
	}

	/**
	 * Generates a Sudoku board from character matches using backtracking
	 * @param {string} secretText - The secret text to encode
	 * @param {Object} matches - Character matches object
	 * @returns {Object} Object containing the board and sequence map
	 */
	generateSudokuFromMatches(secretText, matches) {
		const secret = secretText.toLowerCase();
		const board = Array.from({ length: 9 }, () => Array(9).fill(0));
		const sequenceMap = []; // This will store the order of placements

		// Convert matches object to an array of characters in secret text order
		const secretChars = [];
		for (const ch of secret) {
			if (matches[ch]) {
				// Sort the locations for this character by the number of conflicts
				// This helps with backtracking efficiency while maintaining order
				const sortedLocations = matches[ch]
					.map((loc) => {
						const [row, col] = this.getSudokuCoordinates(loc.s, loc.w);
						return {
							...loc,
							conflicts: this.countConflicts(board, row, col, loc.c + 1),
						};
					})
					.sort((a, b) => a.conflicts - b.conflicts);

				secretChars.push({
					char: ch,
					locations: sortedLocations.map((loc) => {
						const { s, w, c } = loc;
						return { s, w, c };
					}),
				});
			}
		}

		const backtrack = (index) => {
			if (index >= secretChars.length) return true;

			const currentChar = secretChars[index];
			const char = currentChar.char;
			const locations = currentChar.locations;

			for (const location of locations) {
				const { s, w, c } = location;
				const [row, col] = this.getSudokuCoordinates(s, w);
				const value = c + 1;

				if (board[row][col] === 0 && this.isSafe(board, row, col, value)) {
					board[row][col] = value;
					sequenceMap.push([row, col]); // Record the placement order

					if (backtrack(index + 1)) {
						return true;
					}

					// console.log(sequenceMap);

					// Backtrack - undo this placement
					board[row][col] = 0;
					sequenceMap.pop(); // Remove the last placement
				}
			}

			return false;
		};

		if (!backtrack(0)) {
			console.warn(
				"Could not place all characters while satisfying Sudoku rules"
			);
			// Fill in any remaining valid placements while maintaining sequence
			for (const currentChar of secretChars) {
				const char = currentChar.char;
				const locations = currentChar.locations;

				for (const location of locations) {
					const { s, w, c } = location;
					const [row, col] = this.getSudokuCoordinates(s, w);
					const value = c + 1;

					if (board[row][col] === 0 && this.isSafe(board, row, col, value)) {
						board[row][col] = value;
						sequenceMap.push([row, col]); // Record the placement order
						break;
					}
				}
			}
		}

		this.board = board;
		this.sequenceMap = sequenceMap;

		return {
			board: board,
			sequenceMap: sequenceMap,
		};
	}

	/**
	 * Decodes a Sudoku board back to the original message
	 * @param {Array} board - Optional Sudoku board (uses instance board if not provided)
	 * @param {Array} reference - Optional reference matrix (uses instance reference if not provided)
	 * @param {Array} sequenceMap - Optional sequence map (uses instance sequenceMap if not provided)
	 * @returns {string} The decoded message
	 */
	decodeBoard(board = null, reference = null, sequenceMap = null) {
		const sudokuBoard = board || this.board;
		const ref = reference || this.reference;
		const sequence = sequenceMap || this.sequenceMap;

		if (!sudokuBoard || !ref || !sequence) {
			console.warn(
				"Missing required data for decoding. Ensure encoding was completed first."
			);
			return "";
		}

		let message = "";

		// Decode in the order specified by sequenceMap
		for (const [row, col] of sequence) {
			const value = sudokuBoard[row][col];
			if (value > 0) {
				const sentenceIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
				const wordIndex = (row % 3) * 3 + (col % 3);
				const charIndex = value - 1;

				const ch = ref[sentenceIndex][wordIndex][charIndex];
				message += ch;
			}
		}

		return message;
	}

	/**
	 * Complete encoding process - combines all steps
	 * @param {string} coverText - The cover text to use
	 * @param {string} secretText - The secret text to encode
	 * @returns {Object} Object containing success status, board, and sequence map
	 */
	encode(coverText, secretText) {
		try {
			// Step 1: Preprocess cover text
			this.preprocessCoverText(coverText);

			// Step 2: Check if encoding is possible
			if (!this.canEncode(secretText)) {
				return {
					success: false,
					error: "Cannot encode secret text with given cover text",
				};
			}

			// Step 3: Find character matches
			const matches = this.findCharacterMatches(secretText);

			// Step 4: Generate Sudoku board
			const result = this.generateSudokuFromMatches(secretText, matches);

			return {
				success: true,
				board: result.board,
				sequenceMap: result.sequenceMap,
				reference: this.reference,
			};
		} catch (error) {
			return { success: false, error: error.message };
		}
	}

	/**
	 * Complete decoding process
	 * @param {Array} board - Optional board to decode (uses instance board if not provided)
	 * @param {Array} reference - Optional reference matrix (uses instance reference if not provided)
	 * @param {Array} sequenceMap - Optional sequence map (uses instance sequenceMap if not provided)
	 * @returns {string} The decoded message
	 */
	decode(board = null, reference = null, sequenceMap = null) {
		return this.decodeBoard(board, reference, sequenceMap);
	}

	/**
	 * Resets the instance state
	 */
	reset() {
		this.reference = null;
		this.board = null;
		this.sequenceMap = null;
	}
}

const coverText = `Bahwa sesungguhnya kemerdekaan itu ialah hak segala bangsa dan oleh sebab itu, maka penjajahan diatas dunia harus dihapuskan, karena tidak sesuai dengan perikemanusiaan dan perikeadilan.\nDan perjuangan pergerakan kemerdekaan Indonesia telah sampailah kepada saat yang berbahagia dengan selamat sentosa mengantarkan rakyat Indonesia ke depan pintu gerbang kemerdekaan negara Indonesia, yang merdeka, bersatu, berdaulat, adil dan makmur.\nAtas berkat rahmat Allah Yang Maha Kuasa dan dengan didorongkan oleh keinginan luhur, supaya berkehidupan kebangsaan yang bebas, maka rakyat Indonesia menyatakan dengan ini kemerdekaannya.\nKemudian daripada itu untuk membentuk suatu Pemerintah Negara Indonesia yang melindungi segenap bangsa Indonesia dan seluruh tumpah darah Indonesia dan untuk memajukan kesejahteraan umum, mencerdaskan kehidupan bangsa, dan ikut melaksanakan ketertiban dunia yang berdasarkan kemerdekaan, perdamaian abadi dan keadilan sosial, maka disusunlah Kemerdekaan Kebangsaan Indonesia itu dalam suatu Undang-Undang Dasar Negara Indonesia, yang terbentuk dalam suatu susunan Negara Republik Indonesia yang berkedaulatan rakyat dengan berdasar kepada : Ketuhanan Yang Maha Esa, kemanusiaan yang adil dan beradab, persatuan Indonesia, dan kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan, serta dengan mewujudkan suatu keadilan sosial bagi seluruh rakyat Indonesia.`;
const secret = "maks karakternya berapa";

const steganography = new SudokuSteganography();

// Encode
const result = steganography.encode(coverText, secret);
if (result.success) {
	console.log("Encoding successful!");
	console.log("Board:", result.board);
}

// Decode
const decodedMessage = steganography.decode();
console.log("Decoded:", decodedMessage);
