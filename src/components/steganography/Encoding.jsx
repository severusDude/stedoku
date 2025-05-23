import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Upload, X, Download, Copy } from "lucide-react";
import SudokuGrid from "@/components/ui/sudoku";
import { encodeMessage } from "../../../utils/steganography";

function Encoding() {
	const [secretText, setSecretText] = useState("");
	const [coverText, setCoverText] = useState("");
	const [selectedImage, setSelectedImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [grid, setGrid] = useState([]);
	const [isEncoded, setIsEncoded] = useState(false);
	const [encodedImage, setEncodedImage] = useState(null);
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

	const handleReset = () => {
		setSecretText("");
		setCoverText("");
		setSelectedImage(null);
		setImagePreview(null);
		setIsEncoded(false);
		setEncodedImage(null);
		setGrid([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleEncode = async () => {
		const result = await encodeMessage(coverText, secretText, selectedImage);

		// console.log(result.modifiedImage);
		// console.log(typeof result.modifiedImage);
		// const imageURL = URL.createObjectURL(result.modifiedImage);

		// const response = await
		// const blob = await response.blob();
		// const imageURL = URL.createObjectURL(blob);

		const image = await result.modifiedImage;
		const imageURL = URL.createObjectURL(image);

		setEncodedImage(imageURL);
		setGrid(result.board);

		setIsEncoded(true);
	};

	const handleDownload = () => {
		// Download functionality
		// selectedImage
	};

	const handleCopyArray = () => {
		// Copy grid as array to clipboard
		navigator.clipboard.writeText(JSON.stringify(grid));
		console.log("Grid copied to clipboard");
	};

	const handleRestart = () => {
		setIsEncoded(false);
		setEncodedImage(null);
		setGrid([]);
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
					<h1 className="text-3xl font-bold mb-2">Text Encoding</h1>
					<p className="text-muted-foreground">
						Hide your secret message within cover text and images
					</p>
				</div>

				{/* Input Section */}
				{!isEncoded && (
					<Card>
						<CardHeader>
							<CardTitle>Input</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Secret Text Input */}
							<div className="space-y-2">
								<Label htmlFor="secret-text">Secret Text</Label>
								<Input
									id="secret-text"
									type="text"
									placeholder="Input your secret text here"
									value={secretText}
									onChange={(e) => setSecretText(e.target.value)}
								/>
							</div>

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
								<Button onClick={handleEncode} className="flex-1">
									Encode
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
				{isEncoded && (
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Output</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Encoded Image */}
								<div className="space-y-4">
									<Label>Image</Label>
									{encodedImage && (
										<div className="space-y-4">
											<img
												src={encodedImage}
												alt="Encoded"
												className="w-full h-48 object-cover rounded-lg border"
											/>
											<Button onClick={handleDownload} className="w-full">
												<Download className="h-4 w-4 mr-2" />
												Download
											</Button>
										</div>
									)}
								</div>

								{/* Sudoku Grid */}
								<div className="space-y-4">
									<Label>Sudoku Grid</Label>
									<SudokuGrid grid={grid} size={grid.length} />
									<Button onClick={handleCopyArray} className="w-full">
										<Copy className="h-4 w-4 mr-2" />
										Copy as Array
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

export default Encoding;
