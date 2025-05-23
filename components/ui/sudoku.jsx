import React, { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// Individual cell component
const SudokuCell = React.memo(
	({
		value,
		row,
		col,
		size,
		boxSize,
		isSelected,
		isHighlighted,
		isError,
		isHint,
		editable,
		cellSize,
		onCellClick,
		onCellChange,
		onCellFocus,
		onCellBlur,
		onKeyDown,
	}) => {
		const inputRef = useRef(null);

		const handleChange = (e) => {
			const inputValue = e.target.value;
			let newValue = null;

			if (inputValue && /^\d$/.test(inputValue)) {
				const num = parseInt(inputValue, 10);
				if (num >= 1 && num <= size) {
					newValue = num;
				}
			}

			onCellChange?.(row, col, newValue);
		};

		const handleClick = () => {
			onCellClick?.(row, col);
			if (editable && inputRef.current) {
				inputRef.current.focus();
			}
		};

		const handleKeyDown = (e) => {
			onKeyDown?.(e, row, col);
		};

		const isThickRightBorder = (col + 1) % boxSize === 0 && col < size - 1;
		const isThickBottomBorder = (row + 1) % boxSize === 0 && row < size - 1;

		const cellClasses = [
			"relative flex items-center justify-center border transition-colors",
			"border-gray-300",
			isSelected ? "bg-slate-100 border-slate-400" : "",
			isHighlighted ? "bg-slate-100" : "",
			isError ? "bg-red-100 border-red-400" : "",
			isHint ? "bg-green-100" : "",
			isThickRightBorder ? "border-r-2 border-r-gray-800" : "",
			isThickBottomBorder ? "border-b-2 border-b-gray-800" : "",
			!editable ? "bg-gray-100" : "",
		]
			.filter(Boolean)
			.join(" ");

		return (
			<div
				className={cellClasses}
				style={{
					width: cellSize,
					height: cellSize,
					minWidth: cellSize,
					minHeight: cellSize,
				}}
				onClick={handleClick}
			>
				{editable ? (
					<Input
						ref={inputRef}
						value={value || ""}
						onChange={handleChange}
						onFocus={() => onCellFocus?.(row, col)}
						onBlur={() => onCellBlur?.(row, col)}
						onKeyDown={handleKeyDown}
						className="w-full h-full text-center border-0 bg-transparent p-0 focus:ring-0 focus:outline-none text-lg font-semibold"
						maxLength={1}
						autoComplete="off"
					/>
				) : (
					<span className="text-lg font-semibold text-gray-800">
						{value || ""}
					</span>
				)}
			</div>
		);
	}
);

const SudokuGrid = ({
	grid,
	size = 9,
	boxSize = 3,
	cellSize = 48,
	editable = true,
	selectedCell = null,
	highlightedCells = [],
	errorCells = [],
	hintCells = [],
	showErrors = false,
	onCellClick,
	onCellChange,
	onCellFocus,
	onCellBlur,
	ariaLabel = "Sudoku Grid",
	className = "",
}) => {
	const [internalSelectedCell, setInternalSelectedCell] = useState(null);
	const [internalGrid, setInternalGrid] = useState(grid);

	// Use internal state if no external handlers provided
	const currentSelectedCell =
		selectedCell !== null ? selectedCell : internalSelectedCell;
	const currentGrid = grid || internalGrid;

	useEffect(() => {
		if (grid) {
			setInternalGrid(grid);
		}
	}, [grid]);

	const handleCellClick = useCallback(
		(row, col) => {
			if (onCellClick) {
				onCellClick(row, col);
			} else {
				setInternalSelectedCell([row, col]);
			}
		},
		[onCellClick]
	);

	const handleCellChange = useCallback(
		(row, col, value) => {
			if (onCellChange) {
				onCellChange(row, col, value);
			} else {
				const newGrid = currentGrid.map((r, rIndex) =>
					r.map((c, cIndex) => (rIndex === row && cIndex === col ? value : c))
				);
				setInternalGrid(newGrid);
			}
		},
		[onCellChange, currentGrid]
	);

	const handleKeyDown = useCallback(
		(e, row, col) => {
			if (!editable) return;

			const { key } = e;
			let newRow = row;
			let newCol = col;

			switch (key) {
				case "ArrowUp":
					newRow = Math.max(0, row - 1);
					e.preventDefault();
					break;
				case "ArrowDown":
					newRow = Math.min(size - 1, row + 1);
					e.preventDefault();
					break;
				case "ArrowLeft":
					newCol = Math.max(0, col - 1);
					e.preventDefault();
					break;
				case "ArrowRight":
					newCol = Math.min(size - 1, col + 1);
					e.preventDefault();
					break;
				case "Backspace":
				case "Delete":
					handleCellChange(row, col, null);
					e.preventDefault();
					break;
				default:
					return;
			}

			if (newRow !== row || newCol !== col) {
				handleCellClick(newRow, newCol);
			}
		},
		[editable, size, handleCellClick, handleCellChange]
	);

	const isHighlighted = useCallback(
		(row, col) => {
			if (!currentSelectedCell) return false;

			const [selectedRow, selectedCol] = currentSelectedCell;

			// Highlight same row, column, or box
			const sameRow = row === selectedRow;
			const sameCol = col === selectedCol;
			const sameBox =
				Math.floor(row / boxSize) === Math.floor(selectedRow / boxSize) &&
				Math.floor(col / boxSize) === Math.floor(selectedCol / boxSize);

			return (
				(sameRow || sameCol || sameBox) &&
				(row !== selectedRow || col !== selectedCol)
			);
		},
		[currentSelectedCell, boxSize]
	);

	const isErrorCell = useCallback(
		(row, col) => {
			return showErrors && errorCells.some(([r, c]) => r === row && c === col);
		},
		[showErrors, errorCells]
	);

	const isHintCell = useCallback(
		(row, col) => {
			return hintCells.some(([r, c]) => r === row && c === col);
		},
		[hintCells]
	);

	const isSelected = useCallback(
		(row, col) => {
			return (
				currentSelectedCell &&
				currentSelectedCell[0] === row &&
				currentSelectedCell[1] === col
			);
		},
		[currentSelectedCell]
	);

	const gridStyle = {
		display: "grid",
		gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
		gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
		gap: "1px",
		border: "2px solid #1f2937",
		backgroundColor: "#ffffff",
	};

	return (
		<Card className={`p-4 w-fit ${className}`}>
			<div
				className="sudoku-grid"
				style={gridStyle}
				role="grid"
				aria-label={ariaLabel}
				tabIndex={0}
			>
				{currentGrid.map((row, rowIndex) =>
					row.map((cell, colIndex) => (
						<SudokuCell
							key={`${rowIndex}-${colIndex}`}
							value={cell}
							row={rowIndex}
							col={colIndex}
							size={size}
							boxSize={boxSize}
							cellSize={cellSize}
							isSelected={isSelected(rowIndex, colIndex)}
							isHighlighted={isHighlighted(rowIndex, colIndex)}
							isError={isErrorCell(rowIndex, colIndex)}
							isHint={isHintCell(rowIndex, colIndex)}
							editable={editable}
							onCellClick={handleCellClick}
							onCellChange={handleCellChange}
							onCellFocus={onCellFocus}
							onCellBlur={onCellBlur}
							onKeyDown={handleKeyDown}
						/>
					))
				)}
			</div>
		</Card>
	);
};

export default SudokuGrid;
