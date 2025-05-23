import * as React from "react";
import { Link } from "react-router-dom";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher({ teams }) {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					size="lg"
					className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					{/* <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
						<activeTeam.logo className="size-4" />
					</div> */}
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">Stedoku</span>
						<span className="truncate text-xs">Kelompok 3</span>
					</div>
					{/* <ChevronsUpDown className="ml-auto" /> */}
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
