// Steganography Implementation for Sudoku
class SudokuSteganography {
    constructor() {
        this.coverText = "";
        this.secretText = "";
        this.sentenceMatrix = []; // Matrix S
        this.asciiReferenceMatrix = []; // Matrix R
        this.stegoKey = []; // The resulting Sudoku puzzle that acts as a key
    }

    /**
     * Encode a secret message into a Sudoku puzzle using cover text
     * @param {string} secretText - The secret message to hide
     * @param {string} coverText - The cover text used for steganography
     * @returns {Array<Array<number>>} - A Sudoku puzzle that serves as a stego key
     */
    encode(secretText, coverText) {
        this.secretText = secretText;
        this.coverText = coverText;

        // Step 1: Convert secret text to ASCII
        const secretAscii = this.textToAscii(secretText);

        // Step 2 & 3: Create sentence matrix S and ASCII reference matrix R
        this.processConverText();

        // Step 4 & 5: Generate the Sudoku puzzle as a stego key
        this.generateStegoKey(secretAscii);

        return this.stegoKey;
    }

    /**
     * Convert text to an array of ASCII codes
     * @param {string} text - The input text
     * @returns {Array<number>} - Array of ASCII values
     */
    textToAscii(text) {
        const asciiArray = [];
        for (let i = 0; i < text.length; i++) {
            asciiArray.push(text.charCodeAt(i));
        }
        return asciiArray;
    }

    /**
     * Process the cover text to create the sentence matrix S and ASCII reference matrix R
     */
    processConverText() {
        // Split the cover text into sentences (assuming sentences end with '.', '!', or '?')
        const sentences = this.coverText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Find the maximum number of words in any sentence to determine N
        let maxWordCount = 0;
        const sentencesWords = sentences.map(sentence => {
            const words = sentence.trim().split(/\s+/);
            maxWordCount = Math.max(maxWordCount, words.length);
            return words;
        });

        // Create an NxN sentence matrix S and ASCII reference matrix R
        const n = maxWordCount;
        this.sentenceMatrix = Array(n).fill().map(() => Array(n).fill(null));
        this.asciiReferenceMatrix = Array(n).fill().map(() => Array(n).fill(null));

        // Fill the matrices
        for (let i = 0; i < sentencesWords.length && i < n; i++) {
            const words = sentencesWords[i];
            for (let j = 0; j < words.length && j < n; j++) {
                this.sentenceMatrix[i][j] = words[j];
                this.asciiReferenceMatrix[i][j] = this.wordToAsciiArray(words[j]);
            }
        }

        // Initialize the stego key as a 9x9 Sudoku grid filled with zeros
        this.stegoKey = Array(9).fill().map(() => Array(9).fill(0));
    }

    /**
     * Convert a word to an array of ASCII values
     * @param {string} word - Input word
     * @returns {Array<number>} - Array of ASCII values
     */
    wordToAsciiArray(word) {
        if (!word) return [];
        return Array.from(word).map(char => char.charCodeAt(0));
    }

