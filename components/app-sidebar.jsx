import * as React from "react";
import { GalleryVerticalEnd, SquareTerminal } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

// This is sample data.
const data = {
	// user: {
	// 	name: "shadcn",
	// 	email: "m@example.com",
	// 	avatar: "/avatars/shadcn.jpg",
	// },
	teams: [
		{
			name: "Stedoku",
			logo: GalleryVerticalEnd,
			plan: "Kelompok 3",
		},
	],
	navMain: [
		{
			title: "Steganography",
			url: "#",
			icon: SquareTerminal,
			isActive: true,
			items: [
				{
					title: "Encoding",
					url: "/dashboard",
				},
				{
					title: "Decoding",
					url: "#",
				},
			],
		},
	],
};

export function AppSidebar({ ...props }) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			{/* <SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter> */}
			<SidebarRail />
		</Sidebar>
	);
}
