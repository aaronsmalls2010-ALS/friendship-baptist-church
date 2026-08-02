import { PortalSidebar } from "@/components/layout/portal-sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Content scrolls in its own pane so the sidebar / bottom-nav stay fixed and
  // navigation never scroll-jumps the menu.
  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar />
      <main className="flex-1 bg-warm-50 min-w-0 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
