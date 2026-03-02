import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AdminShell from "./_components/AdminShell";

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");

    if (!token) {
        redirect("/admin/login");
    }

    return <AdminShell>{children}</AdminShell>;
}
