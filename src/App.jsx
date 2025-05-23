import { AppSidebar } from "@/components/app-sidebar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/home/Home";
import Encoding from "./components/steganography/Encoding";
import Decoding from "./components/steganography/Decoding";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

function App() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<div className="p-1 lg:p-6 w-screen h-screen">
				<SidebarInset>
					<Router>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/encoding" element={<Encoding />} />
							<Route path="/decoding" element={<Decoding />} />
						</Routes>
					</Router>
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}

export default App;
