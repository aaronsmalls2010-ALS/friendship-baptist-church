import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { PushMemberBar } from "@/components/notifications/push-member-bar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="min-h-screen public-prose">{children}</main>
      <PublicFooter />
      {/* Signed-in members only; never shown to visitors. */}
      <PushMemberBar />
    </>
  );
}
