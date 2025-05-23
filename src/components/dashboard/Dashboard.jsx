import { Button } from "@/components/ui/button";
import React from "react";
import { Link } from "react-router-dom";

function Dashboard() {
	return (
		<>
			<p>test</p>
			<Button>
				<Link to="/">Test</Link>
			</Button>
		</>
	);
}

export default Dashboard;
