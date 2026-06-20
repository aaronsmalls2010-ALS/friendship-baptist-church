import { PortalSidebar } from "@/components/layout/portal-sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <PortalSidebar />
      <main className="flex-1 bg-warm-50 min-w-0">
        <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
