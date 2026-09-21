import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { AdminApolloProvider } from "@/components/admin/AdminApolloProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSuperAdmin();
  if (!user) {
    redirect("/");
  }

  return (
    <AdminApolloProvider>
      <AdminShell>{children}</AdminShell>
    </AdminApolloProvider>
  );
}
