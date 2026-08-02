import { AdminSidebar } from "@/components/layout/admin-sidebar";

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
      <main className="flex-1 bg-warm-50 dark:bg-warm-950 min-w-0 overflow-y-auto pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
