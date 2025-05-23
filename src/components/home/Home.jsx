import { AppSidebar } from "@/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

function Home() {
	return (
		<>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset></SidebarInset>
			</SidebarProvider>
		</>
	);
}

export default Home;
