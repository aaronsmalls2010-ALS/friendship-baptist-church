import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ScrollMain } from "@/components/layout/scroll-main";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // h-screen + overflow-hidden makes the sidebar a fixed, non-scrolling column
  // and gives the content its OWN scroll area, so navigating between admin pages
  // only changes the content pane — the menu never jumps or scrolls.
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <ScrollMain className="flex-1 bg-[#F6F7F9] dark:bg-[#0D1117] min-w-0 overflow-y-auto pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </ScrollMain>
    </div>
  );
}
