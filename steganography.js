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
			.slice(0, 9)
			.map((word) => {
				const padded = word.padEnd(9, "_"); // Ensure 9 characters
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

function encodeSecretText(secretText, reference) {
	const board = Array.from({ length: 9 }, () => Array(9).fill(0));
	const used = new Set();
	const secret = secretText.replaceAll(" ", "");

	for (const ch of secret) {
		let found = false;

		for (let s = 0; s < 9 && !found; s++) {
			for (let w = 0; w < 9 && !found; w++) {
				for (let c = 0; c < 9 && !found; c++) {
					if (ch.toLowerCase() === reference[s][w][c]) {
						const [row, col] = getSudokuCoordinates(s, w);
						const key = `${row},${col}`;
						if (!used.has(key)) {
							board[row][col] = c + 1;
							used.add(key);
							found = true;
						}
					}
				}
			}
		}

		if (!found) {
			console.warn(`Character "${ch}" not found in cover text!`);
		}
	}

	return board;
}

function decodeBoard(board, reference) {
	let message = "";

	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			const value = board[row][col];
			if (value > 0) {
				const sentenceIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
				const wordIndex = (row % 3) * 3 + (col % 3);
				const charIndex = value - 1;

				const ch = reference[sentenceIndex][wordIndex][charIndex];
				message += ch;
			}
		}
	}

	return message;
}

const coverText = `Bahwa sesungguhnya kemerdekaan itu ialah hak segala bangsa dan oleh sebab itu, maka penjajahan diatas dunia harus dihapuskan, karena tidak sesuai dengan perikemanusiaan dan perikeadilan.\nDan perjuangan pergerakan kemerdekaan Indonesia telah sampailah kepada saat yang berbahagia dengan selamat sentosa mengantarkan rakyat Indonesia ke depan pintu gerbang kemerdekaan negara Indonesia, yang merdeka, bersatu, berdaulat, adil dan makmur.\nAtas berkat rahmat Allah Yang Maha Kuasa dan dengan didorongkan oleh keinginan luhur, supaya berkehidupan kebangsaan yang bebas, maka rakyat Indonesia menyatakan dengan ini kemerdekaannya.\nKemudian daripada itu untuk membentuk suatu Pemerintah Negara Indonesia yang melindungi segenap bangsa Indonesia dan seluruh tumpah darah Indonesia dan untuk memajukan kesejahteraan umum, mencerdaskan kehidupan bangsa, dan ikut melaksanakan ketertiban dunia yang berdasarkan kemerdekaan, perdamaian abadi dan keadilan sosial, maka disusunlah Kemerdekaan Kebangsaan Indonesia itu dalam suatu Undang-Undang Dasar Negara Indonesia, yang terbentuk dalam suatu susunan Negara Republik Indonesia yang berkedaulatan rakyat dengan berdasar kepada : Ketuhanan Yang Maha Esa, kemanusiaan yang adil dan beradab, persatuan Indonesia, dan kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan, serta dengan mewujudkan suatu keadilan sosial bagi seluruh rakyat Indonesia.`; // full UUD 1945 here
const secret = "Kelompok tiga KI";

const referenceMatrix = preprocessCoverText(coverText);

if (!canEncode(secret, referenceMatrix)) {
	console.error(
		"Encoding aborted: Cover text does not contain all characters from the secret."
	);
} else {
	const board = encodeSecretText(secret, referenceMatrix);
	const recovered = decodeBoard(board, referenceMatrix);
	console.log("Encoded board:", board);
	console.log("Recovered secret:", recovered);
}
