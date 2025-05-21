function preprocessCoverText(text) {
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

	return reference; // 3D array: [sentence][word][character]
}

function canEncode(secretText, reference) {
	const availableChars = new Set();
	const secret = secretText.replaceAll(" ", "");

	for (let s = 0; s < reference.length; s++) {
		for (let w = 0; w < reference[s].length; w++) {
			for (let c = 0; c < reference[s][w].length; c++) {
				availableChars.add(reference[s][w][c].toLowerCase());
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

function getSudokuCoordinates(sentenceIndex, wordIndex) {
	const gridRow = Math.floor(sentenceIndex / 3);
	const gridCol = sentenceIndex % 3;
	const cellRow = Math.floor(wordIndex / 3);
	const cellCol = wordIndex % 3;

	const row = gridRow * 3 + cellRow;
	const col = gridCol * 3 + cellCol;

	return [row, col];
}

// Helper function to count conflicts for a potential placement
function countConflicts(board, row, col, value) {
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

function isSafe(board, row, col, value) {
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

function findCharacterMatches(secretText, reference) {
	const secret = secretText.replaceAll(" ", "").toLowerCase() + " ";
	const matches = {};

	for (const ch of secret) {
		// Initialize array for this character if it doesn't exist
		if (!matches[ch]) {
			matches[ch] = [];
		}

		for (let s = 0; s < reference.length && s < 9; s++) {
			for (let w = 0; w < reference[s].length && w < 9; w++) {
				for (let c = 0; c < reference[s][w].length && c < 9; c++) {
					if (ch === reference[s][w][c].toLowerCase()) {
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

	return matches; // Returns object with characters as keys
}

function generateSudokuFromMatches(secretText, matches) {
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
					const [row, col] = getSudokuCoordinates(loc.s, loc.w);
					return {
						...loc,
						conflicts: countConflicts(board, row, col, loc.c + 1),
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

	function backtrack(index) {
		if (index >= secretChars.length) return true;

		const currentChar = secretChars[index];
		const char = currentChar.char;
		const locations = currentChar.locations;

		for (const location of locations) {
			const { s, w, c } = location;
			const [row, col] = getSudokuCoordinates(s, w);
			const value = c + 1;

			if (board[row][col] === 0 && isSafe(board, row, col, value)) {
				board[row][col] = value;
				sequenceMap.push([row, col]); // Record the placement order

				if (backtrack(index + 1)) {
					return true;
				}

				console.log(sequenceMap);

				// Backtrack - undo this placement
				board[row][col] = 0;
				sequenceMap.pop(); // Remove the last placement
			}
		}

		return false;
	}

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
				const [row, col] = getSudokuCoordinates(s, w);
				const value = c + 1;

				if (board[row][col] === 0 && isSafe(board, row, col, value)) {
					board[row][col] = value;
					sequenceMap.push([row, col]); // Record the placement order
					break;
				}
			}
		}
	}

	return {
		board: board,
		sequenceMap: sequenceMap,
	};
}

function decodeBoard(board, reference, sequenceMap) {
	let message = "";

	// Decode in the order specified by sequenceMap
	for (const [row, col] of sequenceMap) {
		const value = board[row][col];
		if (value > 0) {
			const sentenceIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
			const wordIndex = (row % 3) * 3 + (col % 3);
			const charIndex = value - 1;

			const ch = reference[sentenceIndex][wordIndex][charIndex];
			message += ch;
		}
	}

	return message;
}

const coverText = `Bahwa sesungguhnya kemerdekaan itu ialah hak segala bangsa dan oleh sebab itu, maka penjajahan diatas dunia harus dihapuskan, karena tidak sesuai dengan perikemanusiaan dan perikeadilan.\nDan perjuangan pergerakan kemerdekaan Indonesia telah sampailah kepada saat yang berbahagia dengan selamat sentosa mengantarkan rakyat Indonesia ke depan pintu gerbang kemerdekaan negara Indonesia, yang merdeka, bersatu, berdaulat, adil dan makmur.\nAtas berkat rahmat Allah Yang Maha Kuasa dan dengan didorongkan oleh keinginan luhur, supaya berkehidupan kebangsaan yang bebas, maka rakyat Indonesia menyatakan dengan ini kemerdekaannya.\nKemudian daripada itu untuk membentuk suatu Pemerintah Negara Indonesia yang melindungi segenap bangsa Indonesia dan seluruh tumpah darah Indonesia dan untuk memajukan kesejahteraan umum, mencerdaskan kehidupan bangsa, dan ikut melaksanakan ketertiban dunia yang berdasarkan kemerdekaan, perdamaian abadi dan keadilan sosial, maka disusunlah Kemerdekaan Kebangsaan Indonesia itu dalam suatu Undang-Undang Dasar Negara Indonesia, yang terbentuk dalam suatu susunan Negara Republik Indonesia yang berkedaulatan rakyat dengan berdasar kepada : Ketuhanan Yang Maha Esa, kemanusiaan yang adil dan beradab, persatuan Indonesia, dan kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan, serta dengan mewujudkan suatu keadilan sosial bagi seluruh rakyat Indonesia.`;
const secret = "Steganography dengan sudoku";

const referenceMatrix = preprocessCoverText(coverText);

// console.log(referenceMatrix);

if (!canEncode(secret, referenceMatrix)) {
	console.error(
		"Encoding aborted: Cover text does not contain all characters from the secret."
	);
} else {
	const matches = findCharacterMatches(secret, referenceMatrix);

	// console.log(matches);

	const { board, sequenceMap } = generateSudokuFromMatches(secret, matches);
	const recovered = decodeBoard(board, referenceMatrix, sequenceMap);

	console.log(sequenceMap);

	console.table(board);
	console.log("Recovered secret:", recovered);
}