    /**
     * Generate the Sudoku puzzle as a stego key
     * @param {Array<number>} secretAscii - The secret message in ASCII format
     */
    generateStegoKey(secretAscii) {
        let secretIndex = 0; // Current position in the secret ASCII array
        let shade = 1; // Shade value for entries (changes for second round of entries)

        // Continue until we've hidden all the secret ASCII values
        while (secretIndex < secretAscii.length) {
            let hiddenCurrentValue = false;

            // Iterate through each sentence (row) in the matrix
            for (let sentenceIdx = 0; sentenceIdx < this.asciiReferenceMatrix.length && secretIndex < secretAscii.length; sentenceIdx++) {
                if (hiddenCurrentValue) {
                    secretIndex++; // Move to the next ASCII value in the secret
                    hiddenCurrentValue = false;
                }

                if (secretIndex >= secretAscii.length) break;
                
                const currentAsciiValue = secretAscii[secretIndex];
                
                // Iterate through each word (column) in the sentence
                for (let wordIdx = 0; wordIdx < this.asciiReferenceMatrix[sentenceIdx].length; wordIdx++) {
                    const asciiValues = this.asciiReferenceMatrix[sentenceIdx][wordIdx];
                    if (!asciiValues) continue;

                    // Check if the current word contains the ASCII value we're looking for
                    for (let charPos = 0; charPos < asciiValues.length; charPos++) {
                        if (asciiValues[charPos] === currentAsciiValue) {
                            // Found a match! Determine the mini-grid position
                            const miniGridRow = Math.floor(sentenceIdx / 3) * 3 + Math.floor(charPos / 3);
                            const miniGridCol = Math.floor(wordIdx / 3) * 3 + (charPos % 3);
                            
                            // Check if the position is within the 9x9 Sudoku grid
                            if (miniGridRow < 9 && miniGridCol < 9) {
                                // If this position is already filled and we're still on the first shade,
                                // we'll leave it and continue (it will be handled in the next shade)
                                if (this.stegoKey[miniGridRow][miniGridCol] === 0) {
                                    // Store the position (1-based) + shade value
                                    this.stegoKey[miniGridRow][miniGridCol] = (charPos + 1) + (shade - 1) * 9;
                                    hiddenCurrentValue = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (hiddenCurrentValue) break;
                }
                
                // If we couldn't find a match in this sentence, skip to the next sentence
                if (!hiddenCurrentValue) {
                    continue;
                }
            }
            
            // If we've gone through all sentences and couldn't hide the current value,
            // increment the shade and try again
            if (!hiddenCurrentValue) {
                shade++;
                // If we've gone through too many shades (would exceed 9), we'll need to stop
                if (shade > 9) {
                    console.warn("Warning: Not all secret text could be encoded. Increase the cover text size.");
                    break;
                }
            } else {
                secretIndex++; // Move to the next ASCII value
            }
        }

        // Fill empty cells with random valid Sudoku values to complete the puzzle
        this.fillRemainingCells();
    }

    /**
     * Fill the remaining empty cells in the Sudoku grid with valid values
     */
    fillRemainingCells() {
        const sudokuSolver = new SudokuGame(); // Reusing the SudokuGame class for solving
        
        // Create a copy of our partially filled stegoKey
        const tempBoard = JSON.parse(JSON.stringify(this.stegoKey));
        
        // Use the solver to fill in the rest of the Sudoku puzzle
        if (sudokuSolver.solveBoard(tempBoard)) {
            // For cells that are empty in stegoKey, copy values from the solved tempBoard
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.stegoKey[i][j] === 0) {
                        this.stegoKey[i][j] = tempBoard[i][j];
                    }
                }
            }
        } else {
            // If solving failed, just fill remaining cells with random valid values
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.stegoKey[i][j] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (this.isValidPlacement(i, j, num)) {
                                this.stegoKey[i][j] = num;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Check if placing a number at a specific position is valid
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to place
     * @returns {boolean} - Whether the placement is valid
     */
    isValidPlacement(row, col, num) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (this.stegoKey[row][i] === num) {
                return false;
            }
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
            if (this.stegoKey[i][col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.stegoKey[boxRow + i][boxCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Decode the secret message from a Sudoku stego key and cover text
     * @param {Array<Array<number>>} stegoKey - The Sudoku puzzle serving as the stego key
     * @param {string} coverText - The original cover text
     * @returns {string} - The decoded secret message
     */
    decode(stegoKey, coverText) {
        this.stegoKey = stegoKey;
        this.coverText = coverText;
        
        // Process the cover text to create the reference matrices
        this.processConverText();
        
        // Extract the positions and shades from the stego key
        const encodedPositions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const value = stegoKey[i][j];
                if (value > 0 && value <= 9 * 9) { // Valid encoded value
                    const shade = Math.floor((value - 1) / 9) + 1;
                    const position = ((value - 1) % 9) + 1; // 1-based position
                    
                    // Store [row, col, position, shade] for sorting
                    encodedPositions.push([i, j, position - 1, shade]); // Convert position to 0-based
                }
            }
        }
        
        // Sort by shade and then by the original order in the grid
        encodedPositions.sort((a, b) => {
            if (a[3] !== b[3]) return a[3] - b[3]; // Sort by shade first
            return a[0] * 9 + a[1] - (b[0] * 9 + b[1]); // Then by grid position
        });
        
        // Extract the ASCII values from the cover text based on the encoded positions
        const decodedAscii = [];
        for (const [row, col, charPos, _] of encodedPositions) {
            // Determine which sentence and word this refers to
            const sentenceIdx = Math.floor(row / 3) * 3 + Math.floor(charPos / 3);
            const wordIdx = Math.floor(col / 3) * 3 + (charPos % 3);
            
            if (sentenceIdx < this.asciiReferenceMatrix.length && 
                wordIdx < this.asciiReferenceMatrix[sentenceIdx].length &&
                this.asciiReferenceMatrix[sentenceIdx][wordIdx]) {
                
                const asciiValues = this.asciiReferenceMatrix[sentenceIdx][wordIdx];
                if (charPos < asciiValues.length) {
                    decodedAscii.push(asciiValues[charPos]);
                }
            }
        }
        
        // Convert the ASCII values back to text
        return String.fromCharCode(...decodedAscii);
    }

    /**
     * Apply the steganography encoding and return the Sudoku board as a SudokuGame
     * @param {string} secretText - Secret text to encode
     * @param {string} coverText - Cover text for steganography
     * @returns {SudokuGame} - A Sudoku game with the encoded message
     */
    createEncodedSudokuGame(secretText, coverText) {
        // Encode the secret message
        const stegoKey = this.encode(secretText, coverText);
        
        // Create a new SudokuGame with the stegoKey as the board
        const game = new SudokuGame();
        game.board = JSON.parse(JSON.stringify(stegoKey));
        
        // Mark all cells as prefilled
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                game.prefilled[i][j] = true;
            }
        }
        
        // Copy the board as the solution too
        game.solution = JSON.parse(JSON.stringify(stegoKey));
        
        return game;
    }

    /**
     * Create a Sudoku game UI with the encoded message
     * @param {string} secretText - Secret text to encode
     * @param {string} coverText - Cover text for steganography 
     */
    createSteganographySudokuUI(secretText, coverText) {
        const game = this.createEncodedSudokuGame(secretText, coverText);
        
        // Update the UI with the new game board
        const cells = document.querySelectorAll('.cell-input');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = game.board[row][col];
            
            cell.value = value !== 0 ? value : '';
            cell.classList.add('prefilled');
            cell.disabled = true;
        });
        
        // Display a success message
        const messageEl = document.getElementById('message');
        messageEl.textContent = 'Secret message successfully encoded into Sudoku!';
        messageEl.className = 'mt-4 text-center font-medium text-green-600';
        messageEl.classList.remove('hidden');
        
        return game;
    }
}

// Usage example:
/*
// Create a new steganography instance
const steg = new SudokuSteganography();

// Example cover text (should be much longer in practice)
const coverText = "This is a sample cover text. It contains multiple sentences of varying lengths. Some are short. Others are much longer and contain many more words than the shorter ones. The algorithm uses this text to hide the secret message.";

// Secret message to hide
const secretMessage = "Hello, this is a secret message!";

// Encode the message into a Sudoku puzzle
const encodedSudoku = steg.encode(secretMessage, coverText);

// To decode:
const decodedMessage = steg.decode(encodedSudoku, coverText);
console.log(decodedMessage); // Should output the original secret message
*/
