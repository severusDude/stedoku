import { Image, ImageData, createCanvas } from "canvas";
// import fs from "fs";

class SudokuSteganography {
	constructor(nSize = 9) {
		this.nSize = nSize;
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

		const reference = sentences.slice(0, this.nSize).map((sentence) => {
			const words = sentence
				.replace(/[,]/g, "") // Remove commas
				.split(/\s+/)
				.filter((word) => word.length <= this.nSize) // Filter out words longer than nSize characters
				.slice(0, this.nSize) // Take first nSize words (after filtering)
				.map((word) => {
					const padded = word.padEnd(this.nSize, " "); // Ensure nSize characters
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
	 * @param {number} sentenceIndex - Index of the sentence (0 to nSize-1)
	 * @param {number} wordIndex - Index of the word (0 to nSize-1)
	 * @returns {Array} [row, col] coordinates in the Sudoku grid
	 */
	getSudokuCoordinates(sentenceIndex, wordIndex) {
		const subGridSize = Math.sqrt(this.nSize);
		const gridRow = Math.floor(sentenceIndex / subGridSize);
		const gridCol = sentenceIndex % subGridSize;
		const cellRow = Math.floor(wordIndex / subGridSize);
		const cellCol = wordIndex % subGridSize;

		const row = gridRow * subGridSize + cellRow;
		const col = gridCol * subGridSize + cellCol;

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
		for (let i = 0; i < this.nSize; i++) {
			if (board[row][i] === value) conflicts++;
		}

		// Check column
		for (let i = 0; i < this.nSize; i++) {
			if (board[i][col] === value) conflicts++;
		}

		// Check subgrid
		const subGridSize = Math.sqrt(this.nSize);
		const boxRow = Math.floor(row / subGridSize) * subGridSize;
		const boxCol = Math.floor(col / subGridSize) * subGridSize;
		for (let i = 0; i < subGridSize; i++) {
			for (let j = 0; j < subGridSize; j++) {
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
		for (let i = 0; i < this.nSize; i++) {
			if (board[row][i] === value || board[i][col] === value) return false;
		}

		const subGridSize = Math.sqrt(this.nSize);
		const boxRow = Math.floor(row / subGridSize) * subGridSize;
		const boxCol = Math.floor(col / subGridSize) * subGridSize;

		for (let r = 0; r < subGridSize; r++) {
			for (let c = 0; c < subGridSize; c++) {
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

			for (let s = 0; s < ref.length && s < this.nSize; s++) {
				for (let w = 0; w < ref[s].length && w < this.nSize; w++) {
					for (let c = 0; c < ref[s][w].length && c < this.nSize; c++) {
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
		const board = Array.from({ length: this.nSize }, () =>
			Array(this.nSize).fill(0)
		);
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
				const subGridSize = Math.sqrt(this.nSize);
				const sentenceIndex =
					Math.floor(row / subGridSize) * subGridSize +
					Math.floor(col / subGridSize);
				const wordIndex =
					(row % subGridSize) * subGridSize + (col % subGridSize);
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

	/**
	 * Gets the current board size
	 * @returns {number} The size of the board (nSize x nSize)
	 */
	getSize() {
		return this.nSize;
	}

	/**
	 * Sets a new board size and resets the instance
	 * @param {number} newSize - The new board size (must be a perfect square for valid Sudoku)
	 */
	setSize(newSize) {
		if (Math.sqrt(newSize) % 1 !== 0) {
			console.warn(
				`Warning: ${newSize} is not a perfect square. This may cause issues with Sudoku grid generation.`
			);
		}
		this.nSize = newSize;
		this.reset();
	}
}

// LSB Steganography functions for embedding coordinate arrays in images

/**
 * Embeds an ordered array of coordinates into an image using LSB steganography
 * @param {ImageData} imageData - Canvas ImageData object
 * @param {Array<Array<number>>} coordinates - Array of [x, y] coordinate pairs
 * @returns {ImageData} Modified ImageData with embedded coordinates
 */
function embedCoordinatesLSB(imageData, coordinates) {
	const data = new Uint8ClampedArray(imageData.data);

	// Convert coordinates to binary string
	const coordString = JSON.stringify(coordinates);
	const binaryData = stringToBinary(coordString);

	// Add delimiter to mark end of data (32 bits of 1s)
	const delimiter = "11111111111111111111111111111111";
	const fullBinaryData = binaryData + delimiter;

	// Check if image has enough capacity
	const availableBits = Math.floor((data.length * 3) / 4); // Only use RGB, skip alpha
	if (fullBinaryData.length > availableBits) {
		throw new Error(
			`Image too small. Need ${fullBinaryData.length} bits, but only ${availableBits} available.`
		);
	}

	let bitIndex = 0;

	// Embed data in LSB of RGB channels (skip alpha channel)
	for (let i = 0; i < data.length && bitIndex < fullBinaryData.length; i++) {
		// Skip alpha channel (every 4th byte)
		if (i % 4 === 3) continue;

		// Get the bit to embed
		const bit = fullBinaryData[bitIndex];

		// Clear LSB and set new bit
		data[i] = (data[i] & 0xfe) | parseInt(bit);

		bitIndex++;
	}

	return new window.ImageData(data, imageData.width, imageData.height);
}

/**
 * Extracts coordinates from an image with embedded LSB data
 * @param {ImageData} imageData - Canvas ImageData object with embedded data
 * @returns {Array<Array<number>>} Array of [x, y] coordinate pairs
 */
function extractCoordinatesLSB(imageData) {
	const data = imageData.data;
	let binaryString = "";
	const delimiter = "11111111111111111111111111111111";

	// Extract LSB from RGB channels
	for (let i = 0; i < data.length; i++) {
		// Skip alpha channel
		if (i % 4 === 3) continue;

		// Extract LSB
		binaryString += (data[i] & 1).toString();

		// Check if we've reached the delimiter
		if (binaryString.endsWith(delimiter)) {
			// Remove delimiter
			binaryString = binaryString.slice(0, -delimiter.length);
			break;
		}
	}

	// Convert binary back to string
	let coordString = binaryToString(binaryString);
	coordString = coordString + "]";

	try {
		return JSON.parse(coordString);
	} catch (error) {
		throw new Error(`Failed to parse embedded coordinate data\n${error}`);
	}
}

/**
 * Convert string to binary representation
 * @param {string} str - Input string
 * @returns {string} Binary string
 */
function stringToBinary(str) {
	return str
		.split("")
		.map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
		.join("");
}

/**
 * Convert binary string back to text
 * @param {string} binary - Binary string
 * @returns {string} Original string
 */
function binaryToString(binary) {
	let result = "";

	// Process 8 bits at a time
	for (let i = 0; i < binary.length; i += 8) {
		const byte = binary.slice(i, i + 8);
		if (byte.length === 8) {
			result += String.fromCharCode(parseInt(byte, 2));
		}
	}

	return result;
}

/**
 * Helper function to load image and get ImageData
 * @param {string} imagePath - Path to image file
 * @returns {Promise<ImageData>} Promise resolving to ImageData
 */
function loadImageData(imageSource) {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.crossOrigin = "anonymous";

		img.onload = function () {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			resolve(imageData);
		};

		img.onerror = reject;

		// Handle Blob/File or URL
		if (imageSource instanceof Blob) {
			img.src = URL.createObjectURL(imageSource);
		} else if (typeof imageSource === "string") {
			img.src = imageSource;
		} else {
			reject(new Error("Unsupported image source type"));
		}
	});
}

/**
 * Helper function to save ImageData as downloadable image
 * @param {ImageData} imageData - Modified ImageData
 */
function saveImageData(imageData) {
	return new Promise((resolve) => {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		canvas.width = imageData.width;
		canvas.height = imageData.height;

		ctx.putImageData(imageData, 0, 0);

		// Create download link
		canvas.toBlob(resolve, "image/png");
	});
}

// const coverText = `Bahwa sesungguhnya kemerdekaan itu ialah hak segala bangsa dan oleh sebab itu, maka penjajahan diatas dunia harus dihapuskan, karena tidak sesuai dengan perikemanusiaan dan perikeadilan.\nDan perjuangan pergerakan kemerdekaan Indonesia telah sampailah kepada saat yang berbahagia dengan selamat sentosa mengantarkan rakyat Indonesia ke depan pintu gerbang kemerdekaan negara Indonesia, yang merdeka, bersatu, berdaulat, adil dan makmur.\nAtas berkat rahmat Allah Yang Maha Kuasa dan dengan didorongkan oleh keinginan luhur, supaya berkehidupan kebangsaan yang bebas, maka rakyat Indonesia menyatakan dengan ini kemerdekaannya.\nKemudian daripada itu untuk membentuk suatu Pemerintah Negara Indonesia yang melindungi segenap bangsa Indonesia dan seluruh tumpah darah Indonesia dan untuk memajukan kesejahteraan umum, mencerdaskan kehidupan bangsa, dan ikut melaksanakan ketertiban dunia yang berdasarkan kemerdekaan, perdamaian abadi dan keadilan sosial, maka disusunlah Kemerdekaan Kebangsaan Indonesia itu dalam suatu Undang-Undang Dasar Negara Indonesia, yang terbentuk dalam suatu susunan Negara Republik Indonesia yang berkedaulatan rakyat dengan berdasar kepada : Ketuhanan Yang Maha Esa, kemanusiaan yang adil dan beradab, persatuan Indonesia, dan kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan, serta dengan mewujudkan suatu keadilan sosial bagi seluruh rakyat Indonesia.`;
// const secret = "Steganography sudoku";

// const steganography = new SudokuSteganography(9);

// // Encode
// const result = steganography.encode(coverText, secret);
// if (result.success) {
// 	console.log("Encoding successful!");
// 	console.log("Board:", result.board);
// 	loadImageData("image.png").then((imageData) => {
// 		const modifiedImageData = embedCoordinatesLSB(
// 			imageData,
// 			result.sequenceMap
// 		);
// 		saveImageData(modifiedImageData, "embed.png");
// 		return modifiedImageData;
// 	});
// }

// const board = [
// 	[5, 2, 6, 3, 4, 0, 0, 0, 1],
// 	[0, 1, 4, 2, 5, 0, 0, 0, 3],
// 	[0, 3, 0, 1, 0, 0, 2, 0, 4],
// 	[0, 5, 3, 0, 0, 0, 0, 0, 0],
// 	[0, 9, 1, 0, 0, 0, 0, 0, 0],
// 	[0, 4, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0, 0],
// 	[0, 0, 0, 0, 0, 0, 0, 0, 0],
// ];
// // Decode
// loadImageData("image.png").then((imageData) => {
// 	const decode = new SudokuSteganography(board.length);
// 	const reference = decode.preprocessCoverText(coverText);
// 	const sequenceMap = extractCoordinatesLSB(imageData);

// 	const decodedMessage = decode.decode(board, reference, sequenceMap);
// 	console.log("Decoded:", decodedMessage);
// });

export async function encodeMessage(coverText, secretText, image) {
	const steganography = new SudokuSteganography(9);

	const result = steganography.encode(coverText, secretText);
	if (!result.success) {
		throw new Error("Encoding failed");
	}

	const imageData = await loadImageData(image);
	const modifiedImageData = embedCoordinatesLSB(imageData, result.sequenceMap);

	// Optional: Save the modified image
	const modifiedImage = saveImageData(modifiedImageData);

	return {
		board: result.board,
		sequenceMap: result.sequenceMap,
		modifiedImage,
	};
}

export async function decodeMessage(coverText, image, board) {
	const decode = new SudokuSteganography(board.length);
	const reference = decode.preprocessCoverText(coverText);
	const imageData = await loadImageData(image);
	const sequenceMap = extractCoordinatesLSB(imageData);
	const decodedMessage = decode.decode(board, reference, sequenceMap);

	return decodedMessage;
}
