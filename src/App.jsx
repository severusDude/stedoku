import { AppSidebar } from "@/components/app-sidebar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/dashboard/Dashboard";
import Home from "./components/home/Home";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

function App() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<Router>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/dashboard" element={<Dashboard />} />
					</Routes>
				</Router>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default App;
