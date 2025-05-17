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

	// Export the board as a JSON string
	exportBoard() {
		const exportData = {
			board: this.board,
			prefilled: this.prefilled,
			solution: this.solution,
		};
		return JSON.stringify(exportData);
	}

	// Import a board from a JSON string
	importBoard(jsonString) {
		try {
			const importData = JSON.parse(jsonString);

			// Validate the imported data structure
			if (!this.isValidBoardFormat(importData)) {
				throw new Error("Invalid board format");
			}

			this.board = importData.board;
			this.prefilled = importData.prefilled;

			// Import solution if available
			if (importData.solution) {
				this.solution = importData.solution;
			}

			return true;
		} catch (error) {
			console.error("Error importing board:", error);
			return false;
		}
	}

	// Import a board directly from a nested array
	importBoardFromArray(boardArray) {
		try {
			// Validate the board array
			if (!Array.isArray(boardArray) || boardArray.length !== 9) {
				throw new Error("Invalid board array: must be 9x9");
			}

			for (let i = 0; i < 9; i++) {
				if (!Array.isArray(boardArray[i]) || boardArray[i].length !== 9) {
					throw new Error(`Invalid row at index ${i}: must have 9 elements`);
				}

				for (let j = 0; j < 9; j++) {
					const value = boardArray[i][j];
					if (!Number.isInteger(value) || value < 0 || value > 9) {
						throw new Error(
							`Invalid value at [${i},${j}]: must be integer between 0-9`
						);
					}
				}
			}

			// Set the board and mark prefilled cells
			this.board = JSON.parse(JSON.stringify(boardArray));
			this.prefilled = Array(9)
				.fill()
				.map(() => Array(9).fill(false));

			// Mark non-zero cells as prefilled
			for (let i = 0; i < 9; i++) {
				for (let j = 0; j < 9; j++) {
					if (this.board[i][j] !== 0) {
						this.prefilled[i][j] = true;
					}
				}
			}

			// Try to solve the board to get the solution
			const solutionBoard = JSON.parse(JSON.stringify(this.board));
			if (this.solveBoard(solutionBoard)) {
				this.solution = solutionBoard;
			} else {
				throw new Error("The provided board has no solution");
			}

			return true;
		} catch (error) {
			console.error("Error importing board from array:", error);
			return false;
		}
	}

	// Validate the imported board format
	isValidBoardFormat(data) {
		// Check if the required properties exist
		if (!data.board || !data.prefilled) {
			return false;
		}

		// Check if board is a 9x9 grid
		if (!Array.isArray(data.board) || data.board.length !== 9) {
			return false;
		}

		// Check if prefilled is a 9x9 grid
		if (!Array.isArray(data.prefilled) || data.prefilled.length !== 9) {
			return false;
		}

		// Check each row of the board
		for (let i = 0; i < 9; i++) {
			if (!Array.isArray(data.board[i]) || data.board[i].length !== 9) {
				return false;
			}

			if (!Array.isArray(data.prefilled[i]) || data.prefilled[i].length !== 9) {
				return false;
			}

			// Check each cell
			for (let j = 0; j < 9; j++) {
				const value = data.board[i][j];
				if (!Number.isInteger(value) || value < 0 || value > 9) {
					return false;
				}

				if (typeof data.prefilled[i][j] !== "boolean") {
					return false;
				}
			}
		}

		return true;
	}
}
