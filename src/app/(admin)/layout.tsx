import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-warm-50 dark:bg-warm-950">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
