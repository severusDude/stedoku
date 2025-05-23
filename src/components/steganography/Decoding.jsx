import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Copy } from "lucide-react";
import SudokuGrid from "@/components/ui/sudoku";
import { decodeMessage } from "../../../utils/steganography";

function Decoding() {
	const [coverText, setCoverText] = useState("");
	const [selectedImage, setSelectedImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [grid, setGrid] = useState([]);
	const [arrayInput, setArrayInput] = useState("");
	const [isDecoded, setIsDecoded] = useState(false);
	const [secretText, setSecretText] = useState("");
	const fileInputRef = useRef(null);

	const handleImageUpload = (file) => {
		if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
			setSelectedImage(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragOver(false);
		const file = e.dataTransfer.files[0];
		handleImageUpload(file);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setIsDragOver(false);
	};

	const handleFileSelect = (e) => {
		const file = e.target.files[0];
		handleImageUpload(file);
	};

	const handleImportFromArray = () => {
		try {
			const parsedArray = JSON.parse(arrayInput);
			if (Array.isArray(parsedArray) && Array.isArray(parsedArray[0])) {
				setGrid(parsedArray);
				setArrayInput("");
			} else {
				alert("Please enter a valid 2D array format");
			}
		} catch (error) {
			alert("Invalid array format. Please enter a valid JSON array.");
		}
	};

	const handleReset = () => {
		setCoverText("");
		setSelectedImage(null);
		setImagePreview(null);
		setGrid([]);
		setArrayInput("");
		setIsDecoded(false);
		setSecretText("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleDecode = async () => {
		console.log(coverText);
		console.log(selectedImage);
		console.log(grid);
		const result = await decodeMessage(coverText, selectedImage, grid);

		setSecretText(result);
		setIsDecoded(true);
	};

	const handleCopySecret = () => {
		navigator.clipboard.writeText(secretText);
		console.log("Secret text copied to clipboard");
	};

	const handleRestart = () => {
		setIsDecoded(false);
		setSecretText("");
	};

	const removeImage = () => {
		setSelectedImage(null);
		setImagePreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="min-h-screen bg-background p-6">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold mb-2">Text Decoding</h1>
					<p className="text-muted-foreground">
						Extract your secret message from cover text and images
					</p>
				</div>

				{/* Input Section */}
				{!isDecoded && (
					<Card>
						<CardHeader>
							<CardTitle>Input</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Cover Text Textarea */}
							<div className="space-y-2">
								<Label htmlFor="cover-text">Cover Text</Label>
								<Textarea
									id="cover-text"
									placeholder="Input your cover text here"
									value={coverText}
									onChange={(e) => setCoverText(e.target.value)}
									className="min-h-[120px] resize-none"
								/>
							</div>

							{/* Sudoku Grid Section */}
							<div className="space-y-4">
								<Label>Sudoku Grid</Label>

								{/* Array Input */}
								<div className="flex gap-2">
									<Input
										placeholder="Paste array here (e.g., [[1,2,3],[4,5,6]])"
										value={arrayInput}
										onChange={(e) => setArrayInput(e.target.value)}
										className="flex-1"
									/>
									<Button onClick={handleImportFromArray} variant="outline">
										Import from Array
									</Button>
								</div>

								{/* Grid Display */}
								{grid.length > 0 && (
									<div className="space-y-2">
										<SudokuGrid grid={grid} size={grid.length} />
									</div>
								)}
							</div>

							{/* Image Upload */}
							<div className="space-y-2">
								<Label>Drop your image here</Label>
								<p className="text-sm text-muted-foreground">
									PNG and JPG support
								</p>

								{imagePreview ? (
									<div className="relative">
										<img
											src={imagePreview}
											alt="Preview"
											className="w-full h-48 object-cover rounded-lg border"
										/>
										<Button
											variant="destructive"
											size="sm"
											className="absolute top-2 right-2"
											onClick={removeImage}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								) : (
									<div
										className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
											isDragOver
												? "border-primary bg-primary/10"
												: "border-muted-foreground/25 hover:border-muted-foreground/50"
										}`}
										onDrop={handleDrop}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onClick={() => fileInputRef.current?.click()}
									>
										<Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
										<p className="text-muted-foreground mb-2">
											Drag and drop your image here, or click to select
										</p>
										<p className="text-sm text-muted-foreground">
											Supports PNG and JPG files
										</p>
									</div>
								)}

								<input
									ref={fileInputRef}
									type="file"
									accept="image/png,image/jpeg"
									onChange={handleFileSelect}
									className="hidden"
								/>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-4 pt-4">
								<Button onClick={handleDecode} className="flex-1">
									Decode
								</Button>
								<Button
									variant="outline"
									onClick={handleReset}
									className="flex-1"
								>
									Reset
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Output Section */}
				{isDecoded && (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Output</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Secret Text Output */}
								<div className="space-y-4">
									<Label>Secret Text</Label>
									<div className="p-4 border rounded-lg bg-muted/50">
										<p className="text-sm">{secretText}</p>
									</div>
									<Button onClick={handleCopySecret} className="w-full">
										<Copy className="h-4 w-4 mr-2" />
										Copy Secret Text
									</Button>
								</div>

								{/* Action Button */}
								<Button
									variant="secondary"
									onClick={handleRestart}
									className="w-full"
								>
									Restart
								</Button>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}

export default Decoding;
