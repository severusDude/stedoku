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
			url: "/",
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
					url: "/encoding",
				},
				{
					title: "Decoding",
					url: "/decoding",
				},
			],
		},
	],
};

export function AppSidebar({ ...props }) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<a href={data.teams[0].url}>
					<TeamSwitcher teams={data.teams} />
				</a>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<div className="flex flex-col w-full gap-1 p-2">
					<span className="text-sm font-semibold">Stedoku</span>
					<span className="text-sm font-regular">this is a test</span>
				</div>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
