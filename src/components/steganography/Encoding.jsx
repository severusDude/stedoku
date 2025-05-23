import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

function Encoding() {
	const [secretText, setSecretText] = useState("");
	const [coverText, setCoverText] = useState("");
	const [selectedImage, setSelectedImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [isDragOver, setIsDragOver] = useState(false);
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
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleEncode = () => {
		// Encoding logic would go here
		console.log("Encoding with:", { secretText, coverText, selectedImage });
	};

	const removeImage = () => {
		setSelectedImage(null);
		setImagePreview(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="min-h-screen">
			<div className="max-w-2xl mx-auto my-6">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Text Encoding
					</h1>
					<p className="text-gray-600">
						Hide your secret message within cover text and images
					</p>
				</div>

				<Card className="border-1 backdrop-blur-sm">
					<CardContent className="p-8 space-y-6">
						{/* Secret Text Input */}
						<div className="space-y-2">
							<Label
								htmlFor="secret-text"
								className="text-sm font-medium text-gray-700"
							>
								Secret Text
							</Label>
							<Input
								id="secret-text"
								type="text"
								placeholder="Input your secret text here"
								value={secretText}
								onChange={(e) => setSecretText(e.target.value)}
								className="w-full"
							/>
						</div>

						{/* Cover Text Textarea */}
						<div className="space-y-2">
							<Label
								htmlFor="cover-text"
								className="text-sm font-medium text-gray-700"
							>
								Cover Text
							</Label>
							<Textarea
								id="cover-text"
								placeholder="Input your cover text here"
								value={coverText}
								onChange={(e) => setCoverText(e.target.value)}
								className="w-full min-h-[120px] resize-none"
							/>
						</div>

						{/* Image Upload */}
						<div className="space-y-2">
							<Label className="text-sm font-medium text-gray-700">
								Drop your image here
							</Label>
							<p className="text-xs text-gray-500 mb-3">PNG and JPG support</p>

							{imagePreview ? (
								<div className="relative">
									<img
										src={imagePreview}
										alt="Preview"
										className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
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
											? "border-blue-400 bg-blue-50"
											: "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
									}`}
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onClick={() => fileInputRef.current?.click()}
								>
									<Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-600 mb-2">
										Drag and drop your image here, or click to select
									</p>
									<p className="text-xs text-gray-500">
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
			</div>
		</div>
	);
}

export default Encoding;
