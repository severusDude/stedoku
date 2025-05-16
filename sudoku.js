// Sudoku Game Logic
class SudokuGame {
	constructor() {
		// Initialize the board (9x9 grid)
		this.board = Array(9)
			.fill()
			.map(() => Array(9).fill(0));
		this.solution = Array(9)
			.fill()
			.map(() => Array(9).fill(0));
		this.prefilled = Array(9)
			.fill()
			.map(() => Array(9).fill(false));
	}

	// Create a new game with the specified difficulty
	newGame(difficulty) {
		// Reset the board
		this.board = Array(9)
			.fill()
			.map(() => Array(9).fill(0));
		this.prefilled = Array(9)
			.fill()
			.map(() => Array(9).fill(false));

		// Generate a solved board
		this.generateSolvedBoard();

		// Copy the solution
		this.solution = JSON.parse(JSON.stringify(this.board));

		// Remove numbers based on difficulty
		this.removeNumbers(difficulty);
	}

	// Generate a solved Sudoku board
	generateSolvedBoard() {
		// Clear the board
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				this.board[i][j] = 0;
			}
		}

		// Fill the board using backtracking
		this.solveBoard(this.board);
	}

	// Solve the current board using backtracking
	solveBoard(board) {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (board[row][col] === 0) {
					// Try numbers 1-9
					const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

					for (let num of numbers) {
						if (this.isValid(board, row, col, num)) {
							board[row][col] = num;

							if (this.solveBoard(board)) {
								return true;
							}

							board[row][col] = 0;
						}
					}

					return false;
				}
			}
		}

		return true; // All cells are filled
	}

	// Check if a number is valid in a specific position
	isValid(board, row, col, num) {
		// Check row
		for (let i = 0; i < 9; i++) {
			if (board[row][i] === num) {
				return false;
			}
		}

		// Check column
		for (let i = 0; i < 9; i++) {
			if (board[i][col] === num) {
				return false;
			}
		}

		// Check 3x3 box
		const boxRow = Math.floor(row / 3) * 3;
		const boxCol = Math.floor(col / 3) * 3;

		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (board[boxRow + i][boxCol + j] === num) {
					return false;
				}
			}
		}

		return true;
	}

	// Remove numbers based on difficulty
	removeNumbers(difficulty) {
		let cellsToRemove;

		switch (difficulty) {
			case "easy":
				cellsToRemove = 40; // Leave ~41 clues
				break;
			case "medium":
				cellsToRemove = 50; // Leave ~31 clues
				break;
			case "hard":
				cellsToRemove = 55; // Leave ~26 clues
				break;
			default:
				cellsToRemove = 40;
		}

		// Mark all cells as prefilled
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				this.prefilled[i][j] = true;
			}
		}

		// Create a list of all positions
		const positions = [];
		for (let i = 0; i < 9; i++) {
			for (let j = 0; j < 9; j++) {
				positions.push([i, j]);
			}
		}

		// Shuffle the positions
		this.shuffleArray(positions);

		// Remove numbers one by one
		for (let i = 0; i < cellsToRemove; i++) {
			if (i < positions.length) {
				const [row, col] = positions[i];
				this.board[row][col] = 0;
				this.prefilled[row][col] = false;
			}
		}
	}

	// Shuffle an array (Fisher-Yates algorithm)
	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	// Update a cell value
	updateCell(row, col, value) {
		if (!this.prefilled[row][col]) {
			this.board[row][col] = value;
		}
	}

	// Check if the current solution is valid
	checkSolution() {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				// Check if any cell is empty
				if (this.board[row][col] === 0) {
					return false;
				}

				// Check if the value is valid
				const currentValue = this.board[row][col];
				this.board[row][col] = 0;

				if (!this.isValid(this.board, row, col, currentValue)) {
					this.board[row][col] = currentValue;
					return false;
				}

				this.board[row][col] = currentValue;
			}
		}

		return true;
	}

	// Solve the current puzzle
	solve() {
		// Create a copy of the current board with only prefilled cells
		const boardCopy = Array(9)
			.fill()
			.map(() => Array(9).fill(0));

		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (this.prefilled[row][col]) {
					boardCopy[row][col] = this.board[row][col];
				}
			}
		}

		// Solve the board
		if (this.solveBoard(boardCopy)) {
			this.board = boardCopy;
		}
	}

	// Clear the user inputs
	clearBoard() {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (!this.prefilled[row][col]) {
					this.board[row][col] = 0;
				}
			}
		}
	}
}
